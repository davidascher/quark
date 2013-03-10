// This keeps user-authored stuff indexed in sqlite

var sqlite3 = require('sqlite3');
var allpages = Pages.find();
var Future = require('fibers/future'), wait = Future.wait;
var db;
var restify = require('restify');
var assert = require('assert');
var SKEY = process.env['BING_APP_ID'];
var client = restify.createJsonClient({
  url: 'https://api.datamarket.azure.com',
});

if (!SKEY) {
	Meteor._debug("Web search requires an environment variable called BING_APP_ID.")
}

var ServiceRootURL = "https://api.duckduckgo.com";

Meteor.methods({
  search: function (term) {
		if (!term) return;
  	Meteor._debug("DOING A SEARCH FOR", term);
    var fut = new Future();
    //select snippet(paragraphs) from paragraphs where data match 'tarte';
    // XXX add title searches too, and rank them higher.
    // XXX figure out ranking in general.
    db.all("SELECT DISTINCT key,SNIPPET(pages) FROM pages WHERE data MATCH '" + term + "';",
    	function(err, rows) {
		    Meteor._debug(rows);
		    var results = [];
		    for (var i = 0; i < rows.length; i++) {
		    	results.push({'pageId': rows[i]['key'], 'snippets': rows[i]["SNIPPET(pages)"]})
		    }
	    	fut.ret(results);
	    })
    var myresults = fut.wait();
    return myresults;
	},
	searchremote: function(term) {
  	Meteor._debug("DOING A Bing SEARCH FOR", term);
		if (!term) return;
    var fut2 = new Future();

    client.basicAuth(SKEY, SKEY);
    client.get('/Bing/Search/v1/Composite?Sources=\'web\'&Query=\'' + term + '\'&$format=JSON&$top=50&$skip=0', function(err, req, res, obj) {
    	if (!obj || !obj.d || !obj.d.results || !obj.d.results[0] || !obj.d.results[0].Web) {
    		Meteor._debug("internet down?");
    		fut2.ret([]);
    		return;
    	}
			var subanswers = obj.d.results[0].Web;
			Meteor._debug(subanswers);
			var parts = [];
			for (var i = 0; i < subanswers.length; i++) {
				var answer = subanswers[i];
				Meteor._debug(answer);
				parts.push({'url': answer.Url, 'title': answer.Title, 'description': answer.Description});
			}
			fut2.ret(parts);
			Meteor._debug(parts);
    });
    return fut2.wait();
  }
});

var aggregateParagraphText = function(contents) {
	var bits = [];
	_.each(contents, function(para, index, list) {
		var typePlugin = TYPES[para.type];
		if (typePlugin && typePlugin.toString)
			bits.push(typePlugin.toString(para));
	})
	return bits.join('\n')
}

var onPageChange = {
	added: function(id, fields) {
		// Meteor._debug("added", id, fields);
		// using OR REPLACE in case we're getting replays by meteor.
		var text = aggregateParagraphText(fields.contents);
		// console.log("Indexing page:", id);
		db.run("INSERT OR REPLACE INTO pages VALUES ($key, $data)", {
			$key: id,
			$data: text
		})
	},
	changed: function(id, fields) {
		// Meteor._debug("changed", id, fields);
		if (fields['content']) { // some updates are just index tweaks for example
			var text = aggregateParagraphText(fields.contents);
			db.run("INSERT OR REPLACE INTO paragraphs VALUES ($key, $data)", {
				$key: id,
				$data: text
			})
		}
	},
	removed: function(id) {
		Meteor._debug("removed", id);
	}
}

db = new sqlite3.Database('pages.sqlite3', function() {
	db.run("CREATE VIRTUAL TABLE pages USING fts4(key, data);", function() {});
});
Meteor.startup(function () {
	allpages.observeChanges(onPageChange)
});

