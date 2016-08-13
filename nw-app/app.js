const GeoTraceroute = require('./GeoTraceroute');
let geoTracer = null;

let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);

app.get('/traceroute', (req, res) => {
	if(typeof req.query.location !== 'undefined'){
		res.send('location received'); // sending back confirmation to client, not working for some reason
		if (geoTracer) geoTracer.cancel();
		geoTracer = new GeoTraceroute();

		geoTracer.on('trace-started', destination => console.log(`[nw-app] Trace started to ${destination}`));
		geoTracer.on('ordered-hop', hop => {
			let str;
			if (hop.geo) {
				str = `hop #${hop.hop}: ${hop.geo.ip} [${hop.geo.latitude}, ${hop.geo.longitude}]`;
				str += ` ${hop.geo.city} ${hop.geo.region_name} ${hop.geo.country_name}`;
			} else {
				str = `hop #${hop.hop}: ${hop.ip}`
			}
			
			console.log(`[nw-app] ${str}`);

			// let addon worker know of hop
			io.emit('trace hop', hop ); 
		});

		geoTracer.on('trace-finished', hops => {
			console.log('[nw-app] Trace complete');
			// let addon worker know of trace completion
			io.emit('trace complete', hops );
			geoTracer = null;
		});

		geoTracer.on('trace-canceled', () => {
			console.log('[nw-app] Trace canceled')
			io.emit('trace canceled')
		});

		geoTracer.trace(req.query.location);
	}
});

io.on('connection', function(socket){
	console.log('[nw-app] A client connected.');
	socket.on('disconnect', function(){
		console.log('[nw-app] A client disconnected.');
	});
});

http.listen(3001, () => console.log('[nw-app] Server listening on http://localhost:3001'));
