define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.marionette.handlebars',
  'backbone.virtualCollection',
  'paper',

  'hbs!device/templates/sitemap'
],
function(
  $,
  _,
  Backbone,
  Marionette,
  MarionetteHandlebars,
  VirtualCollection,
  paper,

  sitemapTemplate
){
  var views = {};

  views.PhysicalDevice = Marionette.ItemView.extend({
    render: function(options){
      this.isClosed = false;

      this.triggerMethod("before:render", this);
      this.triggerMethod("item:before:render", this);

      var x = this.model.get('x') * 10;
      var y = this.model.get('y') * 10;
      var width = 10;
      var height = 13;

      this.shape = new this.paper.Path.Rectangle(x, y, width, height);

      this.shape.style = {
        fillColor: 'black',
        strokeWidth: 5
      }

      //console.log(this.shape);

      this.triggerMethod("render", this);
      this.triggerMethod("item:rendered", this);

      return this;
    },
    onRender: function(){
      this.addEvents();
    },
    addEvents: function(){
      var that = this;

      this.shape.onClick = function(){
        that.doSomething();
      }
    },
    doSomething: function(){
      console.log('doing something', this.model);
    },
    initialize: function(options){
      //console.log(options);
      this.paper = options.paper;
    }
  });

  views.Sitemap = Marionette.CompositeView.extend({
    className: 'sitemap',
    template: {
      type: 'handlebars',
      template: sitemapTemplate
    },
    itemView: views.PhysicalDevice,
    itemViewOptions: function(){
      return {
        paper: this.paper,
        devices: this.collection
      }
    },
    ui: {
      canvas: 'canvas'
    },
    initialize: function(options) {
      var paperTimer = new Date().getTime();
      this.paper = new paper.PaperScope();

      this.collection = new Backbone.VirtualCollection(options.collection, {
        filter: {
          devtype: 'Panel'
        },
        closeWith: this
      });
    },
    onRender: function(){
      console.log(this.ui.canvas);
      this.paper.setup(this.ui.canvas[0]);
      console.log(this.paper);
    },
    onShow: function(){
      this.paper.view.setViewSize(500, 500);
      this.paper.view.draw();
    },
    // Prevent item views from being added to the DOM.
    appendHtml: function(){}
  });

  return views;
});