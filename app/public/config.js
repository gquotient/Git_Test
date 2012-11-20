require.config({
  deps: ["main"],

  paths: {
    jquery: "./components/jquery/jquery",
    lodash: "./components/lodash/lodash",
    //underscore: "./components/lodash/lodash",
    underscore: "./components/require-handlebars-plugin/hbs/underscore",
    backbone: "./components/backbone/backbone",
    handlebars: "./components/handlebars/handlebars",
    hbs: "./components/require-handlebars-plugin/hbs",
    json2: "./components/require-handlebars-plugin/hbs/json2",
    i18nprecompile: "./components/require-handlebars-plugin/hbs/i18nprecompile",
    //templates: "./templates"
  },

  hbs: {
    disableI18n: true
  },

  shim: {
    backbone: {
      deps: ["lodash", "jquery"],
      exports: "Backbone"
    },
    handlebars: {
      exports: "Handlebars"
    }
  }

});