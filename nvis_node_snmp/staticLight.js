const dgram = require('dgram');

const udpSocket = dgram.createSocket({
	type: "udp4"
});

var out = "1, 255, 0, 0, 20, 100";

var ziel = "192.168.43.22";


setInterval(() => {
	udpSocket.send(out, 0, out.length, 1337, ziel, (err) => {
		if (err)
			console.error(err);

		console.log("send: " + out + " an: " + ziel);

	});
}, 1000);
