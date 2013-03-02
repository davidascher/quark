// This keeps user-authored stuff indexed in sqlite

var sqlite3 = require('sqlite3');
var allparas = Paras.find();
var Future = require('fibers/future'), wait = Future.wait;
var db;
var restify = require('restify');
var assert = require('assert');
// var request = require('request');
var SKEY = process.env['BING_APP_ID'];
// Creates a JSON client
var client = restify.createJsonClient({
  url: 'https://api.datamarket.azure.com',
});


var ServiceRootURL = "https://api.duckduckgo.com";

Meteor.methods({
  search: function (term) {
		// return [];
		if (!term) return;
  	Meteor._debug("DOING A SEARCH FOR", term);
    var fut = new Future();
    //select snippet(paragraphs) from paragraphs where data match 'tarte';
    // XXX add title searches too, and rank them higher.
    // XXX figure out ranking in general.
    db.all("SELECT DISTINCT key,SNIPPET(paragraphs) FROM paragraphs WHERE data MATCH '" + term + "';", function(err, rows) {
	    var results = [];
	    for (var i = 0; i < rows.length; i++) {
	    	results.push({'paraId': rows[i]['key'], 'snippets': rows[i]["SNIPPET(paragraphs)"]})
	    }
    	fut.ret(results);
    })
    var myresults = fut.wait();
    return myresults;
	},
	searchremote: function(term) {
		// XXX BROKEN NOT SURE WHY
		if (!term) return;
    Meteor._debug("DOING REMOTE SEARCH FOR", term);

    var fut2 = new Future();

    client.basicAuth(SKEY, SKEY);
    client.get('/Bing/Search/v1/Composite?Sources=\'web\'&Query=\'' + term + '\'&$format=JSON&$top=2&$skip=0', function(err, req, res, obj) {
			var subanswers = obj.d.results[0].Web;
			Meteor._debug(subanswers);
			var parts = [];
			for (var i = 0; i < subanswers.length; i++) {
				var answer = subanswers[i];
				Meteor._debug(answer.Description);
				parts.push({'url': answer.FirstURL, 'text': answer.Description});
			}
			Meteor._debug("About to call .ret() with ", parts)
			fut2.ret(parts);
    });
		Meteor._debug("About to call .wait()")
    return fut2.wait();

  //   var params = { q: "'"+term+"'",  'format': "json"};
		// req = request.get(ServiceRootURL).qs(params);
		// request(req, function(e, r, body) {
		// 	Meteor._debug(e, r, body);
  }

	// bingClient.search(term, function(error, response, data) {
	// 	Meteor._debug(error);
	// 	Meteor._debug(response);
	// 	Meteor._debug(data);
	// 	if (!error && response.statusCode == 200) {
	// 		Meteor._debug(data.SearchResponse.Web.Results[0].Url);
	// 		Meteor._debug(data.SearchResponse.Web.Results);
	// 	} else {
	// 		Meteor._debug("ERROR! " + error + "/" + response.statusCode);
	// 		Meteor._debug("ERROR! " + error.remoteErrors);
	// 	}
	// 	fut.ret(data.SearchResponse.Web.Results)
	// });
	// var otherresults = fut2.wait();
 //    Meteor._debug("GOT LOCAL RESULTS");

	// Meteor._debug(otherresults);
	// return {'local': myresults, 'remote': otherresults};
 //  }
});

var onParaChange = {
	added: function(id, fields) {
		// Meteor._debug("added", id, fields);
		// using OR REPLACE in case we're getting replays by meteor.
		db.run("INSERT OR REPLACE INTO paragraphs VALUES ($key, $data)", {
			$key: id,
			$data: fields['content'][0]
		})
	},
	changed: function(id, fields) {
		// Meteor._debug("changed", id, fields);
		if (fields['content']) { // some updates are just index tweaks for example
			db.run("INSERT OR REPLACE INTO paragraphs VALUES ($key, $data)", {
				$key: id,
				$data: fields['content'][0]
			})
		}
	},
	removed: function(id) {
		Meteor._debug("removed", id);
	}
}

db = new sqlite3.Database('paragraphs.sqlite3', function() {
	db.run("CREATE VIRTUAL TABLE paragraphs USING fts4(key, data);", function() {});
});
Meteor.startup(function () {
	allparas.observeChanges(onParaChange)
});

