define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

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
      id: 'page-alarms'
    },

    regions: {
      contentNavigation: '.nav_content',
      issueDetail: '.detail',
      charts: '.charts'
    },

    selectIssue: function(issue){
      var that = this;

      Backbone.history.navigate('/project/' + this.model.id + '/issues/' + issue.id);

      this.getContactInfo().done(function(){
        that.issueDetail.show(new CoreLayout({
          model: issue,
          project: that.model,
          contactInfo: that.contactInfo
        }));
      });

      this.issueNavigation.setActive(issue.id);
    },

    noIssues: function(){
      this.issueDetail.show(new Marionette.Layout({ template: _.template('There are currently no active alarms') }));
    },

    onShow: function(){
      this.contentNavigation.show(this.issueNavigation);
    },

    getContactInfo: function(){
      // Maintenance contact info
      var that = this,
        defer = new $.Deferred();

      // If contact info hasn't been fetched yet, get it
      if (!this.contactInfo) {
        $.ajax({
          url: '/api/teams/contact',
          dataType: 'json',
          data: {
            team_id: this.options.org_team
          }
        }).done(function(contactInfo){
          // Set contact info
          that.contactInfo = new Backbone.Model(contactInfo);

          defer.resolve(that.contactInfo);
        });
      } else {
        defer.resolve(this.contactInfo);
      }

      // Return the deferred object for other methods to use
      return defer;
    },

    initialize: function(options){
      var that = this;

      Backbone.trigger('set:breadcrumbs', {state: 'issue', display_name: 'Issues'});

      // Set the project model to this layout's model
      this.model = options.model;

      // Instantiate devices collection view
      this.issueNavigation = new Issue.views.NavigationListView({collection: this.model.issues});

      var initialView = function(){
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
      };

      // Fetch issues and update view
      this.model.issues.fetch().done(function(data){
        initialView();
        Backbone.trigger('notification', data.alarms);
      });

      // Listen for a device to be clicked and change view
      this.listenTo(Backbone, 'click:issue', function(issue){
        that.selectIssue(issue);
      });
    }
  });
});
