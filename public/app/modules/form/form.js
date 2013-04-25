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
      id: 'someForm',
      name: 'someForm'
    },
    events: {
      'submit': function(event){
        event.preventDefault();
        console.log('form submitted', event, this);
        console.log(this.$el.serialize());
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