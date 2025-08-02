const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional asset types
config.resolver.assetExts.push(
  // Fonts
  'ttf',
  'otf',
  'woff',
  'woff2',
  // Images
  'svg',
  'webp',
  // Audio
  'mp3',
  'wav',
  'aac',
  // Video
  'mp4',
  'mov'
);

// Enable Hermes on Android and iOS
config.transformer.hermesCommand = 'hermes';

// Increase memory limit for large projects
config.maxWorkers = 2;

module.exports = config; 