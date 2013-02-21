define(
  [],
  function(){

    var ia = {
      root: '/',
      views: {}
    }; // Can we contain this without attaching to window?

    console.log("Hooray! We have an app.", ia);

    //Compile primary templates
    // ia.views.index = Handlebars.compile($('#index').html());
    // ia.views.login = Handlebars.compile($('#login').html());

    return ia;
})