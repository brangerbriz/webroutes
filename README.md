
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

## Download

_WebRoutes_ is not yet available for download, but we expect to publish our first release by October 2016.

## Approach

### Resources/Libraries

_WebRoutes_ is released under the [GPL](LICENSE) and is free to use, edit, copy, and distribute our code.

#### Code

_WebRoutes_ is built with Node.js and bundled/distributed with [NW.js](http://nwjs.io/). It uses the
`[traceroute](https://en.wikipedia.org/wiki/Traceroute)` command underneath. 

See "dependencies" in `[nw-app/package.json](nw-app/package.json)` for a list
of all dependecies.

#### Data

_WebRoutes_ uses data from [Telegeography's](https://www.telegeography.com/) 
[Submarine Cable Map](https://github.com/telegeography/www.submarinecablemap.com) and  
[Internet Exchange Map](https://github.com/telegeography/www.internetexchangemap.com)
projects. Ocean and country border map data are provided by [Natural Earth](http://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-ocean/) and
 [thematicmapping.org](http://thematicmapping.org/downloads/world_borders.php) respectively. Geo IP lookup service is provided by [ip-api.com](http://ip-api.com).

### Geolocation from IP Address

We've found free IP Address to Geolocation services to be wildly innacurate. Ip-api.com does not provide information about its sources, and we've found results for the same IP Addresses to vary greatly between paid services like [IP2Location](http://www.ip2location.com/), [ipinfo.io](http://ipinfo.io/), [EurekAPI](eurekapi.com), [DB-IP](https://www.db-ip.com), and [MaxMind](https://www.maxmind.com/). We use ip-api as our main IP->Geo service, however, we also cross reference MaxMind's free GeoipLite2 IP->Country database to ensure that there is at least rough consensus that IP addresses are coming from the correct country. If we receive contradicting results from those two services we choose to ignore the IP address completely and not show the hop to the user.

### IXP crossing detection

Detecting where exactly packets are handed off from one network to another is tricky. It should be assumed that whenever a hop's autonomous network differs from a previous hop, that network exchange likely occured at an Internet eXchange Point. However, identifying exactly which IXP the exchange occured at is nearly impossible. A new tool/paper on the subject called [TraIXroute](https://github.com/gnomikos/traIXroute) has made significant progress in augmenting traceroute with IXP cross detection information. Unfortunately, our experience found that it had very poor results in the United States, where we have been writing and testing _WebRoutes_.

Instead we chose to use an approach that favors detecting IXPs with a low confidence as to their accuracy over not showing IXP crossings at all. Each time two hops ASN (Autonomous System Number) differ we assume that an IXP was crossed, and identify that crossing to have occurred at the nearest IXP to the earlier hop. Because an ASN change between two hops provides no information as to which hop (from or to) actually facilitated the network exchange, our method should be considered very naive. A better approach would be to use publicly available data about IXP traffic (IXPs very greatly in their traffic throughput/activity, and while there are a great many IXPs around the world, only a handful of them exchange the majority of the world's Internet traffic) to preference IXPs with high daily activiy.

<!--
### Submarine Cable detection

### Handling Trace Timeouts
-->




