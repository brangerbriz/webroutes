
// inject loader cover .....................

var blinds = document.createElement('div');
	blinds.id = "traceroute-blinds";
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

var status = document.createElement('div');
	status.innerHTML = 'mapping route to <span style="color:red">'+window.location.host+'</span>';
var info = document.createElement('div');
	info.id = "traceroute-info";
	

modal.appendChild( status );
modal.appendChild( info );
blinds.appendChild( modal );
document.body.appendChild(blinds);



// loading animation ........................

var color = 'red';
var loop = setInterval( loading, 250 );

function loading(){
	color = (color=="red") ? 'black' : 'red'; 
	status.innerHTML = 'mapping route to <span style="color:'+color+'">'+window.location.host+'</span>';
	modal.style.top = window.innerHeight/2 - modal.offsetHeight/2 + "px";
	modal.style.left = window.innerWidth/2 - modal.offsetWidth/2 + "px";	
}