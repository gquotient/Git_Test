define(
[
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'hbs!form/templates/table'
],
function(
  $,
  _,
  Backbone,
  Marionette,

  tableTemplate
){

  var Forms = { views:{} };

  Forms.views.basic = Marionette.ItemView.extend({
    tagName: 'form',
    attributes: {
      id: '',
      name: ''
    },
    events: {
      'submit': function(event){
        // this.model.set('id') = this.model.get('email');
        var that = this;
        event.preventDefault();
        console.log(this.$el.serializeArray());
        _.each(this.$el.serializeArray(), function(obj){
          that.model.set(obj.name, obj.value);
          console.log(that.model.get(obj.name) );
        });
        this.model.save();
        console.log(that.model.attributes);
      },
      'reset': function(event){
        event.preventDefault();
        console.log('form reset', event, this);
        this.render();
      }
    }
  });

  // Composite view for editing multiple items of the same type quickly
  Forms.views.tableRow = Marionette.ItemView.extend({
    tagName: 'tr',
    onShow: function(){
      this.$el.find('input').attr('disabled', true);
      this.$el.find('select').attr('disabled', true);
    }
  });

  Forms.views.table = Marionette.CompositeView.extend({
    tagName: 'form',
    template: {
      type: 'handlebars',
      template: tableTemplate
    },
    itemViewContainer: 'tbody',
    itemView: Forms.views.tableRow,
    attributes: {
      id: '',
      name: ''
    },
    edit: function(){
      console.log(this.$el.find('input'));
      this.$el.find('input').attr('disabled', false);
      this.$el.find('select').attr('disabled', false);
    },
    events: {
      'submit': function(event){
        // this.model.set('id') = this.model.get('email');
        var that = this;
        event.preventDefault();
        console.log(this.$el.serializeArray());
        //_.each(this.$el.serializeArray(), function(obj){
        //  that.model.set(obj.name, obj.value);
        //  console.log(that.model.get(obj.name) );
        //});
        //this.model.save();
        console.log(that.model.attributes);
        this.render();
      },
      'click button.edit': function(event){
        console.log('edit', event);
        this.edit();
      },
      'reset': function(event){
        event.preventDefault();
        console.log('form reset', event, this);
        this.render();
      }
    }
  });

  return Forms;
});
