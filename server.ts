import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Check if already running under tsx
const isTsxLoaded = Boolean(
  (process as any)[Symbol.for('tsx.version')] ||
  process.execArgv.some((arg) => arg.includes('tsx')) ||
  process.env.__TSX_BOOTSTRAPPED__ === '1'
);

if (!isTsxLoaded) {
  const currentFile = fileURLToPath(import.meta.url);
  const child = spawn(process.execPath, ['--import', 'tsx', currentFile, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, __TSX_BOOTSTRAPPED__: '1' },
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });

  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
} else {
  await import('./serverApp.ts');
}
