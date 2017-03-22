/*jshint esversion: 6 */

//Huzzahs

let PortGroupsCfg = require("./PortGroups.json");

let ips = [];
let ziele = [];

PortGroupsCfg.forEach((portGrp) => {
	portGrp.ziele.forEach((ziel) => {
		ips.push(ziel);
		ziele.push(require('artnet')({
			host: ziel,
			sendAll: true
		}));
	});
});

/*
const options = {
	host: ziel,
	sendAll: true
};

var artnet = require('artnet')(options);
*/



/*jshint esversion: 6*/
const dgram = require('dgram');

const udpSocket = dgram.createSocket({
	type: "udp4"
});

// 1 - 19 weis durchlauf von links nach rechts
// von rechts nach links und zurück

// vordefinierte farben
var black = [0, 0, 0];
var green = [0, 255, 0];
var blue = [0, 0, 255];
var red = [255, 0, 0];
var white = [255, 255, 255];

// schritte pro led
// 3 kanäle = 1 led (1,2,3), (4,5,6), (7,8,9)
var step = 3;

// erste led und letzte led
var start = 1 * step - 2;
var end = 28 * step - 2;

// aktuelle led ist zu begin start
var current = start;

function lauflicht() {

	ziele.forEach(ziel => {
		ziel.set(0, current, blue);
		ziel.set(1, current, black);
		ziel.set(2, current, black);
		ziel.set(3, current, red);
		ziel.set(4, current, black);
	});

	//gehe einen schritt weiter
	current += step;

	//setzte die nächste led auf dunkel -> pin 13
	for (let i = 0; i < 4; i++) {
		ziele.forEach(ziel => {
			ziel.set(0, current + step * i, black);
			ziel.set(1, current + step * i, green);
			ziel.set(2, current + step * i, red);
			ziel.set(3, current + step * i, white);
			ziel.set(4, current + step * i, blue);
		});
	}

	// current ist = 1+3*x  | 1 = 1,2,3 | 2 = 4,5,6 | 3 = 7,8,9
	console.log(`${(current+2)/3}`);

	// laufrichtung umkehren
	if (current <= start || current >= end) {
		step *= -1;
	}

}

function setArt() {

	ips.forEach(ip => {
		udpSocket.send("3", 0, "3".length, 1337, ip, (err) => {
			if (err)
				console.error(err);

			console.log("send: " + "3" + " an: " + ip);

		});
	});

}

class ArtNet {

	constructor() {
		this.setArtInterval;

		this.lauflichtInterval;

		this.running = false;
	}

	start() {
		if (!this.running) {

			setArt();

			this.setArtInterval = setInterval(setArt, 1000 * 5);

			//lauf licht
			this.lauflichtInterval = setInterval(lauflicht, 260);

			this.running = true;
		}
	}

	stop() {
		if (this.running) {
			//lauf licht
			clearInterval(this.lauflichtInterval);
			clearInterval(this.setArtInterval);
			this.setArtInterval = null;
			this.lauflichtInterval = null;
			this.blinkerInterval = null;
			this.running = false;
		}
	}

}

module.exports = new ArtNet();
