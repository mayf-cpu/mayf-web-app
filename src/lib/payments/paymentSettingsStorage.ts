/** Keep production credentials independent when staging shares the Firebase project. */
export function paymentSettingsStorage(appEnv = process.env.APP_ENV) {
  return appEnv === 'production'
    ? { collection: 'paymentProductionRuntimeSettings', marker: 'paymentProductionSettingsState' }
    : { collection: 'paymentRuntimeSettings', marker: 'paymentSettingsState' };
}
