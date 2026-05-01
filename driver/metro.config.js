const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /android[\/\\]\.cxx[\/\\].*/,
  /android[\/\\]app[\/\\]build[\/\\].*/,
  /android[\/\\]build[\/\\].*/,
  /node_modules[\/\\].*[\/\\]android[\/\\]\.cxx[\/\\].*/,
  /node_modules[\/\\].*[\/\\]android[\/\\]build[\/\\].*/,
];

module.exports = config;
