define([
	'jquery',
	'underscore',
	'backbone',
	'backbone.marionette'
],
function(
	$,
	_,
	Backbone,
	Marionette
){
	var Error = { views: {} };

	Error.model = Backbone.Model.extend({});

	Error.views.floating = Marionette.itemView.extend({});
});