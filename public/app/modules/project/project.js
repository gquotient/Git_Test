define(
  [
    'jquery',
    'underscore',
    'backbone',
    'backbone.marionette',
    'backbone.marionette.handlebars',

    'hbs!app/modules/project/templates/dataList',
    'hbs!app/modules/project/templates/dataListItem'
  ],
  function($, _, Backbone, Marionette, MarionetteHandlebars, DataListTemplate, DataListItemTemplate){

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
      initialize: function(){
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
      itemView: Project.views.DataListItem
    });

    Project.views.map = Backbone.Marionette.ItemView.extend({
      render: function(){
        // Create a container for the leaflet map
        this.setElement($('<div id="leafletContainer" />'));
      },
      hideMarkers: function(projects){
        // projects should be an array of project models
        var ids = [];

        _.each(projects, function(project){
          ids.push(project.id);
        });

        _.each(this.markers, function(marker){
          if (ids.indexOf(marker.id) >= 0) {
            // show marker
            // This is a little hackey but there doesn't seem to be a hide/show method in leaflet
            $(marker.marker._icon).fadeIn();
            $(marker.marker._shadow).fadeIn();
          } else {
            // hide marker
            $(marker.marker._icon).fadeOut();
            $(marker.marker._shadow).fadeOut();
          }
        });

        return this;
      },
      build: function(){
        var that = this,
            map = L.map('leafletContainer').setView([30.2, -97.7], 1),
            projects = this.collection.models;

        // add an OpenStreetMap tile layer
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Create array to store markers
        this.markers = [];

        // Build marker objects and markers
        _.each(projects, function(project){
          var latLong = project.attributes.latLong;

          if (latLong && latLong.length) {
            var newMarker = {
              marker: L.marker([latLong[0], latLong[1]]).addTo(map),
              id: project.id
            };

            that.markers.push(newMarker);
          }
        });

        return this;
      }
    });

    return Project;
});
