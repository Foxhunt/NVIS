const dgram = require('dgram');

const udpSocket = dgram.createSocket({
	type: "udp4"
});

var out = "2, 0, 255, 0";

var stop = "0";

var ziel = "192.168.43.22";



class staticLight {

	constructor() {

		this.interval = null;
		this.running = false;

	}

	start() {
		if (!this.interval) {

			udpSocket.send(out, 0, out.length, 1337, ziel, (err) => {
				if (err)
					console.error(err);

				console.log("send: " + out + " an: " + ziel);

			});

			this.interval = setInterval(() => {
				udpSocket.send(out, 0, out.length, 1337, ziel, (err) => {
					if (err)
						console.error(err);

					console.log("send: " + out + " an: " + ziel);

				});
			}, 5000);

			this.running = true;
		}
	}

	stop() {
		if (this.interval) {

			udpSocket.send(stop, 0, out.length, 1337, ziel, (err) => {
					if (err)
						console.error(err);

					console.log("send: " + out + " an: " + ziel);

				});

			clearInterval(this.interval);
			this.interval = null;
			this.running = false;
		}
	}

}


module.exports = new staticLight();
