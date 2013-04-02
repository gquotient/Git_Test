define(
  [
    "jquery",
    "underscore",
    "backbone",
    "backbone.marionette",

    "hbs!app/modules/project/templates/dataListItem"

  ],
  function($, _, Backbone, Marionette, DataListItemTemplate){

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
      template: _.template('<table class="basic"><thead><tr><th>Project Name</th></tr></thead><tbody></tbody></table>'),
      itemViewContainer: 'tbody',
      itemView: Project.views.DataListItem
    });

    return Project;

});
