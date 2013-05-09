define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'paper',

  './paper_symbols',
  './selection'
], function(
  $,
  _,
  Backbone,
  Marionette,
  paper,

  paperSymbols,
  Selection
){
  var Device = { views: {} };

  Device.Model = Backbone.Model.extend({
    defaults: {
      name: '',
      position: {x: 0, y: 0}
    }
  });

  Device.Collection = Backbone.Collection.extend({
    model: Device.Model
  });

  Device.views.PaperItem = Marionette.ItemView.extend({
    initialize: function(options){
      this.paper = options.paper || paper;
      this.center = new this.paper.Point(this.model.get('position'));
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

      this.group = new this.paper.Group();
      this.drawSymbol();
      this.drawLabel();

      this.paper.view.draw();
    },

    drawSymbol: function(){
      this.group.addChild(paperSymbols.factory(this.model.get('type'), this.center));
    },

    drawLabel: function(){
      var label = new this.paper.PointText();

      label.fontSize = 14;
      label.fillColor = 'black';
      label.content = this.model.get('name');
      label.position = this.center.subtract(0, this.group.bounds.height * 0.8);

      this.group.addChild(label);
    },

    erase: function(){
      if (this.group) {
        this.group.remove();
        this.group = null;
      }
    },

    modelEvents: {
      'change:position': 'positionChanged'
    },

    positionChanged: function(){
      var delta = this.center.subtract(this.model.get('position'));

      this.group.translate(delta.negate());
      this.center = this.center.subtract(delta);
    },

    testHit: function(point){
      return this.group.bounds.contains(point);
    },

    testInside: function(rect){
      return this.center.isInside(rect);
    }
  });

  Device.views.Canvas = Marionette.CollectionView.extend({
    tagName: 'canvas',
    itemView: Device.views.PaperItem,

    itemViewOptions: function(){
      return {paper: this.paper};
    },

    attributes: {
      resize: true
    },

    initialize: function(options){
      this.paper = paper.setup(this.el);
      this.selection = new Selection();

      this.listenTo(Backbone, 'editor:keypress editor:mousewheel', function(e, delta){
        if (!delta && e.which === 61) { // the = key
          this.paper.view.zoom = 1;
        } else if (!delta && e.which === 45 || delta < 0) { // the + key or scroll up
          this.paper.view.zoom /= 1.1;
        } else if (!delta && e.which === 43 || delta > 0) { // the - key or scroll down
          this.paper.view.zoom *= 1.1;
        }
      });

      this.listenTo(Backbone, 'editor:mousemove editor:mouseup', this.handleMouseEvent);
    },

    events: {
      mousedown: 'handleMouseEvent'
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
      var that = this;

      // Add any items within the select box if present.
      if (this.select) {
        this.selection.add(this.children.filter(function(view){
          return view.testInside(that.select);
        }), {remove: !e.ctrlKey});
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

    // Overwrite this function so that item views aren't added to the dom.
    appendHtml: function(){}
  });

  return Device;
});
