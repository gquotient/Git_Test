define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',

  'leaflet',
  'css!leaflet.css',

  'project',

  'hbs!layouts/admin/templates/projects'
], function(
  _,
  $,
  Backbone,
  Marionette,

  L,
  leafletCSS,

  Project,

  projectsAdminTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: projectsAdminTemplate
    },

    attributes: {
      id: 'page-projectsAdmin'
    },

    ui: {
      map: '#map'
    },

    regions: {
      list: '#projectList',
      edit: '#projectEdit'
    },

    initialize: function(options){
      this.collection.fetch({
        data: {
          index_name: 'AlignedProjects'
        }
      });

      this.geosearch = new Project.views.AdminGeosearch();

      this.listenTo(this.geosearch, 'found', function(loc){
        this.triggerMethod('new:location', {
          address: loc.address.house_number + ' ' + loc.address.road,
          city: loc.address.city,
          state: loc.address.state,
          zipcode: loc.address.postcode,
          latitude: loc.lat,
          longitude: loc.lon
        });

        this.map.setView([loc.lat, loc.lon], 18);
      });

      this.listView = new Project.views.AdminList({
        collection: this.collection
      });

      this.listenTo(this.listView, 'create', function(){
        this.showEdit( new Project.Model() );
      });

      this.listenTo(this.listView, 'itemview:edit', function(view, args){
        this.showEdit(args.model);
      });

      // Update history
      Backbone.history.navigate('/admin/projects');
    },

    onShow: function(){
      this.map = L.map(this.ui.map[0]).setView([0, 0], 1);

      // add an OpenStreetMap tile layer
      L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
      }).addTo(this.map).setOpacity(0.99);

      this.ui.map.append( this.geosearch.render().el );
      this.list.show(this.listView);
    },

    showEdit: function(model){
      this.model = model;

      this.edit.show( new Project.views.AdminEdit({
        collection: this.collection,
        model: model,
        user: this.options.user
      }));
    },

    onNewLocation: function(attr){
      if (this.model && this.model.isNew()) {
        this.model.set(attr);
      }
    }
  });
});
