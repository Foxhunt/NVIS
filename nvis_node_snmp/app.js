//benötigte Module
const netLight = require("./NetLight.js");

const bodyParser = require("body-parser");
const express = require("express");
const app = express();

//aktueller Modus
var modus;

//port für den Webserver
var port = process.env.PORT || 8080;

//router für nvis-API calls
var nvisRouter = express.Router();

//router für modus-API calls
var modusRouter = express.Router();

// grüße an den besucher
modusRouter.post('/set', (req, res) => {

	if(req.body.modus && modus !== req.body.modus){

		//TODO: modus wechseln

		modus = req.body.modus;
		console.log('changed Modus to: ' + modus);
	}

	res.redirect('/');

});

modusRouter.get('/get', (req, res) => {
	res.send({modus : modus});
});

//neuen port hinzufügen
nvisRouter.post('/addPortGroup', (req, res) => {

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
nvisRouter.get('/start', (req, res) => {

	netLight.start();

	res.redirect("/");
});

//stoppe das SNMP sammeln
nvisRouter.get('/stop', (req, res) => {

	netLight.stop();

	res.redirect("/");
});

//stoppe das SNMP sammeln
nvisRouter.get('/save', (req, res) => {

	netLight.saveConfig();

	res.redirect("/");
});


//req.body objekt zur ferfügung stellen
app.use(bodyParser.urlencoded({ extended: true }));
//router benutzen
app.use(express.static('public'));
app.use('/nvis', nvisRouter);
app.use('/modus', modusRouter);

//app auf port lauschen lassen
app.listen(port, () => {
	console.log('app listening on port ' + port);
	netLight.start();
	modus = "NetLight";
});
