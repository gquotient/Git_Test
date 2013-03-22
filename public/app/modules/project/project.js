define(
  [
    "jquery",
    "backbone",
    "backbone.marionette",

    "hbs!app/modules/project/templates/dataListItem"

  ],
  function($, Backbone, Marionette, DataListItemTemplate){

    var Project = { models: {}, views: {}, layouts: {}, collections: {} };


    Project.models.Project = Backbone.Model.extend({});

    Project.collections.DataList = Backbone.Collection.extend({
      model: Project.models.Project,
      url: '/api/projects'
    });

    Project.views.DataListItem = Marionette.ItemView.extend({
      template: {
        type: 'handlebars',
        template: DataListItemTemplate
      }
    });

    Project.views.DataList = Marionette.CollectionView.extend({
      itemView: Project.views.DataListItem
    });

    return Project;

});
