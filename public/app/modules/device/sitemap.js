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

        if (hitResult) {
          console.log(this.findChild(hitResult.item));
        }
      },
      'mousedown': function(event){
        this.dragging = {
          x: event.offsetX,
          y: event.offsetY
        };
      },
      'mouseup': function(){
        this.dragging = false;
      },
      'mousemove': _.debounce(function(event){
        if (this.dragging) {
          this.position({
            x: event.offsetX - this.dragging.x,
            y: event.offsetY - this.dragging.y
          });

          // Update drag origin
          this.dragging.x = event.offsetX;
          this.dragging.y = event.offsetY;
        }
      }, 15)
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
      console.log('onCollectionRendered', this.collection.length);
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
    position: function(options){
      // If options are passed, position based on those
      if (options) {
        this.deviceGroup.position.x += options.x || 0;
        this.deviceGroup.position.y += options.y || 0;
      } else {
        // else, center the group
        this.deviceGroup.position = this.paper.view.center;
      }

      this.draw();
    },
    rotate: function(degrees){
      if (degrees) {
        this.deviceGroup.rotate(this.model.get('pref_rotation'), this.deviceGroup.center);
      } else {
        this.deviceGroup.rotate(this.model.get('pref_rotation'), this.deviceGroup.center);
      }

      this.draw();
    },
    onShow: function(){
      this.resize();
      this.draw();
    },
    draw: function(){
      if (this.paper.view) {
        this.paper.view.draw();
      }
    },
    // Prevent item views from being added to the DOM.
    appendHtml: function(){}
  });

  return views;
});
