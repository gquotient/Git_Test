Pertinent files/folders
=======================

[/public/app/modules](https://github.com/drakerlabs/FrontEnd/tree/master/public/app/modules) contain all of the models for the Backbone app.

[/public/config.js](https://github.com/drakerlabs/FrontEnd/blob/master/public/config.js) is responisble for configuring paths to modules for Backbone.

[/public/app/layouts/admin.js](https://github.com/drakerlabs/FrontEnd/blob/master/public/app/layouts/admin.js) builds the administration page in the browser.

[routes.js](https://github.com/drakerlabs/FrontEnd/blob/master/routes.js) is responsible for taking a request from the browser and making a request to the model service and send the response back to the browser.

Creating a module
=================

1. Create a folder in the [/public/app/modules](https://github.com/drakerlabs/FrontEnd/tree/master/public/app/modules) folder for the module you are creating. For example: [/public/app/modules/team](https://github.com/drakerlabs/FrontEnd/tree/master/public/app/modules/team)
2. Create a javascript file of the same name as the folder. For example: [/public/app/modules/team/team.js](https://github.com/drakerlabs/FrontEnd/blob/master/public/app/modules/team/team.js)
3. Use the [/public/app/modules/team/team.js](https://github.com/drakerlabs/FrontEnd/blob/master/public/app/modules/team/team.js) file as a template for the new module. Replace occurances of *Team* with *YourModuleName*.
4. Update the [schema definition](https://github.com/drakerlabs/FrontEnd/blob/master/public/app/modules/team/team.js#L24) to reflect the attributes of the model that you'd like to be editable.
5. Update the [fields list](https://github.com/drakerlabs/FrontEnd/blob/master/public/app/modules/team/team.js#L41) for the EditTable view to expose which fields listed in the schema are editable in the admin page.

Configure the paths to the module
=================================

1. In the [/public/config.js](https://github.com/drakerlabs/FrontEnd/blob/master/public/config.js) file, duplicate [these lines](https://github.com/drakerlabs/FrontEnd/blob/master/public/config.js#L53-L57) and replace *team* with *youModuleName*.

Update the admin layout
=======================

1. In [/public/app/layouts/admin.js](https://github.com/drakerlabs/FrontEnd/blob/master/public/app/layouts/admin.js) add *'yourModuleName'* as a dependency after the other module on [lines 7-9](https://github.com/drakerlabs/FrontEnd/blob/master/public/app/layouts/admin.js#L7-L9).
2. Pass *YourModule* in after the other module on (lines 18-20)[https://github.com/drakerlabs/FrontEnd/blob/master/public/app/layouts/admin.js#L18-L20].
3. Add *'yourModule'* to the [config.views object](https://github.com/drakerlabs/FrontEnd/blob/master/public/app/layouts/admin.js#L18-L20) using *'teams'* as a template.

Add routes
==========

1. In [routes.js](https://github.com/drakerlabs/FrontEnd/blob/master/routes.js) use the [user API routes](https://github.com/drakerlabs/FrontEnd/blob/master/routes.js#L227-L258) as a template for adding the routes the new module.
2. If the data from the model service needs to be transformed before sending to the browser/Backbone, *makeRequest* accepts a second argument which is a transformation function (for example: the [teams GET method](https://github.com/drakerlabs/FrontEnd/blob/master/routes.js#L218-L220)).

Cross fingers
=============