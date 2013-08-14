define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'jquery.DatePicker',

  'hbs!dateselection/templates/multi',

  'css!bower_components/datepicker/css/datepicker/base.css'
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
    options: {
      date: {
        start: null,
        stop: null
      }
    },
    events: {
      'click .expand': 'toggle',
      'click .cancel': 'cancel',
      'click .set': 'set'
    },
    toggle: function(){
      if (this.enabled) {
        this.$('.calendar').fadeOut();
        this.enabled = false;
      } else {
        this.$('.calendar').fadeIn();
        this.enabled = true;
      }
    },
    cancel: function(){
      // Reset calendar to currently stored date
      this.calendar.DatePickerSetDate([this.options.date.start, this.options.date.stop]);
      // Close calendar
      this.toggle();
    },
    set: function(){
      // Get date returns [[<dates duple>], <calendar el>]
      var date = this.calendar.DatePickerGetDate()[0];

      // Update stored dates
      this.options.date.start = date[0].getTime();
      this.options.date.stop = date[1].getTime();

      // Worried about memory leaks in the date picker so menually update view for now
      this.$('.start').text(this.dateToString(date[0]));
      this.$('.stop').text(this.dateToString(date[1]));

      // Trigger global date event
      Backbone.trigger('set:date', this.options.date);

      // Hide calendar
      this.toggle();
    },
    onShow: function(){
      // Add jquery calendar
      this.calendar = this.$('.selector').DatePicker({
        mode: 'range',
        inline: true,
        calendars: 3,
        date: [this.options.date.start, this.options.date.stop]
      });

      // Hide on initial view
      this.enabled = false;
      this.$('.calendar').hide();
    },
    dateToString: function(date){
      // Return date format as YYYY-MM-DD
      return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    },
    serializeData: function(){
      // Since we don't have a model, we need to manually create context for the template
      var start = new Date(this.options.date.start),
          stop = new Date(this.options.date.start);

      return {
        date: {
          // Stringify date
          // NOTE - We may just want to make a template helper for this
          start: this.dateToString(start),
          stop: this.dateToString(stop)
        }
      };
    },
    initialize: function(options){
      // Set date to now if not supplied
      if (!options || !options.date) {
        var now = new Date().getTime();

        this.options.date.start = now;
        this.options.date.stop = now;
      }
    }
  });

  return DateSelection;
});
