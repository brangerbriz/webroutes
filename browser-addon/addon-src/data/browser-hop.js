

function onHopReceived(hop) {
	

	let text = getHopDisplayText(hop);
	let el = document.getElementById('traceroute-info');
	if (el) el.innerHTML += text;
	document.documentElement.scrollTop = 99999999999999;
}

function getHopDisplayText(hop) {
	
	let text = '';
	let ws = '         ';
	let infra = hop.infrastructure;

	if (infra &&
		infra.exchanges.length > 0 && 
		!infra.cable){
		// assume this hit an exchange point
		let exchange = infra.exchanges[0].feature.properties.exchanges[0];
		text += `<span class="trrt-ix">[INTERNET EXCHANGE POINT]</span> ${exchange.address[0]}\n\n`;
		exchange.address.shift();
		text += `${ws}ADDRESS: ${exchange.address.join(' ')+ '\n'}`
		text += `${ws}PHONE:   ${exchange.telephone}\n`
		text += `${ws}EMAIL:   ${exchange.email}\n`
		text += `${ws}URL:     ${exchange.url}\n\n\n`

	}

	if (infra && infra.cable) {
		let cable = infra.cable.properties;
		text += `[SUBMARINE CABLE] ${cable.name}\n\n`
		text += `${ws}FROM:   ${infra.landings[0].properties.name}\n`
		text += `${ws}TO:     ${infra.landings[1].properties.name}\n`
		if (cable.length != 'n.a.') text += `${ws}LENGTH: ${cable.length}\n`
		text += `${ws}OWNERS: ${cable.owners.split(', ').join('\n' + ws + '       ')}\n\n`

	}

	if (hop.geo) {
		
		// maybe add this later
		// LAT/LONG:            ${hop.geo.lat}, ${hop.geo.lon}

		text += `[HOP #${hop.hop}] ${hop.geo.city + ', '}${hop.geo.regionName + ', '}${hop.geo.country}\n\n`;
		
		if (hop.geo.reverse) 
			text += `${ws}HOSTNAME:            ${hop.geo.reverse}\n`;
        
        text += `${ws}IP ADDRESS:          ${hop.ip}\n`;
        text += `${ws}INTERNET SERV PROV:  ${hop.geo.isp}\n`;
 		
 		if (hop.geo.isp != hop.geo.org) 
			text += `${ws}ORGANIZATION:        ${hop.geo.org}\n`
	
		text += `${ws}AUTONOMOUS SYSTEM #: ${hop.geo.as}\n\n\n`

	}

	return text;
}
