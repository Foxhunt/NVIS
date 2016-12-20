/*jshint esversion: 6*/
const snmp = require("net-snmp");
const dgram = require("dgram");
const udpSocket = dgram.createSocket({
	type: "udp4"
});

class PortGroup {

	constructor(cfg) {

		//Port Group informationen
		this.beschreibung = cfg.beschreibung;
		this.quelle = cfg.quelle;
		this.ports = cfg.ports;
		this.community = cfg.community;
		this.ziele = cfg.ziele;
		this.snmpGetIntervalTime = cfg.snmpGetIntervalTime;

		//Maximale lebensdauer einer Messung für das Floating Max
		this.window = 0;

		//variable für die interval id
		this.interval = 0;

		//standard OIDs
		this.speed = "1.3.6.1.2.1.2.2.1.5.";
		this.octIn = "1.3.6.1.2.1.2.2.1.10.";
		this.octOut = "1.3.6.1.2.1.2.2.1.16.";
		this.pktsIn = "1.3.6.1.2.1.2.2.1.11.";
		this.pktsOut = "1.3.6.1.2.1.2.2.1.17.";

		//2PI
		this.pi2 = Math.PI * 2;

		//letzte werte zum bilden des delta
		this.lastOctIn = [];
		this.lastOctOut = [];
		this.lastPktsIn = [];
		this.lastPktsOut = [];

		//gemessene werte zum ermitteln des Maximums
		this.maxSpeed = [];
		this.maxPPS = [];
		this.maxPktSize = [];

		//Current Objekt zum aggregieren der Gruppen Daten
		this.current = {
			pktSize: 0,
			bPS: 0,
			pPS: 0,
			speed: 0
		};
	}

	// fragt die oids eines ports ab
	getPortValues(portNr) {

		//session für die snmp-Abfrage
		let session = snmp.createSession(this.quelle, this.community);

		//array für die abgefragten OIDs
		let oids = [];
		oids.push(this.speed + portNr);
		oids.push(this.octIn + portNr);
		oids.push(this.octOut + portNr);
		oids.push(this.pktsIn + portNr);
		oids.push(this.pktsOut + portNr);

		//abfragen der oids
		session.get(oids, (error, varbinds) => {
			if (error) { // fehler abfangen
				console.error(error);
			} else {
				//snmp internal error handling
				for (var i = 0; i < varbinds.length; i++) {
					if (snmp.isVarbindError(varbinds[i])) {
						console.error(snmp.varbindError(varbinds[i]));
					}
				}

				//SNMP Counter speichern
				let speed = varbinds[0].value;
				let octIn = varbinds[1].value;
				let octOut = varbinds[2].value;
				let pktsIn = varbinds[3].value;
				let pktsOut = varbinds[4].value;

				//prüfen ob letzte werte vorhanden sind
				let lastWerteVorhanden = (this.lastOctIn[portNr] !== undefined ||
					this.lastOctOut[portNr] !== undefined ||
					this.lastPktsIn[portNr] !== undefined ||
					this.lastPktsOut[portNr] !== undefined);

				//nur deltas bilden wenn last Werte vorhanden sind
				if (lastWerteVorhanden) {

					//Deltas bilden
					let octInDelta = this.delta(this.lastOctIn[portNr], octIn);
					let octOutDelta = this.delta(this.lastOctOut[portNr], octOut);
					let pktsInDelta = this.delta(this.lastPktsIn[portNr], pktsIn);
					let pktsOutDelta = this.delta(this.lastPktsOut[portNr], pktsOut);

					//rechne die Port geschwindigkeit auf die Gruppenwerte auf
					this.current.speed += speed;

					//ermittele die aktuelle Packet größe und rechne sie auf die Gruppenwerte auf
					this.current.pktSize += Math.round((octInDelta + octOutDelta) / (pktsInDelta + pktsOutDelta));

					//ermittle aktuelle Bit/s und rechne sie auf die Gruppenwerte auf
					this.current.bPS += Math.round((octInDelta + octOutDelta) / this.snmpGetIntervalTime) * 8;

					//ermittle aktuelle Packete pro Sekunde und rechne sie auf die Gruppenwerte auf
					this.current.pPS += Math.round((pktsInDelta + pktsOutDelta) / this.snmpGetIntervalTime);

				}


				// speichern der letzten in und out octets zum errechnen des Deltas
				this.lastOctIn[portNr] = octIn;
				this.lastOctOut[portNr] = octOut;
				this.lastPktsIn[portNr] = pktsIn;
				this.lastPktsOut[portNr] = pktsOut;

			}


		});
	}

