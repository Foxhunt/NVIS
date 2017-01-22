const dgram = require("dgram");
const udpSocket = dgram.createSocket({
	type: "udp4"
});

const out = "hi";
const ziel = "127.0.0.1";
const port = "1337";

setInterval(() => {
	udpSocket.send(out, 0, out.lenght, port, ziel, (err) => {
		if (err) console.log(err);
		console.log(`send ${out} to ${ziel}`)
	})
}, 500);
