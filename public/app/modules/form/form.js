define(
[
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'form/helpers',

  'hbs!form/templates/table',
  'hbs!form/templates/editTableRow',
  'hbs!form/templates/newTableRow'
],
function(
  $,
  _,
  Backbone,
  Marionette,

  formHelpers,

  tableTemplate,
  editTableRowTemplate,
  newTableRowTemplate
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
    template: {
      type: 'handlebars',
      template: editTableRowTemplate
    },
    templateHelpers: function(){
      return { schema: this.options.schema, fields: this.options.fields };
    },
    onShow: function(){
      // Disable form elements
      this.disableForm();
    },
    disableForm: function(){
      this.$el.find(':input:not(button)').attr('disabled', true);
    },
    enableForm: function(){
      // Enable form elements
      this.$el.find(':input:not(button)').attr('disabled', false);
    },
    events: {
      'click button.save': function(event){
        event.preventDefault();

        var that = this;

        var formElements = this.$el.find(':input:not(button)');
        _.each( formElements , function(element){
          that.model.set( element.name, element.value );
        });

        this.model.save();

        this.disableForm();
      },
      'click button.edit': function(event){
        this.enableForm();
      },
      'click button.cancel': function(event){
        event.preventDefault();
        this.render();
        this.disableForm();
      }
    }
  });

  Forms.views.newTableRow = Marionette.ItemView.extend({
    tagName: 'tr',
    template: {
      type: 'handlebars',
      template: newTableRowTemplate
    },
    templateHelpers: function(){
      return { schema: this.options.schema, fields: this.options.fields };
    },
    events:{
      'click button.create': function(event){
        var that = this;
        event.preventDefault();
        var formElements = this.$el.find(':input:not(button)');
        _.each( formElements , function(element){
          that.model.set( element.name, element.value );
        });
        Backbone.sync('create', this.model);
        this.collection.add(this.model);
        this.close();
      },
      'click button.cancel': function(event){
        event.preventDefault();
        this.close();
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
    itemViewOptions: function(model, index){
      return {
        fields: this.fields,
        schema: this.model.schema
      };
    },
    serializeData: function() {
      return {fields: this.fields, schema: this.model.schema};
    },
    itemView: Forms.views.tableRow,
    newRowView: Forms.views.newTableRow,
    attributes: {
      id: '',
      name: ''
    },
    events: {
      'click button.add': function(event){
        event.preventDefault();
        var newModel = new this.model();
        var newModelView = new this.newRowView( { model: newModel, collection: this.collection, schema: this.model.schema, fields: this.fields } );
        this.$el.find('tbody').append( newModelView.render().el );
      }
    }
  });

  return Forms;
});
