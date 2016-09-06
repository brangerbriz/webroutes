const fs = require('fs-promise')
const turf = require('turf')
const _ = require('underscore')
const complexify = require('geojson-tools').complexify

class BorderCrossDetector {
			
	constructor(cb) {
		this.borderGeo = null
		const p = fs.readFile('maps/country_borders.geojson', 'utf8');
		p.then(data => {
			this.borderGeo = JSON.parse(data)
			cb(null)
		})
		 .catch(err => cb(err))
	}

	addBorderCrossData(hop, nextHop) {
		
		hop.countries = []
		
		if (hop.geo && nextHop && nextHop.geo) {
			
			let points = [[hop.geo.lon, hop.geo.lat],[nextHop.geo.lon, nextHop.geo.lat]];
			hop.countries = this._getBordersCrossed(points)
		}
	}

	_getBordersCrossed(points) {
		let complex = complexify(points, 150)
		let countries = complex.map(point => {
			for (let i = 0; i < this.borderGeo.features.length; i++) {
				let feat = this.borderGeo.features[i]
				if (turf.inside(turf.point(point), feat)) {
					return feat.properties.NAME
				}
			}
			return null
		}).filter(v => !!v)
		countries = _.uniq(countries)
		console.log(countries)
	}
}

module.exports = BorderCrossDetector
