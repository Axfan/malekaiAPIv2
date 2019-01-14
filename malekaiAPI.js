//External Libraries
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

//Express Handler
const api = express();

//Express Configuration
require('dotenv').config();
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

// Sessions
const r = require('rethinkdbdash')({
  host: 'localhost',
  db: 'crowfallData',
});
const session = require('express-session');
const RDBStore = require('session-rethinkdb')(session);

const sessionStore = new RDBStore(r, {
	browserSessionsMaxAge: 60000, 
	clearInterval: 60000
});

api.use(session({
	secret: 'malekai',
	cookie: {
		maxAge: 600000
	},
	store: sessionStore,
	resave: true,
	saveUninitialized: false
}));



//load Malekai routes
let home = require('./routes/home');
let races = require('./routes/races');
let classes = require('./routes/classes');
let disciplines = require('./routes/disciplines');
let powers = require('./routes/powers');
let talents = require('./routes/talents');
let news = require('./routes/news');
let devtracker = require('./routes/devtracker');
let videos = require('./routes/videos');
let changelog = require('./routes/changelog');
let login = require('./routes/login');

//use Malekai routes
api.use('/', home);
api.use('/races', races);
api.use('/classes', classes);
api.use('/disciplines', disciplines);
api.use('/powers', powers);
api.use('/talents', talents);
api.use('/news', news);
api.use('/devtracker', devtracker);
api.use('/videos', videos);
api.use('/changelog', changelog);
api.use('/login', login);