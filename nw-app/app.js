const GeoTraceroute = require('./GeoTraceroute');
const InfrastructureAugmenter  = require('./InfrastructureAugmenter');
const BorderCrossDetector = require('./BorderCrossDetector')
const Stats = require('./Stats')

let stats = new Stats()
function printAndResetStats() {
	console.log(stats.getFormattedText())
	stats.reset()
}

let geoTracer = null;
let infraAug = new InfrastructureAugmenter(function(err) {
	if (!err) console.log('[WebRoutes] InfrastructureAugmenter loaded.');
	else {
		console.log('[WebRoutes] Error loading InfrastructureAugmenter.');
		console.error(err);
	}
});

let borderCross = new BorderCrossDetector(err => {
	if (!err) console.log('[WebRoutes] BorderCrossDetector loaded.');
	else {
		console.log('[WebRoutes] Error loading BorderCrossDetector.');
		console.error(err)
	}
})

let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let EventEmitter = require('events');
let emitter = new EventEmitter();
let lastHop = null;

app.use('/map', express.static('maps'));
app.use('/site', express.static('public'));

app.get('/traceroute', (req, res) => {
	if(typeof req.query.location !== 'undefined'){
		res.send('location received'); // sending back confirmation to client, not working for some reason
		if (geoTracer) geoTracer.cancel();
		geoTracer = new GeoTraceroute();

		geoTracer.on('trace-started', destination => {
			console.log(`[WebRoutes] Trace started to ${req.query.location}`)
			lastHop = null;
			emitter.emit('trace started');
		});

		geoTracer.on('my-ip', hop => {
			if (hop.geo && hop.geo.status == 'success') {
				let str = `My IP is ${hop.ip} [${hop.geo.lat}, ${hop.geo.lon}]`;
				str += ` ${hop.geo.city + ','} ${hop.geo.regionName + ','} ${hop.geo.country}`;
				str += ` | ISP: ${hop.geo.isp} ORG: ${hop.geo.org} MOBILE: ${hop.geo.mobile}`;
				console.log(`[WebRoutes] ${str}`);
				// let addon worker know of hop
				//io.emit('my ip', hop ); 
				// let index.html know
				emitter.emit("my-ip", hop );
			}
		});

		geoTracer.on('ordered-hop', hop => {
			
			if (hop.ip != '*') {
				
				if (lastHop != null) {

					printHop(lastHop);
					infraAug.addInfrastructureData(lastHop, hop)
					// don't check a border crossing if this is a 
					// submarine cable hop
					if (!lastHop.infrastructure.cable) {
						borderCross.addBorderCrossData(lastHop, hop)
					}
					else lastHop.countries = []
					// console.log(hop)
					// stats.addHop(lastHop)

					// let addon worker know of hop
					//io.emit('trace hop', lastHop ); 
					// let index.html know

					emitter.emit("ordered-hop", lastHop );
				} else {
					// stats.addHop(hop)
				}
				
				
				lastHop = hop;
			} else {
				console.log(`hop #${hop.hop}: * [trace-hop not fired]`)
			}

		});

		geoTracer.on('trace-finished', hops => {
			
			infraAug.addInfrastructureData(lastHop, null);
			borderCross.addBorderCrossData(lastHop, null)
			// stats.addHop(lastHop)
			printHop(lastHop);
			io.emit('trace hop', lastHop ); 
			emitter.emit("trace hop", lastHop );

			lastHop = null;

			console.log('[WebRoutes] Trace complete');
			// let addon worker know of trace completion
			// let index.html know
			emitter.emit('trace-finished', hops );
			//hops.forEach(({ip}) => console.log(ip + ','))
			geoTracer = null;

			// printAndResetStats()
		});

		geoTracer.on('trace-canceled', () => {
			console.log('[WebRoutes] Trace canceled')

			emitter.emit('trace-canceled');
			// printAndResetStats()
		});

		geoTracer.on('trace-timeout', () => {
			console.log('[WebRoutes] Trace Timeout')
			emitter.emit('trace-timeout');
		});
		
		geoTracer.on('trace-error', err => { 	
			console.log('[WebRoutes] Trace error')
			emitter.emit('trace-error', err);	
			// printAndResetStats()
		});

		geoTracer.trace(req.query.location);
	}
});

io.on('connection', function(socket){
	console.log('[WebRoutes] A client connected.');
	socket.on('disconnect', function(){
		console.log('[WebRoutes] A client disconnected.');
	});
	// pass info from console.html to index.html
	socket.on('console-navigation',function(o){
		emitter.emit('console-navigation', o);
	});	
});

http.listen(3001, () => console.log('[WebRoutes] Server listening on http://localhost:3001'));

function printHop(hop) {
	let str;
	if (hop.geo) {
		str = `hop #${hop.hop} ${hop.geo.as}: ${hop.ip} [${hop.geo.lat}, ${hop.geo.lon}]`;
		str += ` ${hop.geo.city + ','} ${hop.geo.regionName + ','} ${hop.geo.country}`;
		str += ` | ISP: ${hop.geo.isp} ORG: ${hop.geo.org}`;
	} else {
		str = `hop #${hop.hop}: ${hop.ip}`
	}

	console.log(`[WebRoutes] ${str}`);			
}
