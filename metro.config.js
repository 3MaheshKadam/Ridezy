const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix: Exclude backend and .backup files from bundling.
const blockListPatterns = [
    /.*\.backup\.(js|jsx|ts|tsx)$/,
    /.*[\\/]ridezybackend[\\/].*/,
    /.*[\\/]\.git[\\/].*/,
];

config.resolver.blockList = blockListPatterns;

// Also exclude ridezybackend from the file watcher to prevent re-bundle triggers
config.watchFolders = [];
config.resolver.watchFolders = [];

// Explicitly set the watch folders to only watch the project root (not subfolders like ridezybackend)
config.watcher = {
    ...config.watcher,
    watchman: {
        deferStates: ['hg.update'],
    },
};

// Increase resolver timeouts to avoid the 99.9% serialization hang on Windows.
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Set max workers to 1 on Windows to avoid the final 99.9% serialization hang.
// This is the most reliable workaround for Metro hangs on Windows.
config.maxWorkers = 1;

module.exports = withNativeWind(config, { input: './global.css' });