	// fragt die oids aller Ports ab und fassst sie zusammen
	getPortGroupValues() {

		//maxima des betrachteten zeitraums ermitteln
		//arrays kopieren um die reihenfolge der messungen beizubehalten
		//absteigend sortieren und das erste element auswählen
		let maxSpeed = this.maxSpeed.concat().sort(this.srtDesc)[0];
		let maxPktSize = this.maxPktSize.concat().sort(this.srtDesc)[0];
		let maxPPs = this.maxPPS.concat().sort(this.srtDesc)[0];

		//werte aller ports holen
		this.ports.forEach((portNr) => {
			this.getPortValues(portNr);
		});

		//prüfe ob MaxWerte vorhanden sind
		let maxWerteVorhanden = (
			maxSpeed !== undefined || maxPktSize !== undefined || maxPPs !== undefined);


		//nur Verhältnisse bilden wenn max Werte vorhanden sind
		if (maxWerteVorhanden) {

			//ermittle port auslastung relativ zum maximal wert des betrachteten Zeitraums
			let portUtil = Math.round((this.current.bPS * 100) / maxSpeed);

			//ermittle PacketSize auslastung relativ zum maximal wert des betrachteten Zeitraums
			let packetSize = Math.round((this.current.pktSize * 100) / maxPktSize);

			//ermittle PPS auslastung relativ zum maximal wert des betrachteten Zeitraums
			let pps = Math.round((this.current.pPS * 100) / maxPPs);

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

			//gesammelte daten an die Ziele senden
			this.ziele.forEach((ziel) => {
				udpSocket.send(out, 0, out.length, 1337, ziel, (err) => {
					if (err)
						console.error(err);

					console.log(`an ${ziel}: ${out}`);
				});

			});
		}

		//prüfe ob current Werte vorhanden sind
		let currentsVorhanden = (
			this.current.pktSize !== 0 || this.current.bPS !== 0 || this.current.pPS !== 0 || this.current.speed !== 0);

		//nur Werte in die Max arrays schreiben wenn welche vorhanden sind
		if (currentsVorhanden) {
			// überprüfe die Anzahl der gespeicherten messpunkte
			// sind mehr als nötig vorhanden lösche das erste
			if (this.maxSpeed.length >= ((this.window * 60) / this.snmpGetIntervalTime)) {
				this.maxSpeed.shift();
				this.maxPPS.shift();
				this.maxPktSize.shift();
			}

			// füge die aktuellen Werte hinzu
			this.maxSpeed.push(Math.round(this.current.bPS * 1.3 > this.current.speed ? this.current.speed : this.current.bPS * 1.3));
			this.maxPPS.push(Math.round(this.current.pPS * 1.3));
			this.maxPktSize.push(Math.round(this.current.pktSize * 1.3));

			//current werte wieder zurück setzten
			this.current = {
				pktSize: 0,
				bPS: 0,
				pPS: 0,
				speed: 0
			};

		}

	}

	//startet das oid sammeln dieser Port Gruppe
	//window : Fenster zum betrachten der Maximalwerte in Minuten.
	start(window) {

		//setzte das betrachtungs fester auf 5 minuten oder den übergebenen Wert
		this.window = 5 || window;

		//wenn kein interval vorhanden ist starte einen
		if (!this.interval) {
			this.interval = setInterval(() => {
				this.getPortGroupValues();
			}, this.snmpGetIntervalTime * 1000);

		}

	};

	//stopt das oid sammeln dieser Port Gruppe
	stop() {
		//nur stoppen wenn ein intervall läuft
		if (this.interval) {
			clearInterval(this.interval);

			//alte Werte Löschen
			//letzte werte zum bilden der deltas zurücksetzten
			this.lastOctIn = [];
			this.lastOctOut = [];
			this.lastPktsIn = [];
			this.lastPktsOut = [];

			//gemessene werte zurücksetzten
			this.maxSpeed = [];
			this.maxPPS = [];
			this.maxPktSize = [];

			//Current Objekt zurücksetzten
			this.current = {
				pktSize: 0,
				bPS: 0,
				pPS: 0,
				speed: 0
			};

			this.interval = null;
		}
	};

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

		var rad = (t / 100) * (this.pi2 / 4);

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

module.exports = PortGroup;
