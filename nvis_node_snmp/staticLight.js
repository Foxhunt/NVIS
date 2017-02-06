/*jshint esversion: 6*/
const dgram = require('dgram');

const udpSocket = dgram.createSocket({
	type: "udp4"
});

var stop = "0";

var ziel = "192.168.0.22";

class staticLight {

	constructor() {

		this.interval = null;
		this.color = "00ff00";

	}

	get out() {

		let one = parseInt(this.color.charAt(0) + this.color.charAt(1), 16);
		let two = parseInt(this.color.charAt(2) + this.color.charAt(3), 16);
		let three = parseInt(this.color.charAt(4) + this.color.charAt(5), 16);

		return `2, ${one}, ${two}, ${three}`;
	}

	start() {

		console.log("Starting StaticLight.");

		udpSocket.send(this.out, 0, this.out.length, 1337, ziel, (err) => {
			if (err)
				console.error(err);

			console.log("send: " + this.out + " an: " + ziel);

		});

		if (!this.interval) {

			this.interval = setInterval(() => {

				udpSocket.send(this.out, 0, this.out.length, 1337, ziel, (err) => {
					if (err)
						console.error(err);

					console.log("send: " + this.out + " an: " + ziel);

				});

			}, 1000);
		}
	}

	stop() {
		if (this.interval) {

			console.log("Stopping StaticLight.");

			udpSocket.send(stop, 0, 1, 1337, ziel, (err) => {
				if (err)
					console.error(err);

			});

			clearInterval(this.interval);

			this.interval = null;

		}
	}

	get running() {
		return (this.interval != null);
	}

}

module.exports = new staticLight();
