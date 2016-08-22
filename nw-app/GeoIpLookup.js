const request = require("request");
const getMyIp = require("external-ip")({'timeout': 10000, 'getIP': 'parallel'});

const defaultCb = () => console.error('IpApi: you forgot to add a real callback, firing default');

class GeoIpLookup {

	static getLocation(ip, callback=defaultCb) {
		
		let fields = 'country,countryCode,region,regionName,';
		fields += 'city,zip,lat,lon,timezone,isp,org,as,';
		fields += 'mobile,proxy,query,status,message';
		
		request({
		    url: `http://ip-api.com/json/${ip}?fields=${fields}`,
		    json: true
		}, function (error, response, body) {

			if (error) callback(error, null)
		    if (response && response.statusCode === 200) {
		        callback(null, body)
		    } else callback(response, null)
		});
	}

	static getMyLocation(callback=defaultCb) {
		getMyIp((err, ip) => {

		    if (err) {
		    	throw err;
		    	callback('GeoIpLookup.getMyLocation(): Error looking up external IP address', null);
		    }
		    else this.getLocation(ip, callback);
		});
	}
}

module.exports = GeoIpLookup;
