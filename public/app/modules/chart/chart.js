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
  /*
    Have multiple models for the different data types that have
    a good parse method for getting the data formatted to work
    with Rickshaw
  */
  Chart.models.timeSeries = Backbone.Model.extend({
    url: '/api/timeseries',
    parse: function(data){
      console.log('parse');
      var series = [];

      for(var device=0, devicesLength=data.data[0][1].length; device<devicesLength; device++){
        //newSeries[device] = []; //Array for lines generated from this data set
        for(var col=0, colsLength=data.cols.length; col<colsLength; col++){

          var mySeries = {
            data : [],
            dataType : data.cols[col],
            deviceID : data.data[0][1][device][0],
            xAxis : 0,
            threshold : 0.00001
          };

          for(var day=0, dayLength=data.data.length; day<dayLength; day++){
            if(data.data[day][1][device]){
              for(var e=0, eLength=data.data[day][1][device][1].length;e<eLength;e++){//push it's data to the array
                var myDate = data.data[day][0].split('-'),
                  myTime = data.data[day][1][device][1][e][0].split(':');
                //var newDate = new Date(+myDate[2], (+myDate[1]-1), +myDate[0], +myTime[0], +myTime[1]);

                mySeries.data.push( [Date.UTC(+myDate[0], (+myDate[1]-1), +myDate[2], +myTime[0], +myTime[1]), data.data[day][1][device][1][e][col + 1]] );
              }
            }
          }

          series.push(mySeries);
        }
      }

      this.set('series', series);
    },
    initialize: function(options){
      var that = this;

      this.url = options.url || this.url;

      var fetch = function(){
        that.fetch();
      };

      // Using set timeout for now so it only updates once
      this.interval = setTimeout(fetch, 3000);

      // Create series array
      this.set('series', []);
    }
  });

  Chart.views.core = Marionette.ItemView.extend({
    chartOptions: {
      animation: false,
      width: null,
      height: null,
      backgroundColor: null,
      credit: false
    },
    render: function(){
      // Overwrite existing render method
    },
    onShow: function(){
      // Fire resize so rendered charts conform to
      // visible div size
      $(window).resize();
    }
  });

  Chart.views.Line = Chart.views.core.extend({
    model: new Chart.models.timeSeries({url: '/api/arrayPower'}),
    attributes: {
      class: 'chart'
    },
    initialize: function(){
      var that = this;

      // Instantiate the chart
      this.chart = new Highcharts.Chart({
        credits: {
          enabled: false
        },
        chart: _.extend({
          type: 'line',
          renderTo: this.el
        }, this.chartOptions),
        title: {
          text: 'Array Power'
        },
        series: [
          {
            color: '#369',
            data: []
          }
        ]
      });

      // Fetch data
      this.model.fetch();

      // Update chart on data change
      this.model.on('change:series', function(){
        console.log('series updated', arguments);
        var
          series = arguments[1],
          seriesData = that.model.get('series')
        ;

        _.each(that.chart.series, function(serie, index){
          console.log('series', arguments);
          console.log('series data', seriesData[index]);
          serie.setData(seriesData[index].data);
        });
      });
    }
  });

  return Chart;
});