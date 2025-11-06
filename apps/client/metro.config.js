// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.symlinks = true;

// Enable package exports 지원, @repo/schema 지원
config.resolver.unstable_enablePackageExports = true;

// Drizzle: SQL 파일 import 지원
config.resolver.sourceExts.push('sql');

module.exports = withNativeWind(config, {
  input: path.resolve(workspaceRoot, 'apps/client/styles/global.css'),
});
