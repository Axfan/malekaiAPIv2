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

// define the home page route
router.get('/', function (req, res) {
  r.table('classLibrary')
  .run()
  .then(results => {
    if(results.length > 0) {
      res.status(200).send(results);
    } else {
      res.status(404).send('An Error Occured. Ear Spiders were sent to notify the appropriate parties.');
    }
  })
  .catch( err =>{
    res.status(404).send('An Error Occured. Ear Spiders were sent to notify the appropriate parties.');
    console.error(err);
  })
})
module.exports = router;

/*
apiurl/route?page=1&limit=15
// parseInt attempts to parse the value to an integer
// it returns a special "NaN" value when it is Not a Number.
var page = parseInt(req.query.page, 10);
if (isNaN(page) || page < 1) {
  page = 1;
}

var limit = parseInt(req.query.limit, 10);
if (isNaN(limit)) {
  limit = 50;
} else if (limit > 100) {
  limit = 100;
} else if (limit < 25) {
  limit = 25;
}
*/
