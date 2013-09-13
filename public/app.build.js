({
  baseUrl: '.',
  appDir: 'app',
  dir: 'app.build.0.1.1',

  mainConfigFile: 'app/config.js',

  modules: [
    {
      name: 'config',
      include: [
        'init'
      ],
      exclude: [
        'bower_components/requirejs/require',
        'paper'
      ]
    },
    {
      name: 'paper'
    }
  ],

  skipDirOptimize: true, // Only minifies modules in the build
  optimizeCss: 'none'//ß, //Stylus does this for us
  //optimize: 'none' //Use for debugging
})