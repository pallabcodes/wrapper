#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packages = [
  'packages/authx',
  'packages/authx-sdk',
];

function getCurrentVersion(packagePath) {
  const packageJsonPath = path.join(packagePath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

function updateVersion(packagePath, newVersion) {
  const packageJsonPath = path.join(packagePath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`Updated ${packagePath} to version ${newVersion}`);
}

function buildPackage(packagePath) {
  console.log(`Building ${packagePath}...`);
  execSync('pnpm run build', { 
    cwd: packagePath, 
    stdio: 'inherit' 
  });
}

function createGitTag(version) {
  const tag = `v${version}`;
  console.log(`Creating git tag: ${tag}`);
  execSync(`git add .`);
  execSync(`git commit -m "chore: release ${tag}"`);
  execSync(`git tag ${tag}`);
  console.log(`Created tag: ${tag}`);
  console.log(`Push with: git push origin main --tags`);
}

function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch'; // patch, minor, major
  
  if (!['patch', 'minor', 'major'].includes(versionType)) {
    console.error('Usage: node scripts/release.js [patch|minor|major]');
    process.exit(1);
  }

  console.log(`Releasing ${versionType} version...`);

  // Get current version from authx package
  const currentVersion = getCurrentVersion('packages/authx');
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  let newVersion;
  switch (versionType) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }

  console.log(`Current version: ${currentVersion}`);
  console.log(`New version: ${newVersion}`);

  // Update all packages
  packages.forEach(pkg => {
    updateVersion(pkg, newVersion);
    buildPackage(pkg);
  });

  // Create git tag
  createGitTag(newVersion);

  console.log('\nRelease completed!');
  console.log('Next steps:');
  console.log('1. git push origin main --tags');
  console.log('2. The CI will automatically publish the SDK to npm');
}
