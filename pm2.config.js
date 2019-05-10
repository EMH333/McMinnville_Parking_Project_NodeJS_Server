module.exports = {
  apps: [{
    name: 'parallel',
    script: './bin/www',
    error_file: '/parallel/log/node/err.log',
    out_file: '/parallel/log/node/out.log',
    env: {
      'NODE_ENV': 'production',
    },
  }],
};
