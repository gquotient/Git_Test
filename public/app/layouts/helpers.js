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

  Handlebars.registerHelper('edit_table_header', function(){
    var header = ''
    console.log(this);
    _.each(this, function(val, key){
      header += '<th>' + val + '</th>'
    })
    console.log(header);
    return new Handlebars.SafeString(header);
  })

  Handlebars.registerHelper('edit_table_row', function(){
    var that = this;
    var row = '';
    _.each(this.schema.attributes, function(val, key){
      row += '<td><input id="' + key + '" name="' + key + '" type=text value="' + that[key] + '"></td>'
    })
    return new Handlebars.SafeString(row);
  });

  Handlebars.registerHelper('action_buttons', function(){
    return new Handlebars.SafeString(
      ['<button type="button" class="button save primary">Save</button>',
      '<button type="button" class="button edit">Edit</button>',
      '<button type="reset" class="button">Reset</button>'].join()
    );
  })
    
});