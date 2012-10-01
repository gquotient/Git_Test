define([
  // Application.
  "app"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var Navigation = app.module();

  // Navigation Static
  Navigation.STATIC = [
    {title: 'Portfolio'}
  ];

  // Default model.
  Navigation.Model = Backbone.Model.extend({
    initialize: function(){
      this.opacity = 1;
    },

    setOpacityByOffset: function(idx){
      var newOp = 1 - (idx * 0.2);
      this.opacity = newOp < 0.2 ? 0.2 : newOp;
      this.trigger('newOpacity');
    }
    
  });

  // Default collection.
  Navigation.Collection = Backbone.Collection.extend({
    model: Navigation.Model,

    updateOpacities: function(){
      for(var len=this.length, i=0; i < len; i++){
        var model = this.at(i);
        model.setOpacityByOffset(len-i-1);
      }
    }

  });

  // Navigation List.
  Navigation.Views.List = Backbone.LayoutView.extend({
    tagName: 'ul',
    className: 'clearfix',

    beforeRender: function(){
      this.collection.each(function(item){
        this.insertView(new Navigation.Views.Item({model: item, collection: this.collection}));
      }, this);
    },

    initialize: function(){
      this.collection.on('add', function(item){
        var subView = new Navigation.Views.Item({model: item, collection: this.collection});
        this.insertView(subView);
        subView.render();
        this.collection.updateOpacities();
      }, this);
    }
  });

  // Navigation Item.
  Navigation.Views.Item = Backbone.LayoutView.extend({
    template: 'navigation/item',

    tagName: 'li',

    beforeRender: function(){
      this.$el.css('opacity', 0);
    },

    afterRender: function(){
      this.$el.animate({'margin-left': '0px', opacity: 1},500);
    },

    events: {
      'click': function(){
        for(var len=this.collection.length - 1 , idx = this.collection.indexOf(this.model); len > idx ; len--){
          var model = this.collection.pop();
          model.destroy();
        }

        this.collection.updateOpacities();
      }
    },

    cleanup: function(){
      this.model.off(null, null, this);
    },

    serialize: function(){
      return { model: this.model };
    },

    initialize: function(){
      var that = this;
      
      this.model.on('destroy', function(){
        this.$el.animate({
              'margin-left': '30px',
              'opacity': '0'
            }, function(){
              that.remove();
            });
      }, this);
      
      this.model.on('newOpacity', function(){
        this.$el.animate({'opacity': this.model.opacity});
      }, this);
    
    }
  });

  // This is just to get stuff on the page.
  Navigation.Views.Drill = Backbone.LayoutView.extend({
    template: 'navigation/drills',

    serialize: function(){
      return {};
    },

    events: {
      'click p': 'drillDown'
    },

    drillDown: function(e){
      this.collection.add({ title: $(e.target).text() });
    }
  });

  // Return the module for AMD compliance.
  return Navigation;

});
