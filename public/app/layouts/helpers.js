define(
[
  'underscore',
  'handlebars'
],
function(
  _,
  Handlebars
){
  // Unit conversion
  var roundNumber = function(num, dec) {
    var result = (num !== null)?Math.round(num*Math.pow(10,dec))/Math.pow(10,dec):null;
    return result;
  };

  Handlebars.registerHelper('unitConversion', function(value, factor) {
    var factors = {
      M: 1000000,
      k: 1000
    };

    if (typeof factor === 'number') {
      // Arbitrary reduction
      // NOTE: this might not be useful
      return roundNumber((+value / factor), 1);
    } else {
      // Typical watt unit reduction
      return roundNumber((+value / factors[factor]), 1);
    }
  });

  Handlebars.registerHelper('percent', function(value, max){
    return value / max * 100;
  });

  Handlebars.registerHelper('equal', function(argLeft, argRight, options) {
    if (arguments.length < 3) {
      throw new Error('Handlebars Helper equal needs 2 parameters');
    }
    if (argLeft === argRight) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  Handlebars.registerHelper('admin_navigation', function(){
    var list = '';

    _.each(this.views, function(view, key){
      list += '<li class="'+ key +'"><a href="#'+ key +'">'+ view.title +'</a></li>'
    })
    return new Handlebars.SafeString(list);
  })

});
