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
	res.send("Hallo! <br> <a href=\"/nvis/start\">Start</a> <br> <a href=\"/nvis/stop\">Stop</a>");
});

//starte das SNMP sammeln
router.get('/start', (req, res) => {

	snmpCollector.start();

	res.send("Started! <br> <a href=\"stop\">Stop</a> again!");
});

//stoppe das SNMP sammeln
router.get('/stop', (req, res) => {

	snmpCollector.stop();

	res.send("Stoped! <br> <a href=\"start\">Start</a> again!");
});

//app router benutzen lassen
app.use('/nvis', router);


//app auf port lauschen lassen
app.listen(port, () => {
	console.log('app listening on port ' + port);
});
