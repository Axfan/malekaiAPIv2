const fs =  require('fs');
const path = require('path');
const jsonfile = require('jsonfile');
const r = require('rethinkdbdash')({
  host: 'localhost',
  db: 'crowfallData',
});
const git = require('simple-git')();

var db = null;
const bufferSize = 99;

function db_init () { 
	return new Promise((resolve, reject) => {
		r.dbList().then(async result => {
			if (result.indexOf('crowfallData') < 0) await r.dbCreate('crowfallData').run().then(a => console.log('Created database crowfallData!'));
			db = r.db('crowfallData');

			resolve();
		});
	});
}

async function db_syncTables () {
	const tableNames = await db.tableList().run();
	var files = fs.readdirSync('./crowfall-data/data');
	for (file of files) {
		if (!tableNames.includes(`${file}Library`)) await db.tableCreate(`${file}Library`).run().then(a => console.log(`Created table ${file}Library`));
	}
}

function db_getTable (table) { 
	return db.table(`${table}Library`);
}

function db_run (action) {
	return action.run();
}

async function loadDir (dir, ids, data_type) {
	let tbl = null;
	// if we are given a data type, sort out the table
	if (data_type) {
		tbl = db_getTable(data_type);
		if (!tbl) { console.error(`Couldn't find table "${data_type}"!`); return; }

		if (!(ids[data_type] instanceof Array)) {
			console.log('== Loading Data Type ' + data_type);
			ids[data_type] = [];
		}
		// otherwise we are just loading the directory
	} else console.log('=== Loading directory "' + dir + '"');

	const buffer = [];

	const loadBuffer = async () => {
		await db_run(tbl.insert(buffer, { conflict: 'replace', returnChanges: true })).then(res => {

			for (const change of res.changes) {
				if (change.old_val) {
					console.log('~ Replaced ' + change.new_val.data_type + ' ' + change.new_val.name);
				} else {
					console.log('+ Added ' + change.new_val.data_type + ' ' + change.new_val.name);
				}
			}
		});
		buffer.length = 0;
	};

	for (const file of fs.readdirSync(dir)) {
		const p = path.join(dir, file);

		// if the path is another directory, load it (recursive function).
		// "file" which is the new directory is the new data_type as well.
		if (fs.lstatSync(p).isDirectory()) await loadDir(p, ids, data_type || file);
		else if (data_type) {
			const json = jsonfile.readFileSync(p);
			const basename = path.basename(p);
			json.id = basename.substr(0, basename.length - 5);
			ids[data_type].push(json.id);
			json.data_type = data_type;

			buffer.push(json);
			if(buffer.length > bufferSize) await loadBuffer();
		} // if we don't have a data_type, don't load the files -- only the directories
	}
	if (buffer.length) await loadBuffer();
}

function LoadCrowfallData () {
	return new Promise((resolve, reject) => {
		console.log('== Fetching data...');
		const loadingLogic = async(error, _) => {
			if(error) { reject(error); return; }

			const ids = {};

			try {
				// create tables if they do not already exist
				await db_syncTables();
				// load all the data
				await loadDir('./crowfall-data/data', ids);
				// filter the data to remove anything no longer in the git repo
				console.log('=== Filtering data...');
				for(const key in ids) if (ids[key] instanceof Array) {

				const tbl = db_getTable(key);
				if(!tbl) { console.error('Couldn\'t find table for data_type ' + key + '!'); continue; }
					const col = r.expr(ids[key]);
				  // removed deleted objects
					await db_run(tbl.filter(doc => r.not(col.contains(doc('id')))).delete({ returnChanges: true })).then(val => {
						if (val.changes) for (const v of val.changes)
							console.log('- Removed ' + v.old_val.data_type + ' ' + v.old_val.name);
					});
				}

				resolve();
				return;
			} catch (e) {
				reject(e);
				return;
			}
		};

		if (!fs.existsSync('crowfall-data')) {
			git.clone('https://github.com/MalekaiProject/crowfall-data', './crowfall-data', null, loadingLogic);
		} else {
			git.cwd('./crowfall-data').reset('hard', (err) => {
				if (err) { console.error(err); reject(); return; }
				git.pull(loadingLogic);
			});
		}
	});
}

console.log('== Initializing DB...');
db_init()
  .then(() => LoadCrowfallData())
  .then(d => { console.log('Done loading!'); process.exit(); })
  .catch(e => { console.error(e); process.exit(); });

