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
	res.sendFile(__dirname + "/public/index.html");
});

//starte das SNMP sammeln
router.post('/start', (req, res) => {

	snmpCollector.start();

	res.redirect("/");
});

//stoppe das SNMP sammeln
router.post('/stop', (req, res) => {

	snmpCollector.stop();

	res.redirect("/");
});

//app router benutzen lassen
app.use(express.static('public'));
app.use('/nvis', router);

//app auf port lauschen lassen
app.listen(port, () => {
	console.log('app listening on port ' + port);
	snmpCollector.start();
});
