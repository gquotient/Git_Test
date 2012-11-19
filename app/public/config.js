require.config({
  deps: ["main"],

  paths: {
    jquery: "./components/jquery/jquery",
    lodash: "./components/lodash/lodash",
    backbone: "./components/backbone/backbone",
    handlebars: "./components/handlebars/handlebars-1.0.0-rc.1"
  },

  shim: {
    backbone: {
      deps: ["lodash", "jquery"],
      exports: "Backbone"
    }
  }

})