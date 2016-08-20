const request = require("request")
const defaultCb = () => console.error('IpApi.getLocation(): you forgot to add a real callback, firing default');

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
		    if (response.statusCode === 200) {
		        callback(null, body)
		    } else callback(response, null)
		});
	}
}

module.exports = GeoIpLookup;
