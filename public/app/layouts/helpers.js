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


  /*
   * EDIT TABLE HEADERS
   */
  Handlebars.registerHelper('edit_table_header', function(){
    var header = '';
    _.each(this.attributes, function(val, key){
      header += '<th>' + val.title + '</th>';
    });
    return new Handlebars.SafeString(header);
  });

  /*
   * FORM ELEMENTS
   */
  var formElements = {
    text: function(name, value, model){
      return '<td><input id="' + name + '" name="' + name + '" type=text value="' + value + '"></td>';
    },
    select: function(name, value, model){
      var select = '<td><select id="org_' + name +'_type" name="'+name+'">';

      _.each(model.schema.attributes[name].options, function(val, key){
        var selected = val === value ? 'selected' : '';
        select += '<option value="' + val + '" ' + selected +'>'+val+'</option>';
      });

      select += '</select></td>';
      return select;
    }
  };

  /*
   * EDIT TABLE ROWS
   */
  Handlebars.registerHelper('edit_table_rows', function(){
    var that = this;
    var row = '';

    _.each(this.schema.attributes, function(val, key){
      row += formElements[ val.type ]( key, that[key], that );
    });

    return new Handlebars.SafeString(row);
  });

  /*
   * EDIT TABLE ROW ACTION BUTTONS
   */
  Handlebars.registerHelper('edit_action_buttons', function(){
    return new Handlebars.SafeString([
        '<button type="button" class="button save primary">Save</button>',
        '<button type="button" class="button edit">Edit</button>',
        '<button type="reset" class="button cancel">Cancel</button>'
      ].join('')
    );
  });

  /*
   * NEW TABLE ROW ACTION BUTTONS
   */
  Handlebars.registerHelper('new_action_buttons', function(){
    return new Handlebars.SafeString([
        '<button type="button" class="button create primary">Create</button>',
        '<button type="reset" class="button cancel">cancel</button>'
      ].join('')
    );
  });

});
