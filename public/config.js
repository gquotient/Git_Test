// Require config

/*
 * What's going on here? Well, it turns out lodash and underscore aren't entirely
 * drop-in compatible? Specifically: _.chain is not present in lodash, and hbs
 * requires it. Also: backbone needs a specific version of underscore that has the
 * _.pluck method.
 *
 * Another thing to note: hbs requires json2 and i18nprecompile.
 *
 * Also: I want to user backbone.marionette.handlebars because it works so nicely
 * with Alex's require handlebars plugin. It seems to have trouble being installed
 * via bower (underscore dependency issue), so I just dropped it in to the components
 * folder. This is going to be a pain in the ass until it gets fixed.
 *
 * Finally: marionette requires babysitter and wreqr (and backbone, jQuery, underscore
 * and json2).
 */

require.config({
  // deps: ["app/init"],
  paths: {
    //Require plugins
    text: 'components/requirejs-text/text',
    css: 'components/css/css',
    hbs: 'components/require-handlebars-plugin/hbs',

    // Libraries
    json2: 'components/require-handlebars-plugin/hbs/json2',
    i18nprecompile: 'components/require-handlebars-plugin/hbs/i18nprecompile',
    jquery: 'components/jquery/jquery',
    underscore: 'components/underscore/underscore',
    // underscore: 'components/lodash/lodash',
    backbone: 'components/backbone/backbone',
    'backbone.babysitter': 'components/backbone.babysitter/lib/amd/backbone.babysitter',
    'backbone.wreqr': 'components/backbone.wreqr/lib/amd/backbone.wreqr',
    'backbone.marionette': 'components/backbone.marionette/lib/core/amd/backbone.marionette',
    'backbone.marionette.handlebars': 'components/backbone.marionette.handlebars/backbone.marionette.handlebars',
    
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
    disableI18n: false,        // This disables the i18n helper and
    i18nDirectory: "/app/i18n/",
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
