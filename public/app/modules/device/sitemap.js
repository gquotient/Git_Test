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
    drawPanel: function(){
      var x = this.model.get('x') * 10,
        y = this.model.get('y') * 10,
        width = 13,
        height = 10;

      this.shape = new this.paper.Path.Rectangle(x, y, width, height);
    },
    drawShape: function(){
      var shapeString = this.model.get('shapes');
      var parseCoordinates = function(currentPosition){
        for (var i = currentPosition + 1, shapeStringLength = shapeString.length; i < shapeStringLength; i++) {
          if (shapeString[i] === 'M' || shapeString[i] === 'L' || shapeString[i] === 'Z') {
            var stringPieces = shapeString.slice((currentPosition + 1), i).split(',');
            return {
              x: +stringPieces[0] * 10,
              y: +stringPieces[1] * 10
            };
          }
        }
      };

      this.shape = new this.paper.CompoundPath();

      for (var i = 0, shapeStringLength = shapeString.length; i < shapeStringLength; i++) {
        var coordinates;

        if (shapeString[i] === 'M') {
          coordinates = parseCoordinates(i);
          this.shape.moveTo(coordinates.x, coordinates.y);
        }

        if (shapeString[i] === 'L') {
          coordinates = parseCoordinates(i);
          this.shape.lineTo(coordinates.x, coordinates.y);
        }

        if (shapeString[i] === 'Z') {
          this.shape.closePath();
        }
      }
    },
    render: function(){
      this.isClosed = false;

      this.triggerMethod('before:render', this);
      this.triggerMethod('item:before:render', this);

      if (this.model.get('devtype') === 'Panel') {
        this.drawPanel();
      } else {
        this.drawShape();
      }

      this.shape.style = {
        fillColor: 'black',
        strokeColor: 'none',
        strokeWidth: 0
      };

      this.triggerMethod('render', this);
      this.triggerMethod('item:rendered', this);

      return this;
    },
    onClose: function(){
      this.shape.remove();
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
    collectionEvents: {
      'filter': function(){
        console.log(this, 'heard collection filter');
        this._renderChildren();
      }
    },
    initialize: function(options) {
      // Instantiate paper
      this.paper = new paper.PaperScope();

      // Move collection to virtual collection
      this.collection = new Backbone.VirtualCollection(options.collection, {
        filter: {
          devtype: 'String'
        },
        closeWith: this
      });
      this.listenTo(Backbone, 'window:resize', this.resize);

      this.listenTo(Backbone, 'changeView', function(devtype){
        console.log('heard change view');
        this.collection.updateFilter({devtype: devtype});
        console.log(this.collection);
      });
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
      // Store current position info
      var currentRotation = this.currentRotation;
      var currentPosition = this.currentPosition;

      // Reset rotation and position
      this.currentRotation = 0;
      this.currentPosition = {
        x: 0,
        y: 0
      };
      this.deviceGroup.position.x = 0;
      this.deviceGroup.position.y = 0;

      // NOTE - Ok, so, I'm not sure why this makes the positioning for all elements work
      // but it does. Have fun later when you come back to this.
      if (this.children.length) {
        this.resetPosition({
          rotate: currentRotation,
          x: currentPosition.x,
          y: currentPosition.y
        });
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
          if (child.shape === shape || child.shape._children && _.indexOf(child.shape._children, shape) >= 0) {
            return true;
          }
          return false;
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

        view.shape.bringToFront();
      }

      this.draw();
    },
    resetPosition: function(options){
      options = options || {};

      this.zoom();
      this.position(options.x, options.y);
      this.rotate(options.rotate);
      this.draw();
    },
    resize: function(){
      // Fill canvas to size of parent container
      this.paper.view.setViewSize(this.$el.parent().width(), this.$el.parent().height());
    },
    currentPosition: {
      x: 0,
      y: 0
    },
    position: function(x, y){
      // If options are passed, position based on those
      if (x || y) {
        this.deviceGroup.position.x += x || 0;
        this.deviceGroup.position.y += y || 0;

        this.currentPosition.x += x || 0;
        this.currentPosition.y += y || 0;
      } else {
        var center = this.paper.view.center;
        // else, center the group
        this.deviceGroup.position = center;
        this.currentPosition.x = center._x;
        this.currentPosition.y = center._y;
      }

      this.draw();
    },
    currentRotation: 0,
    rotate: function(degrees){
      degrees = degrees || (+this.model.get('pref_rotation') - this.currentRotation);

      this.deviceGroup.rotate(degrees, this.deviceGroup.center);
      this.currentRotation += degrees;

      this.draw();
    },
    currentZoom: 1,
    zoom: function(direction) {
      if (direction === '+') {
        this.deviceGroup.scale(2);
        this.currentZoom *= 2;
      } else if (direction === '-') {
        this.deviceGroup.scale(0.5);
        this.currentZoom *= 0.5;
      } else {
        this.deviceGroup.scale(1 / this.currentZoom);
        this.currentZoom = 1;
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