define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'ia',

  'team',
  // 'organization',

  './base',
  'layouts/admin/teamManagement'
], function(
  _,
  $,
  Backbone,
  Marionette,
  Handlebars,

  ia,

  Team,

  BaseLayout,
  TeamManagementLayout
){
  return BaseLayout.extend({
    onShow: function(){
      this.pageContent.show(this.view);
    },

    showTeam: function(team){
      var layout = new TeamManagementLayout({ team: team });
      this.pageContent.show(layout);
      return layout;
    },

    initialize: function(options){
      this.collection = new Team.collections.Teams();
      this.view = new Team.views.EditTable({ collection: this.collection });

      this.listenTo(Backbone, 'detail', function(model){
        this.showTeam(model);
      }, this);
    }
  });
});
