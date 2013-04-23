/*global module:false*/
module.exports = function(grunt){

  var children = [],
    util = require('util'),
    cp = require('child_process');

  grunt.event.on('services.add', function(cmd, args){

    var child = cp.spawn(cmd, args);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', function(data){
      grunt.log.write(data);
    });

    child.stderr.on('data', function(data){
      grunt.log.write(data);
    });

    child.on('close', function(code){
      if (code !== 0){
        grunt.warn("Done, with errors.");
      }
    });

    children.push(child);
  });

  grunt.event.on('services.kill', function(){
    grunt.log.ok('\nstopping services');

    children.forEach(function(child){
      child.kill('SIGHUP');
    });

    children = [];
  });

  grunt.registerTask('serve', 'Start front end server with auth', function(){
    var done = this.async();

    grunt.event.emit('services.add', '/bin/sh', ['-c', 'bin/auth_service.sh']);
    grunt.event.emit('services.add', process.argv[0], ['server.js']);

    process.on('SIGINT', function(){
      grunt.event.emit('services.kill');
      done();
    });
  });
};
