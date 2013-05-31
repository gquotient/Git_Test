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
      var attr = that.schema.attributes[field];
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

  var actionButtons = {
    edit: '<button type="button" class="button edit">Edit</button>',
    cancel: '<button type="reset" class="button cancel">Cancel</button>',
    save: '<button type="button" class="button save primary">Save</button>',
    resetPassword: '<button type=button class="button reset_password">Reset Password</button>',
    detail: '<button type=button class="button detail">Detail</button>'
  };

  /*
   * EDIT TABLE ROWS
   */
  Handlebars.registerHelper('edit_table_rows', function(){
    var row = '';

    _.each(this.fields, function(field){
      var attr = this.schema.attributes[field];
      row += formElements[ attr.type ]( field, this[field], this );
    }, this);

    return new Handlebars.SafeString(row);
  });

  /*
   * EDIT TABLE ROW ACTION BUTTONS
   */
  Handlebars.registerHelper('edit_action_buttons', function(){

    var cell = '<td>';

    _.each(this.actions, function(action){
      cell += actionButtons[action];
    });

    cell += '</td>';

    return new Handlebars.SafeString(cell);
  });

  /*
   * NEW TABLE ROW ACTION BUTTONS
   */
  Handlebars.registerHelper('new_action_buttons', function(){
    return new Handlebars.SafeString([
        '<button type="reset" class="button cancel">Cancel</button>',
        '<button type="button" class="button create primary">Create</button>'
      ].join('')
    );
  });

});
