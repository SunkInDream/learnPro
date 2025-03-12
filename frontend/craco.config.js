const CracoLessPlugin = require('craco-less');

module.exports = {
  devServer: {
    allowedHosts: 'all'  // 允许所有主机访问&#8203;:contentReference[oaicite:2]{index=2}
  },
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
}; 