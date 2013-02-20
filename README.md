FrontEndWayOfTheFutureAwesomeness
=================================

Requirements
------------

Node.js (> 0.8.0)
NPM (comes with later versions of Node)
Bower (twitter.github.com/bower)


To install
----------

npm install

cd public && bower install


To run
------

$ node app.js

Testing
-------

`cd test && bower install`

Testing can happen manually in the browser or terminal with phantomjs (http://phantomjs.org/). PhantomJS can be installed in Ubuntu with `apt-get install phantomjs`.

### Browser
Point browser to /test/index.html

### Terminal/PhantomJS
`phantomjs run-qunit.js index.html`