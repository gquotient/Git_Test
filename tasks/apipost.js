var _ = require('lodash')
, request = require('request');

module.exports = function(grunt){

  grunt.registerMultiTask('apipost', 'Post data to an API', function(){
    var records = [],
      data = this.data,
      host = grunt.option('host') || this.data.host,
      done = this.async();

    this.filesSrc.forEach(function(filepath){
      if (grunt.file.exists(filepath)) {
        records = records.concat(grunt.file.readJSON(filepath));
      } else {
        grunt.log.warn('Source file "' + filepath + '" not found.');
      }
    });

    grunt.util.async.forEachSeries(records, function(record, callback){
      var path = _.isFunction(data.path) ? data.path(record) : data.path;

      path = path.replace(/:(\w+)(?=\/|$)/g, function(match, label){
        return record[label];
      });

      grunt.util.async.series([
        function(callback){
          if (data.del) {
            request({
              method: 'DELETE',
              uri: host + path
            }, function(err, resp, body){
              grunt.log.subhead('DEL: ' + host + path);

              if (err) {
                grunt.fail.fatal(err);
              } else if (resp.statusCode < 200 || resp.statusCode > 299) {
                grunt.log.error(resp.statusCode + '\n' + body);
              } else {
                grunt.log.ok(resp.statusCode);
              }

              callback();
            });
          } else {
            callback();
          }
        },
        function(callback){
          request({
            method: 'POST',
            uri: host + path,
            form: _.isFunction(data.form) ? data.form(record) : record
          },
          function(err, resp, body){
            grunt.log.subhead('POST: ' + host + path);

            if (err) {
              grunt.fail.fatal(err);
            } else if (resp.statusCode < 200 || resp.statusCode > 299) {
              grunt.log.error(resp.statusCode + '\n' + body);
            } else {
              grunt.log.ok(resp.statusCode);
            }

            callback();
          });
        }
      ], callback);

    }, done);

  });
};
