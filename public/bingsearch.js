// bingsearch.js
request = require('request');
fs = require('fs');

function bing(term, top, skip, cb) {
	// var ServiceRootURL = "https://api.duckduckgo.com";
    var ServiceRootURL =  'https://api.datamarket.azure.com/Bing/Search/v1/Composite';
    var SKEY = process.env['BING_APP_ID'];
    console.log("SKEY", SKEY);
    var params = {
         Sources: "'web'", 
         Query: "'"+term+"'", 
         '$format': "JSON", 
         '$top': top, '$skip': skip
       },
       req = request.get(ServiceRootURL).auth(SKEY, SKEY, false).qs(params);
    request(req, cb)	
}

bing('tomato', 50, 0, function(err, response, body) {
	fs.writeFileSync("bing.json", body)
	console.log(JSON.parse(body));
})