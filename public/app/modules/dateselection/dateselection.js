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
      'click .expand': function(){
        this.toggle();
      }
    },
    toggle: function(){
      if (this.enabled) {
        this.$('.calendar').hide();
        this.enabled = false;
      } else {
        this.$('.calendar').show();
        this.enabled = true;
      }

      this.calendar.toggle();
    },
    onShow: function(){
      // Add jquery calendar
      this.calendar = this.$('.selector').DatePicker({
        mode: 'multiple',
        inline: true,
        calendars: 3,
        date: [this.options.date.start, this.options.date.stop]
      });

      this.enabled = true;

      this.toggle();
    },
    serializeData: function(){
      // Since we don't have a model, we need to manually create context for the template

      var start = new Date(this.options.date.start),
          stop = new Date(this.options.date.start);

      return {
        date: {
          // Stringify date
          // NOTE - We may just want to make a template helper for this
          start: start.getFullYear() + '-' + start.getMonth() + '-' + start.getDate(),
          stop: start.getFullYear() + '-' + start.getMonth() + '-' + start.getDate()
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
