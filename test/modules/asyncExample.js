asyncTest( "dependency loading", function(){
  require(['underscore'], function(_){
    ok(true, 'underscore loaded');
    start();
  });
});