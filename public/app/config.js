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
 * via bower (underscore dependency issue), so I just dropped it in to the bower_components
 * folder. This is going to be a pain in the ass until it gets fixed.
 *
 * Finally: marionette requires babysitter and wreqr (and backbone, jQuery, underscore
 * and json2).
 */

require.config({
  //baseUrl: '/public',
  packages: [
    {
      name: 'user',
      main: 'user',
      location: 'modules/user'
    },
    {
      name: 'portfolio',
      main: 'portfolio',
      location: 'modules/portfolio'
    },
    {
      name: 'project',
      main: 'project',
      location: 'modules/project'
    },
    {
      name: 'device',
      main: 'device',
      location: 'modules/device'
    },
    {
      name: 'layouts',
      main: 'layouts',
      location: 'layouts'
    },
    {
      name: 'breadcrumb',
      main: 'breadcrumb',
      location: 'modules/breadcrumb'
    },
    {
      name: 'form',
      main: 'form',
      location: 'modules/form'
    },
    {
      name: 'message',
      main: 'message',
      location: 'modules/message'
    },
    {
      name: 'team',
      main: 'team',
      location: 'modules/team'
    },
    {
      name: 'organization',
      main: 'organization',
      location: 'modules/organization'
    },
    {
      name: 'error',
      main: 'error',
      location: 'modules/error'
    },
    {
      name: 'chart',
      main: 'chart',
      location: 'modules/chart'
    },
    {
      name: 'issue',
      main: 'issue',
      location: 'modules/issue'
    },
    {
      name: 'equipment',
      main: 'equipment',
      location: 'modules/equipment'
    }
  ],
  paths: {
    // Main app
    ia: 'ia',

    // Require plugins
    text: 'bower_components/requirejs-text/text',
    css: 'bower_components/css/css',
    hbs: 'bower_components/require-handlebars-plugin/hbs',

    // Libraries
    es5shim: 'bower_components/es5-shim/es5-shim',
    json2: 'bower_components/require-handlebars-plugin/hbs/json2',
    i18nprecompile: 'bower_components/require-handlebars-plugin/hbs/i18nprecompile',
    jquery: 'bower_components/jquery/jquery',
    underscore: 'bower_components/underscore/underscore',
    // underscore: 'bower_components/lodash/lodash',
    backbone: 'bower_components/backbone/backbone',
    'backbone.babysitter': 'bower_components/backbone.babysitter/lib/amd/backbone.babysitter',
    'backbone.wreqr': 'bower_components/backbone.wreqr/lib/amd/backbone.wreqr',
    'backbone.marionette': 'bower_components/backbone.marionette/lib/core/amd/backbone.marionette',
    'backbone.marionette.handlebars': 'bower_components/backbone.marionette.handlebars/backbone.marionette.handlebars',
    handlebars: 'bower_components/handlebars/handlebars',
    modernizr: 'bower_components/modernizr/modernizr',
    leaflet: 'bower_components/leaflet/dist/leaflet',
    messageformat: 'bower_components/messageformat.js/messageformat',
    paper: 'bower_components/paper/dist/paper',
    'jquery.mousewheel': 'bower_components/jquery-mousewheel/jquery.mousewheel',
    highcharts: 'bower_components/highcharts/highcharts',
    handsontable: 'bower_components/handsontable/dist/jquery.handsontable'
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
    },
    leaflet: {
      exports: 'L'
    },
    highcharts: {
      deps: ['jquery'],
      exports: 'Highcharts'
    },
    handsontable: {
      deps: ['jquery'],
      exports: 'Handsontable'
    }
  },
  // hbs config
  hbs: {
    disableI18n: false,        // This disables the i18n helper and
    i18nDirectory: 'i18n/',
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
