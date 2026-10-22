import assert from 'node:assert/strict';
import test from 'node:test';
import { firebaseAuthOrigin } from '../src/lib/security/firebaseAuthOrigin';
const options = { staging: false, projectId: 'isolated-stage', productionAuthDomain: 'production-project.firebaseapp.com' };
test('Firebase CSP permits the configured production helper and the isolated staging project', () => {
  assert.equal(firebaseAuthOrigin(options), 'https://production-project.firebaseapp.com');
  assert.equal(firebaseAuthOrigin({ ...options, staging: true }), 'https://isolated-stage.firebaseapp.com');
  assert.equal(firebaseAuthOrigin({ ...options, authDomain: 'auth.example.test' }), 'https://auth.example.test');
});
test('Firebase CSP rejects environment values containing paths, credentials or injected directives', () => {
  for (const authDomain of ['https://auth.example.test', 'auth.example.test/path', 'evil.test; script-src *', 'user@auth.test', '*.firebaseapp.com', 'auth.test\nimg-src *']) {
    assert.throws(() => firebaseAuthOrigin({ ...options, authDomain }));
  }
});
