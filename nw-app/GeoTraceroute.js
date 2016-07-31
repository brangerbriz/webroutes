const Traceroute = require('nodejs-traceroute');
const FreeGeoIp = require('node-freegeoip');
const EventEmitter = require('events');

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
						'trace-finished', 
						'trace-started', 
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
		    });

	    	this._tracer.on('hop', (hop) => {
		        if (hop.ip != "*")
		        {
		            this._numHopsExpected++;
		            FreeGeoIp.getLocation(hop.ip, (err, location) => {
		                this._numHopsProcessed++;
		                if (!err) {
		                	hop.geo = location;
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

	on(event, callback) {
		if (typeof event !== undefined &&
			this._events.indexOf(event) !== -1) {
			this._emitter.addListener(event, callback);
		} else {
			throw new Error(`GeoTraceroute.on: ${event} is not a supported event name`);
		}
	}

	_onGeoLookup(err, hop) {
	    if (!this._tracerouteInProgress && this._numHopsProcessed == this._numHopsExpected) {
	        this._emitter.emit('trace-finished', this._hops);
	        this._lookupInProgress = false;
	        this._hops = [];
	        this._orderedHopsCache = {};
	        this._orderedHopCounter = 0;
	        this._numHopsExpected = 0;
	    } else if (!err){
	        this._hops.push(hop);
	    } else {
	    	this._emitter.emit('error', err);
	    }
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
