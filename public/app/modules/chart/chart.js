define(
[
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'rickshaw'
],
function(
  $,
  _,
  Backbone,
  Marionette,

  Rickshaw
){
  var Chart = { models: {}, views: {} };
  /*
    Have multiple models for the different data types that have
    a good parse method for getting the data formatted to work
    with Rickshaw
  */
  Chart.models.timeSeries = Backbone.Model.extend({
    //url: populated externally
    data: [
      {
        color: 'steelblue',
        data: [ { x: 0, y: 23}, { x: 1, y: 15 }, { x: 2, y: 79 } ]
      },
      {
        color: 'lightblue',
        data: [ { x: 0, y: 30}, { x: 1, y: 20 }, { x: 2, y: 64 } ]
      }
    ]
  });

  Chart.views.Line = Marionette.ItemView.extend({
    model: new Chart.models.timeSeries(),
    render: function(){
      this.chart.render();
    },
    initialize: function(){
      this.chart = new Rickshaw.Graph( {
        element: this.el,
        series: this.model.data
      } );
    }
  });

  return Chart;
});