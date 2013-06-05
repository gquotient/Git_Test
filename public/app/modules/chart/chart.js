define(
[
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'highcharts'
],
function(
  $,
  _,
  Backbone,
  Marionette,

  Highcharts
){
  var Chart = { models: {}, views: {} };

  Chart.models.timeSeries = Backbone.Model.extend({
    url: '/api/timeline',
    parse: function(data){
      console.log('parse', data);
      var series = [];

      _.each(data.response, function(res, index){
        series.push({
          data: res.data
        });
      });

      this.set('series', series);
    },
    getData: function(){
      var that = this;

      $.ajax({
        url: '/api/timeline',
        type: 'POST',
        dataType: 'json',
        data: { traces: that.get('dataType') }
      })
      .done(function(data){
        that.parse(data);
      });
    },
    initialize: function(options){
      var that = this;

      this.url = (options && options.url) ? options.url : this.url;

      var fetch = function(){
        that.fetch();
      };

      // Using set timeout for now so it only updates once
      //this.interval = setTimeout(fetch, 3000);

      // Create series array
      //this.set('series', []);
    }
  });

  Chart.views.core = Marionette.ItemView.extend({
    chartOptions: {
      chart: {
        animation: false,
        width: null,
        height: null,
        backgroundColor: null,
        credit: false
      },
      credits: {
        enabled: false
      },
      plotOptions: {
        series: {
          marker: {
            enabled: false,
            states: {
              hover: {
                enabled: true
              }
            }
          }
        }
      },
      xAxis: {
        type: 'datetime'
      }
    },
    attributes: {
      class: 'chart'
    },
    render: function(){
      // Overwrite existing render method
    },
    onShow: function(){
      // Fire resize so rendered charts conform to
      // visible div size
      $(window).resize();
    },
    onClose: function(){
      if (this.chart) {
        this.chart.destroy();
      }
    }
  });

  Chart.views.Line = Chart.views.core.extend({
    options: {
      title: 'Generic Chart'
    },
    render: function(){
      //Fetch data
      this.model.getData();
    },
    initialize: function(options){
      //console.log('init', this);
      var that = this;

      this.options = _.extend(this.options, options);

      // Instantiate the chart
      this.chart = new Highcharts.Chart($.extend(true, this.chartOptions, {
        chart: {
          type: 'line',
          renderTo: this.el
        },
        title: {
          text: this.options.title,
          style: {
            color: '#ccc'
          }
        },
        series: this.options.series
      }));

      // Update chart on data change
      this.model.on('change:series', function(){
        //console.log('series updated', arguments);
        var
          series = arguments[1],
          seriesData = that.model.get('series')
        ;

        if (series.length) {
          _.each(that.chart.series, function(serie, index){
            // Update series data on new data fetch
            serie.setData(seriesData[index].data);
          });
        } else {
          //throw no data error
        }
      });
    }
  });

  return Chart;
});
