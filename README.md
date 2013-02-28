Front End Application Structure
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

Testing can happen manually in the browser or in your terminal with phantomjs. PhantomJS can be installed in Ubuntu with `apt-get install phantomjs` or OSX with `brew install phantomjs` and the node/mocha to phantomjs bridge with `npm install -g mocha-phantomjs`.

### Browser
Point browser to /test/index.html

### Terminal/PhantomJS
`mocha-phantomjs index.html`


TODO
----

* Flash messages
* Login
  X Wrong password
  - Password reset/Forgot password // Once we actual store passwords.
  X redirect from /login to /index if authenticated already
  X Logout
