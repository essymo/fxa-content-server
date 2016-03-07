/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var url = require('url');

module.exports = function (grunt) {
  function normalizeSriDirectives(sriDirectives) {
    var normalized = {};

    Object.keys(sriDirectives).forEach(function (key) {
      var cleanedKey = key.replace(/@?dist/, '');
      normalized[cleanedKey] = sriDirectives[key];
    });

    return normalized;
  }

  function updateHtmlWithSriAttributes(directives, html) {
    return html.replace(/(?:src|href)="([^"]*)"/gi, function (match, resourceUrl) {
      var parsedUrl = url.parse(resourceUrl);
      var directive = directives[parsedUrl.pathname];
      if (directive) {
        return match + ' integrity="' + directive.integrity + '" crossorigin="anonymous"' ;
      }

      return match;
    });
  }

  function updateSrcWithSriAttributes(directives, src) {
    var html = grunt.file.read(src);

    var htmlWithIntegrity = updateHtmlWithSriAttributes(directives, html);

    if (html !== htmlWithIntegrity) {
      grunt.log.writeln('Adding SRI directives to', src);
      grunt.file.write(src, htmlWithIntegrity);
    }
  }

  grunt.registerMultiTask('sri-update-src', 'Update built resources with SRI tags', function () {
    // open each HTML file
    // look for src, href
    // look up url in sri table
    // if url in sri table, insert integrity tag
    // write HTML file if any changes to file

    var options = this.options({});
    var sriDirectives = normalizeSriDirectives(grunt.file.readJSON(options.src));

    this.filesSrc.forEach(
      updateSrcWithSriAttributes.bind(null, sriDirectives));
  });

  grunt.config('sri-update-src', {
    options: {
      src: '<%= yeoman.tmp %>/sri-directives.json'
    },
    dist: { //eslint-disable-line sorting/sort-object-props
      src: [
        '<%= yeoman.page_template_dist %>/**/*.html'
      ]
    }
  });

  grunt.config('sri', {
    options: {
      algorithms: [ 'sha512' ],
      dest: '<%= yeoman.tmp %>/sri-directives.json'
    },
    dist: { //eslint-disable-line sorting/sort-object-props
      src: [
        '<%= yeoman.dist %>/**/*.css',
        '<%= yeoman.dist %>/**/*.js',
      ]
    }
  });

  grunt.registerTask('sriify', 'Add SRI integrity attributes to static resources', function () {

    grunt.task.run('sri', 'sri-update-src');
  });
};