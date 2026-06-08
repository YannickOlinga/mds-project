const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Autoriser Metro à bundler les fichiers 3D (.glb, .gltf)
config.resolver.assetExts.push('glb', 'gltf', 'bin');

module.exports = config;
