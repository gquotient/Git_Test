define(
[
  'handlebars'
],
function(
  Handlebars
){
  // Unit conversion
  var roundNumber = function(num, dec) {
    var result = (num !== null)?Math.round(num*Math.pow(10,dec))/Math.pow(10,dec):null;
    return result;
  };

  Handlebars.registerHelper('tokW', function(value) {
    return roundNumber((+value / 1000), 1);
  });

  Handlebars.registerHelper('toMW', function(value) {
    return roundNumber((+value / 1000000), 2);
  });

  Handlebars.registerHelper('percent', function(value, max){
    return value/max * 100;
  });
});