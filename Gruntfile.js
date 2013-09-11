/*global module:false*/
module.exports = function(grunt){

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      files: [
        'public/app/**/*.js',
        '!public/app/bower_components/**/*.js'
      ]
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },

    apipost: {
      equip: {
        host: 'http://127.0.0.1:8600',
        path: function(record){
          var label = record.equipment_label.replace(/_(v\d+)$/, '/$1');

          return '/api/equipment/' + label;
        },
        form: function(record){
          return {data: JSON.stringify(record)};
        },
        src: 'data/json/equipment.json'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadTasks('tasks');

  grunt.registerTask('dev', ['jshint', 'watch']);
};
