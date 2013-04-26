define(
[
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette'
],
function(
  $,
  _,
  Backbone,
  Marionette
){

  var DefaultForm = Marionette.ItemView.extend({
    tagName: 'form',
    attributes: {
      id: '',
      name: ''
    },
    events: {
      'submit': function(event){
        // this.model.set('id') = this.model.get('email');
        var that= this;
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

  return DefaultForm;
});
