require(['../public/app/modules/user', 'jquery'], function (user, $) {
  test( "property", function() {
    ok( user.name.length, "Passed!" );
  });
  test( "property", function() {
    ok( user.get('name').length, "Passed!" );
  });
});