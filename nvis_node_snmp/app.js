//benötigte Module
var snmp = require("net-snmp");
var dgram = require("dgram");
var fs = require("fs");
var ports = require(__dirname + "/ports.json");

var udpSocket = dgram.createSocket("udp4");

//zeitintervall in dem die OIDs abgefragt werden
var interval = 13;

// Länge des betrachteten zeitfensters in minuten
var window = 20;

//intervall für das regelmäsige abfragen der oids
setInterval(() => {

	console.log("reading values");

	ports.forEach(getValues);

}, 1000 * interval);



// fragt die oids eines ports ab
function getValues(port, index, portAry) {

	//session für die snmp-Abfrage
	var session = snmp.createSession(port.quelle, port.comunity);

	//maximum des betrachteten zeitraums ermitteln
	//absteigend sortieren und das erste element auswählen
	var maxSpeed = port.maxSpeed.concat().sort((a, b) => {
		return b - a
	})[0];

	//array für die abgefragten OIDs
	var oids = [];
	oids.push(port.speed);
	oids.push(port.octIn);
	oids.push(port.octOut);

	//abfragen der oids
	session.get(oids, function (error, varbinds) {
		if (error) { // fehler abfangen
			console.error(error);
		} else {

			for (var i = 0; i < varbinds.length; i++)
				if (snmp.isVarbindError(varbinds[i]))
					console.error(snmp.varbindError(varbinds[i]));



				//String zum versenden erstellen
			var out = "outOctets: " + varbinds[2].value;
			out += "	outUtil: " + utili(port.lastIfOutOctets, varbinds[2].value, port.lastSpeed, maxSpeed) + "%";
			out += "		inOctets: " + varbinds[1].value;
			out += "	inUtil: " + utili(port.lastIfInOctets, varbinds[1].value, port.lastSpeed, maxSpeed) + "%";
			out += "		maxSpeed: " + maxSpeed;
			out += "	Descr: " + port.beschreibung;


			//gesammelte daten an das Ziel senden
			udpSocket.send(out, 0, out.length, 1337, port.ziel, (err) => {
				if (err)
					console.error(err);
			});

			//ermittle aktuelle Bit/s
			var currentBPS = bitPerSec(port.lastIfOutOctets, varbinds[2].value) + bitPerSec(port.lastIfInOctets, varbinds[1].value);

			// überprüfe die Anzahl der gespeicherten messpunkte
			// sind mehr als nötig vorhanden lösche das erste
			if (port.maxSpeed.length >= ((window * 60) / interval))
				port.maxSpeed.shift();

			// füge den aktuellen wert hinzu
			port.maxSpeed.push(Math.round(currentBPS * 1.3));


			// speichern der letzten in und out octets zum errechnen des Deltas
			portAry[index].lastSpeed = maxSpeed;
			portAry[index].lastIfInOctets = varbinds[1].value;
			portAry[index].lastIfOutOctets = varbinds[2].value;
		}


	});


}

//hilfsfunktion zum berechnen der port auslastung
function utili(lastVal, currentVal, lastSpeed, currentSpeed) {

	// delta Berechnen
	// (currentVal - lastVal)
	// counter resets abfangen:
	// wenn neuer wert kleiner als letzter wert => counter reset
	//    (maxVal - lastVall) + current val = delta bei counter reset
	var delta = lastVal < currentVal ? (currentVal - lastVal) : (2 ^ 32 - 1 - lastVal + currentVal);

	// für durchschnitt bei schwankender port geschwindigkeit
	var speed = (lastSpeed + currentSpeed) / 2;

	return Math.round((delta * 8 * 100) / (interval * speed));
}

//geschwindigkeit in bit/s
//errechnet die bit/s mit hilfe eines Detlas zwischen den letzten und den aktuell gezählten okteten
function bitPerSec(lastVal, currentVal) {

	// delta Berechnen
	var delta = lastVal < currentVal ? (currentVal - lastVal) : (2 ^ 32 - 1 - lastVal + currentVal);

	// bit/s berechnen und zurück geben
	return Math.round((delta * 8) / interval);

}
