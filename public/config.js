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
  paths: {
    // Libraries
    jquery: 'components/jquery/jquery',
    // underscore: 'components/lodash/lodash',
    underscore: 'components/underscore/underscore',
    
    backbone: 'components/backbone/backbone',
    'backbone.babysitter': 'components/backbone.babysitter/lib/amd/backbone.babysitter',
    'backbone.wreqr': 'components/backbone.wreqr/lib/amd/backbone.wreqr',
    'backbone.marionette': 'components/backbone.marionette/lib/core/amd/backbone.marionette',
    'backbone.marionette.handlebars': 'components/backbone.marionette.handlebars/backbone.marionette.handlebars',
    
    hbs: 'components/require-handlebars-plugin/hbs',
    json2: 'components/require-handlebars-plugin/hbs/json2',
    i18nprecompile: 'components/require-handlebars-plugin/hbs/i18nprecompile',
    handlebars: 'components/handlebars/handlebars',
    
    modernizr: 'components/modernizr/modernizr',
    text: 'components/requirejs-text/text',
    css: 'components/css/css'
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
  hbs:{
    disableI18n: true,        // This disables the i18n helper and
                              // doesn't require the json i18n files (e.g. en_us.json)
                              // (false by default)

    disableHelpers: true
  }
});
