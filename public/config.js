// Require config
require.config({
  paths: {
    // Libraries
    jquery: 'components/jquery/jquery',
    underscore: 'components/lodash/lodash',
    backbone: 'components/backbone/backbone',
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
  }
});
