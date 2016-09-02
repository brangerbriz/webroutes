const fs = require('fs-promise');
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
		
		const p1 = fs.readFile('telegeography-data/aggregated-data.json', 'utf8');
		p1.then(data => this.aggregatedData = JSON.parse(data));

		const p2 = fs.readFile('telegeography-data/internetexchanges/buildings.geojson', 'utf8');
		p2.then(data => this.buildingsGeo = JSON.parse(data));

		const p3 = fs.readFile('maps/landingpoints.json', 'utf8');
		p3.then(data => this.landingsGeo = JSON.parse(data));

		const p4 = fs.readFile('maps/ocean.json', 'utf8');
		p4.then(data => this.oceanGeo = JSON.parse(data));

		const p5 = fs.readFile('maps/cable-data.json', 'utf8');
		p5.then(data => this.cablesGeo = JSON.parse(data));

		Promise.all([p1, p2, p3, p4, p5])
			.then(() => {
				this.loaded = true;
				this.landingsGeoById = this._generateGeoById(this.landingsGeo, 'id');
				this.cablesGeoById = this._generateGeoById(this.cablesGeo, 'cable_id');
				callback(null);
			}).catch(err => {
				callback(err)
			})
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

		if (hop.geo && this.loaded && nextHop && nextHop.geo) {
			
			let hopGeoJSON = {
			  type: "Feature",
			  properties: {},
			  geometry: {
			    type: "Point",
			    coordinates: [hop.geo.lon, hop.geo.lat]
			  }
			};

			// If there is an Autonymous System change
			if (hop.geo.as !== nextHop.geo.as &&
				hop.geo.as !== '*' && nextHop.geo.as !== '*') {
				// console.log('AUTONYMOUS SYSTEM CHANGE')
				// console.log(hop)
				let radius = 25; // in kilometers
				let nearby = [];

				this.buildingsGeo.features.forEach(feature => {
					let dist = turf.distance(hopGeoJSON, feature, 'kilometers');
					/*if (dist <= radius)*/ nearby.push({
						dist, feature, fromAsn: hop.geo.as, toAsn: nextHop.geo.as
					});
				});

				if (nearby.length > 0) {
					if (nearby.length > 1) nearby = _.sortBy(nearby, obj => obj.dist);
					hop.infrastructure.exchanges.push(nearby[0]);
					console.log("NEAREST EXCHANGE POINT IS " + nearby[0].dist + " MILES AWAY");
				}
				
				let asn = hop.geo.as.split(' ')[0].substring(2);
				// console.log(`AS change detected for ${hop.ip}. ${hop.geo.as} -> ${nextHop.geo.as}`)
			}
				
			let nearby = [];		
				
			let points = [[hop.geo.lon, hop.geo.lat],[nextHop.geo.lon, nextHop.geo.lat]];
			//console.log(`HOP: [${hop.geo.lat}, ${hop.geo.lon}] [${nextHop.geo.lat}, ${nextHop.geo.lon}]`)
			if (this._crossesOcean(points)) {

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

				// console.log(`${c.cable.properties.name} START: ${c.distStart} END: ${c.distEnd} SUM: ${c.distSum}`);

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
