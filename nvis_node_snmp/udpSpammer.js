var  dgram = require("dgram");
var udpSocket = dgram.createSocket({
	type: "udp4"
});

// portUtil, pps, pktSize

var out = "1, 20, 50, 50";
var ziel = "192.168.0.11";

setInterval(() => {
	udpSocket.send(out, 0, out.length, 1337, ziel, (err) => {
					if (err)
						console.error(err);

					console.log(`an ${ziel}: ${out}`);
				});
}, 2000);
