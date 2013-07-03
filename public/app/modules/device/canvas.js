define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'jquery.mousewheel',
  'paper',

  './canvas_symbols'
], function(
  $,
  _,
  Backbone,
  Marionette,
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
        this.collection = this.model.outgoing;

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

      collectionEvents: {
        'rendering:add': 'addChildView',
        'rendering:remove': 'removeItemView'
      },

      itemViewOptions: function(item){
        return {
          device: this.model,
          paper: this.paper,
          rendering: this.rendering,
          relationship: item.getRelationship(this.model)
        };
      },

      addItemView: function(item){
        var equip = item.equipment;

        // Only add new items if they have position.
        if (!this.children.findByModel(item) && item.getPosition(this.rendering)) {

          // And a relationship in the current rendering.
          if (equip.getRelationship(this.model, this.rendering)) {
            Marionette.CollectionView.prototype.addItemView.apply(this, arguments);
          }
        }
      },

      // Prevent item views from being added to the DOM.
      appendHtml: function(){},

      draw: function(){
        this.erase(true);

        var symbol = this.factory(this.model.equipment.get('label'), this.center),
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

    attributes: {
      resize: true
    },

    initialize: function(options){
      this.paper = paper.setup(this.el);
      this.rendering = options.rendering;

      this.selection = new Backbone.Collection();

      this.listenTo(this.selection, 'add', function(model){
        Backbone.trigger('editor:selection', this.selection);
        model.trigger('selected');
      });

      this.listenTo(this.selection, 'remove', function(model){
        Backbone.trigger('editor:selection', this.selection);
        model.trigger('deselected');
      });

      this.listenTo(Backbone, 'editor:mousemove editor:mouseup', this.handleMouseEvent);
      this.listenTo(Backbone, 'editor:keydown editor:keypress', this.handleKeyEvent);
    },

    collectionEvents: {
      'equipment:add': 'addChildView',
      'rendering:add': 'addChildView',
      'rendering:remove': 'removeItemView'
    },

    itemViewOptions: function(){
      return {
        paper: this.paper,
        rendering: this.rendering
      };
    },

    addItemView: function(item){

      // Only add new items if they have position and equipment.
      if (!this.children.findByModel(item) && item.getPosition(this.rendering) && item.equipment) {
        Marionette.CollectionView.prototype.addItemView.apply(this, arguments);
      }
    },

    // Prevent item views from being added to the DOM.
    appendHtml: function(){},

    events: {
      'mousedown': 'handleMouseEvent',
      'mousewheel': 'handleWheelEvent'
    },

    keydownEvents: {
      9: 'key:tab',
      37: 'key:left',
      38: 'key:up',
      39: 'key:right',
      40: 'key:down'
    },

    keypressEvents: {
      43: 'zoom:out',
      45: 'zoom:in',
      61: 'zoom:reset'
    },

    handleMouseEvent: function(e){
      var offset = this.$el.offset(), method;

      e.point = new this.paper.Point(e.pageX, e.pageY);
      e.delta = e.point.subtract(this.lastPoint);
      this.lastPoint = e.point;

      e.projectPoint = this.paper.view.viewToProject(e.point.subtract(offset.left, offset.top));
      e.projectDelta = e.projectPoint.subtract(this.lastProjectPoint);
      this.lastProjectPoint = e.projectPoint;

      if (e.type === 'mousemove' && this.dragging) {
        e.type = 'mousedrag';
      }

      method = this['on' + e.type[0].toUpperCase() + e.type.slice(1)];

      if (method) {
        method.call(this, e);
      }

      if (e.type === 'mousedown') { this.dragging = true; }
      if (e.type === 'mouseup') { this.dragging = false; }

      this.paper.view.draw();
    },

    handleKeyEvent: function(e){
      var value = (this[e.type + 'Events'] || {})[e.which];

      if (value && !_.contains(['INPUT', 'TEXTAREA'], e.target.nodeName)) {
        e.preventDefault();
        this.triggerMethod(value);
      }
    },

    handleWheelEvent: function(e, delta){
      if (delta < 0) {
        this.triggerMethod('zoom:in');
      } else if (delta > 0) {
        this.triggerMethod('zoom:out');
      }
    },

    onMousedown: function(e){
      var model;

      this.children.any(function(view){
        if (view.testHit(e.projectPoint)) {
          model = view.model;
          return true;
        }
      });

      // Make sure any lingering select boxes are removed.
      if (this.select) { this.eraseSelect(); }

      // Create a select box if not on a device.
      if (!model) {
        this.drawSelect(e.projectPoint);

      // Otherwise add the model if not already included.
      } else if (!this.selection.contains(model)) {
        this.selection.add(model, {remove: !e.ctrlKey});

      // Or remove the model if present and ctrl is being pressed.
      } else if (e.ctrlKey) {
        this.selection.remove(model);
      }
    },

    onMousedrag: function(e){

      // Pan the canvas if holding shift.
      if (e.shiftKey) {
        this.paper.view.scrollBy(e.delta.divide(this.paper.view.zoom).negate());

      // Update the select box if present.
      } else if (this.select) {
        this.moveSelect(e.projectPoint);

      // Otherwise move any models currently selected if editable.
      } else if (this.options.editable) {
        this.moveSelection(e.projectDelta);
      }
    },

    onMouseup: function(e){
      var models = [];

      // Add any models within the select box if present.
      if (this.select) {
        this.children.each(function(view){
          if (view.testInside(this.select)) {
            models.push(view.model);
          }
        }, this);

        this.selection.add(models, {remove: !e.ctrlKey});
        this.eraseSelect();

      // Otherwise snap any models that may have moved if editable.
      } else if (this.options.editable) {
        this.snapSelection();
      }
    },

    onZoomIn: function(){
      this.paper.view.zoom /= 1.1;
    },

    onZoomOut: function(){
      this.paper.view.zoom *= 1.1;
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
    }
  });
});
