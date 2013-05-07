define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'paper',

  './paper_symbols'
], function(
  $,
  _,
  Backbone,
  Marionette,
  paper,

  paperSymbols
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
    }
  });

  Device.views.PaperCollection = Marionette.CollectionView.extend({
    itemView: Device.views.PaperItem,

    itemViewOptions: function(){
      return {paper: this.options.paper};
    },

    appendHtml: function(){}
  });

  return Device;
});
