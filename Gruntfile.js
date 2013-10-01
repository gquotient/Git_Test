var clientInfo = require('./public/app/bower');

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

    requirejs: {
      std: {
        options: {
          baseUrl: '.',
          appDir: 'public/app',
          dir: 'public/build/' + clientInfo.version + '/app',

          mainConfigFile: 'public/app/config.js',

          modules: [
            {
              name: 'config',
              include: [
                'init'
              ],
              exclude: [
                'bower_components/requirejs/require',
                'paper'
              ]
            },
            {
              name: 'paper'
            }
          ],

          skipDirOptimize: true, // Only minifies modules in the build
          optimizeCss: 'none', //Stylus does this for us
          optimize: 'none' //Use for debugging
        }
      }
    },

    stylus: {
      compile: {
        options: {
          paths: ['public/css'],
          urlfunc: 'url'
        },
        files: [
          {
            expand: true,
            cwd: './public/css/',
            src: 'index.styl',
            dest: './public/build/' + clientInfo.version + '/css/',
            rename: function(src, dest){
              // Rename index file to have css extension
              return src + dest.split('.')[0] + '.css';
            }
          }
        ]
      }
    },

    copy: {
      main: {
        files: [
          {
            expand: true,
            cwd: './public/img/',
            src: '*',
            dest: './public/build/' + clientInfo.version + '/img/'
          }
        ]
      }
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
        del: true,
        src: 'data/json/equipment.json'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  // Compile Stylus
  grunt.loadNpmTasks('grunt-contrib-stylus');
  // Abstraction of fs
  grunt.loadNpmTasks('grunt-contrib-copy');
  // Compile js with r.js
  grunt.loadNpmTasks('grunt-requirejs');

  grunt.loadTasks('tasks');

  grunt.registerTask('dev', ['jshint', 'watch']);

  // Run build tasks
  grunt.registerTask('build', ['requirejs', 'stylus', 'copy']);

  // Post equipment.json data to equipment database.
  grunt.registerTask('postequip', function(){
    if (grunt.option('staging')) {
      grunt.option('host', 'http://equip.stage.intelligentarray.com');
    }

    grunt.task.run('apipost:equip');
  });
};
