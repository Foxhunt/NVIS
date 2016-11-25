//benötigte Module
var snmp = require("net-snmp");
var dgram = require("dgram");
var fs = require("fs");
var ports = require(__dirname + "/ports.json");

const pi2 = Math.PI * 2;

var udpSocket = dgram.createSocket("udp4");

class snmp_collector {

	constructor() {

		//zeitintervall in dem die OIDs abgefragt werden
		this.interval = 13;

		// Länge des betrachteten zeitfensters in minuten
		this.window = 1;

		//intervall für das regelmäsige abfragen der oids
		this.collectionInterval;
	}

	//startet die regelmäsige Abfrage
	start() {

		console.log("started SNMP-Collection.");

		this.collectionInterval = setInterval(() => {

			console.log("reading values");

			ports.forEach(this.getValues, this);

		}, 1000 * this.interval);

	}

	//stopt die regelmäsige Abfrage
	stop() {

		console.log("stopped SNMP-Collection.")

		clearInterval(this.collectionInterval);
	}

	// fragt die oids eines ports ab
	getValues(port, index, portAry) {

		//session für die snmp-Abfrage
		let session = snmp.createSession(port.quelle, port.comunity);

		//maxima des betrachteten zeitraums ermitteln
		//absteigend sortieren und das erste element auswählen
		let maxSpeed = port.maxSpeed.concat().sort(this.srtDesc)[0];
		let maxPktSize = port.maxPktSize.concat().sort(this.srtDesc)[0];
		let maxPPs = port.maxPPS.concat().sort(this.srtDesc)[0];

		//array für die abgefragten OIDs
		let oids = [];
		oids.push(port.speed);
		oids.push(port.octIn);
		oids.push(port.octOut);
		oids.push(port.pktsIn);
		oids.push(port.pktsOut);

		//abfragen der oids
		session.get(oids, (error, varbinds) => {
			if (error) { // fehler abfangen
				console.error(error);
			} else {

				for (var i = 0; i < varbinds.length; i++)
					if (snmp.isVarbindError(varbinds[i]))
						console.error(snmp.varbindError(varbinds[i]));

					//SNMP Counter speichern
				let octIn = varbinds[1].value;
				let octOut = varbinds[2].value;
				let pktsIn = varbinds[3].value;
				let pktsOut = varbinds[4].value;

				//nur deltas bilden wenn last Werte vorhanden sind
				if (port.lastOctIn != 0) {

					//Deltas bilden
					let octInDelta = this.delta(port.lastOctIn, octIn);
					let octOutDelta = this.delta(port.lastOctOut, octOut);
					let pktsInDelta = this.delta(port.lastPktsIn, pktsIn);
					let pktsOutDelta = this.delta(port.lastPktsOut, pktsOut);


					//ermittele die aktuelle Packet größe
					let currentPktSize = Math.round((octInDelta + octOutDelta) / (pktsInDelta + pktsOutDelta));

					//ermittle aktuelle Bit/s
					let currentBPS = Math.round((octInDelta + octOutDelta) / this.interval) * 8;

					//ermittle aktuelle Packete pro Sekunde
					let currentPPS = Math.round((pktsInDelta + pktsOutDelta) / this.interval);

					//nur Verhältnisse bilden wenn max Werte vorhanden sind
					if (maxSpeed !== undefined) {

						//ermittle port auslastung relativ zum maximal wert des betrachteten Zeitraums
						let portUtil = Math.round((currentBPS * 100) / maxSpeed);

						//ermittle PacketSize auslastung relativ zum maximal wert des betrachteten Zeitraums
						let packetSize = Math.round((currentPktSize * 100) / maxPktSize);

						//ermittle PPS auslastung relativ zum maximal wert des betrachteten Zeitraums
						let pps = Math.round((currentPPS * 100) / maxPPs);

						// alle werte bei 100 kappen.
						pps = pps > 100 ? 100 : pps;
						portUtil = portUtil > 100 ? 100 : portUtil;
						packetSize = packetSize > 100 ? 100 : packetSize;

						// alle werte unter 0 kappen.
						pps = pps < 0 ? 0 : pps;
						portUtil = portUtil < 0 ? 0 : portUtil;
						packetSize = packetSize < 0 ? 0 : packetSize;



						//String zum versenden erstellen
						// R, G, B, pps, pktSize
						let out = `${this.rgb(portUtil)}, ${pps}, ${packetSize}`;

						console.log(out);

						/*
						console.log("octIn", octIn, '\t', octInDelta);
						console.log("octOut", octOut, '\t', octOutDelta);
						console.log("pktsIn", pktsIn, '\t', pktsInDelta);
						console.log("pktsOut", pktsOut, '\t', pktsOutDelta);
						*/

						//gesammelte daten an das Ziel senden
						udpSocket.send(out, 0, out.length, 1337, port.ziel, (err) => {
							if (err)
								console.error(err);
						});

					}




					// überprüfe die Anzahl der gespeicherten messpunkte
					// sind mehr als nötig vorhanden lösche das erste
					if (port.maxSpeed.length >= ((this.window * 60) / this.interval)) {
						port.maxSpeed.shift();
						port.maxPPS.shift();
						port.maxPktSize.shift();
					}

					// füge die aktuellen Werte hinzu
					port.maxSpeed.push(Math.round(currentBPS));
					port.maxPPS.push(Math.round(currentPPS));
					port.maxPktSize.push(Math.round(currentPktSize));

				}


				// speichern der letzten in und out octets zum errechnen des Deltas
				portAry[index].lastOctIn = octIn;
				portAry[index].lastOctOut = octOut;
				portAry[index].lastPktsIn = pktsIn;
				portAry[index].lastPktsOut = pktsOut;

			}


		});


	}

	//hilfsfunktion zum berechnen der port auslastung
	util(lastVal, currentVal, currentSpeed) {
		var delta = this.delta(lastVal, currentval);

		return Math.round((delta * 8 * 100) / (this.interval * currentSpeed));
	}

	//funktion zum errechnen einer einheit pro Sekunde
	// Bit/s Packete/s .....
	perSec(lastVal, currentVal) {

		// delta Berechnen
		var delta = this.delta(lastVal, currentval)

		// bit/s berechnen und zurück geben
		return Math.round(delta / this.interval);
	}

	//errechnet ein delta aus dem letzten und dem aktuellen Wert eines 32-bit SNMP counters
	// berücksichtigt das zurücksetzten nach überschreiten des Maximal werts
	delta(lastVal, currentVal) {

		// delta Berechnen
		// (currentVal - lastVal)
		// counter resets abfangen:
		// wenn neuer wert kleiner als letzter wert => counter reset
		//    (maxVal - lastVall) + current val = delta bei counter reset
		return lastVal < currentVal ? (currentVal - lastVal) : (2 ^ 32 - 1 - lastVal + currentVal);
	}

	//compare funktion zum absteigendem sortieren
	srtDesc(a, b) {
		return b - a;
	}

	// Ermittelt RGB werte zwischen Grün und Rot aus %-Werten zwischen 0 und 100
	rgb(t) {

		var rad = (t / 100) * (pi2 / 4);

		var r = 255 * Math.sin(rad);
		var g = 255 * Math.cos(rad);
		var b = 0;

		var n = 255 / (r >= g ? r : g);

		r = Math.round(r * n);
		g = Math.round(g * n);
		b = Math.round(b * n);

		var out = `${r}, ${g}, ${b}`;

		return out;
	}

}

module.exports = new snmp_collector();
