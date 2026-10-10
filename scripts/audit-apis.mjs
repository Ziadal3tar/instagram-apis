import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(root, '..');
const modulesRoot = path.join(projectRoot, 'src', 'modules');

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) files.push(full);
  }
}
walk(modulesRoot);

const controllers = files.filter((file) => file.endsWith('.controller.js'));
const routes = files.filter((file) => file.endsWith('.routes.js'));

console.log('Controllers:', controllers.length);
console.log('Routes:', routes.length);

for (const controller of controllers.sort()) {
  const source = fs.readFileSync(controller, 'utf8');
  const exports = [...source.matchAll(/export const (\w+)\s*=\s*asyncHandler/g)].map((match) => match[1]);
  console.log(`- ${path.relative(projectRoot, controller)} -> ${exports.join(', ') || 'none'}`);
}

console.log('\nRoutes:');
for (const route of routes.sort()) {
  const source = fs.readFileSync(route, 'utf8');
  const matches = [...source.matchAll(/router\.(get|post|put|patch|delete)\(([^\n]+)/g)].map((match) => `${match[1].toUpperCase()} ${match[2].replace(/\s+/g, ' ').slice(0, 100)}`);
  console.log(`- ${path.relative(projectRoot, route)}`);
  for (const match of matches) console.log(`  ${match}`);
}
