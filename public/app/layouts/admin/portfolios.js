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
      console.log('edit', portfolio);
      var editView;

      if (portfolio) {
        // display edit view
        editView = new Portfolio.views.SingleEdit({model: portfolio});

        // Update history
        Backbone.history.navigate('/admin/portfolios/' + portfolio.id);
        Backbone.trigger('set:breadcrumbs', {state: 'portfolioEdit', display_name: portfolio.get('display_name')});
      } else {
        // display new view
        editView = new Portfolio.views.SingleEdit({model: new Portfolio.Model()});

        // Update history
        Backbone.history.navigate('/admin/portfolios/new');
        Backbone.trigger('set:breadcrumbs', {state: 'portfolioEdit', display_name: 'New'});
      }

      this.editPortfolios.show(editView);

      this.listenTo(editView, 'cancel', function(){
        this.editPortfolios.show(this.portfolioTable);
        Backbone.history.navigate('/admin/portfolios');
        Backbone.trigger('set:breadcrumbs', {state:'portfolios', display_name:'Portfolios'});
      });
    },
    initialize: function(options){
      console.log('init portfolios admin');
      // Update breadcrumbs
      Backbone.trigger('reset:breadcrumbs', {
        state:'admin',
        display_name: 'Admin'
      });

      Backbone.trigger('set:breadcrumbs', {state:'portfolios', display_name:'Portfolios'});

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

      // Update history
      Backbone.history.navigate('/admin/portfolios');
    }
  });

});
