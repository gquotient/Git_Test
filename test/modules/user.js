require(['app/modules/user'], function (user) {
  describe('User Model', function(){
    describe('#properties', function(){
      it('should have a name', function(done){
        assert(user.name && user.name.length);
        done();
      });
      it('should have an organization', function(done){
        assert(user.organization && user.organization.length);
        done();
      });
    });
    describe('#getMethod', function(){
      it('method should return property', function(done){
        assert(user.get('name') && user.get('name').length);
        done();
      });
    });
  });
});