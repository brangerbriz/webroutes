const fs = require('fs');
const turf = require('turf');
const _ = require('underscore');
const complexify = require('geojson-tools').complexify;

class InfrastructureAugmenter {
	
	constructor(callback) {

		this.aggregatedData = null;
		this.buildingsGeo = null;
		this.landingsGeo = null;
		this.oceanGeo = null;
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
					fs.readFile('maps/ocean.json', 'utf8', (err, data) => {
						if (err) { callback(err); return; }
						this.oceanGeo = JSON.parse(data);
						this.loaded = true;
						callback(null);
					});
				});
			});
		});
	}

	addInfrastructureData(hop, nextHop) {

		var self = this; // gross
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
			let radius = 25; // in kilometers
			let nearby = [];

			this.buildingsGeo.features.forEach(feature => {
				let dist = turf.distance(hopGeoJSON, feature, 'kilometers');
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
				
				if (nextHop.geo) {
					let points = [[hop.geo.lon, hop.geo.lat],[nextHop.geo.lon, nextHop.geo.lat]];
					//console.log(`HOP: [${hop.geo.lat}, ${hop.geo.lon}] [${nextHop.geo.lat}, ${nextHop.geo.lon}]`)
					if (this._crossesOcean(points)) {
						console.log('CROSSED AN OCEAN!')


						let nextHopGeoJSON = {
						  type: "Feature",
						  properties: {},
						  geometry: {
						    type: "Point",
						    coordinates: [nextHop.geo.lon, nextHop.geo.lat]
						  }
						};

						let nearHop = [];
						let nearNextHop = [];
						let radius = 1500;
						// Note: may need to not find nearest n landing points instead of look inside radius
						// to account for instances where no landing points are within radius
						let dists = [];

						this.landingsGeo.features.forEach((feature, i) => {
							
							let dist = turf.distance(hopGeoJSON, feature, 'kilometers');
							if (dist <= radius) nearHop.push({ dist, 
								                              coords: feature.geometry.coordinates, 
								                              id: feature.properties.id,
								                              cableId: feature.properties.cable_id/*getCableIds(feature.properties.cables)*/});
							
							dist = turf.distance(nextHopGeoJSON, feature, 'kilometers');
							if (dist <= radius) {
								nearNextHop.push({ dist, 
					                               coords: feature.geometry.coordinates, 
					                               id: feature.properties.id,
					                               cableId: feature.properties.cable_id/*getCableIds(feature.properties.cables)*/});
							}
						});

						console.log("Landing near this hop: " + nearHop.length);
						console.log("Landing near next hop: " + nearNextHop.length);
						console.log('STARTED CABLE LOOKUP');
						let cables = getCables();
						console.log('FINISHED CABLE LOOKUP');
						cables.forEach(cable => {						
							if (cable) {
								console.log(`FOUND A CABLE: ${cable.name}`);
								console.log(cable);
							} else {
								console.log('CABLE NOT FOUND');
							}
						});


						function getCables() {
							let cables = [];
							// For all landing points near the hop
							for (let i = 0; i < nearHop.length; i++) {
								let cableId = nearHop[i].cableId;
								// validate this is a cable we have in the dict
								//Object.keys(self.aggregatedData).forEach(key => console.log('key' + key))
								if (self.aggregatedData.cable[cableId.toString()]) {
									
									for (let k = 0; k < self.aggregatedData.cable[cableId].landing_points.length; k++) {
										let landing = self.aggregatedData.cable[cableId].landing_points[k];
										// For all landing points near the next hop
										for (let l = 0; l < nearNextHop.length; l++) {
											//console.log(nearNextHop[l].id, landing.id)
											if (nearNextHop[l].id == landing.id) {
												cables.push(self.aggregatedData.cable[cableId]);
												//return self.aggregatedData.cable[cableId];
											}
										}
									} 
								}							
							}
							return cables;
						}

						function getCableIds(cables) {
							let ids = [];
							cables.forEach(({cable_id}) => ids.push(parseInt(cable_id)));
							return ids;
						}

						// if (nearby.length > 0) {
						// 	if (nearby.length > 1) nearby = _.sortBy(nearby, obj => obj.dist);
						// 	hop.infrastructure.exchanges.push(nearby[0]);
						// 	// for each nearby landing point...
						// 	nearby.forEach(obj => {
						// 		// look up their cables, and see if they the other end is near
						// 		// the next hop
						// 		let cable = this.aggregatedData.cables[obj.cableId];
						// 		if (cable) {
						// 			let land = null;
						// 			cable.landing_points.forEach(landing => {
						// 				if (landing.id != obj.id) {
						// 					this.aggregatedData.cables[obj.cableId]
						// 				} 
						// 			});
						// 		}
						// 	});
						// } 
					}
				}

				

			} else { // this is the next hop

			}

		}
	}

	_complexify(points) {
		return complexify(points, 200);
	}

	_crossesOcean(points) {
		
		let inside = false;
		let numPointsMustBeInOcean = 3;
		let numPointsInOcean = 0;
		
		points = complexify(points, 150);
		
		points.shift(); // first point is duplicated by complexify
		points.shift(); // remove first point
		points.pop(); // remove last point

		if (points.length < numPointsMustBeInOcean) return false;

		for (let i = 0; i < points.length; i++) {
			//console.log(points[i]);
			if (turf.inside(turf.point(points[i]), this.oceanGeo.features[0])) {
				numPointsInOcean++;
				if (numPointsInOcean == numPointsMustBeInOcean) {
					inside = true;
					break;
				}
			}
		}	
		
		return inside;
	}
}

module.exports = InfrastructureAugmenter;