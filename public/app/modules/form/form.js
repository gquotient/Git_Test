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
      this.disableForm();
    },
    disableForm: function(){
      // Disable form elements
      this.$el.find(':input:not(button)').attr('disabled', true);
      this.$('.editActions').hide();
      this.$('.defaultActions').show();
    },
    onEnableForm: function(){
      // Enable form elements
      this.$el.find(':input:not(button)').attr('disabled', false);
      this.$('.editActions').show();
      this.$('.defaultActions').hide();
    },
    validateEmail: function(email) {
      // Stole this from Stack Overflow, seems to work
      var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

      return re.test(email);
    },
    validate: function(){
      var $formElements = this.$el.find(':input:not(button)'),
          values = {},
          save = true;

      // If field is required and empty, don't save these values and,
      // handle empty field highlighting
      _.each($formElements, function(el){
        var $el = $(el);

        if ($el.attr('required') && $el.val() === '') {
          save = false;
          $el.css({'border-color': '#f00'});
        } else if ($el.attr('type') === 'email' && !this.validateEmail($el.val())) {
          save = false;
          alert('A valid email is required.');
          $el.css({'border-color': '#f00'});
        } else {
          values[el.name] = el.value;
          $el.css({'border-color': ''});
        }
      }, this);

      // If everything looks good, save the model
      if (save) {
        this.save(values);
      } else {
        alert('Required fields are highlighted');
      }
    },
    save: function(values){
      this.model.set(values);
      this.model.save();
      this.disableForm();
    },
    onSave: function(){
      this.validate();
    },
    onEdit: function(){
      this.enableForm();
    },
    onCancel: function(){
      // Return inputs to existing state
      this.render();
      this.disableForm();
    },
    onDelete: function(){
      // Get the name of the model and prompt user on destroying it
      var name = this.model.get(this.options.fields[0]),
          prompt = confirm('Are you sure you want to delete ' + name + ' ?');

      // If user clicks ok, destroy this model
      if (prompt) {
        this.model.destroy();
      }
    },
    triggers: {
      'click button.save': 'save',
      'click button.edit': 'edit',
      'click button.cancel': 'cancel',
      'click button.delete': 'delete'
    },
    events: {
      'click button.detail': function(event){
        event.preventDefault();
        Backbone.trigger('detail', this.model);
      }
    }
  });

  Forms.views.newTableRow = Forms.views.tableRow.extend({
    template: {
      type: 'handlebars',
      template: newTableRowTemplate
    },
    onRender: function(){},// Kill on render function
    save: function(values){
      this.model.set(values);
      this.collection.create(this.model);
      this.close();
    },
    onCreate: function(){
      this.validate();
    },
    onCancel: function(){
      this.close();
    },
    triggers: {
      'click button.create': 'create'
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
