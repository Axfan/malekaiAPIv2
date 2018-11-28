//External Libraries
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

//Express Handler
const api = express();

//Express Configuration
const port = 7077; //api.malekai.org addy
const ip = '0.0.0.0';
api.listen(port, ip);
api.set('trust proxy', 1);
console.log(`Starting API in the ${process.env.NODE_ENV || 'development(?)'} environment at ${ip}:${port}!`);

//Express Security Configuration
api.use(cors({ origin: '*', methods: 'GET,POST' }));
api.use(compression());
api.use(helmet());
api.use(helmet.referrerPolicy({
  policy: 'no-referrer-when-downgrade'
}));
api.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"]
  }
}))

//load Malekai routes
let home = require('./routes/home');
let races = require('./routes/races');
let classes = require('./routes/classes');

//use Malekai routes
api.use('/', home);
api.use('/races', races);
api.use('/classes', classes);
