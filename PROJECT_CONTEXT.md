# scalab: Project Context System

This document serves as the **single source of truth** for scalab's product goals, architecture, conventions, and constraints. It acts as the "brain of the project" for developers and AI assistants to maintain consistency across the codebase.

## 1. Product Overview

**scalab** is an interactive, visual learning platform designed to teach system design and scalable architecture.

* **Target Users**: Software engineers, students, and system designers looking to understand distributed systems, scalability, and performance bottlenecks through hands-on practice.
* **Core Philosophy**:
  * **Learning-first**: Educational value over hyper-realistic complexity.
  * **Visual Simulation**: Real-time feedback visualized on a graphical canvas.
  * **Deterministic Evaluation**: Predictable, reproducible results for a given system state and traffic load.

## 2. Core Features

* **Simulation Engine**: Propagates traffic through the visually constructed system to determine load, latency, and viability.
* **Challenge Mode (LeetCode-style)**: Targeted system design problems with specific goals and constraints.
* **Playground Mode**: Open-ended sandbox for freely designing and testing architectures.
* **Component Library**: A suite of drag-and-drop system components (Load Balancers, DBs, Caches, etc.).
* **Evaluation Engine**: Analyzes system performance (for both Challenge and Playground modes) to provide actionable feedback.

## 3. System Architecture

### Frontend
* **Next.js (App Router)**: Core application framework and routing.
* **React Flow**: Drives the interactive visual canvas for building node-based architectures.
* **Zustand**: Manages global application state (nodes, edges, simulation state, evaluation results).

### Core Systems
* **Simulation Engine**: Processes the graph (nodes & edges) to simulate traffic flow and capacity constraints.
* **Evaluation Engine**: Validates the simulated output against test cases or rules to generate insights.
* **Scenario/Challenge System**: Loads specific constraints, predefined nodes, and evaluation criteria for Challenge Mode.

## 4. Data Models

* **`Node`**: The fundamental building block on the canvas. Properties include `type`, `capacity`, `latency`, `replicas`, `shards`.
* **`Edge`**: Connections directing the flow of traffic between Nodes.
* **`SimulationOutput`**: The resulting state after a simulation run, detailing throughput, bottlenecks, and latencies across nodes.
* **`Challenge`**: Defines a specific problem, including initial state, constraints, and test cases.
* **`TestCase`**: A unit of evaluation for a Challenge, specifying an input condition and expected `SimulationOutput`.

## 5. Simulation Logic (IMPORTANT)

The Simulation Engine operates deterministically to model system behavior:
* **Traffic Flow**: Traffic originates from clients/API Gateways and flows through connected edges to downstream nodes.
* **Capacity Calculation**: Each node has a baseline capacity. If incoming traffic exceeds this capacity, it creates a bottleneck, potentially causing cascading failures or increased latency.
* **Replication & Sharding**:
  * **Replication**: Increases read capacity. `effectiveReadCapacity = baseCapacity * replicas`.
  * **Sharding**: Partitions data to increase both read and write capacity (overall throughput). `effectiveWriteCapacity = baseCapacity * shards`.

## 6. Evaluation Engine

Provides feedback mechanisms across both primary modes:

### Challenge Mode
* **Test-driven evaluation**: Runs the user's design against predefined test cases.
* **Pass/Fail**: Strict criteria based on whether the architecture meets the challenge's constraints (e.g., handling X RPS).
* **Scoring**: Metrics based on cost, latency, or optimal resource utilization.

### Playground Mode
* **Rule-based analysis**: Heuristics that flag architectural anti-patterns (e.g., missing load balancer, database SPOF).
* **Bottleneck detection**: Highlights nodes where incoming traffic exceeds effective capacity.
* **Insights generation**: Educational feedback and recommendations for improving the design.

## 7. Component System

* **API Gateway**: Entry point for traffic; handles routing and initial rate limiting.
* **Load Balancer**: Distributes incoming traffic across multiple downstream servers to prevent overloading.
* **App Server**: Computes logic; scales horizontally to handle increased request volume.
* **Database**: Persistent storage. Configurable with replicas (for read scaling) and shards (for write scaling).
* **Cache**: Temporary fast storage to reduce database load and improve read latency.
* **Message Broker**: Asynchronous queue processing to decouple services and handle traffic spikes.

## 8. UX Principles

* **Clean modern UI**: Aesthetically pleasing yet functional interface.
* **Node-based editing**: Intuitive drag-and-drop mechanics for system construction.
* **Inline configuration (settings popover)**: Component settings (like replicas/shards) are configured directly on or near the node via vertical accordions—avoiding global side panels.
* **No clutter**: Keep the interface focused on the canvas and educational feedback.

## 9. Constraints (VERY IMPORTANT)

* **Do not overcomplicate simulation**: The simulation must remain understandable and fast, avoiding overly complex queuing theories if they obscure the learning objective.
* **Keep logic deterministic**: The same architecture and input must yield the exact same output every time.
* **Avoid adding unnecessary libraries**: Keep dependencies lightweight and lean. Use built-in or existing tools (like React Flow and Zustand) efficiently.
* **Prioritize learning over realism**: If strict realism makes a concept too convoluted to teach, err on the side of a simplified, educational model.

## 10. Coding Conventions

* **TypeScript strict typing**: Leverage full type safety across data models and props to prevent runtime errors.
* **Modular architecture**: Keep components, simulation logic, and evaluation rules separated and independently testable.
* **No hardcoded logic**: Extract configuration, node definitions, and challenge parameters into constants or database stores.
* **Reusable components**: Build generic UI pieces that can be utilized across different node types or panels.

## 11. Folder Structure

* **`app/`**: Next.js App Router pages, layouts, and API routes.
* **`components/`**: Reusable React components, including UI primitives and React Flow node types.
* **`store/`**: Zustand global state stores (e.g., `useSimulationStore`).
* **`lib/`**: Utility functions, simulation engine logic, evaluation rules, and shared types.

## 12. Future Roadmap (HIGH LEVEL)

* **Multi-region support**: Simulating geographically distributed deployments and cross-region latency.
* **Consistency models**: Teaching eventual vs. strong consistency in distributed databases.
* **AI evaluation layer**: Using LLMs to provide dynamic, qualitative code-review style feedback on architectures.
* **Advanced components**: CDNs, DNS routing, specialized databases (Time-series, Graph).
