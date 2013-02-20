asyncTest( "dependency loading", function(){
  require(['underscore'], function(_){
    console.log(_);
    ok(true, 'underscore loaded');
    start();

  });
});