define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.virtualCollection',
  'jquery.mousewheel',
  'paper',

  './canvasSymbols'
], function(
  $,
  _,
  Backbone,
  Marionette,
  VirtualCollection,
  wheel,
  paper,

  symbolLibrary
){
  var views = {},

    // Need a better place for this.
    relationshipStyles = {
      FLOWS: {color: 'red'},
      COLLECTS: {color: 'red', left: true},
      MEASURED_BY: {color: 'grey', offset: 2},
      MANAGES: {color: 'blue'},
      HAS: {color: 'blue'},
      DEFAULT: {color: 'grey'}
    };

  views.CanvasEdge = Marionette.ItemView.extend({

    initialize: function(options){
      this.device = options.device;

      this.paper = options.paper || paper;
      this.rendering = options.rendering;

      this.style = relationshipStyles[options.relationship] || relationshipStyles.DEFAULT;

      this.listenTo(this.device, 'change:renderings', this.move);
      this.listenTo(this.model, 'change:renderings', this.move);

      this.on('close', this.erase);
    },

    render: function(){
      this.isClosed = false;

      this.triggerMethod('before:render', this);
      this.triggerMethod('item:before:render', this);

      this.draw();

      this.triggerMethod('render', this);
      this.triggerMethod('item:rendered', this);

      return this;
    },

    draw: function(){
      this.erase(true);

      this.edge = new this.paper.Path({
        segments: [[], [], [], []],
        strokeWidth: 2,
        strokeColor: this.style.color
      });

      this.edge.sendToBack();
      this.move();

      this.paper.view.draw();
    },

    erase: function(skipDraw){
      if (this.edge) {
        this.edge.remove();
        this.edge = null;

        if (!skipDraw) {
          this.paper.view.draw();
        }
      }
    },

    startPoint: function(){
      return new this.paper.Point(this.device.getPosition(this.rendering));
    },

    endPoint: function(){
      return new this.paper.Point(this.model.getPosition(this.rendering));
    },

    move: function(){
      var start = this.startPoint(),
        end = this.endPoint(),
        center;

      if (this.style.left) {
        center = start.x - 50;
      } else {
        center = Math.max(start.x + 50, end.x - 50);
      }

      if (this.style.offset) {
        if (start.y >= end.y) {
          start.y -= this.style.offset;
          end.y -= this.style.offset;
        } else {
          start.y += this.style.offset;
          end.y += this.style.offset;
        }
        center -= this.style.offset;
      }

      if (this.edge) {
        this.edge.segments[0].point = start;
        this.edge.segments[1].point.x = center;
        this.edge.segments[1].point.y = start.y;
        this.edge.segments[2].point.x = center;
        this.edge.segments[2].point.y = end.y;
        this.edge.segments[3].point = end;
      }
    }
  });

  views.CanvasNode = Marionette.CollectionView.extend({
    itemView: views.CanvasEdge,

    initialize: function(options){
      this.collection = new Backbone.VirtualCollection(this.model.outgoing, {
        filter: function(model){
          // Only render devices that have position.
          return model.getPosition(options.rendering) &&

            // And a relationship in the current rendering.
            model.equipment.getRelationship(options.model, options.rendering);
        },
        close_with: this
      });

      this.paper = options.paper || paper;
      this.rendering = options.rendering;

      this.factory = symbolLibrary(this.paper);
      this.setCenter();

      this.on('render', this.draw);
      this.on('close', this.erase);
    },

    modelEvents: {
      'selected': 'select',
      'deselected': 'deselect',
      'change:renderings': 'setCenter'
    },

    itemViewOptions: function(item){
      return {
        device: this.model,
        paper: this.paper,
        rendering: this.rendering,
        relationship: item.getRelationship(this.model)
      };
    },

    // Prevent item views from being added to the DOM.
    appendHtml: function(){},

    draw: function(){
      this.erase(true);

      var symbol = this.factory(this.model.equipment.getRootLabel(), this.center),
        label = this.drawLabel(this.model);

      label.position = this.center.subtract(0, (symbol.bounds.height + label.bounds.height) * 0.55);

      this.node = new this.paper.Group([symbol, label]);
      this.paper.view.draw();
    },

    drawLabel: function(device){
      var name = device.get('name');

      if (!name || name.length > 12) {
        name = device.get('did');
      }

      return new this.paper.PointText({
        fontSize: 14,
        fillColor: 'black',
        justification: 'center',
        content: name
      });
    },

    erase: function(skipDraw){
      this.deselect();

      if (this.node) {
        this.node.remove();
        this.node = null;
      }

      if (!skipDraw) {
        this.paper.view.draw();
      }
    },

    select: function(){
      this.node.bringToFront();

      this.highlight = new this.paper.Path.Rectangle(this.center.subtract(25), 50);
      this.highlight.fillColor = 'red';
      this.highlight.opacity = 0.2;
    },

    deselect: function(){
      if (this.highlight) {
        this.highlight.remove();
        this.highlight = null;
      }
    },

    setCenter: function(){
      var orig = this.center,
        point = this.center = new this.paper.Point(this.model.getPosition(this.rendering)),
        delta = point.subtract(orig);

      if (this.node) { this.node.translate(delta); }
      if (this.highlight) { this.highlight.translate(delta); }
    },

    testHit: function(point){
      return this.node.bounds.contains(point);
    },

    testInside: function(rect){
      return this.center.isInside(rect);
    }
  });

  views.Canvas = Marionette.CollectionView.extend({
    tagName: 'canvas',
    itemView: views.CanvasNode,

    itemViewOptions: function(){
      return {
        paper: this.paper,
        rendering: this.rendering
      };
    },

    attributes: {
      resize: true
    },

    initialize: function(options){
      this.rendering = options.rendering;

      this.paper = new paper.PaperScope();
      this.paper.setup(this.el);

      this.collection = new Backbone.VirtualCollection(options.collection, {
        filter: function(model){
          // Only render devices that have position and equipment.
          return model.getPosition(options.rendering) && model.equipment;
        },
        close_with: this
      });

      this.selection = new Backbone.Collection();

      this.listenTo(this.selection, 'add', function(model){
        Backbone.trigger('canvas:selection', this.selection);
        model.trigger('selected');
      });

      this.listenTo(this.selection, 'remove', function(model){
        Backbone.trigger('canvas:selection', this.selection);
        model.trigger('deselected');
      });

      _.bindAll(this, 'handleMouseEvent', 'handleWheelEvent', 'handleKeyEvent');
    },

    collectionEvents: {
      'reset': 'checkDevices'
    },

    checkDevices: function(){
      var that = this,
        queue = [],
        lastPoint;

      function walk(target){
        if (!target.outgoing) { return; }

        target.outgoing.each(function(device){
          if (!device.equipment) { return; }

          // Ignore devices that don't have rendering information.
          if (!device.equipment.getRendering(that.rendering)) { return; }

          // Ignore strings and panels for now.
          if (_.contains(['S', 'P'], device.equipment.get('label'))) { return; }

          // Add devices that need position to the queue.
          if (!device.getPosition(that.rendering)) {
            queue.push([device, target]);
          }

          // Recursively walk the outgoing tree.
          walk(device);
        });
      }

      function process(){
        var next = queue.shift(), point;

        if (next) {
          that.positionDevice.apply(that, next);

          // Get the new top center of the project.
          point = that.paper.project.activeLayer.bounds.topCenter;

          // When the top center changes, reset the zoom.
          if (!point.equals(lastPoint)) {
            that.triggerMethod('zoom:reset');
            lastPoint = point;
          }

          // Defer processing the next device to keep the ui responsive.
          _.defer(process);
        }
      }

      // Create a queue of devices that need position by walking the tree.
      walk(this.model);

      // Start processing the queue.
      process();
    },

    positionDevice: function(device, target){
      var equip = device.equipment,
        label = this.rendering,
        rendering = equip.getRendering(label),
        position, delta;

      if (device.getPosition(label) || !rendering) { return; }

      if (rendering.root && rendering.position) {
        position = _.clone(rendering.position);

        // Move root device to the bottom.
        if (this.paper.project.activeLayer.bounds.height > 0) {
          delta = this.paper.project.activeLayer.bounds.bottom - position.y;

          if (delta > 0) {
            position.y += Math.ceil(delta / 200) * 200;
          }
        }

      // Otherwise position relative to target device.
      } else if (target && equip.getRelationship(target, label)) {
        position = target.getPosition(label);

        // Apply offset for this equipment.
        if (position && rendering.offset) {
          position.x += rendering.offset.x || 0;
          position.y += rendering.offset.y || 0;
        }
      }

      if (position) {

        // Avoid other devices already rendered.
        while (this.paper.project.hitTest(position)) {
          position.y += 100;
        }

        device.setPosition(label, position);
      }
    },

    delegateCanvasEvents: function(){
      function format(events){
        return _.map(events.split(' '), function(evnt){
          return evnt + '.canvas' + this.cid;
        }, this).join(' ');
      }

      this.$el
        .on(format('mousedown dblclick'), this.handleMouseEvent)
        .on(format('mousewheel'), this.handleWheelEvent)

        // Disable context menus in the canvas.
        .on(format('contextmenu'), false);

      $(document)
        .on(format('mousemove mouseup'), this.handleMouseEvent)
        .on(format('keydown keypress'), this.handleKeyEvent);
    },

    undelegateCanvasEvents: function(){
      this.$el.add(document).off('.canvas' + this.cid);
    },

    translateMousePoint: function(x, y){
      var point = new this.paper.Point(x, y),
        offset = this.$el.offset(),
        canvasPoint = point.subtract(offset.left, offset.top),
        projectPoint = this.paper.view.viewToProject(canvasPoint);

      return {
        point: point,
        canvasPoint: canvasPoint,
        projectPoint: projectPoint
      };
    },

    handleMouseEvent: function(e){
      var args = this.translateMousePoint(e.pageX, e.pageY);

      _.extend(args, {
        type: (this.dragging && e.type === 'mousemove') ? 'mousedrag' : e.type,
        modifier: e.ctrlKey,

        canvasDelta: args.canvasPoint.subtract(this.lastCanvasPoint),
        projectDelta: args.projectPoint.subtract(this.lastProjectPoint)
      });

      this.lastCanvasPoint = args.canvasPoint;
      this.lastProjectPoint = args.projectPoint;

      if (e.type === 'mousedown') { this.dragging = true; }
      if (e.type === 'mouseup') { this.dragging = false; }

      // For click events see if the point falls within a device view.
      if (e.type !== 'mousemove') {
        args.view = this.children.find(function(view){
          return view.testHit(args.projectPoint);
        });

        args.model = args.view && args.view.model;
      }

      this.triggerMethod(args.type, args);

      this.paper.view.draw();
    },

    handleWheelEvent: function(e, delta){
      var args = this.translateMousePoint(e.pageX, e.pageY);

      if (delta !== 0) {
        e.preventDefault();
        this.triggerMethod(delta > 0 ? 'zoom:in' : 'zoom:out', args);
      }
    },

    keydownEvents: {
      9: 'key:tab',
      37: 'key:left',
      38: 'key:up',
      39: 'key:right',
      40: 'key:down'
    },

    keypressEvents: {
      43: 'zoom:in',
      45: 'zoom:out',
      61: 'zoom:reset'
    },

    handleKeyEvent: function(e){
      var value = (this[e.type + 'Events'] || {})[e.which];

      if (value && !_.contains(['INPUT', 'TEXTAREA'], e.target.nodeName)) {
        e.preventDefault();
        this.triggerMethod(value);
      }
    },

    onShow: function(){
      this.delegateCanvasEvents();
      this.triggerMethod('zoom:reset');
    },

    onRender: function(){
      this.triggerMethod('zoom:reset');
    },

    onClose: function(){
      this.undelegateCanvasEvents();
    },

    onMousedown: function(args){

      // Make sure any lingering select boxes are removed.
      if (this.select) { this.eraseSelect(); }

      // Create a select box if modifier and not on a device.
      if (args.modifier && !args.model) {
        this.drawSelect(args.projectPoint);
      }

      // Try and add the device if not currently selected. Remove all other
      // selected devices if no modifier. If not on a device this clears the
      // whole selection.
      if (!this.selection.contains(args.model)) {
        this.selection.add(args.model, {remove: !args.modifier});

      // Or remove the device if present and modifier.
      } else if (args.modifier) {
        this.selection.remove(args.model);
      }
    },

    onMousedrag: function(args){

      // Update the select box if present.
      if (this.select) {
        this.moveSelect(args.projectPoint);

      // Otherwise pan the canvas if no devices selected.
      } else if (!this.selection.length) {
        this.panBy(args.canvasDelta.divide(this.paper.view.zoom));

      // Or move those devices if editable.
      } else if (this.model.isEditable()) {
        this.moveSelection(args.projectDelta);
      }
    },

    onMouseup: function(args){
      var models = [];

      // Add any devices within the select box if present.
      if (this.select) {
        this.children.each(function(view){
          if (view.testInside(this.select)) {
            models.push(view.model);
          }
        }, this);

        this.selection.add(models);
        this.eraseSelect();

      // Otherwise snap any devices that may have moved if editable.
      } else if (this.model.isEditable()) {
        this.snapSelection();
      }
    },

    onDblclick: function(args){
      if (args.model) {
        Backbone.trigger('click:device', args.model);
      }
    },

    onZoomIn: function(){
      this.zoomTo(this.paper.view.zoom * 1.1);
    },

    onZoomOut: function(){
      this.zoomTo(this.paper.view.zoom / 1.1);
    },

    onZoomReset: function(){
      var layer = this.paper.project.activeLayer,
        width = this.$el.parent().width(),
        margin = Math.min(width * 0.05, 50),
        zoom = 1, delta;

      // Calculate the minimum zoom to fit the devices in screen.
      if (layer.bounds.width && width) {
        zoom = Math.min((width - (margin * 2)) / layer.bounds.width, zoom);
      }
      this.zoomTo(zoom);

      // Find the distance between the devices and view.
      delta = this.paper.view.bounds.topLeft.subtract(layer.bounds.topLeft);

      // Add an offset to center the devices.
      if (layer.bounds.width && width) {
        delta = delta.add({
          x: ((width / this.paper.view.zoom) - layer.bounds.width) / 2,
          y: margin
        });
      }
      this.panBy(delta);
    },

    zoomTo: function(zoom){
      this.paper.view.zoom = Math.min(Math.max(zoom, 0.25), 2);
    },

    panBy: function(delta){
      this.paper.view.scrollBy(delta.negate());
    },

    drawSelect: function(point){
      this.select = this.paper.Path.Rectangle(point, 1);
      this.select.strokeColor = 'black';
      this.select.dashArray = [8, 8];
    },

    moveSelect: function(point){
      this.select.segments[3].point = point;
      this.select.segments[2].point.x = point.x;
      this.select.segments[0].point.y = point.y;
    },

    eraseSelect: function(){
      this.select.remove();
      this.select = null;
    },

    moveSelection: function(delta){
      this.selection.each(function(model) {
        var position = model.getPosition(this.rendering);

        model.setPosition(this.rendering, {
          x: position.x + delta.x,
          y: position.y + delta.y
        });
      }, this);
    },

    snapSelection: function(){
      this.selection.each(function(model) {
        var position = model.getPosition(this.rendering);

        model.setPosition(this.rendering, {
          x: Math.round(position.x / 100) * 100,
          y: Math.round(position.y / 100) * 100
        }, true);
      }, this);
    },

    // Prevent item views from being added to the DOM.
    appendHtml: function(){}
  });

  return views;
});
