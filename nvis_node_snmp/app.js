//benötigte Module
const netLight = require("./NetLight.js");

const bodyParser = require("body-parser");
const express = require("express");
const app = express();

//port für den Webserver
var port = process.env.PORT || 8080;

//router für API calls
var nvis = express.Router();

// grüße an den besucher
nvis.post('/', (req, res) => {
	console.log(req.body.modus);
	res.redirect("/");
});

//neuen port hinzufügen
nvis.post('/addPortGroup', (req, res) => {

	let cfg = {}
	cfg.beschreibung = req.body.beschreibung;
	cfg.quelle = req.body.quelle;
	cfg.ports = req.body.ports.split(",");
	cfg.ports.forEach((s, i, a) => {
		a[i] = parseInt(s.trim());
	});
	cfg.community = req.body.community;
	cfg.ziele = req.body.ziele.split(",");
	cfg.ziele.forEach((s, i, a) => {
		a[i] = s.trim();
	});
	cfg.intervalTime = parseInt(req.body.intervalTime);

	console.log(cfg);


	res.redirect('/');
});

//starte das SNMP sammeln
nvis.get('/start', (req, res) => {

	netLight.start();

	res.redirect("/");
});

//stoppe das SNMP sammeln
nvis.get('/stop', (req, res) => {

	netLight.stop();

	res.redirect("/");
});

//stoppe das SNMP sammeln
nvis.get('/save', (req, res) => {

	netLight.saveConfig();

	res.redirect("/");
});

//app router benutzen lassen
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(express.static('public'));
app.use('/nvis', nvis);

//app auf port lauschen lassen
app.listen(port, () => {
	console.log('app listening on port ' + port);
	netLight.start();
});
