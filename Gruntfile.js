module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-babel')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-exec')

  grunt.initConfig({
    clean: ['dist'],

    watch: {
      src: {
        files: ['src/**/*'],
        tasks: ['default']
      }
    },

    copy: {
      src: {
        cwd: 'src',
        expand: true,
        src: ['**/*'],
        dest: 'dist'
      }
    },

    babel: {
      src: {
        files: [{
          cwd: 'src',
          src: ['**/*.js'],
          expand: true,
          dest: 'dist'
        }]
      }
    },
    
    exec: {
      jasmine: {
        cmd: 'node_modules/jasmine/bin/jasmine.js'
      }
    }
  })

  grunt.registerTask('test', 'exec:jasmine')
  grunt.registerTask('default', ['clean', 'copy', 'babel'])
}
