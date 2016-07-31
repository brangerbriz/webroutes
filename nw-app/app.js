const GeoTraceroute = require('./GeoTraceroute');

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
	geoTracer.trace('twitter.com');
});

geoTracer.on('error', err => { 
	throw err;
});

geoTracer.trace('twitter.com');