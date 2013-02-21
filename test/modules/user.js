describe('User Model', function(){
  describe('#properties', function(){
    it('should have a name', function(done){
      require(['app/modules/user'], function (user) {
        assert(true, user.name && user.name.length);
        assert(true, user.get('name') && user.get('name').length);
        done();
      });
    });
  });
});
