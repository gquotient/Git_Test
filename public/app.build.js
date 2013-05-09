({
  baseUrl: '.',
  appDir: 'app',
  dir: 'app.build',

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

  optimizeCss: 'none', //Stylus does this for us
  optimize: 'none' //Use for debugging
})