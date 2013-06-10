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
    EdgeView = Marionette.ItemView.extend({

      initialize: function(options){
        this.device = options.device;

        this.paper = options.paper || paper;
        this.rendering = options.rendering;

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

      styles: {
        DEFAULT: {color: 'grey'},
        MEASURED_BY: {color: 'grey', offset: 2},
        FLOWS: {color: 'red'},
        COLLECTS: {color: 'red', left: true}
      },

      draw: function(){
        this.erase(true);

        this.style = this.styles[this.model.getRelationship(this.device)] || this.styles.DEFAULT;

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

      itemViewOptions: function(){
        return {
          device: this.model,
          paper: this.paper,
          rendering: this.rendering
        };
      },

      initialize: function(options){
        this.collection = this.model.outgoing;

        this.paper = options.paper || paper;
        this.rendering = options.rendering;

        this.factory = symbolLibrary(this.paper);
        this.setCenter();

        this.on('render', this.draw);
        this.on('close', this.erase);
      },

      // Overwrite this function to prevent rendering of children without position
      addItemView: function(model){
        if (model.getPosition(this.rendering)){
          Marionette.CollectionView.prototype.addItemView.apply(this, arguments);
        }
      },

      // Overwrite this function so that item views aren't added to the dom.
      appendHtml: function(){},

      modelEvents: {
        'selected': 'select',
        'deselected': 'deselect',
        'change:renderings': 'setCenter'
      },

      draw: function(){
        this.erase(true);

        var symbol = this.factory(this.model.get('device_type'), this.center),
          label = new this.paper.PointText();

        label.fontSize = 14;
        label.fillColor = 'black';
        label.content = this.model.get('name');
        label.position = this.center.subtract(0, symbol.bounds.height * 0.8);

        this.node = new this.paper.Group([symbol, label]);
        this.paper.view.draw();
      },

      erase: function(skipDraw){
        if (this.node) {
          this.node.remove();
          this.node = null;

          if (!skipDraw) {
            this.paper.view.draw();
          }
        }
      },

      select: function(){
        this.node.bringToFront();

        this.highlight = new this.paper.Path.Rectangle(this.center.subtract(25), 50);
        this.highlight.fillColor = 'red';
        this.highlight.opacity = 0.2;
      },

      deselect: function(){
        this.highlight.remove();
        this.highlight = null;
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

    // Overwrite this function to prevent rendering of children without position
    addItemView: function(model){
      if (model.getPosition(this.rendering)){
        Marionette.CollectionView.prototype.addItemView.apply(this, arguments);
      }
    },

    // Overwrite this function so that item views aren't added to the dom.
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
      var offset = this.$el.offset();

      e.point = new this.paper.Point(e.pageX, e.pageY);
      e.delta = e.point.subtract(this.lastPoint);
      this.lastPoint = e.point;

      e.projectPoint = this.paper.view.viewToProject(e.point.subtract(offset.left, offset.top));
      e.projectDelta = e.projectPoint.subtract(this.lastProjectPoint);
      this.lastProjectPoint = e.projectPoint;

      if (e.type === 'mousemove' && this.dragging) {
        this.triggerMethod('mousedrag', e);
      } else {
        this.triggerMethod(e.type, e);
      }

      if (e.type === 'mousedown') { this.dragging = true; }
      if (e.type === 'mouseup') { this.dragging = false; }

      this.paper.view.draw();
    },

    handleKeyEvent: function(e){
      var value = (this[e.type + 'Events'] || {})[e.which];

      if (value && e.target.nodeName !== 'INPUT') {
        e.preventDefault();
        this.triggerMethod(value, e);
      }
    },

    handleWheelEvent: function(e, delta){
      if (delta < 0) {
        this.triggerMethod('zoom:in', e);
      } else if (delta > 0) {
        this.triggerMethod('zoom:out', e);
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

      // Otherwise move any models currently selected.
      } else {
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

      // Otherwise snap any models that may have moved.
      } else {
        this.snapSelection();
      }
    },

    onKeyTab: function(e){
      var model = this.selection.last();

      this.selection.add(this.collection.next(model), {remove: !e.ctrlKey});
      this.paper.view.draw();
    },

    onKeyLeft: function(e){
      var model = this.selection.last() || this.collection.last(),
        parnt = model && model.incoming && model.incoming.first(),
        sibling = parnt && parnt.outgoing && parnt.outgoing.previous(model);

      if (sibling) {
        this.selection.add(sibling, {remove: !e.ctrlKey});
        this.paper.view.draw();
      }
    },

    onKeyRight: function(e){
      var model = this.selection.last() || this.collection.last(),
        parnt = model && model.incoming && model.incoming.last(),
        sibling = parnt && parnt.outgoing && parnt.outgoing.next(model);

      if (sibling) {
        this.selection.add(sibling, {remove: !e.ctrlKey});
        this.paper.view.draw();
      }
    },

    onKeyUp: function(e){
      var model = this.selection.last() || this.collection.last(),
        parnt = model && model.incoming && model.incoming.first();

      if (parnt && parnt.has('device_type')) {
        this.selection.add(parnt, {remove: !e.ctrlKey});
        this.paper.view.draw();
      }
    },

    onKeyDown: function(e){
      var model = this.selection.last() || this.collection.last(),
        child = model && model.outgoing && model.outgoing.first();

      if (child) {
        this.selection.add(child, {remove: !e.ctrlKey});
        this.paper.view.draw();
      }
    },

    onZoomIn: function(e){
      this.paper.view.zoom /= 1.1;
    },

    onZoomOut: function(e){
      this.paper.view.zoom *= 1.1;
    },

    onZoomReset: function(e){
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
        });

        model.save();
      }, this);
    }
  });
});
