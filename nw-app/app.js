const GeoTraceroute = require('./GeoTraceroute');

let app = require('express')();
let http = require('http').Server(app);

app.get('/traceroute', (req, res) => {
	if(typeof req.query.location !== "undefined"){
		res.send('location received'); // sending back confirmation to client, not working for some reason
		geoTracer.trace(req.query.location);
	}
});

let geoTracer = new GeoTraceroute();

geoTracer.on('trace-started', destination => console.log(`Trace started to ${destination}`));
geoTracer.on('ordered-hop', hop => {
	let str;
	if (hop.geo) {
		str = `hop #${hop.hop}: ${hop.geo.ip} [${hop.geo.latitude}, ${hop.geo.longitude}]`;
		str += ` ${hop.geo.city} ${hop.geo.region_name} ${hop.geo.country_name}`;
	} else {
		str = `hop #${hop.hop}: ${hop.ip}`
	}
	
	console.log(str)
});

geoTracer.on('trace-finished', hops => {
	console.log('Trace complete');
});

geoTracer.on('error', err => { 
	throw err;
});

http.listen(3001, () => {
	console.log('Server listening on http://localhost:3001');
});



