const express = require('express')
const router = express.Router();
const fetch = require('node-fetch');
const btoa = require('btoa');

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const redirect = encodeURIComponent(process.env.DISCORD_REDIRECT);

// middleware that is specific to this router
router.use(function(req, res, next) {
    next();
});

router.get('/', function (req, res) {
	res.redirect(`https://discordapp.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify&response_type=code&redirect_uri=${redirect}`);
});

router.get('/callback', async function(req, res) {
	if (!req.query.code) res.status(400).send({
		status: 'ERROR',
		error: 'NoCodeReturned'
	});

	const code = req.query.code;
	const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
	const tokenResponse = await fetch(`https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${redirect}`,
		{
			method: 'POST',
			headers: {
				Authorization: `Basic ${credentials}`
			}
		}).catch( err => {
			res.status(404).send('An Error Occured. Ear Spiders were sent to notify the appropriate parties.');
		    console.error(err);
		});
	const tokenJSON = await tokenResponse.json();
	const userResponse = await fetch('https://discordapp.com/api/users/@me', 
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${tokenJSON.access_token}`
			}
		}).catch( err => {
			res.status(404).send('An Error Occured. Ear Spiders were sent to notify the appropriate parties.');
		    console.error(err);
		});
	req.session.user = await userResponse.json();
	req.session.save();
	// Redirect placeholder
	res.redirect('https://malekai.org/')
});	

module.exports = router;