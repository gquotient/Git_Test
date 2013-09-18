define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'ia',

  'portfolio',
  'form',

  'hbs!layouts/admin/templates/portfolios'
], function(
  _,
  $,
  Backbone,
  Marionette,
  Handlebars,

  ia,

  Portfolio,
  Forms,

  portfoliosTemplate
){

  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: portfoliosTemplate
    },
    regions: {
      editPortfolios: '.editPortfolios'
    },
    events: {
      'click .add': function(){
        this.edit();
      }
    },
    onShow: function(){
      this.editPortfolios.show(this.portfolioTable);
    },
    edit: function(portfolio){
      // Create a new portfolio if none was passed
      var model = portfolio || new Portfolio.Model();
      var editView;

      if (!model.isNew()) {
        // Update history
        Backbone.history.navigate('/admin/portfolios/' + portfolio.id);
        Backbone.trigger('set:breadcrumbs', {state: 'portfolioEdit', display_name: portfolio.get('display_name')});
      } else {
        // Update history
        Backbone.history.navigate('/admin/portfolios/new');
        Backbone.trigger('set:breadcrumbs', {state: 'portfolioEdit', display_name: 'New'});
      }

      // Instantiate and show edit view
      editView = new Portfolio.views.SingleEdit({
        model: model,
        portfolios: this.options.collection
      });

      this.editPortfolios.show(editView);

      // On cancel just return to the primary portfolios admin view
      this.listenTo(editView, 'cancel', function(){
        this.editPortfolios.show(this.portfolioTable);
        Backbone.history.navigate('/admin/portfolios');
        Backbone.trigger('set:breadcrumbs', {state:'portfolios', display_name:'Portfolios'});
      });

      this.listenTo(model, 'sync', function(){
        // Update the portfolio collection
        this.options.collection.add(model);

        // Update bread crumbs and url to the new model
        Backbone.history.navigate('/admin/portfolios/' + model.id);
        Backbone.trigger('set:breadcrumbs', {state: 'portfolioEdit', display_name: model.get('display_name')});
      }, this);
    },
    initialize: function(options){
      // Cache portfolio table
      this.portfolioTable = new Portfolio.views.EditTable({
        collection: this.options.collection,
        itemView: Forms.views.tableRow.extend({// Hijack item view edit
          onEdit: function(){return this;}
        })
      });

      // Listen for edit event from table
      this.listenTo(this.portfolioTable, 'itemview:edit', function(itemView){
        this.edit(itemView.model);
      });
    }
  });

});
