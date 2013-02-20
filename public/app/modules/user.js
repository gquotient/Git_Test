define(['jquery'], function($){
  return {
    name: 'Justin',
    organization: 'Draker',
    get: function(property) {
      return this[property];
    }
  };
});