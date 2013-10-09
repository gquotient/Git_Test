define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.marionette.handlebars',
  'backbone.virtualCollection',
  'paper',

  'hbs!device/templates/sitemap',
  'hbs!device/templates/deviceInfo'
],
function(
  $,
  _,
  Backbone,
  Marionette,
  MarionetteHandlebars,
  VirtualCollection,
  paper,

  sitemapTemplate,
  deviceInfoTemplate
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
    }
  });

  views.DeviceInfo = Marionette.ItemView.extend({
    className: 'deviceInfo',
    template: {
      type: 'handlebars',
      template: deviceInfoTemplate
    },
    templateHelpers: function(){
      var that = this;

      return {
        parents: (function(){
          var parents = [];

          var getParents = function(model){
            var parent = model.incoming ? model.incoming.models[0] : null;

            if (parent) {
              parents.push(parent.toJSON());
              getParents(parent);
            }
          };

          getParents(that.model);

          return parents;
        })()
      };
    },
    triggers: {
      'click .close': 'close'
    },
    onShow: function(){
      if (this.options.animate) {
        this.$el
          .animate({
            'margin-left': 0
          }, 250);
      } else {
        this.$el
          .css({
            'margin-left': 0
          });
      }
    },
    onClose: function(){
      var that = this;

      this.$el
        .animate({
          'margin-left': '-100%'
        }, 250, function(){
          that.close();
        });
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
        paper: this.paper
      };
    },
    ui: {
      canvas: 'canvas',
      deviceInfoContainer: '.deviceInfoContainer'
    },
    events: {
      // 'click': function(event){
      //   var hitTest = this.paper.project.hitTest(event.offsetX, event.offsetY);

      //   if (hitTest) {
      //     this.buildDeviceInfo(this.findChild(hitTest.item).model);
      //   }
      // },
      'mousedown': function(event){
        // Set dragging object
        this.dragging = {
          x: event.offsetX,
          y: event.offsetY
        };
      },
      'mouseup': function(){
        // Clear dragging object
        this.dragging = false;
      },
      'mousemove': _.debounce(function(event){
        // Polyfill because firefox doesn't get offsetX/offsetY
        // http://bugs.jquery.com/ticket/8523
        var offsetX = event.offsetX || (event.clientX - $(event.target).offset().left);
        var offsetY = event.offsetY || (event.clientY - $(event.target).offset().top);

        // If currently dragging with the mouse, move the canvas around
        if (this.dragging) {
          // Move group to new position
          this.position(
            offsetX - this.dragging.x,
            offsetY - this.dragging.y
          );

          // Update drag origin
          this.dragging.x = offsetX;
          this.dragging.y = offsetY;
        } else {
          // Otherwise, handle hovering
          var hitTest = this.paper.project.hitTest(offsetX, offsetY);

          if (hitTest) {
            this.hilight(this.findChild(hitTest.item));
            this.$el.css('cursor', 'pointer');
          } else {
            this.hilight();
            this.$el.css('cursor', 'auto');
          }
        }
      }, 15),
      // Handle controls
      'click .center': function(){
        this.position();
      },
      'click .rotateL': function(){
        this.rotate(-15);
      },
      'click .rotateR': function(){
        this.rotate(15);
      },
      'click .zoomIn': function(){
        this.zoom('+');
      },
      'click .zoomOut': function(){
        this.zoom('-');
      },
      'click .reset': function(){
        this.resetPosition();
      }
    },
    initialize: function(options) {
      // Instantiate paper
      this.paper = new paper.PaperScope();

      // Move collection to virtual collection
      this.collection = new Backbone.VirtualCollection(options.collection, {
        filter: {
          devtype: 'Panel'
        },
        closeWith: this
      });

      this.listenTo(Backbone, 'window:resize', this.resize);
    },
    deviceInfoView: views.DeviceInfo,
    buildDeviceInfo: function(device){
      console.log('buildDeviceInfo', device);

      var deviceInfo = new this.deviceInfoView({
        model: device,
        animate: !this.deviceInfo.currentView
      });

      console.log(this.deviceInfo);

      this.deviceInfo.show(deviceInfo);
    },
    // This fires after the primary view is rendered
    onCompositeModelRendered: function(){
      this.paper.setup(this.ui.canvas[0]);
      this.deviceGroup = new this.paper.Group();
    },
    // This fires after children render
    onCompositeCollectionRendered: function(){
      // Reset rotation
      this.currentRotation = 0;

      // NOTE - Ok, so, I'm not sure why this makes the positioning for all elements work
      // but it does. Have fun later when you come back to this.
      if (this.children.length) {
        this.resetPosition();
      }
    },
    onAfterItemAdded: function(itemView){
      // Add items to group for manipulation
      this.deviceGroup.addChild(itemView.shape);
    },
    // Find child view based on a given paper shape
    findChild: function(shape){
      if (shape) {
        return this.children.find(function(child){
          return child.shape === shape;
        });
      }

      return false;
    },
    hilight: function(view){
      // Set all shapes to default styling
      this.deviceGroup.style = {
        strokeColor: 'none',
        strokeWidth: 0
      };

      if (view) {
        // Hilight siblings
        view.model.incoming.first().outgoing.each(function(model){
          var child = this.children.findByModel(model);

          if (child && child !== view) {
            child.shape.style = {
              strokeColor: '#F26322',
              strokeWidth: 1
            };
          }
        }, this);

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
      this.draw();
    },
    resize: function(){
      // Fill canvas to size of parent container
      this.paper.view.setViewSize(this.$el.parent().width(), this.$el.parent().height());
    },
    position: function(x, y){
      // If options are passed, position based on those
      if (x || y) {
        this.deviceGroup.position.x += x || 0;
        this.deviceGroup.position.y += y || 0;
      } else {
        // else, center the group
        this.deviceGroup.position = this.paper.view.center;
      }

      this.draw();
    },
    rotate: function(degrees){
      degrees = degrees || (+this.model.get('pref_rotation') - this.currentRotation);

      this.deviceGroup.rotate(degrees, this.deviceGroup.center);
      this.currentRotation += degrees;

      this.draw();
    },
    zoom: function(direction) {
      if (direction === '+') {
        this.deviceGroup.scale(2);
      } else if (direction === '-') {
        this.deviceGroup.scale(0.5);
      }

      this.draw();
    },
    onShow: function(){
      this.resize();

      this.deviceInfo = new Backbone.Marionette.Region({
        el: this.ui.deviceInfoContainer
      });
    },
    draw: function(){
      this.paper.view.draw();
    },
    // Prevent item views from being added to the DOM.
    appendHtml: function(){}
  });

  return views;
});