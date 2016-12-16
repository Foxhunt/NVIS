//benötigte Module
var PortGroup = require("./PortGroup.js");

var PortGroupsCfg = require("./PortGroups.json");
var portGroups = [];


//TODO: snmp_collector -> NetLight -> PortGroups benutzen

class NetLight {

	constructor() {

		//mit den CFG-Objekten aus PortGroups.json PortGroup-Objekte erzeugen und speichern
		PortGroupsCfg.forEach((cfg) => {
			portGroups.push(new PortGroup(cfg));
		});

	}

	//startet die regelmäsige Abfrage
	start() {
		console.log("Starting SNMP collection on all PortGroups");
		portGroups.forEach((portGroup) => {
			portGroup.start();
		});
	}

	//stopt die regelmäsige Abfrage
	stop() {
		console.log("Stopping SNMP collection on all PortGroups");
		portGroups.forEach((portGroup) => {
			portGroup.stop();
		});
	}
}

module.exports = new NetLight();
