import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function allJavaScriptFiles(dir, result = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') allJavaScriptFiles(full, result);
    if (entry.isFile() && full.endsWith('.js')) result.push(full);
  }
  return result;
}

test('all JavaScript files pass Node syntax validation', () => {
  for (const file of allJavaScriptFiles(root)) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    assert.equal(result.status, 0, `${file}\n${result.stderr}`);
  }
});

test('sensitive runtime env file is not shipped', () => {
  assert.equal(existsSync(path.join(root, 'config', '.env')), false);
  assert.equal(existsSync(path.join(root, '.env.example')), true);
});

test('legacy broken runtime references are removed', () => {
  const files = allJavaScriptFiles(path.join(root, 'src'));
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /DB\/model\/|src\/module\/|DBMethods|console\.log\(gg\)|console\.log\(posts\.length\)/);
  }
});

test('runtime app smoke test (runs when npm dependencies are installed)', async (t) => {
  let app;
  try {
    ({ default: app } = await import('../src/app.js'));
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') {
      t.skip(`Install dependencies first: ${error.message}`);
      return;
    }
    throw error;
  }

  const server = app.listen(0);
  try {
    const port = server.address().port;
    const ping = await fetch(`http://127.0.0.1:${port}/ping`);
    assert.equal(ping.status, 200);
    assert.deepEqual(await ping.json(), { success: true, message: 'pong' });

    const auth = await fetch(`http://127.0.0.1:${port}/user/getUserData`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    assert.equal(auth.status, 401);

    const missing = await fetch(`http://127.0.0.1:${port}/does-not-exist`);
    assert.equal(missing.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
