require(['../public/app/modules/user', 'jquery'], function (user, $) {
  test( "property", function() {
    ok( user.name && user.name.length, "User name property" );
  });
  test( "property", function() {
    ok( user.get('name') && user.get('name').length, "User get method" );
  });
});