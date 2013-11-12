# IA6 Front End App

![Take my money](http://images.memegenerator.net/instances/200x/39664343.jpg)

## Setting up a development environment

* Install redis

```
# Ubuntu using apt-get
$ sudo apt-get install redis-server
```

```
# OSX using homebrew http://brew.sh
$ brew install redis
```

* Install nvm

```
$ curl https://raw.github.com/creationix/nvm/master/install.sh | sh
```

* Install node v0.10 and set as default

```
$ nvm install 0.10 && nvm alias default 0.10 && nvm use 0.10
```

* Install global node packages

```
$ npm install -g bower grunt-cli
```

* Install local node packages

```
# From the root directory of this repo
$ npm install
```

* Install client packages using bower

```
# From the root directory of this repo
$ (cd public/app && bower install)
```

* Run the server

```
# Using remote services
$ NODE_ENV=development-remote node server.js
```

```
# Using local services
$ NODE_ENV=development node server.js
```

* Login to the [app](http://127.0.0.1:3005) using your email and default password "Draker321"


## Setting up local services

* Install and run the [AuthService](https://github.com/drakerlabs/AuthService), [ModelService](https://github.com/drakerlabs/ModelService) and [EquipmentService](https://github.com/drakerlabs/EquipmentService)

* Add the client app to the AuthService

```
$ python AuthService/auth_service/manage.py add_client_app IA6 0.1
```

* Add your organization to the ModelService

```
$ python ModelService/model_service/manage.py create_org -o vendor DRAKER Draker
```

* Add yourself as a vendor admin for the organization

```
$ python ModelService/model_service/manage.py add_person DRAKER "your.email@drakerenergy.com" "Your Name"
$ python ModelService/model_service/manage.py make_person_an_admin DRAKER "your.email@drakerenergy.com"
$ python ModelService/model_service/manage.py push_persons
```

* Add portfolios to the organization teams

```
$ python ModelService/model_service/manage.py create_portfolio -d DRAKER ALL "All Projects" "has(n.label)"
$ python ModelService/model_service/manage.py create_portfolio -d DRAKER ADMIN "All Projects" "has(n.label)"
```

* Add the base equipment to the EquipmentService

```
$ grunt postequip
```


## Developing code

* Please keep the code clean by using `grunt jshint` before any commit
