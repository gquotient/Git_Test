// Require config
require.config({
  paths: {
    //Require plugins
    text: 'components/requirejs-text/text',
    css: 'components/css/css',
    hbs: 'components/require-handlebars-plugin/hbs',
    // Libraries
    jquery: 'components/jquery/jquery',
    underscore: 'components/lodash/lodash',
    backbone: 'components/backbone/backbone',
    handlebars: 'components/handlebars/handlebars',
    modernizr: 'components/modernizr/modernizr'
    // Modules

  },
  shim: {
    backbone: {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    underscore: {
      exports: '_'
    },
    handlebars: {
      exports: 'Handlebars'
    },
    modernizr: {
      exports: 'Modernizr'
    }
  },
  // hbs config
  hbs: {
    disableI18n: true,        // This disables the i18n helper and
                              // doesn't require the json i18n files (e.g. en_us.json)
                              // (false by default)

    disableHelpers: true,     // When true, won't look for and try to automatically load
                              // helpers (false by default)

    helperPathCallback:       // Callback to determine the path to look for helpers
      function (name) {       // ('/template/helpers/'+name by default)
        return 'cs!' + name;
      },

    //templateExtension: "html", // Set the extension automatically appended to templates
                              // ('hbs' by default)

    compileOptions: {}        // options object which is passed to Handlebars compiler
  }
});
