define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'jquery.DatePicker',

  'hbs!dateselection/templates/multi'
],
function(
  $,
  _,
  Backbone,
  Marionette,

  DatePicker,

  multiTemplate
){
  var DateSelection = { views: {} };

  DateSelection.views.Multi = Marionette.ItemView.extend({
    className: 'dateSelection multi',
    template: {
      type: 'handlebars',
      template: multiTemplate
    },
    date: {
      start: new Date(),
      stop: new Date()
    },
    events: {
      'click .expand': function(){
        this.$('.calendar').toggle();
      }
    },
    onShow: function(){
      console.log('calendar div', this.$('.calendar'));
      // Add jquery calendar
      this.calendar = this.$('.calendar').DatePicker({
        mode: 'multiple',
        inline: true,
        calendars: 3,
        date: new Date()
      });

      this.calendar.toggle();
    }
  });

  return DateSelection;
});
