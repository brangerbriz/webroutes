class Stats {

	constructor() {
		this.reset()
	}

	reset() {
		this.hopCount = 0
		this.countries = []
		this.cables = []
		this.isps = new Set()
		this.asns = new Set()
		this.ixps = new Set()
	}

	addHop(hop) {

		this.hopCount++

		if (hop.geo) {

			this.isps.add(hop.geo.isp)
			this.asns.add(hop.geo.as)

			if (hop.countries) {
				if (hop.countries[0] === this.countries[this.countries.length - 1])
					hop.countries.shift()
				this.countries = this.countries.concat(hop.countries)
			}
		}

		if (hop.infrastructure) {
			
			if (hop.infrastructure.cable) {
				let cableName = hop.infrastructure.cable.properties.name
				if (this.cables.length > 0 && 
					this.cables[this.cables.length - 1].name !== cableName) {
					this.cables.push({
						name: cableName,
						length: hop.infrastructure.cable.properties.length
					})
				} else if (this.cables.length === 0) {
					this.cables.push({
						name: cableName,
						length: hop.infrastructure.cable.properties.length
					})
				}
			}

			if (hop.infrastructure.exchanges.length > 0) {
				let ixp = hop.infrastructure.exchanges[0].feature.properties.exchanges[0]
				let ix = ixp.address[0] //+ (ixp.address.length > 1 ? ixp.address[ixp.length - 1] : '') 
				this.ixps.add(ix)
			}
		}
	}

	getFormattedText() {

		let text = `Number of hops: ${this.hopCount - 1}\n`
		
		if (this.countries.length > 1) 
			text += `Number of country borders crossed: ${this.countries.length - 1}\n`
		
		text += `Number of Networks traversed: ${this.asns.size}\n`
		if (this.ixps.size > 0) {
			text += `Networks connected at the Internet eXchange points (IXPs):\n`
			this.ixps.forEach(ixp =>  text += `    ${ixp}\n`)
		}
		text += `Networks run by the following ISPs:\n`
		this.isps.forEach(isp=> text += `    ${isp}\n`)
		if (this.cables.length > 0) {
			text += `Submarine cables crossed:\n`
			this.cables.forEach(cable => text += `    ${cable.name}, ${cable.length}\n`)
		}

		return text

	}
}

module.exports = Stats
