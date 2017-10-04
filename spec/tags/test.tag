<test>
  <span class="${ active: isActive }" data-awe="${fn(isActive)}">${ text }</span>
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
  