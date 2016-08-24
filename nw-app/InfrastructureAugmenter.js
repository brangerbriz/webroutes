const fs = require('fs');
const turf = require('turf');
const _ = require('underscore');

class InfrastructureAugmenter {
	
	constructor(callback) {
		this.loaded = false;
		fs.readFile('telegeography-data/aggregated-data.json', 'utf8', (err, data) => {
			if (err) { callback(err); return; }
			this.aggregatedData = JSON.parse(data);
			fs.readFile('telegeography-data/internetexchanges/buildings.geojson', 'utf8', (err, data) => {
				if (err) { callback(err); return; }
				this.buildingsGeo = JSON.parse(data);
				fs.readFile('maps/landingpoints.json', 'utf8', (err, data) => {
					if (err) { callback(err); return; }
					this.landingsGeo = JSON.parse(data);
					this.loaded = true;
					callback(null);
				});
			});
		});
	}

	addInfrastructureData(hop, nextHop) {

		hop.infrastructure = {
			exchanges: [],
			cables: [],
			landings: []
		};

		if (hop.geo && this.loaded) {
			
			let hopGeoJSON = {
			  type: "Feature",
			  properties: {},
			  geometry: {
			    type: "Point",
			    coordinates: [hop.geo.lon, hop.geo.lat]
			  }
			};

			// EXCHANGE POINTS
			let radius = 20; // in miles
			let nearby = [];

			this.buildingsGeo.features.forEach(feature => {
				let dist = turf.distance(hopGeoJSON, feature, 'miles');
				if (dist <= radius) nearby.push({ dist, coords: feature.geometry.coordinates });
			});

			if (nearby.length > 0) {
				if (nearby.length > 1) nearby = _.sortBy(nearby, obj => obj.dist);
				hop.infrastructure.exchanges.push(nearby[0]);
				//console.log("NEAREST EXCHANGE POINT IS " + nearby[0].dist + " MILES AWAY");
			}

			nearby = [];

			// CABLES + LANDING POINTS
			if(nextHop) {
				
				this.landingsGeo.features.forEach(feature => {
					let dist = turf.distance(hopGeoJSON, feature, 'miles');
					if (dist <= radius) nearby.push({ dist, 
						                              coords: feature.geometry.coordinates, 
						                              id: feature.properties.id,
						                              cableId: parseInt(feature.properties.cable_id) });
				});

				if (nearby.length > 0) {
					if (nearby.length > 1) nearby = _.sortBy(nearby, obj => obj.dist);
					hop.infrastructure.exchanges.push(nearby[0]);
					// for each nearby landing point...
					nearby.forEach(obj => {
						// look up their cables, and see if they the other end is near
						// the next hop
						let cable = this.aggregatedData.cables[obj.cableId];
						if (cable) {
							let land = null;
							cable.landing_points.forEach(landing => () {
								if (landing.id != obj.id) land = landing; 
							});
						}
					});
				}

			} else {

			}

		}
	}
}

module.exports = InfrastructureAugmenter;