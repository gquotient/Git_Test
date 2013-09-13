({
  baseUrl: '.',
  appDir: 'app',
  dir: 'build/0.1.1/app',

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
  optimizeCss: 'none' //Stylus does this for us
  //optimize: 'none' //Use for debugging
})