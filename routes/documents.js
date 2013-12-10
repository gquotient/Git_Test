var fs = require('fs'),
  _ = require('lodash'),
  multiparty = require('multiparty'),
  FormData = require('form-data'),
  request = require('request');

module.exports = function(app){

  function parseMultipart(req, res, next){
    var form = new multiparty.Form();

    form.parse(req, function(err, fields, files){
      if (err) {
        req.flash('error', err.message);
        console.log('error!:', err);
        return res.send(500, err.message);
      }

      req.body = _.mapValues(fields, function(v){ return _.first(v); });
      req.files = _.flatten(_.values(files), true);

      next();
    });
  }

  function translateBody(body){
    var portfolio_id = body.portfolio_id,
      project_label = body.project_label,
      graph_key = body.graph_key,
      docinfo = portfolio_id || project_label || graph_key;

    // Generate a body that matches the model service and remove empty fields.
    return _.pick({
      doctype: docinfo === portfolio_id ? 'portfolio' :
               docinfo === project_label ? 'project' :
               docinfo === graph_key ? 'device' :
               body.doctype,
      docinfo: docinfo,
      docinfo2: body.docinfo2,
      category: body.category,
      filename: body.filename
    }, _.identity);
  }

  function requestMultipart(options, callback){
    var form = new FormData();

    // Add all of the form fields to the form.
    _.each(options.form, function(v, k){ form.append(k, v); });

    // And remove them from options.
    options = _.omit(options, 'form');

    // Calculate the length.
    form.getLength(function(err, len){
      if (err) {
        return callback(err);
      }

      // Make the request.
      request(options, callback)

      // Set the content length of the form since it isn't done automatically.
      .setHeader('Content-Length', len)

      // Overwrite the form object with the one already created.
      ._form = form;
    });
  }

  app.post('/api/documents/:id?', parseMultipart, function(req, res, next){
    var form = translateBody(req.body),
      file = _.first(req.files);

    if (file) {
      form.docfile = fs.createReadStream(file.path);
      form.filename = form.filename || file.originalFilename;
    }

    if (req.params.doc_id) {
      form.doc_id = req.params.doc_id;
    }

    requestMultipart({
      method: 'POST',
      uri: app.get('modelUrl') + '/res/document',
      headers: {
        currentUser: req.user.email
      },
      form: form
    }, function(err, resp, body){
      // Remove all uploaded files once the request is complete.
      _.each(req.files, function(f){ fs.unlink(f.path); });

      if (err) {
        req.flash('error', err.message);
        console.log('error!:', err);
        return res.send(500, err.message);
      }

      res.send(resp.statusCode, body);
    });
  });

};
