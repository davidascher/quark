// This keeps user-authored stuff indexed in sqlite

var sqlite3 = require('sqlite3');
var allparas = Paras.find();
var Future = require('fibers/future'), wait = Future.wait;
var db;
var restify = require('restify');
var assert = require('assert');
var SKEY = process.env['BING_APP_ID'];
var client = restify.createJsonClient({
  url: 'https://api.datamarket.azure.com',
});


var ServiceRootURL = "https://api.duckduckgo.com";

Meteor.methods({
  search: function (term) {
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
		if (!term) return;
    var fut2 = new Future();

    client.basicAuth(SKEY, SKEY);
    client.get('/Bing/Search/v1/Composite?Sources=\'web\'&Query=\'' + term + '\'&$format=JSON&$top=50&$skip=0', function(err, req, res, obj) {
			var subanswers = obj.d.results[0].Web;
			var parts = [];
			for (var i = 0; i < subanswers.length; i++) {
				var answer = subanswers[i];
				parts.push({'url': answer.Url, 'title': answer.Title, 'description': answer.Description});
			}
			fut2.ret(parts);
    });
    return fut2.wait();
  }
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

