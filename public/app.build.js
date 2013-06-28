({
  baseUrl: '.',
  appDir: 'app',
  dir: 'app',

  mainConfigFile: 'app/config.js',

  modules: [
    {
      name: 'config',
      include: [
        'init'
      ],
      exclude: [
        'components/requirejs/require',
        'paper'
      ]
    }
  ],

  optimizeCss: 'none', //Stylus does this for us
  optimize: 'none' //Use for debugging
})