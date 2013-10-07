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
    render: function(){
      this.isClosed = false;

      this.triggerMethod('before:render', this);
      this.triggerMethod('item:before:render', this);

      var x = this.model.get('x') * 10;
      var y = this.model.get('y') * 10;
      var width = 13;
      var height = 10;

      this.shape = new this.paper.Path.Rectangle(x, y, width, height);

      this.shape.style = {
        fillColor: 'black'
      };

      this.triggerMethod('render', this);
      this.triggerMethod('item:rendered', this);

      return this;
    },
    initialize: function(options){
      this.paper = options.paper;
      this.project = options.project;
    }
  });

  views.Sitemap = Marionette.CollectionView.extend({
    tagName:'canvas',
    itemView: views.PhysicalDevice,
    itemViewOptions: function(){
      return {
        paper: this.paper,
        devices: this.collection
      };
    },
    initialize: function(options) {
      var paperTimer = new Date().getTime();

      this.paper = new paper.PaperScope();
      this.paper.setup(this.el);
      this.deviceGroup = new this.paper.Group();

      this.collection = new Backbone.VirtualCollection(options.collection, {
        filter: {
          devtype: 'Panel'
        },
        closeWith: this
      });

      this.listenTo(Backbone, 'window:resize', this.resize);
    },
    events: {
      'click': function(event){
        var hitResult = this.paper.project.hitTest(event.offsetX, event.offsetY);
        console.log('click', event);
        console.log(hitResult);
        if (hitResult) {
          console.log(this.findChild(hitResult.item));
        } else {
          console.log('Nothing clicked');
        }
      }
    },
    findChild: function(shape){
      if (shape) {
        return this.children.find(function(child){
          return child.shape === shape;
        });
      }

      return false;
    },
    onCollectionRendered: function(){
      console.log('onCollectionRendered');
      this.position();
      this.rotate();
      //this.draw();
    },
    onAfterItemAdded: function(itemView){
      // Add items to group for manipulation
      this.deviceGroup.addChild(itemView.shape);
    },
    resize: function(){
      this.paper.view.setViewSize(this.$el.parent().width(), this.$el.parent().height());
    },
    position: function(){
      this.deviceGroup.position = this.paper.view.center;
      this.draw();
    },
    rotate: function(){
      this.deviceGroup.rotate(this.model.get('pref_rotation'), this.paper.view.center);
      this.draw();
    },
    onRender: function(){
      console.log('onRender');
      console.log(this.model);
      console.log(this.paper);
    },
    onShow: function(){
      this.resize();
      this.draw();
    },
    draw: function(){
      var renderTime = new Date().getTime();
      console.log('draw', this.collection.length, this.children.length);
      if (this.paper.view) {
        console.log('has view');
        this.paper.view.draw();
        //this.paper.view.rotate(this.model.get('pref_rotation'));
        console.log('time to draw:', new Date().getTime() - renderTime);
      }
    },
    animate: function(){
      console.log('animate');
      var that = this;
      var length = 30;
      var colors = ['red', 'green', 'blue', 'black', 'yellow'];
      var next = function(){
        console.log('next');
        length--;

        that.children.each(function(child){
          //console.log('child', child);
          child.shape.style = {
            fillColor: colors[parseInt((Math.random() * 10 / 2))]
          };
        });

        that.paper.view.draw();

        if (length) {
          setTimeout(next, 10);
        }
      };

      setTimeout(next, 0);
    },
    // Prevent item views from being added to the DOM.
    appendHtml: function(){}
  });

  return views;
});