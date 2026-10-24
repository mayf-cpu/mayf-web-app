import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
export async function productionRollbackVersion({token,accountId,request=fetch}) {
  if (!token || !/^[a-f0-9]{32}$/i.test(accountId || '')) throw Error('Deployment credentials unavailable');
  const response = await request(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/mayf/deployments`,{method:'GET',headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},redirect:'manual',signal:AbortSignal.timeout(10000)});
  if (!response.ok) throw Error('Current production deployment could not be recorded');
  const body = await response.json();
  const deployments = body.success === true && Array.isArray(body.result?.deployments) ? body.result.deployments : [];
  const latest = [...deployments].sort((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
  const version = latest?.versions?.[0];
  if (latest?.versions?.length !== 1 || version.percentage !== 100 || !/^[a-f0-9-]{36}$/i.test(version.version_id)) throw Error('A single 100% production version is required for automatic rollback');
  return version.version_id;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const version = await productionRollbackVersion({token:process.env.CLOUDFLARE_API_TOKEN,accountId:process.env.CLOUDFLARE_ACCOUNT_ID});
    if (!process.env.GITHUB_OUTPUT) throw Error('GitHub output file is unavailable');
    appendFileSync(process.env.GITHUB_OUTPUT,`version=${version}\n`);console.log('Recorded production rollback version: '+version);
  } catch(error) { console.error(error.message);process.exitCode=1; }
}
