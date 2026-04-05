# scalab: Core Architecture Deep Dive

This document details the inner workings of scalab's core computational systems: the Simulation Engine, the Evaluation Engine, and the data flow between them.

## 1. Data Flow Overview

The lifecycle of an architecture simulation in scalab moves from user interaction to visual feedback in a continuous loop:

1. **User Interaction**: The user manipulates the canvas (adding nodes, connecting edges, tweaking node settings like replicas).
2. **State Management (`Zustand`)**: These changes immediately update the global state store, ensuring a single source of truth for the graph structure.
3. **Simulation Engine Trigger**: A change in the graph state or a deliberate "Run Simulation" action feeds the current graph (Nodes & Edges) into the Simulation Engine.
4. **Traffic Propagation**: The engine calculates traffic flow, capacities, and bottlenecks across the graph.
5. **Evaluation Engine Trigger**: The `SimulationOutput` is passed to the Evaluation Engine.
    * In **Playground Mode**, it applies heuristics to generate insights.
    * In **Challenge Mode**, it verifies the output against test cases.
6. **UI Update**: The enriched output (bottlenecks highlighted, insights generated, test status updated) is saved back to the state, triggering React Flow and UI panels to render the feedback visually.

## 2. Simulation Engine

The Simulation Engine is the deterministic heart of scalab. It abstractly models how a system performs under load without requiring actual infrastructure.

### Graph Traversal
The engine treats the architecture as a Directed Acyclic Graph (DAG).
* It identifies entry points (usually API Gateways or Load Balancers).
* It traverses the graph topologically, ensuring parent nodes are processed before child nodes.

### Traffic Splitting & Routing
When a node has multiple outgoing edges, traffic is split:
* **Load Balancers**: Evenly divide incoming load among downstream app servers by default.
* **Caches**: Splitting depends on cache hit rates (e.g., 80% traffic stops at the cache, 20% proceeds to the database).

### Capacity and Bottleneck Calculation
Each node processes data based on its mathematical capacity.

* **Base Capacity**: Hardcoded baseline (e.g., single DB instance handles 1000 RPS).
* **Scaling Multipliers**:
  * **Database Scaling**:
    * `effectiveWriteCapacity = baseCapacity * shards`
    * `effectiveReadCapacity = baseCapacity * (shards * replicas)`
  * **Horizontal Scaling**:
    * Adding instances linearly increases the `total group capacity` behind a load balancer.

If `incomingTraffic > effectiveCapacity`, the engine flags the node with `isBottleneck: true`. Subsequential nodes may experience traffic starvation resulting from this upstream bottleneck.

## 3. Evaluation Engine

The Evaluation Engine interprets the raw mathematical output from the Simulation Engine to provide educational context.

### Playground Mode (Rule-Based Analysis)
In the open-ended playground, the engine runs through a suite of predefined rules, checking the architecture against common anti-patterns:
* **Single Point of Failure (SPOF)**: Detecting databases without replicas or app servers without a load balancer.
* **Under-provisioning**: Identifying bottlenecks where traffic exceeds capacity.
* **Over-provisioning**: Detecting elements with massive excess capacity acting as an unnecessary cost.
* **Missing Components**: Flagging when an API gateway connects directly to a database, skipping an application tier.

*Output*: Generates human-readable warnings, errors, and success metrics displayed in the Insight Panel.

### Challenge Mode (Test-Driven Evaluation)
In Challenge Mode, the evaluation is stricter and scenario-specific.
1. The engine loads `TestCases` for the current challenge.
2. It sets the `SimulationEngine` input to mirror the test case's constraints (e.g., injecting 10,000 RPS).
3. It compares the resulting `SimulationOutput` to the `expectedOutput`.
4. Criteria evaluated typically include:
   * **Resilience**: Did the system survive the load without bottlenecks?
   * **Latency**: Was the SLA met?
   * **Cost Constraints**: Did the architecture stay under budget while meeting the target?

*Output*: Boolean pass/fail per test case, driving the challenge progression state.
