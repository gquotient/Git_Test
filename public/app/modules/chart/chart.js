/*

  TODO:

  [x] Smart axis selection
  [x] Smart axis labels
  [ ] Revert to normal colors when same data type is displayed
  [ ] Area chart (health and soiling)

*/

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

  var basicSeries = {
    name: 'Series',
    data: []
  };

  Chart.seriesDefaults = {
    health: $.extend(_.clone(basicSeries), {
      name: 'Health',
      color: 'purple',
      unit: '%'
    }),
    soiling: $.extend(_.clone(basicSeries), {
      name: 'Soiling',
      color: 'green',
      unit: '%'
    }),
    irradiance: $.extend(_.clone(basicSeries), {
      name: 'Irradiance',
      color: '#DFD85C',
      unit: 'W/M2'
    }),
    power: $.extend(_.clone(basicSeries), {
      name: 'Power',
      color: '#369',
      unit: 'W'
    })
  };

  Chart.models.timeSeries = Backbone.Model.extend({
    url: '/api/timeline',
    parse: function(data){
      console.log('parse', data);
      var series = [];

      _.each(data.response, function(res, index){
        var data = res.data;

        //Adjust time to milliseconds
        _.each(data, function(point, index){
          point[0] = point[0] * 1000;
        });

        series.push({
          data: res.data
        });
      });

      this.set('series', series);
    },
    getData: function(){
      var that = this;

      $.ajax({
        url: this.url + '?timezone=' + this.get('timezone'),
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
        borderWidth: 0,
        spacingTop : 12,
        spacingRight : 12,
        spacingBottom : 12,
        spacingLeft : 12,
        plotBorderWidth : 1,
        plotBorderColor : '#555'
      },
      title: {
        text: null
      },
      credits: {
        enabled: false
      },
      colors: [
        '#8DD3C7',
        '#4DAF4A',
        '#FF7F00',
        '#F781BF',
        '#E41A1C',
        '#FFFF33',
        '#A65628',
        '#377EB8',
        '#BEBADA',
        '#FB8072',
        '#80B1D3',
        '#B3DE69',
        '#984EA3',
        '#FCCDE5',
        '#D9D9D9',
        '#BC80BD',
        '#FDB462',
        '#CCEBC5',
        '#FFED6F',
        '#0066cc'
      ],
      plotOptions: {
        series: {
          marker: {
            enabled: false,
            radius: 1.5,
            states: {
              hover: {
                enabled: true
              }
            }
          }
        }
      },
      tooltip: {
        //formatter: function() {
        //  return this.x + ' | ' + this.y;
        //},
        //shared: true,

      },
      legend: {
        borderWidth: 0,
        itemStyle: {
          color: '#ccc'
        },
        itemHoverStyle: {
          color: '#fff'
        }
      },
      xAxis: {
        type: 'datetime',
        tickColor: '#555',
        gridLineColor: '#444', //Lines inside plot
        lineColor: '#555' //Bottom line of plot
      },
      yAxis: [
        {
          gridLineColor: '#444', //Lines inside plot
          title: {
            style: {
              color: '#ccc',
              'font-weight': 'normal'
            }
          }
        },
        {
          opposite: true,
          gridLineColor: '#444', //Lines inside plot
          title: {
            style: {
              color: '#ccc',
              'font-weight': 'normal'
            }
          }
        }
      ]
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
    },
    smartAxesSelector: function(series){
      var axes = [];

      _.each(series, function(serie, index){
        if (axes.indexOf(serie.unit) < 0) {
          axes.push(serie.unit);
        }
        serie.yAxis = axes.indexOf(serie.unit);
      });

      return series;
    },
    smartAxesTitles: function(series){
      var titles = [];

      _.each(series, function(serie, index){
        if (!titles[serie.yAxis]) {
          var title = {
            title: {
              text: serie.unit
            }
          };

          titles[serie.yAxis] = title;
        }
      });

      return titles;
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
      //console.log('init', this, this.model);
      var that = this;

      // Run series through axis selector
      this.options.series = this.smartAxesSelector(this.options.series);

      console.log(this.options.series);

      // Instantiate the chart
      this.chart = new Highcharts.Chart($.extend(true, this.chartOptions, {
        chart: {
          type: 'line',
          renderTo: this.el
        },
        yAxis: this.smartAxesTitles(this.options.series),
        series: this.options.series
      }));

      // Update chart on data change
      this.model.on('change:series', function(model, seriesData){
        if (seriesData.length) {
          _.each(that.chart.series, function(serie, index){
            // Update series data
            if (seriesData[index].data && seriesData[index].data.length) {
              serie.setData(seriesData[index].data);
            } else {
              //throw no data error
              console.warn('No data found on trace:', seriesData[index]);
            }
          });
        } else {
          //throw no data error
          console.warn('No data came back at all. Call Thadeus.');
        }
      });
    }
  });

  return Chart;
});
