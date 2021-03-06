/*
 * grunt-rollup
 * https://github.com/chrisprice/grunt-rollup
 *
 * Copyright (c) 2015 Chris Price
 * Licensed under the MIT license.
 */

'use strict';

var Promise = require('promise');
var rollup = require('rollup-babel');
var path = require('path');

module.exports = function(grunt) {

  grunt.registerMultiTask('rollup-babel', 'Grunt plugin for rollup-babel - next-generation ES6 module bundler', function() {

    var done = this.async();

    var options = this.options({
      external: [],
      format: 'es6',
      exports: 'auto',
      moduleId: null,
      moduleName: null,
      globals: {},
      indent: true,
      useStrict: true,
      banner: null,
      footer: null,
      sourceMap: false,
      sourceMapFile: null,
      sourceMapRelativePaths: false,
      babel: true
    });

    var promises = this.files.map(function(f) {

      if (f.src.length === 0) {
        grunt.fail.warn('No entry point specified.');
      }

      if (f.src.length > 1) {
        grunt.fail.warn('Multiple entry points are not supported.');
      }

      var entry = f.src[0];

      if (!grunt.file.exists(entry)) {
        grunt.fail.warn('Entry point "' + entry + '" not found.');
      }

      return rollup.rollup({
        entry: entry,
        external: options.external,
        babel: {
          sourceMap: !!options.sourceMap
        }
      }).then(function(bundle) {

        var sourceMapFile = options.sourceMapFile;
        if (!sourceMapFile && options.sourceMapRelativePaths) {
          sourceMapFile = path.resolve(f.dest);
        }

        var result = bundle.generate({
          format: options.format,
          exports: options.exports,
          moduleId: options.moduleId,
          moduleName: options.moduleName,
          globals: options.globals,
          indent: options.indent,
          useStrict: options.useStrict,
          banner: options.banner,
          footer: options.footer,
          sourceMap: options.sourceMap,
          sourceMapFile: sourceMapFile
        });

        var code = result.code;

        if (options.sourceMap === true) {
          var sourceMapOutPath = f.dest + '.map';
          grunt.file.write(sourceMapOutPath, result.map.toString());
          code += "\n//# sourceMappingURL=" + path.basename(sourceMapOutPath);
        } else if (options.sourceMap === "inline") {
          code += "\n//# sourceMappingURL=" + result.map.toUrl();
        }

        grunt.file.write(f.dest, code);
      });
    });

    Promise.all(promises)
      .then(function() {
        done();
      })
      .catch(function(error) {
        grunt.fail.warn(error);
      });
  });

};
