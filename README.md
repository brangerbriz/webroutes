
![WebRoutes Image](webroutes.png)

#WebRoutes: Internet mapping artware

_WebRoutes_ is a critical artware project that provides users with a window into the Internet infrastructure 
and geopolitical network topology that is inherently invisible to them as they browse the web. Viewing a website 
is much more than an exchange between you and that website. _WebRoutes_ illustrates how every HTTP request can 
mean crossing country borders and interacting with dozens of companies who own and control portions of Internet 
infrastructure a webpage must use to get to your computer. By visualizing an augmented traceroute process, 
_WebRoutes_ identifies the Autonomous Networks (AS), ISPs, Internet Exchange Point (IXP) crossings, and Submarine 
Cables that work together to ping-pong TCP/IP packets back and forth from web browsers to servers. By 
elongating a process that usually takes milliseconds, _WebRoutes_ allows users to follow, analyze, and draw 
conclusions about the intricate, often counter-intuitive, paths their packets take on their journey through 
the Internet.



## Accuracy

_WebRoutes_ is a digital litearcy artware project and should not be used as a network diagnostic tool. Tracking a 
network packet's journey across the Internet is a very difficult task. The protocols that network packets use to 
traverse the Internet do not provide sufficient information to accurately model their route topology, yet alone 
convert IP addresses to geolocations. Tools like `traceroute`, `tracert`, and `mtr` subvert elements of network 
protocols in ways that allow them to be used as route mapping tools, however, the Internet is not designed in 
a way that makes this easy or accurate. For this reason, we've taken the liberty of making quite a lot of 
assumptions, generalizations, and flat-out guesses about the information that _WebRoutes_ provides. The tools 
and APIs that we've utilized to build _WebRoutes_ has been in the interest of painting "the big picture" of 
Internet infrastructure. To see how/what we used to detail this journey see the [Approach](#Approach) 
section below.

