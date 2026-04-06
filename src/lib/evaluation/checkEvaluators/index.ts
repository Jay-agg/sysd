export { evaluateRequiredComponents } from './componentCheck';
export { evaluateNoSinglePointOfFailure, detectSingleInstanceSpofs } from './spofCheck';
export { evaluateMaxLatency } from './latencyCheck';
export { evaluateMaxErrorRate } from './errorRateCheck';
export { evaluateMinThroughput } from './throughputCheck';
export { evaluateMinReplicas } from './minReplicasCheck';
export { evaluateMinShards } from './minShardsCheck';
export { evaluateRequiredCapabilities } from './capabilitiesCheck';
export { normalizeTestChecks } from './normalizeChecks';
