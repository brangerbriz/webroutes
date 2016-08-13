function traceHttpReq( host ){
	var req = new XMLHttpRequest();
	req.open("GET", "http://localhost:3001/traceroute?location="+host, true);
	req.send(null);	
}

var socket = io.connect("http://localhost:3001");

socket.on('connect_error', function(err){
	self.port.emit("woops", err );
});

socket.on('trace error', function(err){
	console.log(err);
	self.port.emit("trace error", err );
});

socket.on('connect', function(){

	// received 'trace complete' message from server
	socket.on('trace complete', function(hops){
		// let addon (index.js) know that trace was complete		
		self.port.emit("trace complete", hops );
	});

	// received 'trace hop' message from server
	socket.on('trace hop', function(hop){
		// let addon (index.js) know that there was a new hop
		self.port.emit("trace hop", hop );
	});

});


// when received new host from addon: index.js
self.port.on("new host", function( host ){
	// send traceroute httpReq to server
	traceHttpReq( host );
});