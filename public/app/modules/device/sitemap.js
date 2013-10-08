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
        fillColor: 'black',
        strokeColor: 'none',
        strokeWidth: 0
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

  views.Sitemap = Marionette.CompositeView.extend({
    template: {
      type: 'handlebars',
      template: sitemapTemplate
    },
    className: 'sitemap',
    itemView: views.PhysicalDevice,
    itemViewOptions: function(){
      return {
        paper: this.paper,
        devices: this.collection
      };
    },
    ui: {
      canvas: 'canvas',
      center: '.center'
    },
    events: {
      'click': function(event){
        var hitTest = this.paper.project.hitTest(event.offsetX, event.offsetY);

        if (hitTest) {
          console.log(this.findChild(hitTest.item));
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
        } else {
          var hitTest = this.paper.project.hitTest(event.offsetX, event.offsetY);

          if (hitTest) {
            this.hilight(this.findChild(hitTest.item));
            this.$el.css('cursor', 'pointer');
          } else {
            this.hilight();
            this.$el.css('cursor', 'move');
          }
        }
      }, 15),
      'click .center': function(){
        this.position();
      },
      'click .rotateL': function(){
        this.rotate(-15);
      },
      'click .rotateR': function(){
        this.rotate(15);
      },
      'click .reset': function(){
        this.resetPosition();
      }
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

      this.listenTo(Backbone, 'window:resize', this.resize);
    },
    // This fires after the primary view is rendered
    onCompositeModelRendered: function(){
      console.log('onCompositeModelRendered');
      this.paper.setup(this.ui.canvas[0]);
      this.deviceGroup = new this.paper.Group();
    },
    // This fires after children render
    onCompositeCollectionRendered: function(){
      console.log('onCollectionRendered', this.collection.length);
      console.log(this.deviceGroup);
      this.currentRotation = 0;
      this.resetPosition();
    },
    onAfterItemAdded: function(itemView){
      // Add items to group for manipulation
      this.deviceGroup.addChild(itemView.shape);
    },
    findChild: function(shape){
      if (shape) {
        return this.children.find(function(child){
          return child.shape === shape;
        });
      }

      return false;
    },
    hilight: function(view){
      this.deviceGroup.style = {
        strokeColor: 'none',
        strokeWidth: 0
      };

      if (view) {
        // Hilight siblings
        this.children.each(function(child){
          if (child.model.incoming.models[0] === view.model.incoming.models[0]) {
            child.shape.style = {
              strokeColor: '#F26322',
              strokeWidth: 1
            };
          }
        });

        // Hilight hovered
        view.shape.style = {
          strokeColor: '#F26322',
          strokeWidth: 2
        };
      }

      this.draw();
    },
    resetPosition: function(){
      this.position();
      this.rotate();
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
        this.deviceGroup.rotate(degrees, this.deviceGroup.center);
        this.currentRotation += degrees;
      } else {
        var defaultRotation = +this.model.get('pref_rotation');

        this.deviceGroup.rotate(-this.currentRotation + defaultRotation, this.deviceGroup.center);
        this.currentRotation += defaultRotation - this.currentRotation;
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
