// the code that's about paragraph types

if (Meteor.isClient) {

	function endParagraphEditing(paraid, contents, template) {
	  // trim leading and trailing whitespace
	  var contents = $.trim(contents);
	  var page = Template.main.topmostpage();
	  var originalContents = Template.page.contents.call(page)

	  // The paragraph has likely changed.  We want to:
	  //  -- parse the contents of the paragraph, so that we know whether
	  //     to split it, delete, or what.
	  //  -- update the DOM of the non-editing version
	  //  -- update the Page that the paragraph lives in, so that it gets persisted.
	  var newContents = [];
	  _.each(originalContents, function (para, index, list) {
	    if (para.guid == paraid) {
	      if (contents.length > 0) {
	        var subparas = _.map(contents.split(/\n\n+/),
	          function(value) { 
	            return {
	              type: 'para',
	              guid: guid(),
	              value: value
	          }});
	        newContents = newContents.concat(subparas);
	      }
	    } else {
	      newContents.push(para);
	    }
	  })

	  Session.set("editand", null);
	  Session.set("editing_para", null);

	  var timestamp = (new Date()).getTime();
	  Pages.update(page._id, {$set: {contents: newContents, mtime: timestamp}});
	}

	Template.para.events({
	  'blur': function(evt, template) {
	    if (! Session.get("editing_para")) return; // otherwise random paragraphs get deleted!
	    var contents = $(evt.target).val();
	    endParagraphEditing(this.guid, contents, template);
	  },

	  'keydown .para': function(evt, template) {
	    if (evt.which == 27) {
	      var contents = evt.target.value;
	      console.log("on escape", this.guid, contents, template)
	      endParagraphEditing(this.guid, contents, template);
	    }
	  },
	});

	Template.para.editing = function (arg) {
	  return Session.equals('editing_para', this.guid);
	};

	Template.para.events({

	  'dblclick .editable': function (evt, tmpl) {
	    evt.stopPropagation();
	    evt.preventDefault();
	    startEditParagraph(this, tmpl)
	  },

	})	
}
var ParaType = {
	toString: function(para) {
		return para.value;
	}
}

var TYPES = TYPES || {};
TYPES['para'] = ParaType;
