const fs = require('fs');
const ip = require('ip');
const Traceroute = require('nodejs-traceroute');

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

urls = loadAlexaAsArr(1000);

let timeoutCount = 0;
let closeCount = 0;

urls.forEach(url => traceroute(url));

function done() {
	// console.log(`${timeoutCount}/${urls.length} requests timed out.`)
	console.log(`${urls.length - timeoutCount} traceroutes finished fully`)
}

function traceroute(url) {

	const tracer = new Traceroute();
	let dest;

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
        		if (prefix && ip.cidrSubnet(prefix).contains(hop.ip)) {
        			log(`Found ${ixpPrefixes[i].short} in ixpPrefixes for ${hop.ip}`)
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

        	// console.log(hop.ip)

        } else if (hop.hop == 30) {
        	timeoutCount++;
        }
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
