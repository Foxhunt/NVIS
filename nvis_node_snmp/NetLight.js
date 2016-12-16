//benötigte Module
let fs = require("fs");

let PortGroup = require("./PortGroup.js");

let PortGroupsCfg = require("./PortGroups.json");
let portGroups = [];


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

	//erzeugt ein json File aus portGroups in
	//dem die PortGruppen als cfg objekte abgelegt sind
	saveConfig() {
		fs.writeFile('./data.json', JSON.stringify(portGroups, ["beschreibung", "quelle", "ports", "community", "ziele", "intervalTime"], 4), 'utf-8', err => {
			if (err)
				console.error(err);
		});
	}

	//erzeigt ein neues PortGroup-Objekt und fügt sie den bestehenden hinzu
	//
	addPortGroup(cfg) {
		portGroups.push(new PortGroup(cfg));
	}



}

module.exports = new NetLight();
