const dgram = require('dgram');

const udpSocket = dgram.createSocket({
	type: "udp4"
});

var stop = "0";

var ziel = "192.168.0.22";



class staticLight {

	constructor() {

		this.interval = null;
		this.running = false;
		this.color = "00ff00";
		this.out;

	}

	start() {


		let one = parseInt(this.color.charAt(0) + this.color.charAt(1), 16);
		let two = parseInt(this.color.charAt(2) + this.color.charAt(3), 16);
		let three = parseInt(this.color.charAt(4) + this.color.charAt(5), 16);


		let out = `2, ${one}, ${two}, ${three}`;

		udpSocket.send(out, 0, out.length, 1337, ziel, (err) => {
			if (err)
				console.error(err);

			console.log("send: " + out + " an: " + ziel);

		});


		if (!this.interval) {


			this.interval = setInterval(() => {

				let one = parseInt(this.color.charAt(0) + this.color.charAt(1), 16);
				let two = parseInt(this.color.charAt(2) + this.color.charAt(3), 16);
				let three = parseInt(this.color.charAt(4) + this.color.charAt(5), 16);


				let out = `2, ${one}, ${two}, ${three}`;

				udpSocket.send(out, 0, out.length, 1337, ziel, (err) => {
					if (err)
						console.error(err);

					console.log("send: " + out + " an: " + ziel);

				});
			}, 1000);

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
