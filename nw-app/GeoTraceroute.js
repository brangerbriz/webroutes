const Traceroute = require('nodejs-traceroute');
//const FreeGeoIp = require('node-freegeoip');
const GeoIpLookup = require('./GeoIpLookup');
const EventEmitter = require('events');
const geolite = require('geoip-lite')

class GeoTraceroute {

	constructor() {
		this._numHopsProcessed = 0;
		this._numHopsExpected = 0;
		this._lookupInProgress = false;
		this._tracerouteInProgress = false;
		this._orderedHopsCache = {};
		this._hops = [];

		this._events = ['hop', 
						'ordered-hop',
						'my-ip',
						'trace-finished', 
						'trace-started', 
						'trace-canceled',
						'trace-timeout',
						'error'];

		this._orderedHopCounter = 0;

		this._emitter = new EventEmitter();
	}

	trace(url) {

		if (this._lookupInProgress) return false;

		try {
			this._tracer = new Traceroute();
		
			this._tracer.on('destination', (destination) => {     
		        this._numHopsProcessed = 0;
		        this._lookupInProgress = true;
		        this._tracerouteInProgress = true;
		        this._emitter.emit('trace-started', destination);
		        GeoIpLookup.getMyLocation((err, location) => {
		        	if (!err) {		        		
	        			this._emitter.emit('my-ip', {
			        		hop: 0,
			        		ip: location.query,
			        		geo: location.status == 'success' ? location : null
		        		});
		        	} else console.error(err);
		        });
		    });

	    	this._tracer.on('hop', (hop) => {
		        
		        if (hop.ip != "*")
		        {
		            this._numHopsExpected++;
		            
		            GeoIpLookup.getLocation(hop.ip, (err, location) => {
		                this._numHopsProcessed++;
		                if (!err) {

		                	hop.geo = location.status == 'success' ? location : null;

		                	// double-check the country code with geoip lite
		                	let geoTest = geolite.lookup(location.query)
		        			if (geoTest && geoTest.country !== location.countryCode) {
		        				let mes = `[WebRoutes] IP address ${hop.ip} geoip-lite country mismatch `
		        				mes += `between lite: ${geoTest.country} and ip-api: ${location.countryCode}`
		        				console.log(mes)
		        				hop.ip = '*'
		        				hop.geo = null
		        			}

		                	this._emitter.emit('hop', hop);
		                	if (hop.hop == this._orderedHopCounter + 1) {
		                		this._emitter.emit('ordered-hop', hop);
		            			this._orderedHopCounter++;
		            		}
		                	else {
		                		this._orderedHopsCache[hop.hop] = hop;
		                	}

		                	this._fireCachedHops();
		                }
		                else this._emitter.emit('error', err);
		                this._onGeoLookup(err, hop);
		            });
		        } else {

		        	this._emitter.emit('hop', hop);

		        	if (hop.hop == this._orderedHopCounter + 1) {
	            		this._emitter.emit('ordered-hop', hop);
	        			this._orderedHopCounter++;
	        		} else {
	            		this._orderedHopsCache[hop.hop] = hop;
	            	}

	            	this._fireCachedHops();

	            	if (hop.hop == 30) {
	            		this._emitter.emit('trace-timeout');
	            		this._tracerouteInProgress = false;
	            		this._finish()
	            	}

		        }
		    });

	    	this._tracer.on('close', (code) => {
		        if (code != 0) 
		        	this._emitter.emit('error', `Traceroute process returned error code ${code}`);
		        this._tracerouteInProgress = false;
		    });
		    
		    this._tracer.trace(url);
		    return true;
	    } catch (ex) {
	    	
	    	return false;
	        this._emitter.emit('error', ex);
	    }
	}

	cancel() {
		this._emitter.emit('trace-canceled');
		this._emitter.removeAllListeners();
	}

	on(event, callback) {
		if (typeof event !== 'undefined' &&
			this._events.indexOf(event) !== -1) {
			this._emitter.addListener(event, callback);
		} else {
			throw new Error(`GeoTraceroute.on: ${event} is not a supported event name`);
		}
	}

	_onGeoLookup(err, hop) {
	    if (!this._tracerouteInProgress && 
	    	this._numHopsProcessed == this._numHopsExpected) {
	       this._finish()
	    } else if (!err){
	        this._hops.push(hop);
	    } else {
	    	this._emitter.emit('error', err);
	    }
	}

	_finish() {
		this._emitter.emit('trace-finished', this._hops);
        this._lookupInProgress = false;
        this._hops = [];
        this._orderedHopsCache = {};
        this._orderedHopCounter = 0;
        this._numHopsExpected = 0;
	}

	_fireCachedHops() {
		if (this._orderedHopsCache[this._orderedHopCounter + 1]) {
			this._orderedHopCounter++;
			this._emitter.emit('ordered-hop', this._orderedHopsCache[this._orderedHopCounter]);
			this._fireCachedHops();
		}   	
	}
}

module.exports = GeoTraceroute;
