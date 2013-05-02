define(
[
  'underscore',
  'handlebars'
],
function(
  _,
  Handlebars
){

  /*
   * EDIT TABLE HEADERS
   */
  Handlebars.registerHelper('edit_table_header', function(){
    var header = '';
    var that = this;
    _.each(this.fields, function(field){
      var attr = that.schema.attributes[field]
      header += '<th>' + attr.title + '</th>';
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

    _.each(this.fields, function(field){
      var attr = that.schema.attributes[field]
      row += formElements[ attr.type ]( field, that[field], that );
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