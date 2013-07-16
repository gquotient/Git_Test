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

  'layouts/issues/core',

  'hbs!layouts/templates/issues'
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

  CoreLayout,

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
      Backbone.history.navigate('/project/' + this.model.id + '/issues/' + issue.id);

      this.issueDetail.show(new CoreLayout({model: issue, project: this.model}));

      $('.nav_content').find('.active').removeClass('active');

      $('.nav_content').find('#' + issue.id).addClass('active');
    },

    noIssues: function(){
      this.issueDetail.show(new Marionette.Layout({ template: _.template('There are currently no active alarms') }));
    },

    onShow: function(){
      this.contentNavigation.show(this.issueNavigation);
    },

    onClose: function(){
      if(this.model.devices && this.model.devices.length){
        // Clear devices from memory
        this.model.devices.reset();
      }
    },

    initialize: function(options){
      var that = this;

      Backbone.trigger('set:breadcrumbs', {state: 'issue', display_name: 'Issues'});

      // Set the project model to this layout's model
      this.model = options.model;

      // Instantiate devices collection view
      this.issueNavigation = new Issue.views.NavigationListView({collection: this.model.issues});

      // Fetch issues and update view
      this.model.issues.fetch().done(function(){
        if (options.currentIssue) {
          // Find issue with correct id
          var myIssue = that.model.issues.findWhere({uid: options.currentIssue});

          if (myIssue) {
            // If issue was found, change context
            that.selectIssue(myIssue);
          } else {
            // Handle issue not found
            console.warn('That issue does not exist');
          }
        } else if (that.model.issues.models.length) {
          that.selectIssue(that.model.issues.models[0]);
        } else {
          // Handle 'no issues' view
          that.noIssues();
        }
      });

      // Listen for a device to be clicked and change view
      this.listenTo(Backbone, 'click:issue', function(issue){
        that.selectIssue(issue);
      });
    }
  });
});
