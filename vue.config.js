module.exports = {
  pwa: {
    name: 'A Journal To A Life Worth Living',
    themeColor: '#007bff',
    msTileColor: '#ffffff',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    workboxPluginMode: 'GenerateSW',
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'firebase-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 24 * 60 * 60 // 1 dag
            }
          }
        }
      ]
    }
  }
}