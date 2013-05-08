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
      ],
      exclude: [
        'components/requirejs/require'
      ]
    }
  ],

  //Use for debugging
  optimizeCss: 'none',
  optimize: 'none'
})