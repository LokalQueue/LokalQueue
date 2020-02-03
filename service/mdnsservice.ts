import mdns_server from "mdns-server";

const mdns = mdns_server({
    reuseAddr: true, // in case other mdns service is running
    loopback: true,  // receive our own mdns messages
    noInit: true     // do not initialize on creation
});

// listen for response events from server
mdns.on('response', function(response) {
    console.log('got a response packet:');
    let a = [];
    if (response.answers) {
        a = a.concat(response.answers)
    }
    if (response.additionals) {
        a = a.concat(response.additionals)
    }
    console.log(a)
});

// listen for query events from server
mdns.on('query', function(query) {
    console.log('got a query packet:')
    let q = [];
    if (query.questions) {
        q = q.concat(query.questions)
    }
    console.log(q)
});

// listen for the server being destroyed
mdns.on('destroyed', function () {
    console.log('Server destroyed.');
    // @ts-ignore
    process.exit(0)
});

// query for all services on networks
mdns.on('ready', function () {
    mdns.query({
        questions: [{
            name: '_services._dns-sd._udp.local',
            type: 'PTR'
        }]
    })
});

// initialize the server now that we are watching for events
mdns.initServer();

// destroy the server after 10 seconds
setTimeout(function () { mdns.destroy() }, 10000);