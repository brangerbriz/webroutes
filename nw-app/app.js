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
		geoTracer.on('my-ip', hop => {
			if (hop.geo && hop.geo.status == 'success') {
				let str = `My IP is ${hop.ip} [${hop.geo.lat}, ${hop.geo.lon}]`;
				str += ` ${hop.geo.city + ','} ${hop.geo.regionName + ','} ${hop.geo.country}`;
				str += ` | ISP: ${hop.geo.isp} ORG: ${hop.geo.org} MOBILE: ${hop.geo.mobile}`;
				console.log(`[WebRoutes] ${str}`);
				// let addon worker know of hop
				io.emit('my ip', hop ); 
				// let index.html know
				emitter.emit("my ip", hop );
			}
		});

		geoTracer.on('ordered-hop', hop => {
			let str;
			if (hop.geo) {
				str = `hop #${hop.hop}: ${hop.ip} [${hop.geo.lat}, ${hop.geo.lon}]`;
				str += ` ${hop.geo.city + ','} ${hop.geo.regionName + ','} ${hop.geo.country}`;
				str += ` | ISP: ${hop.geo.isp} ORG: ${hop.geo.org} MOBILE: ${hop.geo.mobile}`;
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

		geoTracer.on('trace-timeout', () => {
			console.log('[WebRoutes] Trace Timeout')
			io.emit('trace timeout')
			emitter.emit('trace timeout');
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
