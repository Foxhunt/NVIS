//benötigte Module
const netLight = require("./NetLight");
const staticLight = require("./StaticLight");
const artNet = require("./ArtNet");

const bodyParser = require("body-parser");
const express = require("express");
const app = express();

//aktueller Modus
var modus;
var runnigMode;

//port für den Webserver
var port = process.env.PORT || 8080;


//router für modus-API calls
var modusRouter = express.Router();

//route zum setzten der Modi
modusRouter.post('/set', (req, res) => {

	if (req.body.modus && modus !== req.body.modus) {

		//TODO: modus wechseln

		modus = req.body.modus;

		switchMode(modus);

		console.log('changed Modus to: ' + modus);
	}

	res.redirect('/');

});

//route zum erfahren der Modi
modusRouter.get('/get', (req, res) => {
	res.send({
		modus: modus
	});
});

//starte das SNMP sammeln
modusRouter.get('/start', (req, res) => {

	if (!runnigMode.running) {

		runnigMode.start();

	}

	res.redirect("/");
});

//stoppe das SNMP sammeln
modusRouter.get('/stop', (req, res) => {

	if (runnigMode.running) {

		runnigMode.stop();

	}

	res.redirect("/");
});


//router für StaticLight-API calls
var staticLightRouter = express.Router();

staticLightRouter.post('/setColor', (req, res) => {

	staticLight.color = req.body.color;

	runnigMode.start();

	res.redirect('/');

});


staticLightRouter.get('/getColor', (req, res) => {
	res.send({
		color: staticLight.color
	})
});



//router für nvis-API calls
var nvisRouter = express.Router();

//Route um neuen port hinzuzufügen
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
	cfg.snmpGetIntervalTime = parseInt(req.body.snmpGetIntervalTime);

	console.log(cfg);

	//portGruppe hinzufügen
	netLight.addPortGroup(cfg);

	res.redirect('/');
});

//Speichere die aktuelle PortGruppen Konfiguration
nvisRouter.get('/save', (req, res) => {

	netLight.saveConfig();

	res.redirect("/");
});


//req.body objekt zur ferfügung stellen
app.use(bodyParser.urlencoded({
	extended: true
}));

//router benutzen
app.use(express.static(__dirname + '/public'));
app.use('/nvis', nvisRouter);
app.use('/modus', modusRouter);
app.use('/staticLight', staticLightRouter);

//app auf port lauschen lassen
app.listen(port, () => {
	console.log('app listening on port ' + port);
	modus = "NetLight";
	switchMode(modus);
});

function switchMode(modus) {
	switch (modus) {
	case "NetLight":
		if (runnigMode)
			runnigMode.stop();
		runnigMode = netLight;
		runnigMode.start();
		break;
	case "StaticLight":
		if (runnigMode)
			runnigMode.stop();
		runnigMode = staticLight;
		runnigMode.start();
		break;
	case "ArtNet":
		if (runnigMode)
			runnigMode.stop();
		runnigMode = artNet;
		runnigMode.start();
		break;
	default:
		if (runnigMode)
			runnigMode.stop();
		break;
	}
}
