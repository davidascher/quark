// The code needed for JSON data chunk types

if (Meteor.isClient) {

  function escape (key, val) {
      if (typeof(val)!="string") return val;
      return val
        .replace(/[\"]/g, '\\"')
        .replace(/[\\]/g, '\\\\')
        .replace(/[\/]/g, '\\/')
        .replace(/[\b]/g, '\\b')
        .replace(/[\f]/g, '\\f')
        .replace(/[\n]/g, '\\n')
        .replace(/[\r]/g, '\\r')
        .replace(/[\t]/g, '\\t')
      ; 
  }

  Template.style.events({
    'click .view_source' : function(event, tmpl) {
      var styleChunk = this;
      var pageElt = $(event.target).closest('.page');
      var chunk = $(event.target).closest(".chunk");
      Quark.editor.show(styleChunk.value, 'css', pageElt, function (newcode) {
        Session.set('style', newcode)
        styleChunk.value = newcode;
        contents = JSON.parse(chunk.attr("data-json"));
        contents.value = newcode;
        chunk.attr('data-json', JSON.stringify(contents));
      });
    },
  })

  Template.style.size = function() {
    return this.value.length;
  };

  Template.style.render = function(arg, arg2) {
    if (Session.get('style')) 
      return Session.get("style")
    else
      return this.value;
  };
}

// the code that's about paragraph types

var StyleType = {
    toString: function(chunk) {
        // for testing purposes, we'll just look at the values
        return chunk.value;
    },
    bootstrap: function() {
        Meteor._debug("CREATING Style TEST Page");
        Pages.insert({
            name: "Style test",
            _id:"_tyle",
             contents: [
               {type: 'para', value: "This is a paragraph of a page w/ a style blob.", guid: guid()},
               {type: 'style', value: ".card {background: orange; color: white}", guid: guid()},
             ]
        });
    }
}

var TYPES = TYPES || {};
TYPES['style'] = StyleType;

if (Meteor.isServer) {

}