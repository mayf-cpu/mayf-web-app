// Fixed-origin, read-only deployment acceptance. No credentials or writes.
for (const [path, validate] of [
  ['/api/health', (body) => body.status === 'ok' && body.app === 'Maths at Your Fingertips' && body.environment === 'production'],
  ['/api/annual-pass/config', (body) => body.success === true && body.checkoutEnabled === false],
]) {
  const response = await fetch('https://mayf.co.in' + path, { method:'GET',redirect:'manual',headers:{Accept:'application/json','Cache-Control':'no-store'},signal:AbortSignal.timeout(15000) });
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json') || !validate(await response.json())) throw Error('Production acceptance failed at ' + path);
  console.log('PASS: production ' + path);
}
for (const path of ['/api/admin/orders','/api/admin/payments/settings','/api/student/orders']) {
  const response = await fetch('https://mayf.co.in' + path, {method:'GET',redirect:'manual',headers:{Accept:'application/json'},signal:AbortSignal.timeout(15000)});
  if (![401,403].includes(response.status)) throw Error('Production authentication perimeter failed at ' + path);
  console.log('PASS: production anonymous access denied to ' + path);
}
