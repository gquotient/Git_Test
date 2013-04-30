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
        event.preventDefault();

        // this.model.set('id') = this.model.get('email');
        var that = this;

        _.each(this.$el.serializeArray(), function(obj){
          that.model.set(obj.name, obj.value);
          console.log(that.model.get(obj.name) );
        });

        this.model.save();

        console.log(this.model.attributes);
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
      // Disable form elements
      this.$el.find('input').attr('disabled', true);
      this.$el.find('select').attr('disabled', true);
      this.$el.find('checkbox').attr('disabled', true);
      this.$el.find('radio').attr('disabled', true);
    },
    edit: function(){
      // Enable form elements
      this.$el.find('input').attr('disabled', false);
      this.$el.find('select').attr('disabled', false);
      this.$el.find('checkbox').attr('disabled', false);
      this.$el.find('radio').attr('disabled', false);
    },
    events: {
      'click button.save': function(event){
        event.preventDefault();
        // this.model.set('id') = this.model.get('email');

        var that = this;

        console.log(this.$el.serializeArray());
        
        _.each(this.$el.serializeArray(), function(obj){
          that.model.set(obj.name, obj.value);
        });
        
        this.model.save();
        console.log(this.model);
        
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
      // Enable form elements
      this.$el.find('input').attr('disabled', false);
      this.$el.find('select').attr('disabled', false);
      this.$el.find('checkbox').attr('disabled', false);
      this.$el.find('radio').attr('disabled', false);
    },
    events: {
      // 'submit': function(event){
      //   event.preventDefault();
      //   // this.model.set('id') = this.model.get('email');

      //   var that = this;

      //   //console.log(this.$el.serializeArray());
      //   //_.each(this.$el.serializeArray(), function(obj){
      //   //  that.model.set(obj.name, obj.value);
      //   //  console.log(that.model.get(obj.name) );
      //   //});
      //   //this.model.save();
      //   console.log(that.collection);
      //   this.render();
      // },
      // 'click button.edit': function(event){
      //   console.log('edit', event);
      //   this.edit();
      // },
      // 'reset': function(event){
      //   event.preventDefault();
      //   console.log('form reset', event, this);
      //   this.render();
      // }
    }
  });

  return Forms;
});
