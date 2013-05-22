define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'jquery.mousewheel',
  'paper',

  './paper_symbols',
  './selection'
], function(
  $,
  _,
  Backbone,
  Marionette,
  wheel,
  paper,

  paperSymbols,
  Selection
){

  var Device = { views: {} };

  Device.Model = Backbone.Model.extend({
    defaults: {
      type: 'device'
    },

    initialize: function(){
      this.devices = new Device.Collection();
    }
  });

  Device.Collection = Backbone.Collection.extend({
    model: Device.Model
  });

  Device.LibraryModel = Backbone.Model.extend({

    filterRelationships: function(props, pluck){
      var relationships = _.where(this.get('relationships'), props);
      return pluck ? _.pluck(relationships, pluck) : relationships;
    }
  });

  Device.LibraryCollection = Backbone.Collection.extend({
    model: Device.LibraryModel,

    mapRelationshipTypes: function(types){
      return _.intersection.apply(this, this.reduce(function(memo, model){
        if (_.contains(types, model.get('device_type'))) {
          memo.push(model.filterRelationships({direction: 'OUTGOING'}, 'device_type'));
        }
        return memo;
      }, []));
    }
  });

  Device.views.PaperEdge = Marionette.ItemView.extend({
    initialize: function(options){
      this.paper = options.paper || paper;
      this.device = options.device;

      this.listenTo(this.device, 'change:position', function(model, position){
        if (this.edge) {
          this.edge.firstSegment.point = new this.paper.Point(position);
        }
      });

      this.listenTo(this.model, 'change:position', function(model, position){
        if (this.edge) {
          this.edge.lastSegment.point = new this.paper.Point(position);
        }
      });

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
      this.erase();

      this.edge = new this.paper.Path.Line(
        new this.paper.Point(this.device.get('position')),
        new this.paper.Point(this.model.get('position'))
      );

      this.edge.sendToBack();
      this.edge.strokeWidth = 2;
      this.edge.strokeColor = 'red';

      this.paper.view.draw();
    },

    erase: function(){
      if (this.edge) {
        this.edge.remove();
        this.edge = null;
      }
    }
  });

  Device.views.PaperNode = Marionette.CollectionView.extend({
    itemView: Device.views.PaperEdge,

    itemViewOptions: function(){
      return {paper: this.paper, device: this.model};
    },

    initialize: function(options){
      this.collection = this.model.devices;

      this.paper = options.paper || paper;
      this.factory = paperSymbols(this.paper);
      this.setCenter();

      this.on('render', this.draw);
      this.on('close', this.erase);
    },

    modelEvents: {
      'selected': 'select',
      'deselected': 'deselect',
      'change:positionX': 'setCenter',
      'change:positionY': 'setCenter'
    },

    draw: function(){
      this.erase();

      var symbol = this.factory(this.model.get('device_type'), this.center),
        label = new this.paper.PointText();

      label.fontSize = 14;
      label.fillColor = 'black';
      label.content = this.model.get('name');
      label.position = this.center.subtract(0, symbol.bounds.height * 0.8);

      this.node = new this.paper.Group([symbol, label]);
      this.paper.view.draw();
    },

    erase: function(){
      if (this.node) {
        this.node.remove();
        this.node = null;
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
        point = this.center = new this.paper.Point(
          this.model.get('positionX'),
          this.model.get('positionY')
        ),
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

  Device.views.Canvas = Marionette.CollectionView.extend({
    tagName: 'canvas',
    itemView: Device.views.PaperNode,

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
      this.listenTo(Backbone, 'editor:keypress', this.zoom);
    },

    events: {
      'mousedown': 'handleMouseEvent',
      'mousewheel': 'zoom'
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

    zoom: function(e, delta){
      if (!delta && e.which === 61) { // the = key
        this.paper.view.zoom = 1;
      } else if (!delta && e.which === 45 || delta < 0) { // the + key or scroll up
        this.paper.view.zoom /= 1.1;
      } else if (!delta && e.which === 43 || delta > 0) { // the - key or scroll down
        this.paper.view.zoom *= 1.1;
      }
    },

    // Overwrite this function so that item views aren't added to the dom.
    appendHtml: function(){}
  });

  return Device;
});
