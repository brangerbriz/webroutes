
![WebRoutes Image](webroutes.png)

#WebRoutes: visual traceroute software

_WebRoutes_ is a critical artware project that provides users with a window into the internet infrastructure 
and geopolitical network topology that is inherently invisible to them as they browse the web. By visualizing 
an augmented traceroute process, WebRoutes identifies the Autonomous Networks (AS), ISPs, Internet Exchange 
Point (IXP) crossings, and Submarine Cables that work together to ping-pong TCP/IP packets back and forth 
from their web browsers to servers. By elongating a process that usually takes milliseconds, _WebRoutes_ allows 
users to follow, analyze, and draw conclusions about the intricate, often counter-intuitive, paths their packets 
take on their journey through the Internet.

## Accuracy

Tracking a network packet's journey across the internet is a very difficult task. 
The protocols that network packets use to traverse the internet do not provide sufficient information 
to accurately model their route topology, yet alone convert IP addresses to geolocations. Tools 
like `traceroute`, `tracert`, and `mtr` subvert elements of network protocols in ways that allow them to 
be used as route mapping tools, however, the internet is not designed in a way that makes this easy or accurate. 
For this reason, we've taken the liberty of make quite a lot of assumptions, generalizations, and flat-out guesses
about the information that _WebRoutes_ provides. For this reason, _WebRoutes_ __should not__ be used as a network
diagnostic tool. The tools and APIs that we've utilized to build _WebRoutes_ has been in the interest of painting
"the big picture" of internet infrastructure.

