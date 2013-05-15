define(
[
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'chartjs'
],
function(
  $,
  _,
  Backbone,
  Marionette,

  Chartjs
){
  var Chart = { views: {} };

  Chart.Model = Backbone.Model.extend({
    data: {
      labels : ['January','February','March','April','May','June','July'],
      datasets : [
        {
          fillColor : 'rgba(220,220,220,0.5)',
          strokeColor : 'rgba(220,220,220,1)',
          pointColor : 'rgba(220,220,220,1)',
          pointStrokeColor : '#fff',
          data : [65,59,90,81,56,55,40]
        },
        {
          fillColor : 'rgba(151,187,205,0.5)',
          strokeColor : 'rgba(151,187,205,1)',
          pointColor : 'rgba(151,187,205,1)',
          pointStrokeColor : '#fff',
          data : [28,48,40,19,96,27,100]
        }
      ]
    }
  });

  Chart.views.Line = Marionette.ItemView.extend({
    model: new Chart.Model(),
    tagName: 'canvas',
    chartOptions: {},
    render: function(){
      var myChart = new Chartjs(this.$el.get(0).getContext('2d'))
        .Line(this.model.data, this.chartOptions);
    },
    initialize: function(){}
  });

  return Chart;
});