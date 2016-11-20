//benötigte Module
var snmp = require("net-snmp");
var dgram = require("dgram");
var fs = require("fs");
var ports = require(__dirname + "/ports.json");

var udpSocket = dgram.createSocket("udp4");

var pi2 = Math.PI * 2;

//zeitintervall in dem die OIDs abgefragt werden
var interval = 13;

// Länge des betrachteten zeitfensters in minuten
var window = 1;

//intervall für das regelmäsige abfragen der oids
setInterval(() => {

	console.log("reading values");

	ports.forEach(getValues);

}, 1000 * interval);



// fragt die oids eines ports ab
function getValues(port, index, portAry) {

	//session für die snmp-Abfrage
	var session = snmp.createSession(port.quelle, port.comunity);

	//maxima des betrachteten zeitraums ermitteln
	//absteigend sortieren und das erste element auswählen
	var maxSpeed = port.maxSpeed.concat().sort(srtDesc)[0];
	var maxPktSize = port.maxPktSize.concat().sort(srtDesc)[0];
	var maxPPs = port.maxPPS.concat().sort(srtDesc)[0];

	//array für die abgefragten OIDs
	var oids = [];
	oids.push(port.speed);
	oids.push(port.octIn);
	oids.push(port.octOut);
	oids.push(port.pktsIn);
	oids.push(port.pktsOut);

	//abfragen der oids
	session.get(oids, function (error, varbinds) {
		if (error) { // fehler abfangen
			console.error(error);
		} else {

			for (var i = 0; i < varbinds.length; i++)
				if (snmp.isVarbindError(varbinds[i]))
					console.error(snmp.varbindError(varbinds[i]));


			let octIn = varbinds[1].value;
			let octInDelta = delta(port.lastOctIn, octIn);

			let octOut = varbinds[2].value;
			let octOutDelta = delta(port.lastOctOut, octOut);

			let pktsIn = varbinds[3].value
			let pktsInDelta = delta(port.lastPktsIn, pktsIn);

			let pktsOut = varbinds[4].value;
			let pktsOutDelta = delta(port.lastPktsOut, pktsOut);




			//ermittele die aktuelle Packet größe
			let currentPktSize = Math.round((octInDelta + octOutDelta) / (pktsInDelta + pktsOutDelta));

			//ermittle aktuelle Bit/s
			let currentBPS = Math.round((octInDelta + octOutDelta) / interval) * 8;

			//ermittle aktuelle Packete pro Sekunde
			let currentPPS = Math.round((pktsInDelta + pktsOutDelta) / interval);


			//ermittle port auslastung relativ zum maximal wert des betrachteten Zeitraums
			let portUtil = Math.round((currentBPS * 100) / maxSpeed);

			//ermittle PacketSize auslastung relativ zum maximal wert des betrachteten Zeitraums
			let packetSize = Math.round((currentPktSize * 100) / maxPktSize);

			//ermittle PPS auslastung relativ zum maximal wert des betrachteten Zeitraums
			let pps = Math.round((currentPPS * 100) / maxPPs);



			// überprüfe die Anzahl der gespeicherten messpunkte
			// sind mehr als nötig vorhanden lösche das erste
			if (port.maxSpeed.length >= ((window * 60) / interval)) {
				port.maxSpeed.shift();
				port.maxPPS.shift();
				port.maxPktSize.shift();
			}

			// füge die aktuellen Werte hinzu
			port.maxSpeed.push(Math.round(currentBPS));
			port.maxPPS.push(Math.round(currentPPS));
			port.maxPktSize.push(Math.round(currentPktSize));


			// speichern der letzten in und out octets zum errechnen des Deltas
			portAry[index].lastSpeed = maxSpeed;
			portAry[index].lastOctIn = octIn;
			portAry[index].lastOctOut = octOut;
			portAry[index].lastPktsIn = pktsIn;
			portAry[index].lastPktsOut = pktsOut;




			//String zum versenden erstellen
			// R, G, B, pps, pktSize
			let out = `${rgb(portUtil)}, ${pps}, ${packetSize}`;

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


	});


}

//hilfsfunktion zum berechnen der port auslastung
function util(lastVal, currentVal, currentSpeed) {
	var delta = delta(lastVal, currentval);

	return Math.round((delta * 8 * 100) / (interval * currentSpeed));
}

//funktion zum errechnen einer einheit pro Sekunde
// Bit/s Packete/s .....
function perSec(lastVal, currentVal) {

	// delta Berechnen
	var delta = delta(lastVal, currentval)

	// bit/s berechnen und zurück geben
	return Math.round(delta / interval);
}

//errechnet ein delta aus dem letzten und dem aktuellen Wert eines 32-bit SNMP counters
// berücksichtigt das zurücksetzten nach überschreiten des Maximal werts
function delta(lastVal, currentVal) {

	// delta Berechnen
	// (currentVal - lastVal)
	// counter resets abfangen:
	// wenn neuer wert kleiner als letzter wert => counter reset
	//    (maxVal - lastVall) + current val = delta bei counter reset
	return lastVal < currentVal ? (currentVal - lastVal) : (2 ^ 32 - 1 - lastVal + currentVal);
}

//compare funktion zum absteigendem sortieren
function srtDesc(a, b){
	return b - a;
}


// Ermittelt RGB werte zwischen Grün und Rot aus %-Werten zwischen 0 und 100
function rgb(t) {

	var rad = (t / 100) * (pi2 / 4);

	var r = 255 * Math.sin(rad);
	var g = 255 * Math.cos(rad);
	var b = 0;

	var n = 255 / (r > g ? r : g);

	r = Math.round(r * n);
	g = Math.round(g * n);
	b = Math.round(b * n);

	var out = `${r}, ${g}, ${b}`;

	return out;
}
