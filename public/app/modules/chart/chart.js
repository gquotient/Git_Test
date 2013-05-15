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
  var Chart = { views: {} };

  Chart.Model = Backbone.Model.extend({
    data: []
  });

  Chart.views.Line = Marionette.ItemView.extend({
    model: new Chart.Model(),
    chartOptions: {},
    render: function(){
      var graph = new Rickshaw.Graph( {
        element: this.el,
        series: [
          {
            color: 'steelblue',
            data: [ { x: 0, y: 23}, { x: 1, y: 15 }, { x: 2, y: 79 } ]
          }, {
            color: 'lightblue',
            data: [ { x: 0, y: 30}, { x: 1, y: 20 }, { x: 2, y: 64 } ]
          }
        ]
      } );

      graph.render();
    },
    initialize: function(){}
  });

  return Chart;
});