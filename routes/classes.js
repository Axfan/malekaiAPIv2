const express = require('express')
const router = express.Router()
const r = require('rethinkdbdash')({
  host: 'localhost',
  db: 'crowfallData',
});

// middleware that is specific to this router
router.use(function(req, res, next) {
    next();
});

let routeName = "classes", dbName = "classLibrary";

//malekai.org class route get handler
router.get('/', function (req, res) {
  //parameter cleanup and sanitizing
  let resultStart = parseInt(req.query.start, 10);
  if (isNaN(resultStart) || resultStart < 0) {
    resultStart = 0;
  }
  let resultLimit = parseInt(req.query.limit, 10);
  if (isNaN(resultLimit)){
    resultLimit = 50;
  } else if (resultLimit > 100) {
    resultLimit = 100;
  } else if (resultLimit < 25) {
    resultLimit = 25;
  }
  let retrieveAll = req.query.all && req.query.all.toLowerCase() == 'yes' ? true : false;

  //start request for all data route handler
  if(retrieveAll) {
    r.table(dbName)
    .orderBy('id')
    .run()
    .then(results => {
      let response;
      if(results.length > 0) {
        let processedData = results.map(data => {
          data.icon = `https://cdn.malekai.network/images/${routeName}/${data.id}.png`;
          data.icon_svg = `https://cdn.malekai.network/svgs/${routeName}/${data.id}.svg`;
          return data;
        })
        response = {
          results: processedData,
          nextPage: false,
          cursor: resultStart + resultLimit,
          limit: resultLimit
        };
        res.status(200).send(response);
      } else {
        res.status(404).send('An Error Occured. Ear Spiders were sent to notify the appropriate parties.');
      }
    })
    .catch( err =>{
      res.status(404).send('An Error Occured. Ear Spiders were sent to notify the appropriate parties.');
      console.error(err);
    })
    //end request for all data route handler

  } else {

    //start pagination route handler
    r.table(dbName)
    .orderBy('id')
    .skip(resultStart)
    .limit(resultLimit)
    .run()
    .then(results => {
      let response;
      if(results.length > 0) {
        let processedData = results.map(data => {
          data.icon = `https://cdn.malekai.network/images/${routeName}/${data.id}.png`;
          data.icon_svg = `https://cdn.malekai.network/svgs/${routeName}/${data.id}.svg`;
          return data;
        })
        if(results.length < resultLimit){
          response = {
            results: processedData,
            nextPage: false,
            cursor: resultStart + resultLimit,
            limit: resultLimit
          };
        } else {
          response = {
            results: processedData,
            nextPage: `https://api.malekai.org/${routeName}?start=${resultLimit + resultStart}&limit=${resultLimit}`,
            cursor: resultStart + resultLimit,
            limit: resultLimit
          };
        }
        res.status(200).send(response);
      } else {
        results.nextPage = false;
        res.status(404).send(results);
      }
    })
    .catch( err =>{
      res.status(404).send('An Error Occured. Ear Spiders were sent to notify the appropriate parties.');
      console.error(err);
    })
  }
  //end pagination route handler
})

//search route
router.get('/:id', function (req, res) {
  if(req.params.id) {
    let name = req.params.id.toLowerCase().replace(' ', '-');
    r.table(dbName)
    .filter({ id: name})
    .run()
    .then(results => {
      let response;
      if(results && results.length >= 1){
        let processedData = results.map(data => {
          data.icon = `https://cdn.malekai.network/images/${routeName}/${data.id}.png`;
          data.icon_svg = `https://cdn.malekai.network/svgs/${routeName}/${data.id}.svg`;
          return data;
        })
        response = {
          results: processedData
        };
        res.status(200).send(response);
      } else {
        res.status(404).send(`No results found for ${req.params.id}.`);
      }
    })
    .catch( err =>{
      res.status(404).send('An Error Occured. Ear Spiders were sent to notify the appropriate parties.');
      console.error(err);
    })
  }
});

module.exports = router;
