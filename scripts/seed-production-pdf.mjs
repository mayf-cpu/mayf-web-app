import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const digest = '2627f39c45a3554cd3cb521c72f1499b50ab95447a634ccc79f6d2da1c993915';
const key = `pdf/cnt-pdf-algebra-basics-staging-check/${digest}.pdf`;
export function verifyPublishedPdf(bytes, expectedHash = digest, expectedSize = 3624329) {
  if (bytes.length !== expectedSize || !bytes.subarray(0,8).toString().startsWith('%PDF-') || !bytes.subarray(-2048).toString().includes('%%EOF') || createHash('sha256').update(bytes).digest('hex') !== expectedHash) throw Error('Published PDF bytes do not match the accepted source');
}
export function seedPublishedPdf(verifyOnly = false) {
  const directory = mkdtempSync(join(tmpdir(),'mayf-production-pdf-'));
  const file = join(directory,'accepted.pdf');
  const wrangler = resolve('node_modules/wrangler/bin/wrangler.js');
  const run = (...args) => execFileSync(process.execPath,[wrangler,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:60000});
  try {
    try {
      run('r2','object','get','mayf-study-materials/'+key,'--remote','--file',file);
      verifyPublishedPdf(readFileSync(file)); console.log('PASS: accepted published PDF already exists in private production R2'); return;
    } catch(error) {
      if (verifyOnly || !String(error.stderr || error.stdout || '').includes('The specified key does not exist.')) throw Error('Production PDF could not be verified; no overwrite was attempted');
    }
    run('r2','object','get','mayf-staging-materials/'+key,'--remote','--file',file);
    verifyPublishedPdf(readFileSync(file));
    run('r2','object','put','mayf-study-materials/'+key,'--remote','--file',file,'--content-type','application/pdf');
    run('r2','object','get','mayf-study-materials/'+key,'--remote','--file',file);
    verifyPublishedPdf(readFileSync(file));
    console.log('PASS: accepted published PDF copied to private production R2 and hash-verified after readback');
  } finally { rmSync(directory,{recursive:true,force:true}); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { seedPublishedPdf(process.argv.includes('--verify-only')); }
  catch { console.error('Production PDF preparation failed; reconcile the private object before deployment.');process.exitCode=1; }
}
