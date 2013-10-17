/*

  TODO

  [x] See what zoom level will fill the screen and set it to that
  [x] Other overlay types
  [ ] Overlay play indicator dragging/clicking
  [x] Overlay date display formatting
  [ ] Overlay interval fetching
  [ ] Device Detail
  [ ] Real panel sizes / orientation
  [x] Error handling
  [x] Perf - Filter device shapes that are out of view from painting
  [x] Perf - Skip unattached panels
  [ ] Compass
  [ ] Only drag visible shapes and update all shapes on drag stop
      - This may mean not using the group for positioning

*/

define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.marionette.handlebars',
  'backbone.virtualCollection',

  'paper',
  'walltime',

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
  WallTime,

  sitemapTemplate,
  deviceInfoTemplate
){
  var views = {};

  var defaultFillColor = '#555',
    fillColors = {
      A: [
        {
          value: 80,
          label: '> 80%',
          color: '#034E7B'
        },
        {
          value: 60,
          label: '60% - 79%',
          color: '#0570B0'
        },
        {
          value: 40,
          label: '40% - 59%',
          color: '#3690C0'
        },
        {
          value: 20,
          label: '20% - 39%',
          color: '#74A9CF'
        },
        {
          value: 0,
          label: '0% - 19%',
          color: '#A6BDDB'
        }
      ],
      R: [
        {
          value: 40,
          label: '> 40',
          color:  '#034E7B'
        },
        {
          value: 30,
          label: '30 - 39',
          color: '#0570B0'
        },
        {
          value: 20,
          label: '20 - 29',
          color: '#3690C0'
        },
        {
          value: 10,
          label: '10 - 19',
          color: '#74A9CF'
        },
        {
          value: 0,
          label: '0 - 9',
          color: '#A6BDDB'
        }
      ],
      N: [
        {
          value: 95,
          label: '> 95%',
          color: '#034E7B'
        },
        {
          value: 90,
          label: '90% - 94%',
          color: '#0570B0'
        },
        {
          value: 85,
          label: '85% - 89%',
          color: '#3690C0'
        },
        {
          value: 80,
          label: '80% - 84%',
          color: '#74A9CF'
        },
        {
          value: 75,
          label: '75% - 79%',
          color: '#A6BDDB'
        },
        {
          value: 50,
          label: '50% - 74%',
          color: '#eeec2d'
        },
        {
          value: 0,
          label: '0% - 49%',
          color: '#f12727'
        }
      ],
      E: [
        {
          value: 120,
          label: '> 120',
          color: '#0080FF'
        },
        {

          value: 114,
          label: '115 - 119',
          color: '#2E9AFE'
        },
        {
          value: 109,
          label: '110 - 114',
          color: '#58ACFA'
        },
        {
          value: 104,
          label: '105 - 109',
          color: '#8ABEF7'
        },
        {
          value: 102,
          label: '103 - 104',
          color: '#A9D0F5'
        },
        {
          value: 97,
          label: '98 - 102',
          color: '#CEE3F6'
        },
        {
          value: 94,
          label: '95 - 97',
          color:'#F6CECE'
        },
        {
          value: 89,
          label: '90 - 94',
          color:'#F5A9A9'
        },
        {
          value: 84,
          label: '85 - 89',
          color:'#F78181'
        },
        {
          value: 79,
          label: '80 - 84',
          color:'#FA5858'
        },
        {
          value: 74,
          label: '75 - 79',
          color:'#FE2E2E'
        },
        {
          value: 0,
          label: '< 75',
          color:'#f12727'
        }
      ]
    },
    colorSelector = function(type, value) {
      var result;

      _.find(fillColors[type], function(color){
        if (value >= color.value) {
          result = color.color;
          return true;
        }
      });

      return result || defaultFillColor;
    };

  views.PhysicalDevice = Marionette.ItemView.extend({
    // Handle panel drawing
    drawPanel: function(){
      var x = this.model.get('x') * 10,
        y = this.model.get('y') * 10,
        width = 13,
        height = 10;

      this.shape = new this.paper.Path.Rectangle(x, y, width, height);
    },
    // Handle arbitrary shapes
    drawShape: function(){
      // Get the SVG path string
      var shapeString = this.model.get('shapes'),
        // Parse coordinates at a given point on the string
        parseCoordinates = function(currentPosition){
          // Loop through from the current position to next rule (M, L, or Z)
          for (var i = currentPosition + 1, shapeStringLength = shapeString.length; i < shapeStringLength; i++) {
            if (shapeString[i] === 'M' || shapeString[i] === 'L' || shapeString[i] === 'Z') {
              // Return the coordinates for the rule at the current position
              var stringPieces = shapeString.slice((currentPosition + 1), i).split(',');
              return {
                x: +stringPieces[0] * 10,
                y: +stringPieces[1] * 10
              };
            }
          }
        };

      this.shape = new this.paper.CompoundPath();

      // Parse the shape string
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

      // Draw the shape instead of rendering html
      if (this.model.get('devtype') === 'Panel') {
        this.drawPanel();
      } else {
        this.drawShape();
      }

      // Handle
      if (this.model.get('devtype') === 'Panel' && this.model.get('attached') === 'null') {
        this.shape.set({
          fillColor: '#999',
          strokeColor: '#ccc',
          strokeWidth: 0
        });
      } else {
        // Apply shape style
        this.shape.set({
          fillColor: defaultFillColor,
          strokeColor: '#ccc',
          strokeWidth: 0
        });
      }

      this.shapeId = this.shape._id;

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
    constructor: function(){
      // Array for caching views on bound filtering
      this.visible = [];
      // Current hilighted view
      this.currentHilight = null;
      this.currentSelection = null;
      // Positioning stuffs
      this.currentPosition = {
        x: 0,
        y: 0
      };
      this.currentRotation = 0;
      this.currentZoom = null;
      // Overlay stuffs
      this.currentOverlay = {
        type: null,
        data: null,
        dataLength: 0
      };
      this.date = {
        start: 'today',
        stop: 'now'
      };
      this.playing = false;
      this.currentIndex = 0;

      // Call the original constructor
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },
    className: 'sitemap loading',
    template: {
      type: 'handlebars',
      template: sitemapTemplate
    },
    templateHelpers: function(){
      var deviceTypes = this.model.get('devtypes').split(',');
      return {
        deviceTypes: _.without(deviceTypes, 'PV Array')
      };
    },
    itemView: views.PhysicalDevice,
    itemViewOptions: function(){
      return {
        paper: this.paper
      };
    },
    ui: {
      canvas: 'canvas',
      deviceInfoContainer: '.deviceInfoContainer',
      deviceTypeSelect: '.deviceType select',
      overlatTypeSelect: '.overlayType select',
      legendContainer: '.legendContainer',
      timeControls: '.controls.time',
      playButton: '.play',
      pauseButton: '.pause',
      timeDisplay: '.timeDisplay .time',
      timeSlider: '.timeSlider .indicator',
      message: '.messageContainer'
    },
    events: {
      'click': function(event){
        var hitTest = this.paper.project.hitTest(event.offsetX, event.offsetY);

        if (hitTest) {
          var child = this.findChildByShape(hitTest.item);
          Backbone.trigger('click:device', child.model);
        }
      },
      'mousedown canvas': function(event){
        // Set dragging object if primary mouse button clicked
        if (event.which === 1) {
          this.dragging = {
            x: event.offsetX,
            y: event.offsetY
          };
        }
      },
      'mouseout canvas': function(){
        // Force unhilight if mouse leaves canvas
        if (this.currentHilight) {
          this.hilight();
        }
      },
      'mouseup canvas': function(event){
        var that = this;

        if (this.dragging) {
          // Clear dragging and update resting position and update filtered set
          var offsetX = event.offsetX || (event.clientX - $(event.target).offset().left);
          var offsetY = event.offsetY || (event.clientY - $(event.target).offset().top);

          // Move group to new position
          this.position({
            x: offsetX - this.dragging.x,
            y: offsetY - this.dragging.y,
            draw: false,
            filter: true
          });

          // Clear dragging object
          this.dragging = false;
        }
      },
      'mousemove': _.throttle(function(event){
        // Polyfill because firefox doesn't get offsetX/offsetY
        // http://bugs.jquery.com/ticket/8523
        var offsetX = event.offsetX || (event.clientX - $(event.target).offset().left);
        var offsetY = event.offsetY || (event.clientY - $(event.target).offset().top);

        // If currently dragging with the mouse, move the canvas around
        if (this.dragging) {
          // Move group to new position
          this.position({
            x: offsetX - this.dragging.x,
            y: offsetY - this.dragging.y,
            filter: false
          });

          // Update drag origin
          this.dragging.x = offsetX;
          this.dragging.y = offsetY;
        } else {
          // Otherwise, handle hovering
          var hitTest = this.paper.project.hitTest(offsetX, offsetY);

          if (hitTest) {
            var child = this.findChildByShape(hitTest.item);

            if (this.currentHilight !== child) {
              this.hilight(child);
            }

            this.$el.css('cursor', 'pointer');
          } else if (this.currentHilight) {
            this.hilight(null);
            this.$el.css('cursor', 'auto');
          }
        }
      }, 60),
      // Handle controls
      'click .center': function(){
        this.position();
      },
      'click .rotateL': function(){
        this.rotate({
          degrees: -15
        });
      },
      'click .rotateR': function(){
        this.rotate({
          degrees: 15
        });
      },
      'click .zoomIn': function(){
        this.zoom({
          direction: '+'
        });
      },
      'click .zoomOut': function(){
        this.zoom({
          direction: '-'
        });
      },
      'click .reset': function(){
        this.resetPosition();
      },
      'change .deviceType select': function(event){
        this.setDeviceType(event.currentTarget.value);
      },
      'change .overlayType select': function(event){
        this.setOverlayType(event.currentTarget.value);
      },
      // I don't know why but, it wouldn't hear the events when I used just the class...
      'click .play': function(){
        this.play();
      },
      'click .pause': function(){
        this.pause();
      },
      'click .rewind': function(){
        this.setIndex(0, true);
      },
      'click .stepForward': function(){
        this.setIndex('+', true);
      },
      'click .stepBackward': function(){
        this.setIndex('-', true);
      },
      'click .fastForward': function(){
        this.setIndex(this.currentOverlay.dataLength - 1, true);
      },
      'click .toggleLegend': function(){
        this.ui.legendContainer.toggle();
      }
    },
    collectionEvents: {
      'filter': function(){
        // When the filtered list updates, re-render the collection
        this._renderChildren();
      }
    },
    initialize: function(options) {
      // Instantiate paper
      this.paper = new paper.PaperScope();

      // Move collection to virtual collection
      this.collection = new Backbone.VirtualCollection(options.collection, {
        filter: {
          devtype: this.currentDeviceType
        },
        closeWith: this
      });

      this.listenTo(Backbone, 'window:resize', this.resize);

      this.listenTo(Backbone, 'set:date', function(date){
        this.date = date;

        // If there is a currently active overlay, update with new device type
        if (this.currentOverlay.type) {
          this.setOverlayType(this.currentOverlay.type);
        }
      });
    },
    showMessage: function(message, level){
      this.ui.message.empty();

      var $message = $('<div class="message">' + message + '</div>');

      // If level supplied, add it as class
      if (level) {
        $message.addClass(level);
      }

      // Fade in, wait 3 seconds, fade out, then remove the element
      $message.hide();

      this.ui.message.append($message);

      $message.fadeIn().delay(3000).fadeOut({
        done: function(){
          $message.remove();
        }
      });
    },
    deviceInfoView: views.DeviceInfo,
    buildDeviceInfo: function(device){
      var deviceInfo = new this.deviceInfoView({
        model: device,
        animate: !this.deviceInfo.currentView
      });

      this.deviceInfo.show(deviceInfo);
    },
    // This fires after the primary view is rendered
    onCompositeModelRendered: function(){
      this.paper.setup(this.ui.canvas[0]);
      this.deviceGroup = new this.paper.Group();
    },
    // This fires after children render
    onCompositeCollectionRendered: function(){
      // NOTE - Ok, so, I'm not sure why this makes the positioning for all elements work
      // but it does. Have fun later when you come back to this.
      if (this.children.length && this._isShown) {
        this.resetPosition({reset: true, zoom: this.currentZoom});
        // Hide loading indicator
        this.$el.removeClass('loading');
      }
    },
    onAfterItemAdded: function(itemView){
      // Add items to group for manipulation
      this.deviceGroup.addChild(itemView.shape);
    },
    findChildByShape: function(shape){
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
    filterOnBounds: function(){
      var maxBounds = this.paper.view.bounds;

      this.visible = [];

      this.children.each(function(child){
        var isVisible = child.shape.bounds.intersects(maxBounds);
        child.shape.visible = isVisible;

        if (isVisible) {
          this.visible.push(child);
        }
      }, this);

      this.draw();
    },
    currentDeviceType: 'Inverter',
    setDeviceType: function(deviceType){
      // Update select ui
      this.ui.deviceTypeSelect.val(deviceType);
      // Update current
      this.currentDeviceType = deviceType;
      // Update collection
      this.collection.updateFilter({devtype: deviceType});
      // Message user about what device level they are viewing
      this.showMessage(deviceType);

      // If there is a currently active overlay, update with new device type
      if (this.currentOverlay.type) {
        this.setOverlayType(this.currentOverlay.type);
      }
    },
    selectDevice: function(device){
      this.currentSelection = this.children.findByModel(device);
      this.hilight();
    },
    hilight: function(view){
      this.currentHilight = view || null;

      var parent = view ? view.model.incoming.first() : null;

      // Loop through visible shapes and set appropriate hilighting
      _.each(this.visible, function(child){
        if (view && parent && child.model.incoming.first() === parent) {
          child.shape.set({
            strokeColor: '#F26322',
            strokeWidth: 1
          });

          return;
        }

        child.shape.set({
          strokeColor: '#ccc',
          strokeWidth: 0
        });
      });

      // Hilight hovered
      if (view) {
        view.shape.set({
          strokeColor: '#F26322',
          strokeWidth: 2
        });

        view.shape.bringToFront();
      } else if (this.currentSelection && this.currentSelection.model.get('devtype') === this.currentDeviceType) {
        this.currentSelection.shape.set({
          strokeColor: '#F26322',
          strokeWidth: 2
        });

        this.currentSelection.shape.bringToFront();
      }

      this.draw();
    },
    resetPosition: function(options){
      options = options || {};

      if (options.reset) {
        this.currentRotation = 0;
        this.currentZoom = null;
      }

      this.position({
        draw: false,
        filter: false
      });
      this.rotate({
        draw: false,
        filter: false
      });
      this.zoom({
        direction: options.zoom,
        draw: false,
        filter: false
      });

      this.filterOnBounds();
      this.draw();
    },
    resize: function(){
      // Fill canvas to size of parent container
      this.paper.view.setViewSize(this.$el.parent().width(), this.$el.parent().height());
      this.filterOnBounds();
    },
    position: function(options){
      // If options are passed, position based on those
      if (typeof options.x === 'number' || typeof options.y === 'number') {
        var currentPosition = this.deviceGroup.position,
          newX = currentPosition._x + (options.x || 0),
          newY = currentPosition._y + (options.y || 0);

        this.deviceGroup.position = new this.paper.Point(newX, newY);
        this.currentPosition.x = newX;
        this.currentPosition.y = newY;
      } else {
        // else, center the group
        var center = this.paper.view.center;

        this.deviceGroup.position = new this.paper.Point(center._x, center._y);
        this.currentPosition.x = center._x;
        this.currentPosition.y = center._y;
      }

      if (options.filter !== false) { this.filterOnBounds(); }

      if (options.draw !== false) { this.draw(); }
    },
    rotate: function(options){// degrees, draw, filter
      var degrees = options.degrees || (+this.model.get('pref_rotation') - this.currentRotation);

      this.deviceGroup.rotate(degrees, this.deviceGroup.center);
      this.currentRotation += degrees;

      if (options.filter !== false) { this.filterOnBounds(); }

      if (options.draw !== false) { this.draw(); }
    },
    zoom: function(options) {// direction, draw, filter
      var smartZoom = function(){
        var deviceGroupBounds = this.deviceGroup.bounds,
          viewBounds = this.paper.view.bounds,
          widthRatio = deviceGroupBounds.width / viewBounds.width,
          heightRatio = deviceGroupBounds.height / viewBounds.height,
          zoom = 1;

        // If devices extend beyond the view port scale them down
        if (widthRatio > 1 || heightRatio > 1) {
          zoom = 1 / Math.max(Math.ceil(widthRatio/2) * 2, Math.ceil(heightRatio/2) * 2);
        } else if (widthRatio < 1 && heightRatio < 1) {
          // else, if device bounds are within the view, see if they can be scaled without
          // extending beyond the view
          zoom = 1 / Math.max(Math.ceil(widthRatio * 2) / 2, Math.ceil(heightRatio * 2) / 2);
        }

        return zoom || 1;
      };
      var scale;

      if (options.direction === '+') {
        // Zoom in
        scale = 2;
        this.currentZoom *= 2;
      } else if (options.direction === '-') {
        // Zoom out
        scale = 0.5;
        this.currentZoom *= 0.5;
      } else if (typeof options.direction === 'number') {
        // Zoom to supplied level
        scale = options.direction;
        this.currentZoom = options.direction;
      } else {
        // Initial zoom
        scale = smartZoom.call(this);
        this.currentZoom = this.currentZoom * scale || scale;
      }

      if (this.currentZoom <= 0.25 && this.currentDeviceType !== 'Inverter') {
        return this.setDeviceType('Inverter');
      }

      if (this.currentZoom === 0.5 && this.currentDeviceType !== 'String') {
        return this.setDeviceType('String');
      }

      if (this.currentZoom >= 1 && this.currentDeviceType !== 'Panel') {
        return this.setDeviceType('Panel');
      }

      this.deviceGroup.scale(scale);

      if (options.filter !== false) { this.filterOnBounds(); }

      if (options.draw !== false) { this.draw(); }
    },
    setOverlayType: function(type){
      var that = this;

      var clearOverlay = function(){
        // Reset overlay
        that.currentOverlay = {
          type: null,
          data: null,
          dataLength: 0
        };

        // Reset index
        that.currentIndex = 0;

        // Update device color
        that.deviceGroup.style = {
          fillColor: defaultFillColor
        };

        that.draw();

        // Hide controls
        that.ui.timeControls.hide();

        // Clear out legend
        that.ui.legendContainer.empty();

        // Force selected value
        that.ui.overlatTypeSelect.val('none');
      };

      if (type && type !== 'none') {
        that.currentOverlay.type = type;

        // Refresh data
        this.fetchOverlayData().done(function(data){
          if (data.response && data.response[0].length && !data.response[0].errmsg) {
            // Set new data set
            that.currentOverlay.data = data.response[0];
            // Cache the length
            that.currentOverlay.dataLength = data.response[0].length;
            // Show controls
            that.ui.timeControls.show();
            // Reset time to first available
            that.setIndex(0);
            // Create legend
            that.buildLegend();
          } else if (data.response[0].errmsg) {
            that.showMessage('Heatmap data failed to load', 'error');
            console.warn('Heatmap data failed:', data.response[0].errmsg, data);
            clearOverlay();
          } else if (!data.response[0].length) {
            that.showMessage('No heatmap data for selected timeframe', 'warning');
            clearOverlay();
          }
        });
      } else {
        clearOverlay();
      }
    },
    fetchOverlayData: function(){
      var that = this,
        // If the times are in unix time, convert them to seconds for the data service
        start = typeof this.date.start === 'number' ? this.date.start/1000 : this.date.start,
        stop = typeof this.date.stop === 'number' ? this.date.stop/1000 : this.date.stop;

      this.$el.addClass('loading');

      return $.ajax({
        url: '/api/overlay/' + this.currentOverlay.type + '/' + this.currentDeviceType,
        type: 'post',
        dataType: 'json',
        data: {
          traces: [{
            project_label: this.model.get('project_label'),
            project_timezone: this.model.get('timezone'),
            dtstart: start,
            dtstop: stop,
            parent_identifier: this.model.get('graph_key')
          }]
        }
      }).always(function(){
        that.$el.removeClass('loading');
      });
    },
    buildLegend: function(){
      this.ui.legendContainer.empty();

      var $legend = $('<ul class="legend" />');

      _.each(fillColors[this.currentOverlay.type], function(color){
        $legend.append('<li style="border-color:' + color.color + '">' + color.label + '</li>');
      });

      this.ui.legendContainer.append($legend);
    },
    play: function(){
      this.playing = true;
      this.ui.playButton.hide();
      this.ui.pauseButton.show();
      this.run();
    },
    pause: function(){
      this.playing = false;
      this.ui.playButton.show();
      this.ui.pauseButton.hide();
    },
    run: function(){
      var that = this,
        loop = function(){
          that.run();
        };

      if (this.playing && this.currentOverlay.data && this.currentIndex < this.currentOverlay.dataLength - 1) {
        this.setIndex('+');
        setTimeout(loop, 100);
      } else {
        this.pause();
      }
    },
    setIndex: function(value, pause) {
      // Increment index
      if (value === '+' && this.currentIndex < this.currentOverlay.dataLength - 1) {
        this.currentIndex++;
      }

      // Decrement index
      if (value === '-' && this.currentIndex > 0) {
        this.currentIndex--;
      }

      // Set index manually
      if (typeof value === 'number' && value >= 0 && value < this.currentOverlay.dataLength) {
        this.currentIndex = value;
      }

      this.paintDevices();

      if (pause) {
        this.pause();
      }
    },
    paintDevices: function(){
      var dataSlice = this.currentOverlay.data[this.currentIndex],
        localTime = new Date(this.currentOverlay.data[this.currentIndex][0] * 1000);

      _.each(this.visible, function(child){
        // Don't bother painting shapes out of bounds and isn't an unattached panel
        if (child.model.get('attached') !== 'null') {
          var deviceDataValue = dataSlice[1][child.model.get('graph_key')];
          var color;

          // if graph key exists in data slice, paint it
          if (typeof deviceDataValue === 'number') {
            color = colorSelector(this.currentOverlay.type, deviceDataValue);
          } else {
            // else, set it to the default color
            color = defaultFillColor;
          }

          child.shape.set({
            fillColor: color
          });
        }
      }, this);

      this.draw();

      // Set time display
      this.ui.timeDisplay.text(
        localTime.getFullYear() + '-' + ('0' + (localTime.getMonth() + 1)).slice(-2) + '-' + ('0' + localTime.getDate()).slice(-2) + ' ' +
        ('0' + localTime.getHours()).slice(-2) + ':' + ('0' + localTime.getMinutes()).slice(-2)
      );

      // Set time slider position
      var availableWidth = this.ui.timeSlider.parent().width() - this.ui.timeSlider.width();
      var percentComplete = this.currentIndex > 0 ? this.currentIndex/this.currentOverlay.dataLength : 0;

      this.ui.timeSlider.css('margin-left', availableWidth * percentComplete);
    },
    draw: _.throttle(function(){
      this.paper.view.draw();
    }, 60, true),
    onShow: function(){
      // Update size of container when it's in the dom
      this.resize();

      // Fire initial bound filtering
      this.filterOnBounds();

      // If children already populated, do initial positioning with hard reset
      if (this.children.length) {
        this.resetPosition();
      }

      // Cache dynamic regions
      this.deviceInfo = new Backbone.Marionette.Region({
        el: this.ui.deviceInfoContainer
      });

      this.legend = new Backbone.Marionette.Region({
        el: this.ui.legendContainer
      });

      // Set value to default device type
      this.ui.deviceTypeSelect.val(this.currentDeviceType);
    },
    onClose: function(){
      // Clean up paper stuffs
      this.paper.view.remove();
      delete this.paper;
    },
    // Prevent item views from being added to the DOM.
    appendHtml: function(){}
  });

  return views;
});