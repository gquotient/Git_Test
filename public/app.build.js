({
  baseUrl: '.',
  appDir: 'app',
  dir: 'app-build',

  mainConfigFile: 'app/config.js',

  modules: [
    {
      name: 'config',
      include: [
        'init'
      ]
    }
  ],


  //Use for debugging
  optimizeCss: 'none',
  optimize: 'none'
})