//benötigte Module
var snmpCollector = require("./snmp_collector.js");

snmpCollector.start();

setTimeout(() => {
	//snmpCollector.stop();
}, 1000 * 120);
