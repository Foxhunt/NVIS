//benötigte Module
const snmpCollector = require("./snmp_collector.js");
const express = require("express");
const app = express();

//port für den Webserver
var port = process.env.PORT || 8080;

//router für API calls
var router = express.Router();

// grüße an den besucher
router.get('/', (req, res) => {
	res.send("Hallo!");
});

//starte das SNMP sammeln
router.get('/start', (req, res) => {
	snmpCollector.start();
	res.send("Start!");
});

//stoppe das SNMP sammeln
router.get('/stop', (req, res) => {
	snmpCollector.stop();
	res.send("Stop!");
});

//app router benutzen lassen
app.use('/nvis', router);


//app auf port lauschen lassen
app.listen(port, () => {
	console.log('app listening on port ' + port);
});
