
// inject loader cover .....................

var tracerouteblinds = document.createElement('div');
	tracerouteblinds.id = "traceroute-blinds";
	tracerouteblinds.style.width = "100%";
	tracerouteblinds.style.height = "100%";
	tracerouteblinds.style.position = "fixed";
	tracerouteblinds.style.left = "0px";
	tracerouteblinds.style.top = "0px";
	tracerouteblinds.style.zIndex = "999999999999999999999999";
	tracerouteblinds.style.background = "rgba(0,0,0,0.75)";

var traceroutemodal = document.createElement('div');
	traceroutemodal.id = "traceroute-modal";
	traceroutemodal.style.width = "25%";
	traceroutemodal.style.padding = "20px";
	traceroutemodal.style.position = "relative";
	traceroutemodal.style.background = "#fff";
	traceroutemodal.style.fontFamily = "monospace";

var traceroutestatus = document.createElement('div');
	traceroutestatus.id = "traceroute-status";
	traceroutestatus.innerHTML = 'mapping route to <span style="color:red">'+window.location.host+'</span>';
var tracerouteinfo = document.createElement('div');
	tracerouteinfo.id = "traceroute-info";
	

traceroutemodal.appendChild( traceroutestatus );
traceroutemodal.appendChild( tracerouteinfo );
tracerouteblinds.appendChild( traceroutemodal );
document.body.appendChild(tracerouteblinds);



// loading animation ........................

var traceroutecolor = 'red';
var tracerouteloop = setInterval( tracerouteloading, 250 );

function tracerouteloading(){
	traceroutecolor = (traceroutecolor=="red") ? 'black' : 'red'; 
	traceroutestatus.innerHTML = 'mapping route to <span style="color:'+traceroutecolor+'">'+window.location.host+'</span>';
	traceroutemodal.style.top = window.innerHeight/2 - traceroutemodal.offsetHeight/2 + "px";
	traceroutemodal.style.left = window.innerWidth/2 - traceroutemodal.offsetWidth/2 + "px";	
}
