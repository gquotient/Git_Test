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
        });

        this.model.save();

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
      return {
        schema: this.options.schema,
        fields: this.options.fields,
        actions: this.options.actions
      };
    },
    onRender: function(){
      // Disable form elements
      this.disableForm();
      this.defaultActions = this.$('td.actions button');
    },
    disableForm: function(){
      this.$el.find(':input:not(button)').attr('disabled', true);
      this.$('td.actions').html(this.defaultActions);
    },
    enableForm: function(){
      // Enable form elements
      this.$el.find(':input:not(button)').attr('disabled', false);
      this.$('td.actions').html(this.editControls);
    },
    editControls: $([
      '<button type="reset" class="button cancel">Cancel</button>',
      '<button type="button" class="button primary save">Save</button>'
    ].join('')),
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
      },
      'click button.detail': function(event){
        event.preventDefault();
        Backbone.trigger('detail', this.model);
      },
      'click button.delete': function(event){
        event.preventDefault();

        var name = this.model.get(this.options.fields[0]),
            prompt = confirm('Are you sure you want to delete ' + name + ' ?');

        if (prompt) {
          console.log('delete', this.model);
          this.model.destroy();
        }
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
      return {
        schema: this.options.schema,
        fields: this.options.fields,
        actions: this.options.actions
      };
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
        actions: this.actions,
        schema: this.model.schema
      };
    },
    serializeData: function() {
      return { fields: this.fields, schema: this.model.schema, actions: this.actions };
    },
    itemView: Forms.views.tableRow,
    newRowView: Forms.views.newTableRow,
    attributes: {
      id: '',
      name: ''
    },
    actions: false,
    events: {
      'click button.add': function(event){
        event.preventDefault();
        var newModel = new this.model();
        var newModelView = new this.newRowView( { model: newModel, collection: this.collection, schema: this.model.schema, fields: this.fields, actions: this.actions } );
        this.$el.find('tbody').append( newModelView.render().el );
      }
    }
  });

  return Forms;
});
