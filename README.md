# metalsmith-riot
A Metalsmith plugin to render riot tags in your html

## Installation

```shell
npm install mattjcowan/metalsmith-riot
```

## Usage

```js
var Metalsmith = require("metalsmith")
var riotTags = require("metalmsith-riot")

Metalsmith(__dirname)
  // ... once html files are available
  .use(riotTags({ directory: 'tags/**/*.tag' }))
  // ...
```

### Metadata

File and global metadata can be accessed using a 'metadata' property inside your Riot tags, for example:

```html
<my-tag>
    <span>{ title }</span>

    <script>
        this.title = this.metadata.title || 'No title available'
    </script>
</my-tag>
```

## Options

The plugin accepts a hash of options:

### directory (required)

A glob pattern of *.tag files that should be included for Riot 
to render and recognize while parsing the html

```js
{
  directory: 'path/to/directory/with/tag/files/**/*.tag'
}
```

**MUST** end with *.tag (as the current riot engine only supports *.tag file rendering on the server)

### sanitize (optional)

If the html is not valid or has unbalanced tags, simple-dom (a library used by Riot) is going to choke. Set this value to 'true' to attempt to get rid of any issues related to unbalanced html elements.

```js
{
  sanitize: true
}
```

### settings (optional)

If your html for example has a lot of brackets in it {{ and }}, then riot will 
try to interpret these as expressions. You may therefore want to customize the
[riot settings](http://riotjs.com/api/misc/).

```js
{
  settings: {
    brackets: '${ }'
  }
}
```

## Full example

### Tag file

Sample file **test.tag**:

```html
<test>
  <span class="{ active: isActive }" data-awe="{fn(isActive)}">{ text }</span>
  <yield/>

  <style scoped>
  .span { color: blue; }
  </style>
  
  <script>
    var _ = require('lodash')

    var self = this

    this.text = 'this is text'
    this.isActive = this.opts.active === 'true'

    this.fn = function (a) {
      return _.upperCase(a ? 'awesome' : 'not-awesome')
    }
  </script>
</test>
```

Features demonstrated in this tag:
- Binding to a simple 'text' property
- Binding to an 'active' property passed into the tag as an html attribute
- Running a function 'fn' during the render process
- Nesting of tags and yielding content blocks
- Using external libraries with 'require' inside script tags

### HTML sample input

```html
<html>

<head></head>

<body>
    <section>
        <div data-is="test" active="false">WITH SOME CONTENT</div>
        <div data-is="test" active="true"></div>
        <test active="true">MORE CONTENT</test>
        <test active="false">
            <test active="true">MORE CONTENT</test>
        </test>
    </section>
</body>

</html>
```

### HTML sample output

```html
<html>

<head></head>

<body>
    <section>
        <div data-is="test" active="false">
            <span data-awe="NOT AWESOME">this is text</span>
            WITH SOME CONTENT
        </div>
        <div data-is="test" active="true">
            <span class="active" data-awe="AWESOME">this is text</span>
        </div>
        <test active="true">
            <span class="active" data-awe="AWESOME">this is text</span>
            MORE CONTENT
        </test>
        <test active="false">
            <span data-awe="NOT AWESOME">this is text</span>
            <test active="true">
                <span class="active" data-awe="AWESOME">this is text</span> 
                MORE CONTENT
            </test>
        </test>
    </section>
</body>

</html>
```   

## Not Supported at this time

*PRs are welcome!*

The following are not supported at this time.

- Async rendering (for example, making an AJAX request during the render process)
- Style elements are not processed and will not appear in the final html
- Script elements are used for rendering and binding of content at runtime during render, but do not appear in final html
- Lifecycle hooks intended for the DOM inside script tags are ignored (i.e.: '.on()' methods)