const fs = require('fs');
const turf = require('turf');
const _ = require('underscore');
const complexify = require('geojson-tools').complexify;

class InfrastructureAugmenter {
	
	constructor(callback) {

		this.aggregatedData = null;
		this.buildingsGeo = null;
		this.landingsGeo = null;
		this.landingsGeoById = null;
		this.cablesGeo = null;
		this.cablesGeoById = null;
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
							fs.readFile('maps/cable-data.json', 'utf8', (err, data) => {
							if (err) { callback(err); return; }
							this.cablesGeo = JSON.parse(data);
							this.loaded = true;
							this.landingsGeoById = this._generateGeoById(this.landingsGeo, 'id');
							this.cablesGeoById = this._generateGeoById(this.cablesGeo, 'cable_id');
							//console.log(this.cablesGeoById[Object.keys(this.cablesGeoById)[0]])
							callback(null);
						});
					});
				});
			});
		});
	}

	_generateGeoById(geoObj, propName) {
		let geoById = {};
		geoObj.features.forEach(feature => {
			let prop = feature.properties[propName];
			geoById[prop] = feature; // DANGER DANGER: 
		});
		return geoById;
	}

	addInfrastructureData(hop, nextHop) {

		var self = this; // gross
		hop.infrastructure = {
			exchanges: [],
			landings: [],
			cable: null
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
				if (dist <= radius) nearby.push({ dist, feature });
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

						let landingNearHop = [];
						let landingNearNextHop = [];
						
						this.landingsGeo.features.forEach((feature, i) => {
							
							//console.log(feature);
							//return;
							landingNearHop.push({ dist: turf.distance(hopGeoJSON, feature, 'kilometers'), 
										   feature: feature,
			                               coords: feature.geometry.coordinates, 
			                               id: feature.properties.id,
			                               cableId: feature.properties.cable_id});
							
							landingNearNextHop.push({ dist: turf.distance(nextHopGeoJSON, feature, 'kilometers'), 
				                               feature: feature,
				                               coords: feature.geometry.coordinates, 
				                               id: feature.properties.id,
				                               cableId: feature.properties.cable_id});
							
						});

						landingNearHop = _.sortBy(landingNearHop, function(hop) { return hop.dist });
						landingNearNextHop = _.sortBy(landingNearNextHop,function(hop) { return hop.dist });					
						
						let c = getCables()[0];
						
						hop.infrastructure.landings.push(c.start);
						hop.infrastructure.landings.push(c.end);
						hop.infrastructure.cable = c.cable;
						
						console.log(hop)

						console.log(`${c.cable.properties.name} START: ${c.distStart} END: ${c.distEnd} SUM: ${c.distSum}`);

						// cables.forEach(c => {						
						// 	if (c) {
						// 		console.log(`${c.cable.properties.name} START: ${c.distStart} END: ${c.distEnd} SUM: ${c.distSum}`);
						// 		hop.infrastructure.landings.push(c.start);
						// 		hop.infrastructure.landings.push(c.end);
						// 		hop.infrastructure.cable = c.cable;
						// 	} else {
						// 		console.log('CABLE NOT FOUND');
						// 	}
						// });

						function getCables() {

							let cables = [];
							// For each landing points near the hop
							for (let i = 0; i < landingNearHop.length; i++) {
								// get that landing point's id
								let cableId = landingNearHop[i].feature.properties.cable_id;
								// For each landing point that cable has								
								for (let k = 0; k < self.aggregatedData.cable[cableId].landing_points.length; k++) {
									let landing = self.aggregatedData.cable[cableId].landing_points[k];
									// For all landing points near the next hop
									for (let l = 0; l < landingNearNextHop.length; l++) {
										if (landingNearNextHop[l].feature.properties.id == landing.id && 
											landingNearNextHop[l].feature.properties.id != landingNearHop[i].feature.properties.id) {	
											cables.push({
												start: landingNearHop[i].feature,
												end: landingNearNextHop[l].feature,
												cable: self.cablesGeoById[cableId],
												distSum: landingNearHop[i].dist + landingNearNextHop[l].dist,
												distStart: landingNearHop[i].dist,
												distEnd: landingNearNextHop[l].dist 
											});

										}
									}
								}							
							}

							return _.uniq(_.sortBy(cables, cable => cable.distSum), cable => cable.cable.properties.id);
						}

						function getCableIds(cables) {
							let ids = [];
							cables.forEach(({cable_id}) => ids.push(parseInt(cable_id)));
							return ids;
						}
					}
				}
			}
		}
	}

	_crossesOcean(points) {
		
		let inside = false;
		let numPointsMustBeInOcean = 2;
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