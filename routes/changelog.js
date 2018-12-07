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

let routeName = "changelog", dbName = "changeLog";

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
    .orderBy(r.desc('changedate'))
    .run()
    .then(results => {
      let response;
      if(results.length > 0) {
        response = {
          results: results,
          nextPage: false,
          retrievedAll: true
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
    .filter({ data_type: "news" })
    .orderBy(r.desc('date'))
    .skip(resultStart)
    .limit(resultLimit)
    .run()
    .then(results => {
      let response;
      if(results.length > 0) {
        if(results.length < resultLimit){
          response = {
            results: results,
            nextPage: false,
            cursor: resultStart + resultLimit,
            limit: resultLimit
          };
        } else {
          response = {
            results: results,
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

module.exports = router;
