module.exports = function(app){
  require('./routes/root')(app);
  require('./routes/alarms')(app);
  require('./routes/data')(app);
  require('./routes/devices')(app);
  require('./routes/helpers')(app);
  require('./routes/organizations')(app);
  require('./routes/portfolios')(app);
  require('./routes/projects')(app);
  require('./routes/session')(app);
  require('./routes/specs')(app);
  require('./routes/teams')(app);
  require('./routes/user')(app);
};
