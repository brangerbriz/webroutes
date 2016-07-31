console.log('content_script: ran');
var req = new XMLHttpRequest();
req.open("GET", "http://localhost:3001/?location="+window.location.host, true);
req.addEventListener("load", function() {
	// for confirming that the server got the message
	// ...not working for some reason.
	console.log( 'content_script:', req.responseText ); 
});
req.send(null);

var blinds = document.createElement('div');
	blinds.style.width = "100%";
	blinds.style.height = "100%";
	blinds.style.position = "fixed";
	blinds.style.left = "0px";
	blinds.style.top = "0px";
	blinds.style.zIndex = "999999999999999999999999";
	blinds.style.background = "rgba(0,0,0,0.75)";

var modal = document.createElement('div');
	modal.style.width = "25%";
	modal.style.padding = "20px";
	modal.style.position = "relative";
	modal.style.background = "#fff";
	modal.style.fontFamily = "monospace";
	modal.style.textAlign = "center";
	modal.innerHTML = "mapping route to "+window.location.host;

blinds.appendChild( modal );
document.body.appendChild(blinds);

var dots = "";

function loading(){
	setTimeout( loading, 250 );
	dots += ".";
	if( dots.length > 3 ) dots = "";
	modal.innerHTML = dots+" mapping route to "+window.location.host+" "+dots;
	modal.style.top = window.innerHeight/2 - modal.offsetHeight/2 + "px";
	modal.style.left = window.innerWidth/2 - modal.offsetWidth/2 + "px";	
}

loading();

