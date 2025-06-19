const webpack = require('webpack');

module.exports = function override(config) {
  // Add fallbacks for Node.js core modules
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer/"),
    "util": require.resolve("util/")
  });
  config.resolve.fallback = fallback;

  // Define process.env
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.NODE_DEBUG': false
    })
  ]);

  // Add process as an external
  config.externals = config.externals || {};
  if (!Array.isArray(config.externals)) {
    config.externals = [config.externals];
  }
  config.externals.push({
    'process': 'var process',
  });

  return config;
};