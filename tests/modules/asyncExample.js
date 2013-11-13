describe('Load Dependency', function(){
  describe('#require()', function(){
    it('should load jquery', function(done){
      require(['jquery'], function($){
        assert(true, true);
        done();
      });
    });
  });
});
