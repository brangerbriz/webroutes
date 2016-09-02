const fs = require('fs');
const ip = require('ip');
const Traceroute = require('nodejs-traceroute');
const GeoIpLookup = require('../GeoIpLookup')

let urls = [
	"206.223.119.5",
	"github.com",
	"facebook.com",
	"gmail.com",
	"baidu.com",
	"nytimes.com",
	"wired.com",
	"ok.ru",
	"twitter.com",
	"reddit.com",
	"stackoverflow.com",
	"hackaday.io",
	"Rakuten.co.jp",
	"naver.jp",
	"kb.iu.edu",
	"wikipedia.com",
	"level3.net",
	"spotify.com",
	"daringfireball.net",
	"ip-api.com",
	"iceland.is",
	"underscorejs.org",
	"ledluxor.com",
	"roanokeva.gov",
	"bikulov.org",
	"gqrx.dk"
]

// UNCOMMENT HERE FOR RANDOM
// const fakeIps = getFakeIps(1000);
// urls = fakeIps;

let buffer = fs.readFileSync('data/ixp_prefixes.txt', 'utf8');
let ixpPrefixes = ixpPrefixes2Arr(buffer);
buffer = fs.readFileSync('data/ixpfx.json', 'utf8');
let ipxFx = JSON.parse(buffer).data;
buffer = fs.readFileSync('data/ixp_subnets.csv', 'utf8');
let ixpSubnets = ixpSubnets2Arr(buffer);
let netixlanByAsn = loadNetixlanByAsn()

urls = loadAlexaAsArr(100);

let timeoutCount = 0;
let closeCount = 0;
let ipCount = 0;
let ipAsnMatchCount = 0;

urls.forEach(url => traceroute(url));

function done() {
	console.log(`${ipAsnMatchCount}/${ipCount} ip addresses had APs in netixlan`)
	console.log(`${urls.length - timeoutCount} traceroutes finished fully`)
}

function traceroute(url) {

	const tracer = new Traceroute();
	let dest, lastHop;

	tracer.on('destination', (destination) => {     
        // log(`starting trace to ${destination}`);
        dest = destination;
    });

	tracer.on('hop', (hop) => {
        
        if (hop.ip != "*")
        {

        	// Check ixp_prefixes.txt
        	for (let i = 0; i < ixpPrefixes.length; i++) {
        		let prefix = ixpPrefixes[i].prefix;
        		if (prefix && prefix !== "+" &&
        			ip.cidrSubnet(prefix).contains(hop.ip)) {
        			log(`Found ${ixpPrefixes[i].short || ixpPrefixes[i].name} in ixpPrefixes for ${hop.ip}`)
        		}        		
        	}

        	// check ixpfx.json
        	for (let i = 0; i < ipxFx.length; i++) {
        		let prefix = ipxFx[i].prefix;
        		if (prefix && ip.cidrSubnet(prefix).contains(hop.ip)) {
        			log(`Found ${ipxFx[i].ixlan_id} in ixpFx for ${hop.ip}`)
        		}  
        	}

        	// check ixp_subnets.txt
        	for (let i = 0; i < ixpSubnets.length; i++) {
        		let subnet = ixpSubnets[i].subnet;
        		if (subnet && ip.cidrSubnet(subnet).contains(hop.ip)) {
        			log(`Found ${ixpSubnets[i].short} in ixpSubnets for ${hop.ip}`)
        		}        		
        	}

        	// if this netixlan has a 
        	if (netixlanByAsn.has(parseInt(hop.asn))) {
        		let name = netixlanByAsn.get(parseInt(hop.asn));
        		
        		// console.log(`Found ${hop.asn} in netixlan:`)
        		// ipAsnMatchCount++;
        	}

        	if (lastHop && 
        		hop.asn != lastHop.asn &&
        		netixlanByAsn.has(parseInt(hop.asn)) &&
        		netixlanByAsn.has(parseInt(lastHop.asn))) {
        		
        		let ix1 = netixlanByAsn.get(parseInt(hop.asn))
        		let ix2 = netixlanByAsn.get(parseInt(lastHop.asn))

        		let overlap = ix1.filter(ix => {
        			for (let i = 0; i < ix2.length; i++) {
        				if (ix2[i].ix_id == ix.ix_id) return true
        			}
        			return false
        		})

        		overlap.forEach((ix) => 
        			console.log(`Found ASN change with common IXP membership at ${ix.name} for ${hop.ip}`))

        		ipAsnMatchCount++;

        	}

        	lastHop = hop;

        } else if (hop.hop == 30) {
        	timeoutCount++;
        }

        ipCount++;
    });

	tracer.on('close', (code) => {
		closeCount++;
		
		if (closeCount == urls.length) {
			done();
		}
        // log(`Traceroute to ${dest} closed with ${code}`);
    });
    
    tracer.trace(url);
}

function loadNetixlanByAsn() {
	let netixlan = fs.readFileSync('data/netixlan.json')
	netixlan = JSON.parse(netixlan)
	const netixlanByAsn = new Map()
	netixlan.data.forEach(ix => {
		const arr = netixlanByAsn.get(ix.asn)
		if (arr) arr.push(ix)
		else netixlanByAsn.set(ix.asn, [ix]) 
	})
	return netixlanByAsn;
}

function ixpSubnets2Arr(stringFile) {
	let arr = [];
	const lines = stringFile.split('\n');
	lines.forEach(line => {
		let [id, short, status, version, multicast, mlpa, subnet, participants] = line.split('\t');

		if (short) short = short.trim();
		
		let obj = {};
		if (id) obj.id = id;
		if (subnet) obj.subnet = subnet;
		if (short) obj.short = short;
		arr.push(obj);
	});

	return arr;
}

function ixpPrefixes2Arr(stringFile) {
	let arr = [];
	const lines = stringFile.split('\n');
	lines.forEach(line => {
		let [id, prefix, name, short] = line.split('\t');

		if (name) name = name.trim();
		if (short) short = short.trim();
		
		let obj = {};
		if (id) obj.id = id;
		if (prefix) obj.prefix = prefix;
		if (name) obj.name = name;
		if (short) obj.short = short;
		arr.push(obj);
	});

	return arr;
}

function log(s) {
	console.log(`[test-ip-prefixes] ${s}`);
}

function getFakeIps(len) {
	
	let arr = [];
	
	for (let i = 0; i < len; i++) {
		arr.push(`${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}.${getRandomInt(0, 255)}`)
	}
	
	return arr;

	function getRandomInt(min, max) {
	    return Math.floor(Math.random() * (max - min + 1)) + min;
	}
}

function loadAlexaAsArr(len) {
	let arr = [];
	let alexa = fs.readFileSync('data/top-1m.csv', 'utf8');
	alexa.split('\n').forEach(line => {
		let row = line.split(',');
		arr.push(row[1])
	});	
	return arr.splice(0, len);
}
