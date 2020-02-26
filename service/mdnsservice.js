var mdns = require('multicast-dns')();
var ip = require('ip');

mdns.on("query", query => {
    if (query.questions[0] && query.questions[0].name === "lokalqueue._tcp.local") {
        console.log(query);

        mdns.respond({
            answers: [
                {
                    name: "lokalqueue._tcp.local",
                    type: "SRV",
                    data: {
                        port: 8888, // static port
                        weight: 0,
                        priority: 10,
                        target: ip.address() // local IP
                    }
                }, {
                    name: "lokalqueue._tcp.local",
                    type: "A",
                    data: ip.address(),
                    ttl: 300
                }
            ]
        });
    }
});

