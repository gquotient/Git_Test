define(
[
  'underscore',
  'handlebars'
],
function(
  _,
  Handlebars
){

  Handlebars.registerHelper('prettyColumnName', function(name) {
    var columnNames = {
      ac_power_mean: 'AC Power'
    };

    return columnNames[name] || name;
  });

  return Handlebars.helpers;
});
