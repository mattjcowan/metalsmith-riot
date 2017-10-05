var glob = require('glob')
var fs = require('fs')
var path = require('path')
var debug = require('debug')('metalsmith:riot')
var sanitizeHtml = require('sanitize-html')

/**
 * Expose the `plugin`.
 */

module.exports = plugin

/**
 * A Metalsmith plugin to take a directory of tag files
 * and compile them using the riot compiler, and render
 * tag instances of those compiled tags inside html files
 *
 * @param {Object} opts
 * @return {Function}
 */

function plugin (opts) {
  opts = opts || {}
  var dir = opts.directory
  var settings = opts.settings
  var sanitize = opts.sanitize

  /*
    * Fix for resolving local path
    * @param {Metalsmith} metalsmith The metalsmith instance
    * @returns The absolute path including initial globbing pattern
    */
  function resolvePath (metalsmith) {
    var globStart = false // Indicator, if globbing pattern was found yet
    var cwd = metalsmith.directory() // Get Metalsmith working directory
    var subPath = []
    var pattern = []
    var directory = dir.split('/')
    directory.forEach(function parsePathElems (elem) {
      if (globStart || elem.search(/[^a-z0-9.\-_]/gi) >= 0) { // Search in current path segment for glob patterns
        globStart = true // If true, set globStart to true
        return pattern.push(elem) // add to pattern now and in future automatically
      }
      return subPath.push(elem)
    })

    // Now check if calculated path is existing (absolute vs relative position to Metalsmith CWD)
    var localPath = path.resolve(cwd, subPath.join('/')) // Assume path is relative to CWD, e.g. ./src/*.json
    if (!fs.existsSync(path.resolve(cwd, localPath))) {
      localPath = path.relative(cwd, subPath.join('/')) // Assumption false, it was absolute, e.g. ./test/fixtures/...
    }

    return path.resolve(cwd, localPath, pattern.join('/')) // return correct path
  }

  return function (files, metalsmith, done) {
    var metadata = metalsmith.metadata()

    debug('Metalsmith riot')

    setImmediate(done)

    // normalize base directories
    if (Array.isArray(dir)) {
      dir = dir.map(function (d) { return resolvePath(d) })
    } else {
      dir = [ resolvePath(metalsmith) ] // Get previously calculated correct path
    }

    // require in all the tags
    var riot = require('riot')
    if (settings) Object.assign(riot.settings, settings)

    // create a global mixin with the global metadata
    // riot.mixin({ metadata: metadata })

    var tags = []
    dir.forEach(function (d) {
      var tagFiles = glob.sync(d)
      tagFiles.forEach(function (tf) {
        var tag = require(tf)
        tags.push(tag)
      })
    })
    debug('Found tags', tags)

    Object.keys(files).forEach(function (file, index) {
      if (!isHtml(file)) return
      var data = files[file]

      riot.mixin({ metadata: Object.assign({}, data, metadata) })

      var contents = data.contents.toString()

      // DOCTYPEs are imbalanced tags for riot, so we need to strip them out and add them back in after parsing
      var preHtml = ''
      var htmlIdx = contents.indexOf('<html', 0)
      if (htmlIdx > 0) {
        preHtml = contents.substring(0, htmlIdx)
        contents = contents.substring(htmlIdx)
      }

      var fileTagName = 'file-' + index
      if (sanitize) {
        contents = sanitizeHtml(contents, {
          // allow all tags & attributes
          allowedTags: false,
          allowedAttributes: false
        })
      }
      var fileTag = riot.tag(fileTagName, contents)
      var fileHtml = riot.render(fileTag)
      files[file].contents = preHtml + fileHtml.substring(fileTagName.length + 2, fileHtml.length - (fileTagName.length + 3))
    })
  }
}

/**
 * Check if a `file` is html.
 *
 * @param {String} file
 * @return {Boolean}
 */

function isHtml (file) {
  return /\.html?/.test(path.extname(file))
}
