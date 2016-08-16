/*
	converts the telegeography data files into a single geoJson formatted file
	<3 ../n!ck
*/

var fs = require('fs');
var turf = require('turf');

var cDir = 'submarinecables/cable';
var eDir = 'submarinecables/cable'; // TODO: include exchange points here
var cables = fs.readdirSync(cDir);

var geoJson = {
	type:"FeatureCollection",
	features:[]
}

// ... still not working as i'd hope :(
function smartSort( lineObj ){

 	var fc = { "type":"FeatureCollection", "features":[] };
 	var x,y,pt;
 	for (var i = 0; i < lineObj.geometry.coordinates.length; i++) {
 		x = lineObj.geometry.coordinates[i][0];
 		y = lineObj.geometry.coordinates[i][1];
 		pt = turf.point([x,y]);
 		fc.features.push( pt );
 	}

 	// find the outer most point....
 	var center = turf.center(fc);
 	var farthest = {id:-1,km:-1 };
 	var dis = [];
 	// var nearest = turf.nearest(center, fc);
	for (var i = 0; i < fc.features.length; i++) {
		var d = turf.distance(fc.features[i], center, "kilometers");
		dis.push({ id:i, km:d });
		if( d > farthest.km ) farthest = { id:i, km:d };
	}

	// create new coord in nearest order, starting from farthest point
	var nearest;
	var next = fc.features.splice( farthest.id, 1 )[0]; // assign next && remove 
	var coords = [ next.geometry.coordinates ]; // NOTE: missing 'z'
	while( fc.features.length>0 ){
		nearest = turf.nearest( next, fc );
		coords.push( nearest.geometry.coordinates );
		// assign next && remove from features
		for (var i = 0; i < fc.features.length; i++) {
			if( fc.features[i].geometry.coordinates[0]==nearest.geometry.coordinates[0] 
				&& fc.features[i].geometry.coordinates[1]==nearest.geometry.coordinates[1]){
				next = fc.features.splice( i, 1 )[0];
				break;
			}
		}
	}
	
 	lineObj.geometry.coordinates = coords;
	return lineObj;

}

// --------------------------------------------
// create GeoJson from the telegeography data
// --------------------------------------------
for (var i = 0; i < cables.length; i++) {

	var obj = {
		type:"Feature",
		properties: {},
		geometry: {
			type: "LineString",
			coordinates: []
		}
	}

	var file = fs.readFileSync(cDir+"/"+cables[i],"utf8");
	if( file && cables[i]!=="all.json" ){

		var d = JSON.parse(file);
		obj.properties.name = d.name;
		obj.properties.owners = d.owners;
		obj.properties.length = d.length;
		obj.properties.url = d.url;
		obj.properties.rfs = d.rfs;
		for (var j = 0; j < d.landing_points.length; j++) {
			var x = parseFloat(d.landing_points[j].latlon.split(',')[1]);
			var y = parseFloat(d.landing_points[j].latlon.split(',')[0]);
			var z = 0;
			obj.geometry.coordinates.push([x,y,z]);
		}				
		
		obj = smartSort( obj );
		// if( i==0 ) smartSort( obj );
		geoJson.features.push( obj );		

	} else if( !file ) {
		console.log( "couldn't read "+cDir+"/"+cables[i] );
	}
}
// make js object a string
var geoData = JSON.stringify(geoJson);

// write that string to a file
fs.writeFile("new-cable-data.json", geoData, function(err) {
	if(err) return console.log(err);
	console.log("new-cable-data.json was saved!");
}); 

