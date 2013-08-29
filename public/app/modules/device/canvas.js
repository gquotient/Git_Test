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
  var

    // Need a better place for this.
    relationshipStyles = {
      FLOWS: {color: 'red'},
      COLLECTS: {color: 'red', left: true},
      MEASURED_BY: {color: 'grey', offset: 2},
      MANAGES: {color: 'blue'},
      HAS: {color: 'blue'},
      DEFAULT: {color: 'grey'}
    },

    EdgeView = Marionette.ItemView.extend({

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
    }),

    NodeView = Marionette.CollectionView.extend({
      itemView: EdgeView,

      initialize: function(options){
        this.collection = new Backbone.VirtualCollection(this.model.outgoing, {
          filter: function(model){
            // Only render devices that have position.
            return model.getPosition(options.rendering) &&

              // And a relationship in the current rendering.
              model.equipment.getRelationship(options.model, options.rendering);
          }
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

  return Marionette.CollectionView.extend({
    tagName: 'canvas',
    itemView: NodeView,

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

      _.bindAll(this, 'handleMouseEvent', 'handleKeyEvent', 'handleWheelEvent');
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

    handleMouseEvent: function(e){
      var type = this.dragging && e.type === 'mousemove' ? 'mousedrag' : e.type,

        // Create a point relative to the window and calculate the delta.
        point = new this.paper.Point(e.pageX, e.pageY),
        delta = point.subtract(this.lastPoint),

        // Subtract the el offset to get the canvas point.
        offset = this.$el.offset(),
        canvasPoint = point.subtract(offset.left, offset.top),

        // Convert the canvas point to a project point and calculate the delta.
        projectPoint = this.paper.view.viewToProject(canvasPoint),
        projectDelta = projectPoint.subtract(this.lastProjectPoint),

        // For click events see if the point falls within a device view.
        view = e.type !== 'mousemove' && this.children.find(function(view){
          return view.testHit(projectPoint);
        });

      this.triggerMethod(type, {
        type: type,
        modifier: e.ctrlKey,

        point: point,
        delta: delta,
        canvasPoint: canvasPoint,
        projectPoint: projectPoint,
        projectDelta: projectDelta,

        view: view,
        model: view && view.model
      });

      this.lastPoint = point;
      this.lastProjectPoint = projectPoint;

      if (e.type === 'mousedown') { this.dragging = true; }
      if (e.type === 'mouseup') { this.dragging = false; }

      this.paper.view.draw();
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

    handleWheelEvent: function(e, delta){
      e.preventDefault();

      if (delta > 0) {
        this.triggerMethod('zoom:in');
      } else if (delta < 0) {
        this.triggerMethod('zoom:out');
      }
    },

    onShow: function(){
      this.delegateCanvasEvents();
    },

    onClose: function(){
      this.undelegateCanvasEvents();
    },

    onMousedown: function(obj){

      // Make sure any lingering select boxes are removed.
      if (this.select) { this.eraseSelect(); }

      // Create a select box if modifier and not on a device.
      if (obj.modifier && !obj.model) {
        this.drawSelect(obj.projectPoint);
      }

      // Try and add the device if not currently selected. Remove all other
      // selected devices if no modifier. If not on a device this clears the
      // whole selection.
      if (!this.selection.contains(obj.model)) {
        this.selection.add(obj.model, {remove: !obj.modifier});

      // Or remove the device if present and modifier.
      } else if (obj.modifier) {
        this.selection.remove(obj.model);
      }
    },

    onMousedrag: function(obj){

      // Update the select box if present.
      if (this.select) {
        this.moveSelect(obj.projectPoint);

      // Otherwise pan the canvas if no devices selected.
      } else if (!this.selection.length) {
        this.paper.view.scrollBy(obj.delta.divide(this.paper.view.zoom).negate());

      // Or move those devices if editable.
      } else if (this.model.isEditable()) {
        this.moveSelection(obj.projectDelta);
      }
    },

    onMouseup: function(obj){
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

    onDblclick: function(obj){
      if (obj.model) {
        Backbone.trigger('click:device', obj.model);
      }
    },

    onZoomIn: function(){
      if (this.paper.view.zoom < 2) {
        this.paper.view.zoom *= 1.1;
      }
    },

    onZoomOut: function(){
      if (this.paper.view.zoom > 0.25) {
        this.paper.view.zoom /= 1.1;
      }
    },

    onZoomReset: function(){
      this.paper.view.zoom = 1;
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
});
