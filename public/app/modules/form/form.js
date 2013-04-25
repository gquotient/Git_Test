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
        console.log('form submitted', event);
        console.log($(this).serialize());
      }
    }
  });

  return DefaultForm;
});