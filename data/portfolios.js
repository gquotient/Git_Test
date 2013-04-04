var _ = require("lodash")
  , fs = require('fs');

/*
  Generator:
  Step 1 - Generate Projects
  Step 2 - Generate (Sub)Portfolios (assigning projects to portfolios)
  Step 3 - Generate Portfolios containing Subportfolios
*/


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
  var status = function(){
    var myStatus = ['OK', 'Warn', 'Alert'];

    return myStatus[_.random(0, 2)];
  }
  var project = {
    id: id,
    name: "Project " + id,
    kpis: {
      dc_capacity: dc_capacity,
      ac_capacity: dc_capacity - _.random(100, 300),
      irradiance_now: _.random(1000),
      power_now: _.random(100)
    },
    latLong: [_.random(-60, 60), _.random(-180,180)],
    belongsTo: [],
    status: status()
  };

  return project;
}

function generatePortfolio(projects){
  var id = _.random(1000);
  var portfolio = {
    id: id,
    name: "Portfolio " + id,
    subPortfolioIDs: [],
    superPortfolioIDs: [],
    projectIDs: []
  };

  // Random number of SubPortfolios per Portfolio.
  var numberOfProjects = _.random(projects.length);
  _.times(numberOfProjects, function(){
    var project = projects[ _.random(numberOfProjects - 1) ];
    if ( !_.contains(portfolio.projectIDs, project.id) ){
      portfolio.projectIDs.push(project.id);
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
  var subportfolios = [];
  var portfolios = [];

  // Generate *num/2* number of portfolios into the subportfolios array.
  _.times(num/2, function(){
    subportfolios.push( generatePortfolio(projects) );
  });

  // Generate *num/2* number of portfolios into the main portfolios array.
  _.times(num/2, function(){
    portfolios.push( generatePortfolio([]) );
  });


  // Loop through the portfolios array and add subportfolios.
  var numberOfSubPortfolios = subportfolios.length;

  _.each(portfolios, function(portfolio){
    // Random number of SubPortfolios per Portfolio.
    var numberOfSubPortfolios = _.random(3);
    _.times(numberOfSubPortfolios, function(){
      var subPortfolio = subportfolios[ _.random(numberOfSubPortfolios - 1) ];
      if ( !_.contains(portfolio.subPortfolioIDs, subPortfolio.id) ){
        portfolio.subPortfolioIDs.push(subPortfolio.id);
        subPortfolio.superPortfolioIDs.push(portfolio.id);
      }
    });

  });

  portfolios = portfolios.concat(subportfolios);

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
