/** Simulation is a local development tool, never a production payment path. */
export function isProductionPaymentRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production';
}
