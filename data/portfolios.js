var _ = require("lodash")
  , fs = require('fs');

/* 
{
  id: 78
  name: "Test Portfolio 1",
  subPorfolios: [1,2,3,...],
  kpis: {
    dc_capacity: 1235,
    ac_capacity: 1156,
    power_now: 34
  }
}
*/

function generatePortfolio(){
  var portfolio = {
    id: _.random(1000),
    name: "Test Portfolio " + this.id,
    subPortfolios: [],
    superPortfolios: [],
    kpis: {
      dc_capacity: _.random(1000,3000),
      ac_capacity: _.random(800, 2800),
      power_now: _.random(100)
    }
  };

  return portfolio;
}

function generatePortfolios(num){
  var portfolios = [];

  // Generate *num* number of portfolios into the porftolios array.
  _.times(num, function(){
    portfolios.push( generatePortfolio() );
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
      }
    });

  });

  return portfolios;
}

if(require.main === module) { 
    var num = process.argv.slice(2);
    var portfolios = generatePortfolios(num);
    fs.writeFile("./json/portfolios.json", JSON.stringify( portfolios, null, 2 ), function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }
  }); 
} else { 
  module.exports = generatePortfolios;
}



