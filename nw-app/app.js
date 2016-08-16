const GeoTraceroute = require('./GeoTraceroute');
let geoTracer = null;

let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let EventEmitter = require('events');
let emitter = new EventEmitter();

app.use('/map', express.static('maps'));
app.use('/site', express.static('public'));

app.get('/traceroute', (req, res) => {
	if(typeof req.query.location !== 'undefined'){
		res.send('location received'); // sending back confirmation to client, not working for some reason
		if (geoTracer) geoTracer.cancel();
		geoTracer = new GeoTraceroute();

		geoTracer.on('trace-started', destination => console.log(`[WebRoutes] Trace started to ${req.query.location}`));
		geoTracer.on('ordered-hop', hop => {
			let str;
			if (hop.geo) {
				str = `hop #${hop.hop}: ${hop.geo.ip} [${hop.geo.latitude}, ${hop.geo.longitude}]`;
				str += ` ${hop.geo.city} ${hop.geo.region_name} ${hop.geo.country_name}`;
			} else {
				str = `hop #${hop.hop}: ${hop.ip}`
			}
			
			console.log(`[WebRoutes] ${str}`);			

			// let addon worker know of hop
			io.emit('trace hop', hop ); 
			// let index.html know
			emitter.emit("trace hop", hop );
		});

		geoTracer.on('trace-finished', hops => {
			console.log('[WebRoutes] Trace complete');
			// let addon worker know of trace completion
			io.emit('trace complete', hops );
			// let index.html know
			emitter.emit('trace complete', hops );

			geoTracer = null;
		});

		geoTracer.on('trace-canceled', () => {
			console.log('[WebRoutes] Trace canceled')
			io.emit('trace canceled')
			emitter.emit('trace canceled');
		});
		
		geoTracer.on('error', err => { 	
			console.log('[WebRoutes] Trace error')
			io.emit('trace error', err);	
			emitter.emit('trace error', err);	
		});

		geoTracer.trace(req.query.location);
	}
});

io.on('connection', function(socket){
	console.log('[WebRoutes] A client connected.');
	socket.on('disconnect', function(){
		console.log('[WebRoutes] A client disconnected.');
	});
});

http.listen(3001, () => console.log('[WebRoutes] Server listening on http://localhost:3001'));
