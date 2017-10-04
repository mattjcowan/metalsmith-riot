/* eslint no-template-curly-in-string: "off" */
var Metalsmith = require('metalsmith')
var dir = require('node-dir')
var fs = require('fs-extra')
var pretty = require('pretty')
var equal = require('assert-dir-equal')
var renderRiotTags = require('..')

describe('metalsmith-riot', function () {
  it('should convert riot tags', function (done) {
    Metalsmith('spec/fixture')
      .use(renderRiotTags({
        directory: 'spec/tags/**/*.tag',
        sanitize: true, // set this to false and you get an 'unbalanced tag' error from simple-dom.js
        settings: {
          brackets: '${ }' // if you remove this setting, the 'html-with-brackets.html' file will not be able to be rendered and will break the metalsmith flow
        }
      }))
      .build(function (err) {
        if (err) return done(err)
        // pretty expected and built files so that we're comparing apples and apples
        dir.files('spec/fixture/expected', {sync: true}).forEach(f => {
          fs.writeFileSync(f, pretty(fs.readFileSync(f, 'utf8'), {ocd: true}))
        })
        dir.files('spec/fixture/build', {sync: true}).forEach(f => {
          fs.writeFileSync(f, pretty(fs.readFileSync(f, 'utf8'), {ocd: true}))
        })
        equal('spec/fixture/expected', 'spec/fixture/build')
        done()
      })
  })
})
