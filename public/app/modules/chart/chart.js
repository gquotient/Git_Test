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

  'highcharts',

  'walltime'
],
function(
  $,
  _,
  Backbone,
  Marionette,

  Highcharts,

  WallTime
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
    insolation: $.extend(_.clone(basicSeries), {
      name: 'Insolation',
      color: '#DFD85C',
      unit: 'Wh/m²'
    }),
    irradiance: $.extend(_.clone(basicSeries), {
      name: 'Irradiance',
      color: '#DFD85C',
      unit: 'W/m²'
    }),
    energy: $.extend(_.clone(basicSeries), {
      name: 'Energy',
      color: '#369',
      unit: 'Wh'
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

  Chart.dataDefaults = function(project, device, dataType, date) {
    var
      ddl = {
        'Panel': 'pnl',
        'String': 'str-pnl-calc',
        'DC Bus': 'bus-str-calc',
        'Generation Meter': 'acm'
      },
      column = {
        Default: {
          power: 'dc_power',
          current: 'dc_current',
          voltage: 'dc_voltage'
        },
        Panel: {
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
        'DC Bus': {
          power: 'dc_power',
          current: 'dc_current',
          voltage: 'dc_voltage'
        },
        'AC Bus': {
          power: 'ac_power',
          current: 'ac_current',
          voltage: 'ac_voltage'
        },
        'Generation Meter': {
          power: 'ac_power_mean'
          //current: ac_current_a_mean, ac_current_b_mean, ac_current_c_mean, ac_current_n_mean
          //voltage: `ac_voltage_<phase>_mean`, the phases are `ab, an, bc, bn, ca, cn`
        }
      },
      dataDefinition
    ;

    if (dataType === 'irradiance') {
      dataDefinition = {
        'project_label': project.id,
        'ddl': 'pgen-env',
        'dtstart': date ? date.start/1000 : 'today',
        'dtstop': date ? date.stop/1000 : 'now',
        'columns': ['freezetime', 'irradiance'],
        project_timezone: project.get('timezone')
      };
    } else {
      var deviceDefinition = column[device.get('devtype')] || column.Default;

      dataDefinition = {
        'project_label': project.id,
        'ddl': ddl[device.get('devtype')],
        'dtstart': date ? date.start/1000 : 'today',
        'dtstop': date ? date.stop/1000 : 'now',
        'columns': ['freezetime', deviceDefinition[dataType]],
        'filters': [
          {
            'column': 'identifier',
            'in_set': [device.get('graph_key')]
          }
        ],
        project_timezone: project.get('timezone')
      };
    }

    return dataDefinition;
  };

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
        text: null,
        align: 'left',
        style: {
          color: '#ccc',
          fontFamily: 'Helvetica, sans-serif'
        },
        useHTML: true
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
        },
        line: {
          stacking: null
        },
        column: {
          stacking: 'normal',
          borderWidth: 0
        }
      },
      tooltip: {
        shared: true,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        borderColor: '#555',
        borderRadius: 0,
        style: {
          color: '#ccc'
        }
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
            text: null,
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
            text: null,
            style: {
              color: '#ccc',
              'font-weight': 'normal'
            }
          },
          min: 0
        }
      ]
    },
    className: 'chart',
    fetch: function(){
      var that = this;
      var $loadingIndicator = $('<span class="loadingIndicator"></span>');

      this.$el.append($loadingIndicator);

      return $.ajax({
        url: '/api/timeline',
        cache: false,
        type: 'POST',
        dataType: 'json',
        data: {
          traces: this.options.traces
        }
      })
      .always(function(){
        $loadingIndicator.remove();
      })
      .fail(function(){
        console.warn('Timeline data request failed', arguments);
      })
      .done(function(data){
        that.parse(data.response);
      });
    },
    parse: function(data){
      /*
        This is pretty simple minded at the moment and assumes duples of points on
        individual traces
      */
      var series = [];

      var roundNumber = function(num, dec) {
        var result = (num !== null) ? Math.round(num*Math.pow(10,dec)) / Math.pow(10,dec) : null;
        return result;
      };

      // Loop through each trace
      _.each(data, function(trace, index){
        var seriesData = [],
            timezone = this.options.traces[index].project_timezone,
            walltime = WallTime.UTCToWallTime(new Date(), timezone),
            offset = (walltime.offset.negative) ? -walltime.offset.hours : walltime.offset.hours;

        if (trace && trace.data) {
          // Loop through each point on the trace
          _.each(trace.data, function(point, index){
            // Change point to local js epoch time
            point[0] = (point[0] * 1000) + (offset * 60 * 60 * 1000);
            // Round watts to integers
            point[1] = roundNumber(point[1], 2);
          });

          seriesData = trace.data;

          // Sort data until APIs sort by default
          seriesData.sort();
        } else if (trace && trace.errmsg) {
          console.warn(trace.errmsg);
        } else {
          console.warn('Something bad happend', this);
        }

        // Push updated trace to series array
        series.push({
          data: seriesData
        });
      }, this);

      // Update chart data
      this.setSeriesData(series);
    },
    setSeriesData: function(series){
      if (series.length) {
        _.each(this.chart.series, function(serie, index){
          // Update series data
          if (series[index].data) {
            serie.setData(series[index].data);
          }

          // If trace data is empty, handle no data error
          if (!series[index].data.length) {
            //throw no data error
            console.warn('No data found on trace:', series[index]);
          }
        });
      } else {
        //throw no data error
        console.warn('No data came back at all. Call Thadeus.');
      }
    },
    setDate: function(date){
      var start = date.start/1000, // Devide by 1000 to match unix epoch time
          stop = date.stop/1000;

      // Update time on each trace
      _.each(this.options.traces, function(trace){
        trace.dtstart = start;
        trace.dtstop = stop;
      });

      // Fetch new data
      this.fetch();
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
      // Clean up highcharts chart
      if (this.chart) {
        this.chart.destroy();
      }
    },
    smartSeriesBuilder: function(){
      var series = [];

      // Default names based on ddls
      _.each(this.options.traces, function(trace){
        series.push({
          name: trace.columns[1]
        });
      });

      return series;
    },
    smartAxesSelector: function(series){
      var axes = [];

      // Select the correct axis based on matching units
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

      // Use the unit to label the axis
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

  Chart.views.Basic = Chart.views.core.extend({
    options: {
      // Fetch new data every 5 minutes
      autoUpdate: true
    },
    render: function(){
      var that = this;

      // Instantiate the chart
      this.chart = new Highcharts.Chart(this.chartOptions);

      var fetch = function(){
        that.fetch();
      };

      //Fetch data on render
      fetch();

      // Using set timeout for now so it only updates once
      if (this.options.autoUpdate) {
        this.fetchInterval = setInterval(fetch, 300000);
      }

      // Listen for date set event and update chart
      this.listenTo(Backbone, 'set:date', this.setDate);
    },
    onClose: function(){
      // Clean up highcharts chart
      if (this.chart) {
        this.chart.destroy();
      }

      // Clear the auto update when view is closed
      clearInterval(this.fetchInterval);
    },
    initialize: function(options) {
      // If no series defs provided, build basic series for traces
      if (!options.series) {
        options.series = this.smartSeriesBuilder();
      }

      // Run series through axis selector
      options.series = this.smartAxesSelector(options.series);

      // Merge supplied chart options with view specific options
      this.chartOptions = $.extend(true, {}, this.chartOptions, options.chartOptions, {
        chart: {
          type: options.type || 'line',
          renderTo: this.el
        },
        yAxis: this.smartAxesTitles(this.options.series),
        series: options.series
      });
    }
  });

  return Chart;
});
