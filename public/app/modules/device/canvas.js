define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'jquery.mousewheel',
  'paper',

  './canvas_symbols',
  './canvas_selection'
], function(
  $,
  _,
  Backbone,
  Marionette,
  wheel,
  paper,

  symbolLibrary,
  Selection
){
  var
    EdgeView = Marionette.ItemView.extend({

      initialize: function(options){
        this.paper = options.paper || paper;
        this.device = options.device;

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
        return new this.paper.Point(this.device.getPosition('ELECTRICAL'));
      },

      endPoint: function(){
        return new this.paper.Point(this.model.getPosition('ELECTRICAL'));
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
        return {paper: this.paper, device: this.model};
      },

      initialize: function(options){
        this.collection = this.model.outgoing;

        this.paper = options.paper || paper;
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
          point = this.center = new this.paper.Point(this.model.getPosition('ELECTRICAL')),
          delta = point.subtract(orig);

        if (this.node) { this.node.translate(delta); }
        if (this.highlight) { this.highlight.translate(delta); }
      },

      testHit: function(point){
        return this.node.bounds.contains(point);
      },

      testInside: function(rect){
        return this.center.isInside(rect);
      },

      // Overwrite this function so that item views aren't added to the dom.
      appendHtml: function(){}
    });

  return Marionette.CollectionView.extend({
    tagName: 'canvas',
    itemView: NodeView,

    itemViewOptions: function(){
      return {paper: this.paper};
    },

    attributes: {
      resize: true
    },

    initialize: function(options){
      this.paper = paper.setup(this.el);
      this.selection = new Selection();

      this.listenTo(Backbone, 'editor:mousemove editor:mouseup', this.handleMouseEvent);
      this.listenTo(Backbone, 'editor:keydown editor:keypress', this.handleKeyEvent);
    },

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
      var item = this.children.find(function(view){
        return view.testHit(e.projectPoint);
      });

      // Make sure any lingering select boxes are removed.
      if (this.select) { this.eraseSelect(); }

      // Create a select box if not on an item.
      if (!item) {
        this.drawSelect(e.projectPoint);

      // Otherwise add the item if not already included.
      } else if (!this.selection.contains(item)) {
        this.selection.add(item, {remove: !e.ctrlKey});

      // Otherwise remove the item if ctrl is being pressed.
      } else if (e.ctrlKey) {
        this.selection.remove(item);
      }
    },

    onMousedrag: function(e){

      // Pan the canvas if holding shift.
      if (e.shiftKey) {
        this.paper.view.scrollBy(e.delta.divide(this.paper.view.zoom).negate());

      // Update the select box if present.
      } else if (this.select) {
        this.moveSelect(e.projectPoint);

      // Otherwise move any items currently selected.
      } else {
        this.selection.moveAll(e.projectDelta);
      }
    },

    onMouseup: function(e){
      var items;

      // Add any items within the select box if present.
      if (this.select) {
        items = this.children.filter(function(view){
          return view.testInside(this.select);
        }, this);
        this.selection.add(items, {remove: !e.ctrlKey});
        this.eraseSelect();

      // Otherwise snap any items that may have moved.
      } else {
        this.selection.snapAll();
      }
    },

    onKeyTab: function(e){
      var model = this.selection.models.last();
      this.selection.add({model: this.collection.next(model)}, {remove: !e.ctrlKey});
      this.paper.view.draw();
    },

    onKeyLeft: function(e){
      var model = this.selection.models.last() || this.collection.last(),
        parnt = model && model.incoming && model.incoming.first(),
        sibling = parnt && parnt.outgoing && parnt.outgoing.previous(model);

      if (sibling) {
        this.selection.add({model: sibling}, {remove: !e.ctrlKey});
        this.paper.view.draw();
      }
    },

    onKeyRight: function(e){
      var model = this.selection.models.last() || this.collection.last(),
        parnt = model && model.incoming && model.incoming.last(),
        sibling = parnt && parnt.outgoing && parnt.outgoing.next(model);

      if (sibling) {
        this.selection.add({model: sibling}, {remove: !e.ctrlKey});
        this.paper.view.draw();
      }
    },

    onKeyUp: function(e){
      var model = this.selection.models.last() || this.collection.last(),
        parnt = model && model.incoming && model.incoming.first();

      if (parnt && parnt.has('device_type')) {
        this.selection.add({model: parnt}, {remove: !e.ctrlKey});
        this.paper.view.draw();
      }
    },

    onKeyDown: function(e){
      var model = this.selection.models.last() || this.collection.last(),
        child = model && model.outgoing && model.outgoing.first();

      if (child) {
        this.selection.add({model: child}, {remove: !e.ctrlKey});
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

    // Overwrite this function so that item views aren't added to the dom.
    appendHtml: function(){}
  });
});
