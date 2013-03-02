// // bingsearch.js
// request = require('request');
// fs = require('fs');

// function bing(term, top, skip, cb) {
// 	// var ServiceRootURL = "https://api.duckduckgo.com";
//     var ServiceRootURL =  'https://api.datamarket.azure.com/Bing/Search/v1/Composite';
//     console.log("SKEY", SKEY);
//     var params = {
//          Sources: "'web'", 
//          Query: "'"+term+"'", 
//          '$format': "JSON", 
//          '$top': top, '$skip': skip
//        },
//        req = request.get(ServiceRootURL).auth(SKEY, SKEY, false).qs(params);
//     request(req, cb)	
// }

// bing('tomato', 50, 0, function(err, response, body) {
// 	fs.writeFileSync("bing.json", body)
// 	console.log(JSON.parse(body));
// })

var restify = require('restify');
var assert = require('assert');
var SKEY = process.env['BING_APP_ID'];

// Creates a JSON client
var client = restify.createJsonClient({
  url: 'https://api.datamarket.azure.com',
  // url: 'https://us-west-1.api.joyentcloud.com'
});


client.basicAuth(SKEY, SKEY);
client.get('/Bing/Search/v1/Composite?Sources=web&q=tomato&$format=JSON&$top=10&$skip=0', function(err, req, res, obj) {
  // assert.ifError(err);

  console.log(err); // JSON.stringify(obj, null, 2));
  console.log(res); // JSON.stringify(obj, null, 2));
  console.log(obj); // JSON.stringify(obj, null, 2));
});