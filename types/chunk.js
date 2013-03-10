// chunk.js

if (Meteor.isClient) {
	Template.chunk.json = function() {
	  return JSON.stringify(this);
	}
}

