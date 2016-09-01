/*
	Aggregates data in submarinecables/cable/* and submarinecables/landing-point/*
	into a single aggregated-data.json dictionary for quick lookup by their
	respective ids.
	<3 Braxxox
*/

var fs = require('fs');

const cableDir = 'submarinecables/cable';
const landingDir = 'submarinecables/landing-point'; 
const exchangeDir = 'internetexchanges/'

var cableFiles = fs.readdirSync(cableDir);
var landingFiles = fs.readdirSync(landingDir);

const dictionary = {
	landing: {},
	cable: {}
}

parseCableFiles();
parseLandingFiles();

fs.writeFileSync('aggregated-data.json', JSON.stringify(dictionary));

function parseCableFiles() {
	for (let i = 0; i < cableFiles.length; i++) {
		let file = fs.readFileSync(cableDir + "/" + cableFiles[i], "utf8");
		if(file && cableFiles[i] !== "all.json"){
			var d = JSON.parse(file);
			dictionary.cable[d.cable_id] = d;	
		} else if(!file) {
			console.log( "Error, couldn't read " + cableDir + "/" + cableFiles[i] );
		}
	}
}

function parseLandingFiles() {
	for (let i = 0; i < landingFiles.length; i++) {
		let file = fs.readFileSync(landingDir + "/" + landingFiles[i], "utf8");
		if(file && landingFiles[i] !== "all.json"){
			var d = JSON.parse(file);
			dictionary.landing[d.id] = d;		
		} else if (!file) {
			console.log( "Error, couldn't read " + landingDir + "/" + landingFiles[i] );
		}
	}
}
