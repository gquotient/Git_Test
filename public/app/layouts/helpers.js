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

  Handlebars.registerHelper('roundNumber', function(value, decimal) {
    return roundNumber(value, decimal);
  });

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

  Handlebars.registerHelper('percent', function(value, max, peak, floor){
    var percent = value / max * 100,
      result = (typeof peak === 'number') ?
                Math.min(percent, peak)
                :
                (typeof floor === 'number') ?
                  Math.max(percent, floor)
                  :
                  percent;

    // Returning 0 is probably not the best action, but it makes some things
    // look less messed up for now
    return (!isNaN(result)) ? result : 0;
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
      list += '<li class="'+ key +'"><a href="#'+ key +'">'+ view.title +'</a></li>';
    });
    return new Handlebars.SafeString(list);
  });

  Handlebars.registerHelper('team_select', function(teamsJSON, currentTeam){

    var teams = JSON.parse(teamsJSON);
    if (teams.length === 1){ return teams[0][2]; }

    var retSelect = '<select>';
    _.each(teams, function(team){
      var selected = '';
      if (team[0] === currentTeam){
        selected = 'selected';
      }
      retSelect += '<option value='+team[0]+ ' ' + selected + '>'+team[2]+'</option>';
    });

    retSelect+='</select>';

    return retSelect;
  });

  Handlebars.registerHelper('date', function(epoch){
    var date = new Date(epoch * 1000);

    return date.toDateString();
  });

});
