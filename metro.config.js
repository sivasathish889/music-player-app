const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('ts', 'tsx', 'js', 'jsx', 'json');
config.resolver.extraNodeModules = {
    'shaka-player/dist/shaka-player.ui': require.resolve('shaka-player/dist/shaka-player.ui.js'),
};

module.exports = config;
