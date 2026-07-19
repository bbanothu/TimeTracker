#!/usr/bin/env node
/**
 * Bumps expo.version minor: 1.X.0 → 1.(X+1).0
 * Keeps patch at 0. Also syncs package.json version.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appJsonPath = path.join(root, 'app.json');
const packageJsonPath = path.join(root, 'package.json');

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const current = String(appJson.expo?.version ?? '1.0.0');
const parts = current.split('.').map((part) => Number.parseInt(part, 10));
if (parts.length < 2 || parts.some((n) => !Number.isFinite(n))) {
  console.error(`Invalid version in app.json: ${current}`);
  process.exit(1);
}

const [major, minor] = parts;
const next = `${major}.${minor + 1}.0`;

appJson.expo.version = next;
packageJson.version = next;

fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log(`Version bumped ${current} → ${next}`);
