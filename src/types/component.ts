/** Canonical component tokens for challenge checks and the dataset (must match the canvas / simulation model). */
export const SUPPORTED_COMPONENTS = [
  'apiGateway',
  'appServer',
  'database',
  'cache',
  'loadBalancer',
  'webClient',
  'mobileClient',
  'worker',
  'messageBroker',
  'sqlDatabase',
  'noSqlDatabase',
  'cdn',
] as const;

export type ComponentType = (typeof SUPPORTED_COMPONENTS)[number];
