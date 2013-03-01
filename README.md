Front End Application Structure
=================================

Requirements
------------

* Node.js (> 0.8.0) && NPM (comes with later versions of Node)
* Redis

### OSX
Download and install the package from http://nodejs.org/

Install homebrew (http://crosstown.coolestguyplanettech.com/os-x/40-setting-up-os-x-lion-to-plug-into-homebrew-package-manager)

Install Redis: `brew install redis`

### Ubuntu

Install node:

    sudo add-apt-repository ppa:chris-lea/node.js
    sudo apt-get update
    sudo apt-get install <package name>

Install Redis: `apt-get install redis`


To install
----------

For now, install Bower package manager globally: `npm install -g bower`. We may want to make this a local asset.

From your project root folder, install the server dependencies: `npm install`.

Then, install browser dependencies: `cd public && bower install`.


To run
------

From your project root folder, run `$ node server.js` to start the server. Default port is set to 3005.

Testing (Optional)
------------------

`cd test && bower install`

Testing can happen manually in the browser or in your terminal with phantomjs. PhantomJS can be installed in Ubuntu with `apt-get install phantomjs` or OSX with `brew install phantomjs` and the node/mocha to phantomjs bridge with `npm install -g mocha-phantomjs`.

### Browser
Point browser to /test/index.html

### Terminal/PhantomJS
`mocha-phantomjs index.html`


TODO
----

X Flash messages
* Login
  X Wrong password
  - Password reset/Forgot password // Once we actual store passwords.
  X redirect from /login to /index if authenticated already
  X Logout
