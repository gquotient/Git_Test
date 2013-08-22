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
    onShow: function(){
      this.editPortfolios.show(this.portfolioTable);
    },
    edit: function(portfolio){
      console.dir(portfolio);
      var editView;

      if (portfolio) {
        // display edit view
        editView = new Portfolio.views.SingleEdit({model: portfolio});
      } else {
        // display new view
        editView = new Portfolio.views.SingleEdit({model: new Portfolio.Model()});
      }

      this.editPortfolios.show(editView);

      // Update history
      Backbone.history.navigate('/admin/portfolios/' + portfolio.id);
      Backbone.trigger('set:breadcrumbs', {state:'portfolio', display_name: portfolio.get('display_name')});
    },
    initialize: function(options){
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
