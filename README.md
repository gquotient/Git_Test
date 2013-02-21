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

Testing can happen manually in the browser or terminal with phantomjs (https://github.com/metaskills/mocha-phantomjs). PhantomJS can be installed in Ubuntu with `npm install -g mocha-phantomjs`.

### Browser
Point browser to /test/index.html

### Terminal/PhantomJS
`mocha-phantomjs index.html`