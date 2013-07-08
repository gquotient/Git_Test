define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'project',
  'device',
  'chart',
  'issue',

  'hbs!layouts/templates/projectIssues'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,

  Project,
  Device,
  Chart,
  Issue,

  projectIssuesTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: projectIssuesTemplate
    },

    attributes: {
      id: 'page-projectDevices'
    },

    regions: {
      contentNavigation: '.nav_content',
      issueDetail: '.issueDetail',
      charts: '.charts'
    },

    selectIssue: function(issue){
      Backbone.trigger('set:breadcrumbs', {model: issue, state: 'issue', display_name: issue.get('title')});

      // this.app.state = 'issue';

      Backbone.history.navigate('/project/' + this.model.id + '/issues/' + issue.id);

      this.issueDetail.show(new Marionette.Layout({template: _.template('Issue: <%= id %> <br> Description: <%= title %>'), model: issue}));

      $('.nav_content').find('.active').removeClass('active');

      $('.nav_content').find('#' + issue.id).addClass('active');
    },

    onShow: function(){
      this.contentNavigation.show(this.issueNavigation);
    },

    initialize: function(options){
      this.app = options.app;
      var that = this;

      Backbone.trigger('set:breadcrumbs', {state: 'issue', display_name: 'Issues'});

      // Set the project model to this layout's model
      this.model = options.model;

      this.model.issues = new Issue.Collection();

      // Instantiate devices collection view
      this.issueNavigation = new Issue.views.NavigationListView({collection: this.model.issues});

      this.model.issues.fetch().done(function(){
        if (options.currentIssue) {
          console.log(that.model.issues, options.currentIssue);
          var myIssue = that.model.issues.findWhere({id: options.currentIssue});
          console.log(myIssue);

          that.selectIssue(myIssue);
        }
      });

      // Listen for a device to be clicked and change view
      this.listenTo(Backbone, 'click:issue', function(issue){
        that.selectIssue(issue);
      });
    }
  });
});
