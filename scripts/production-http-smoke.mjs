import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Fixed-origin, read-only acceptance. Never follows redirects or prints response bodies.
export async function productionHttpSmoke({request = fetch, pause = ms => new Promise(resolve => setTimeout(resolve, ms)), attempts = 6, report = console.log} = {}) {
  const check = async (path, validate) => {
    let failure = 'no response';
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const response = await request('https://mayf.co.in' + path, { method:'GET', redirect:'manual', headers:{Accept:'application/json','Cache-Control':'no-store'}, signal:AbortSignal.timeout(15000) });
        const json = response.headers.get('content-type')?.includes('application/json');
        if (json && await validate(response, await response.json())) { report('PASS: production ' + path); return; }
        failure = 'HTTP ' + response.status + '; JSON=' + Boolean(json);
      } catch (error) { failure = error?.name === 'TimeoutError' ? 'request timeout' : 'request or JSON failure'; }
      report('WAIT: production ' + path + ' attempt ' + attempt + '/' + attempts + ': ' + failure);
      if (attempt < attempts) await pause(2000);
    }
    throw Error('Production acceptance failed at ' + path + ' after ' + attempts + ' attempts: ' + failure);
  };
  await check('/api/health', (response, body) => response.ok && body.status === 'ok' && body.app === 'Maths at Your Fingertips' && body.environment === 'production' && body.firebaseConfigured === true && body.firebaseProjectMatchesWebConfig === true);
  await check('/api/annual-pass/config', (response, body) => response.ok && body.success === true && body.checkoutEnabled === false);
  for (const path of ['/api/admin/orders','/api/admin/payments/settings','/api/student/orders']) {
    await check(path, response => [401,403].includes(response.status));
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await productionHttpSmoke(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
