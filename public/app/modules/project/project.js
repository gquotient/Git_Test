define(
  [
    'jquery',
    'underscore',
    'backbone',
    'backbone.marionette',

    'hbs!app/modules/project/templates/dataList',
    'hbs!app/modules/project/templates/dataListItem'
  ],
  function($, _, Backbone, Marionette, DataListTemplate, DataListItemTemplate){

    var Project = { models: {}, views: {}, layouts: {}, collections: {} };


    Project.models.Project = Backbone.Model.extend({});

    Project.collections.DataList = Backbone.Collection.extend({
      model: Project.models.Project,
      url: '/api/projects',

      filterByIDs: function(ids){
        return this.filter(function(project){
          return _.contains(ids, project.id);
        });
      }
    });

    Project.views.DataListItem = Marionette.ItemView.extend({
      template: {
        type: 'handlebars',
        template: DataListItemTemplate
      },
      initialize: function(options){
        Handlebars.registerHelper('projectId', function() {
          return this.name.replace(' ', '_');
        });
      },
      render: function(){
        this.setElement(this.template.template(this.model.attributes));
      }
    });

    Project.views.DataList = Marionette.CompositeView.extend({
      template: {
        type: 'handlebars',
        template: DataListTemplate
      },
      itemViewContainer: 'tbody',
      itemView: Project.views.DataListItem,
      initialize: function(options){
        var that = this;

        this.controller = options.controller;

        this.listenTo(this.controller, 'select:portfolio', function(options){
          // Reset collection and re render
          that.collection.reset(options.model.get('projects').models);
        });
      }
    });

    Project.views.map = Backbone.Marionette.ItemView.extend({
      render: function(){
        // Create a container for the leaflet map
        this.setElement($('<div id="leafletContainer" />'));
      },
      build: function(){
        var map = L.map('leafletContainer').setView([30.2, -97.7], 1),
            projects = this.collection.models;

        // add an OpenStreetMap tile layer
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        _.each(projects, function(project){
          var latLong = project.attributes.latLong;

          if (latLong && latLong.length) {
            L.marker([latLong[0], latLong[1]]).addTo(map);
          }
        });

      },
      initialize: function(options){
        var that = this;

        this.controller = options.controller;

        this.listenTo(this.controller, 'select:portfolio', function(options){
        });
      }
    });

    return Project;

});
