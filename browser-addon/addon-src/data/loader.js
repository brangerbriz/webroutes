
// inject loader cover .....................

var tracerouteblinds = document.createElement('div');
	tracerouteblinds.id = "traceroute-blinds";
	tracerouteblinds.style.width = "100%";
	tracerouteblinds.style.height = "100%";
	tracerouteblinds.style.position = "fixed";
	tracerouteblinds.style.left = "0px";
	tracerouteblinds.style.top = "0px";
	tracerouteblinds.style.zIndex = "1000000000000000000";
	tracerouteblinds.style.background = "#000";

// var traceroutemodal = document.createElement('div');
// 	traceroutemodal.id = "traceroute-modal";
// 	traceroutemodal.style.width = "100%";
// 	traceroutemodal.style.padding = "20px";
// 	traceroutemodal.style.position = "relative";
// 	traceroutemodal.style.background = "#fff";
// 	traceroutemodal.style.fontFamily = "monospace";

// var traceroutestatus = document.createElement('div');
// 	traceroutestatus.id = "traceroute-status";
// 	traceroutestatus.innerHTML = 'mapping route to <span style="color:red">'+window.location.host+'</span>';

var tracerouteinfo = document.createElement('pre');
	tracerouteinfo.id = "traceroute-info";
	tracerouteinfo.style.position = "absolute";
	tracerouteinfo.style.zIndex = "1000000000000000001";
	tracerouteinfo.style.left = "100px";
	tracerouteinfo.style.top = "20px";
	tracerouteinfo.style.color = "#fff";


	// traceroutemodal.style.overflow = "auto"
	

// traceroutemodal.appendChild( traceroutestatus );
// traceroutemodal.appendChild( tracerouteinfo );
// tracerouteblinds.appendChild( traceroutemodal );

document.body.appendChild(tracerouteblinds);
document.body.appendChild(tracerouteinfo);

window.addEventListener('scroll',function(e){
	var cap = tracerouteinfo.offsetHeight - innerHeight + 20;
	if( e.pageY >= cap){
		document.documentElement.scrollTop = cap;
	}
});



// loading animation ........................

// var traceroutecolor = 'red';
// var tracerouteloop = setInterval( tracerouteloading, 250 );

// function tracerouteloading(){
// 	traceroutecolor = (traceroutecolor=="red") ? 'black' : 'red'; 
// 	traceroutestatus.innerHTML = 'mapping route to <span style="color:'+traceroutecolor+'">'+window.location.host+'</span>';
// 	traceroutemodal.style.top = window.innerHeight/2 - traceroutemodal.offsetHeight/2 + "px";
// 	traceroutemodal.style.left = window.innerWidth/2 - traceroutemodal.offsetWidth/2 + "px";	
// }
