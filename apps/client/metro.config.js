// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { getMetroTools } = require('react-native-monorepo-tools');

const monorepoMetroTools = getMetroTools();

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.watchFolders = monorepoMetroTools.watchFolders;

config.resolver.extraNodeModules = monorepoMetroTools.extraNodeModules;

module.exports = config;
