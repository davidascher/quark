// The code needed for JSON data chunk types

if (Meteor.isClient) {
	Template.json.events({
		'click .show_source' : function(event, tmpl) {
      var styleChunk = this;
      var pageElt = $(event.target).closest('.page');
      var chunk = $(event.target).closest(".chunk");
      chunkid = chunk.attr("guid");
      Quark.editor.editchunk(chunkid, pageElt);
		}
	})

	Template.json.size = function() {
		return this.value.length;
	}
}

// the code that's about paragraph types

var JSONType = {
	toString: function(chunk) {
		// for testing purposes, we'll just look at the values
		return chunk.value;
	},
	bootstrap: function() {
		Meteor._debug("CREATING JSON TEST Page");
		Pages.insert({
			name: "JSON test",
		 	_id:"_json",
			 contents: [
			   {type: 'para', value: "This is a paragraph of a page w/ a JSON blob."},
			   {type: 'json', value: "{a: 123, b: 'foo'}"},
			 ]
		});
	},
  editorMode: {name: "javascript", json: true},
  onCodeChange: function(chunkid, newcode) {
    var chunk = $("[guid=\"" + chunkid + "\"]");
    console.log("chunkid", chunkid, "chunk", chunk);
    contents = JSON.parse(chunk.attr("data-json"));
    contents.value = newcode;
    chunk.attr('data-json', JSON.stringify(contents));
  }
}

var TYPES = TYPES || {};
TYPES['json'] = JSONType;

if (Meteor.isServer) {

}