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

  // NOTE: This isn't particularly useful at the moment
  // but may be helpful if series share multiple properties
  var basicSeries = {
    name: 'Series',
    data: []
  };

  // Set up default colors, labels, etc. for data types
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
      unit: 'W/m²'
    }),
    power: $.extend(_.clone(basicSeries), {
      name: 'Power',
      color: '#369',
      unit: 'W'
    }),
    voltage: $.extend(_.clone(basicSeries), {
      name: 'Voltage',
      color: '#f16eaa',
      unit: 'V'
    }),
    current: $.extend(_.clone(basicSeries), {
      name: 'Current',
      color: '#acd473',
      unit: 'I'
    })
  };

  Chart.dataDefaults = function(project, device, dataType, timezone) {
    var
      ddl = {
        'Panel': 'pnl',
        'String': 'str-pnl-calc',
        'Inverter': 'bus-str-calc'
      },
      column = {
        'Panel': {
          power: 'dc_power_output',
          current: 'dc_current_output_mean',
          voltage: 'dc_voltage_output_mean'
        },
        'String': {
          energy: 'dc_energy',
          power: 'dc_power',
          current: 'dc_current',
          voltage: 'dc_voltage',
          panel_power_mean: 'dc_power_output_mean'
        },
        'Inverter': {
          power: 'dc_power',
          current: 'dc_current',
          voltage: 'dc_voltage'
        }
      },
      dataDefinition
    ;

    if (dataType === 'irradiance') {
      dataDefinition = {
        'project_label': project.id,
        'ddl': 'pgen-env',
        'dtstart': 'today',
        'dtstop': 'now',
        'columns': ['freezetime', 'irradiance'],
        project_timezone: timezone || null
      };
      /*
      dataDefinition = {
        'project_label': project.id,
        'ddl': 'env',
        'dtstart': 'today',
        'dtstop': 'now',
        'columns': ['freezetime', 'value_mean'],
        'filters': [
          {'column': 'attribute', 'in_set': ['irradiance']},
          {'column': 'identifier', 'in_set': [project.id + ':IRRA-1']}
        ]
      };
      */
    } else {
      dataDefinition = {
        'project_label': project.id,
        'ddl': ddl[device.get('devtype')],
        'dtstart': 'today',
        'dtstop': 'now',
        'columns': ['freezetime', column[device.get('devtype')][dataType]],
        'filters': [
          {
            'column': 'identifier',
            'in_set': [device.get('graph_key')]
          }
        ],
        project_timezone: timezone || null
      };
    }

    return dataDefinition;
  };

  Chart.models.timeSeries = Backbone.Model.extend({
    url: '/api/timeline',
    parse: function(data){
      /*
        This is pretty simple minded at the moment and assumes duples of points on
        individual traces
      */
      var series = [];

      var roundNumber = function(num, dec) {
        var result = (num !== null)?Math.round(num*Math.pow(10,dec))/Math.pow(10,dec):null;
        return result;
      };

      // Loop through each trace
      _.each(data.response, function(res, index){
        var data = res.data;

        // Loop through each point on the trace
        _.each(data, function(point, index){
          // Adjust time to milliseconds
          point[0] = point[0] * 1000;
          // Round watts to integers
          point[1] = roundNumber(point[1], 0);
        });

        // Push updated trace to series array
        series.push({
          data: res.data
        });
      });

      // Set the data on the model
      this.set('series', series);
    },
    fetch: function(){
      /*
        Opted to use a custom data fetch method in lieu of the
        default backbone fetch() to have a little more control
      */
      var that = this;

      return $.ajax({
        url: this.url,
        cache: false,
        type: 'POST',
        dataType: 'json',
        data: {
          traces: this.get('dataType')
        }
      })
      .done(function(data){
        that.parse(data);
      });
    },
    initialize: function(options){
      var that = this;

      this.url = (options && options.url) ? options.url : this.url;
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
        plotBorderColor : '#444'
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
        tickColor: '#444',
        gridLineColor: '#333', //Lines inside plot
        lineColor: '#444' //Bottom line of plot
      },
      yAxis: [
        {
          gridLineColor: '#333', //Lines inside plot
          title: {
            style: {
              color: '#ccc',
              'font-weight': 'normal'
            }
          },
          min: 0
        },
        {
          opposite: true,
          gridLineColor: '#333', //Lines inside plot
          title: {
            style: {
              color: '#ccc',
              'font-weight': 'normal'
            }
          },
          min: 0
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
      title: 'Generic Chart',
      autoUpdate: true
    },
    render: function(){
      //Fetch data
      this.model.fetch();
    },
    onClose: function(){
      // Clear the auto update when view is closed
      clearInterval(this.fetchInterval);
    },
    initialize: function(options){
      //console.log('init', this, this.model);
      var that = this;

      // Run series through axis selector
      this.options.series = this.smartAxesSelector(this.options.series);

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

      var fetch = function(){
        that.model.fetch();
      };

      // Using set timeout for now so it only updates once
      this.fetchInterval = setInterval(fetch, 300000);
    }
  });

  return Chart;
});
