var _ = require("lodash")
  , fs = require('fs');

/*
Portfolio:

{
  id: 78
  name: "Portfolio 1",
  subPorfolios: [1,2,3,...],
  projects: []
}
*/

/*
Portfolios gotta have projects.
*/

/*
Project:

{
  id: 23
  name: "Project X",
  kpis: {
    dc_capacity: 1235,
    ac_capacity: 1156,
    power_now: 34
  }
}
*/

function generateProject(){
  var id = _.random(1000);
  var dc_capacity = _.random(1000,3000);
  var project = {
    id: id,
    name: "Project " + id,
    kpis: {
      dc_capacity: dc_capacity,
      ac_capacity: dc_capacity - _.random(100, 300),
      power_now: _.random(100)
    },
    belongsTo: []
  };

  return project;
}

function generatePortfolio(projects){
  var id = _.random(1000);
  var portfolio = {
    id: id,
    name: "Portfolio " + id,
    subPortfolios: [],
    superPortfolios: [],
    projects: []
  };

  // Random number of SubPortfolios per Portfolio.
  var numberOfProjects = _.random(projects.length - 10);
  _.times(numberOfProjects, function(){
    var project = projects[ _.random(numberOfProjects - 1) ];
    if ( !_.contains(portfolio.projects, project.id) ){
      portfolio.projects.push(project.id);
      project.belongsTo.push(portfolio.id);
    }
  });

  return portfolio;
}

function generateProjects(num) {
  var projects = [];

  _.times(num, function(){
    projects.push( generateProject() );
  });

  return projects;
}

function isntSuper(portfolio, subPortfolio){

}

function generatePortfolios(num){
  var projects = generateProjects(num*3);
  var portfolios = [];

  // Generate *num* number of portfolios into the porftolios array.
  _.times(num, function(){
    portfolios.push( generatePortfolio(projects) );
  });

  // Loop through the portfolios array and add subportfolios.
  var numberOfPortfolios = portfolios.length;

  _.each(portfolios, function(portfolio){
    // Random number of SubPortfolios per Portfolio.
    var numberOfSubPortfolios = _.random(3);
    _.times(numberOfSubPortfolios, function(){
      var subPortfolio = portfolios[ _.random(numberOfPortfolios - 1) ];
      if ( !_.contains(subPortfolio.subPortfolios, portfolio.id) && subPortfolio.id !== portfolio.id && !_.contains(portfolio.subPortfolios, subPortfolio.id)){
        portfolio.subPortfolios.push(subPortfolio.id);
        subPortfolio.superPortfolios.push(portfolio.id);
      }
    });

  });

  return {portfolios: portfolios, projects: projects};
}

if(require.main === module) {
    var num = process.argv.slice(2);
    var portfoliosAndProjects = generatePortfolios(num);
    var portfolios = portfoliosAndProjects.portfolios;
    var projects = portfoliosAndProjects.projects;
    fs.writeFile("./json/portfolios.json", JSON.stringify( portfolios, null, 2 ), function(err) {
      if(err) {
          console.log(err);
      } else {
          console.log("The file was saved!");
      }
    });
    fs.writeFile("./json/projects.json", JSON.stringify( projects, null, 2 ), function(err) {
      if(err) {
          console.log(err);
      } else {
          console.log("The file was saved!");
      }
    }); 
} else { 
  module.exports = generatePortfolios;
}



