require.config({
  deps: ["main"],

  paths: {
    jquery: "./components/jquery/jquery",
    lodash: "./components/lodash/lodash",
    backbone: "./components/backbone/backbone"
  },

  shim: {
    backbone: {
      deps: ["lodash", "jquery"],
      exports: "Backbone"
    }
  }

})