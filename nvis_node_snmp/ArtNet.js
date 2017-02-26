/*jshint esversion: 6 */

const options = {
	host: '192.168.0.22',
	sendAll: true
};

var artnet = require('artnet')(options);


//Huzzah
var ziel = "192.168.0.22";

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
var color = [255, 255, 255];

var f = 3;
var color1 = [green[0] / f, green[1] / f, green[2] / f];
var color2 = [color1[0] / f, color1[1] / f, color1[2] / f];
var color3 = [color2[0] / f, color2[1] / f, color2[2] / f];
var color4 = [color3[0] / f, color3[1] / f, color3[2] / f];
var color5 = [color4[0] / f, color4[1] / f, color4[2] / f];

// schritte pro led
// 3 kanäle = 1 led (1,2,3), (4,5,6), (7,8,9)
var step = 3;

// erste led und letzte led
var start = 1 * step - 2;
var end = 19 * step - 2;

// aktuelle led ist zu begin start
var current = start;

//schritte zum dimmen des lichts
var incrL = -5;


/*
universum -> pin

pin 13: laufende dunkle LED
pin 14: laufende helle LED
*/

function lauflicht() {

	//setzte die aktuelle led auf blau -> pin 13
	artnet.set(13, current, blue);

	//setzte die aktuelle led auf dunkel -> pin 14
	//if (step > 0) {
	artnet.set(14, current, black);
	//artnet.set(14, 19 * Math.abs(step) - 1 - current, black);
	//}

	// dimme lichter
	//color[0] += incrL;
	//color[1] += incrL;
	//color[2] += incrL;

	//blue[2] += incrL;
	green[1] += incrL;
	//red[0] += incrL;

	//gehe einen schritt weiter
	current += step;

	//setzte die nächste led auf dunkel -> pin 13
	artnet.set(13, current, black);

	//setzte die nächste led auf hell -> pin 14
	artnet.set(14, current, green);
	//artnet.set(14, current - step, color1);
	//artnet.set(14, current - step*2, color2);
	//artnet.set(14, current - step*3, color3);
	//artnet.set(14, current - step*4, color3);
	//artnet.set(14, current - step*5, color3);

	//artnet.set(14, 19 * Math.abs(step) - 1 - current, red);

	// current ist = 1+3*x  | 1 = 1,2,3 | 2 = 4,5,6 | 3 = 7,8,9
	console.log(`${(current+2)/3} \t ${color}`);
	//console.log((current + 2) / 3, (19 * Math.abs(step) + 1 - current) / 3);

	// laufrichtung umkehren
	if (current <= start || current >= end) {
		step *= -1;
	}

	// dimmer umdrehen
	if (color[0] <= 0 || color[0] >= 255) {
		incrL *= -1;
	}

}





var blinker = 1 * step - 2;
var blinkerColor = [20, 20, 20];
var incr = 1;

//setInterval(blink, 6);

function blink() {

	blinkerColor[0] += incr;
	blinkerColor[1] += incr;
	blinkerColor[2] += incr;

	for(let i = 1; i <= 19 * step - 2; i += 3)
		artnet.set(14, i, blinkerColor);

	if (blinkerColor[0] <= 10 || blinkerColor[0] >= 150) {
		incr *= -1;
	}

	//console.log(incr, blinkerColor);

}

function setArt(){

	udpSocket.send("3", 0, "3".length, 1337, ziel, (err) => {
		if (err)
			console.error(err);

		console.log("send: " + "3" + " an: " + ziel);

	});

}

class ArtNet {

	constructor() {
		this.artInterval;
		this.lauflichtInterval;
		this.blinkerInterval;
		this.running = false;
	}

	start() {
		if (!this.running) {

			setArt();

			this.artInterval = setInterval(setArt, 1000 * 5);

			//lauf licht
			this.lauflichtInterval = setInterval(lauflicht, 120);
			//this.blinkerInterval = setInterval(blink, 20);
			this.running = true;
		}
	}

	stop() {
		if (this.running) {
			//lauf licht
			clearInterval(this.lauflichtInterval);
			clearInterval(this.blinkerInterval);
			clearInterval(this.artInterval);
			this.artInterval = null;
			this.lauflichtInterval = null;
			this.blinkerInterval = null;
			this.running = false;
		}
	}

}

module.exports = new ArtNet();
