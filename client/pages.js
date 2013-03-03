// TODOs

// new UI for creating new pages: asks for a name; editing names -> makes 302s and tweaks backlinks.
// make some pages starrable


var Pages = new Meteor.Collection("pages");
var Paras = new Meteor.Collection("paras");
var Redirects = new Meteor.Collection("redirects");
var showdown;

var newRouter = true;

function doSearch(searchterm) {
  var results = [];
  var pages = {};
  var pageIds = [];
  if (! searchterm) {
    Session.set("doing-search", false);
    return;
  }

  Session.set("doing-search", true);

  Meteor.call("search", searchterm, function(err, local) {
    for (i = 0; i < local.length; i++) {
      // XXX this is probably all very slow.
      paraId = local[i]['paraId'];
      para = Paras.findOne(paraId);
      if (!para) return; // XXX
      page = Pages.findOne(para.page);
      var p;
      if (pages[page._id]) {
        p = pages[page._id]
      } else {
        pageIds.push(page._id);
        p = {'name': page.name, 'pageId': page._id, snippets: []};
        pages[page._id] = p;
      }
      snippets = local[i]['snippets'];
      snippets = "<p>" + snippets.split('\n').join('</p><p>') + "</p>";
      p['snippets'].push(snippets);
    }
    for (i = 0; i < pageIds.length; i++) {
      results.push(pages[pageIds[i]]);
    }
    Session.set("searchresults", results);
  });

  Meteor.call("searchremote", searchterm, function(err, remote) {
    console.log("setting remote search results to ", remote)
    Session.set("remotesearchresults", remote);
  });
}

Template.main.rendered = function() {
  $(".searchresults .searchcard").draggable({ opacity: 0.7, helper: "clone" }); //{stack: ".searchresults .searchcard"});
  $( "#page" ).droppable({
    accept: ".searchcard",
    hoverClass: "activated",
    activeClass: "ready",
    drop: function(event, ui) {
      var droppedPageId = ui.draggable.attr('data-id');
      var timestamp = (new Date()).getTime();
      var pageId = Session.get('pageId');
      var index = Paras.find({page: pageId}).count() + 1;
      var pageName = Pages.findOne(droppedPageId).name;
      Paras.insert({
        index: index,
        'page': pageId,
        'content': ["[[" + pageName + "]]"]
      })
      ui.draggable.remove();
    }
  });
};

Template.main.pagestack = function() {
  var stackIds = Session.get("stackIds");
  stackIds = [];
  stackIds.push('foo');
  stackIds.push('bar');
  if (!stackIds) return;
  var pages = new Meteor.Collection();
  for (var i = 0; i < stackIds.length; i++) {
    pages.push(Pages.findOne(stackIds[i]));
  }
}

Template.search.events({
  'keydown #search': function(evt) {
    var searchterm = $("#search")[0].value;
    if (!searchterm) {
      Session.set('doing-search', false);
    } else {
      if (evt.which == 13) {
        doSearch(searchterm);
      }
    }
  },
  'click': function(evt) {
    var searchterm = $("#search")[0].value;
    doSearch(searchterm);
  }
})

Template.main.doingsearch = function() {
  return Session.get("doing-search");
}

Template.main.searchresults = function() {
  var results = Session.get("searchresults");
  return results;
}

Template.main.socialsearchresults = function() {
  var results = Session.get("searchresults");
  results.reverse();
  return results;
}

Template.main.remotesearchresults = function() {
  return Session.get("remotesearchresults");
}

Template.newpara.events({
  'click': function(evt) {
    var pageName = Session.get("pageId");
    var index = Paras.find({page: pageName}).count() + 1;
    var p = Paras.insert({
      index: index,
      'page': pageName,
      'content': ["Make this paragraph say what you want it to."]
    })
    Session.set("editing_para", p);
    Meteor.flush(); // force DOM redraw, so we can focus the edit field
    activateInput($("#para-textarea")); // XXX hacky - assumes only one such thing in page.
  }
})

Template.newlink.events({
  'click': function(evt) {
    var pageName = Session.get("pageId");
    var index = Paras.find({page: pageName}).count() + 1;
    var p = Paras.insert({
      index: index,
      'page': pageName,
      'content': ["This is how you add a link to a [http://www.mozilla.org page on another website]"]
    })
    Session.set("editing_para", p);
    Meteor.flush(); // force DOM redraw, so we can focus the edit field
    activateInput($("#para-textarea")); // XXX hacky - assumes only one such thing in page.
  }
})

Template.newpage.events({
  'click': function(evt) {
    // this creates a paragraph containing a link to a page that doesn't exist.
    // and inserts it at the end of the current page.
    var pageId = Session.get("pageId");
    var names = ['new page', 'another new page', 'a random new page'];
    var newpage = true;
    var i = 0;
    var newpagename = names[i];
    while (newpage != null) {
      newpage = Pages.findOne({name: newpagename});
      if (!newpage) break;
      i++;
      if (i >= names.length) {
        newpagename = 'new page ' + (i-2).toString(); // so they start from 1
      } else {
        newpagename = names[i];
      }
      newpage = Pages.findOne({name: newpagename});
    }
    var timestamp = (new Date()).getTime();
    var newpageId = Pages.insert({name: newpagename, mtime: timestamp});
    Paras.insert({
      index: 0,
      'page': newpageId,
      'content': ["This is an default page. Very sad.  Make it personal?"]
    })
    var index = Paras.find({page: pageId}).count() + 1;
    var p = Paras.insert({
      index: index,
      'page': pageId,
      'content': ["Link to a [[" + newpagename + "]]"]
    })
    Session.set("editing_para", p);
    Meteor.flush(); // force DOM redraw, so we can focus the edit field
    activateInput($("#para-textarea")); // XXX hacky - assumes only one such thing in page.
  }
})

Template.heartedpages.pages = function() {
  return Pages.find({starred: true}, {sort: {name: 1}}); // alpha
};

Template.recentpages.pages = function() {
  return Pages.find({}, {sort: {mtime: -1}}); // most recently modified first
};


Template.editablepagetitle.editing_title = function() {
  return Session.get("editing_title");
}

var endPagetitleEditing = function(evt, tmpl) {
  evt.stopPropagation();
  evt.preventDefault();
  Session.set("editing_title", null);
  var pageId = Session.get('pageId')
  var page = Pages.findOne(pageId);
  var oldpagename = page.name;
  console.log("OLDPAGE NAME", oldpagename);
  if (!page) return;
  var newpagename = tmpl.find("#title-input").value;
  console.log("NEW PAGE NAME", newpagename);
  console.log(page);
  Pages.update(page._id, {$set: {name: newpagename}})
  router.go("/" + newpagename);
  Session.set("editand", null);
  // register a redirect serverside
  Redirects.insert({old_name: oldpagename, original_id: page._id})
}

Template.editablepagetitle.events({
  'blur': function(evt, tmpl) {
    endPagetitleEditing(evt, tmpl);
  },
  'click span.pagetitle': function(evt, tmpl) {
    Session.set("editing_title", true);
    Session.set("editand", this._id);
    Meteor.flush(); // force DOM redraw, so we can focus the edit field
    activateInput(tmpl.find("#title-input"));
  },
  'keydown #title-input': function(evt, tmpl) {
    if (evt.which == 13) {
      endPagetitleEditing(evt, tmpl);
    }
  }
})

Template.heart.starred = function() {
  var page = Pages.findOne(Session.get("pageId"));
  if (!page) return false;
  return page.starred && true;
}

Template.heart.events({
  'click i.heart': function(evt, tmpl) {
    var page = Pages.findOne(Session.get("pageId"));
    Pages.update(page, {$set: {starred: !page.starred}})
  }
})

Template.page.preserve(['.card']);


Template.page.rendered = function() {
  $("#sortable").sortable({ handle: ".drag-handle", 
    update: updateParagraphOrder,
    placeholder: "paragraph-placeholder"
  });
  $( ".drag-handle" ).disableSelection();
  $( ".para" ).enableSelection();
}

Template.page.currentPage = function () {
  id = Session.get("pageId");
  if (!id) return;
  var page = Pages.findOne(id);
  if (!page) return;
  var pageName = page.name;
  if (!pageName) return;
  return pageName.trim();
};

Template.page.paras = function() {
	var pageName = Session.get("pageId");
	var paras = Paras.find({"page": pageName}, {sort: {index: 1}});
  return paras
}

Template.para.editing = function () {
  return Session.equals('editing_para', this._id);
};

Template.page.itemlist = function() {
return Items.find({},{sort:{listposition:1}});
}

function confirmPageExists(pageId) {
  var timestamp = (new Date()).getTime();
  page = Pages.findOne({_id: pageId});
  if (page) {
    Pages.update(page._id,
      {$set: {
        // name: pageName,
        mtime: timestamp}
      });
    return;
  }
  Pages.insert({name: pageName, 
    mtime: timestamp
  });
};


// function handleInternalLinkClick(evt) {
//   evt.stopPropagation();
//   evt.preventDefault();
//   var target = evt.target.getAttribute('data');
//   var pageName = unescape(target);

//   var redirect = Redirects.findOne({old_name: pageName});
//   if (redirect) {
//     // this is an actual client-side redirect, kinda cute!
//     Session.set("pageId", redirect.original_id);
//   } else {
//     Session.set("pageId", pageNameToId(unescape(target)));
//   }
// };

function fixupIndices() {
  var pageName = Session.get("pageId");
  var paras = Paras.find({page: pageName}, {sort: {index: 1}});
  var index = 0;
  paras.forEach(function(para) {
    Paras.update(para._id, {$set: {index: index}});
    index++;
  });
}

function endParagraphEditing(id, index, contents) {
  // trim leading and trailing whitespace
  var contents = $.trim(contents);
  var pageId = Session.get("pageId");
  // if it's empty, get rid of it.
  if (contents.length == 0) {
    Paras.remove(id);
  } else {
    var subparas = contents.split(/\n\n+/);
    var numsubparas = subparas.length;
    // if it has double newlines, split it
    if (numsubparas > 1) {
      Paras.remove(id); // remove the old one
      for (var i = 0; i < subparas.length; i++) {
        Paras.insert({
          page: pageId,
          index: index + (i / numsubparas), 
          content: [subparas[i]]
        });
      }
    } else {
      Paras.update({_id: id}, {
        page: pageId,
        index: index, 
        content: [contents]
      });
    }
  }
  fixupIndices();
  Session.set("editand", null);
  Session.set("editing_para", null);

  confirmPageExists(pageId);
}

var activateInput = function (input) {
  input.focus();
  input.select();
};

var startEditParagraph = function(para, tmpl) {
    Session.set("editing_para", para._id);
    Session.set("editand", para._id);
    Meteor.flush(); // force DOM redraw, so we can focus the edit field
    activateInput(tmpl.find("#para-textarea"));
}


Template.page.events({
  'click .edit-handle': function(evt, tmpl) {
    evt.stopPropagation();
    evt.preventDefault();
    startEditParagraph(this, tmpl);
  },

  'click i.done-handle': function(evt, template) {
    var para = $(evt.target).parent();
    var textarea = para.find("textarea").val();
    endParagraphEditing(this._id, this.index, textarea);

  },

  'dblclick .editable': function (evt, tmpl) {
    evt.stopPropagation();
    evt.preventDefault();
    startEditParagraph(this, tmpl)
    // Session.set("editing_para", this._id);
  },

  'blur': function(evt) {
    var para = $(evt.target).parent();
    var textarea = para.find("textarea").val();
    endParagraphEditing(this._id, this.index, textarea);
  },

  'keydown .para': function(evt) {
    if (evt.which == 27) {
      endParagraphEditing(this._id, this.index, evt.target.value);
    }
  },
});

asSlug = function(name) {
  return name;
//  return name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase();
};

renderInternalLink = function(match, name) {
  var slug = asSlug(name);
  return "<a class=\"internal\" data=\"" + slug + "\" href=\"/" + slug + "\" title=\"" + "\">" + name + "</a>";
};

Handlebars.registerHelper('linkify', function(content, options) {
  var original = content[0];
  converter = new Showdown.converter(); // XXX move this to some appropriate scope
  var html = converter.makeHtml(original);
  var linkified = html.replace(/\[\[([^\]]+)\]\]/gi, renderInternalLink).replace(/\[(http.*?) (.*?)\]/gi, "<a class=\"external\" target=\"_blank\" href=\"$1\" title=\"$1\" rel=\"nofollow\">$2</a>");
  return new Handlebars.SafeString(linkified);
});

var pageNameToId = function(pageName) {
  var page = Pages.findOne({'name': pageName});
  if (page) return page._id;
  return null;
}

function updateParagraphOrder(event, ui) {
  // build a new array items in the right order, and push them
  // stolen from https://github.com/sdossick/sortable-meteor
  console.log("updateParagraphOrder", event.target)
  var rows = $(event.target).find('.para');
  _.each(rows, function(element,index,list) {
    var id = $(element).data('id');
    Paras.update({_id: id}, {$set: {index: index}});
  });
}


if (newRouter) {
  var router;
  Session.set("idStack", []); // at first there is nothing.

  function setPage (arg) {
    console.log("in setPage", arg.params);
    var params = arg.params;
    this.set("post", { title: "Post Title Set in Filter" });
    Session.set("pageId", pageNameToId(unescape(params['_id'])));

    // console.log("in setPage", arg.params);
    // var params = arg.params;
    // params['_id'] = 'Welcome';
    // var id = pageNameToId(unescape(params['_id']));
    // var id = 'Welcome';
    // Session.set("pageId", id);
    // Session.set("idStack", Session.get("idStack").push(id))
    // Session.set("pageId", pageNameToId("Welcome"));
  }

  Meteor.startup(function () {
    router = new Meteor.PageRouter({});
    router.pages({
      '/:_id': { to: 'main', before: [setPage]},
      '/': { to: 'main', 'as': 'Welcome', before: [setPage]}
    });
  });

} else {
  var PagesRouter = Backbone.Router.extend({
    routes: {
      ":pageId": "main",
      "": "index"
    },
    index: function() {
      id = "Welcome"; // special cased in bootstrap code pageNameToId("Welcome");
      Session.set("pageId", id);
    },
    main: function (pageId) {
      console.log("main, pageId = ", pageId)
      Session.set("pageId", pageNameToId(unescape(pageId)));
    },
    setPage: function (list_id) {
      this.navigate(list_id, true);
    }
  });

  Router = new PagesRouter;
  Meteor.startup(function () {
    Backbone.history.start({pushState: true});
  });
}


Meteor.startup(function () {
  $( "#trash" ).droppable({
    accept: ".searchcard",
    hoverClass: "activated",
    activeClass: "ready",
    drop: function(event, ui) {}
  });

});

Meteor.subscribe('pages', function () {
  if (!Session.get('pageId')) {
    // not clear if this does anything
    var page = Pages.findOne({}, {sort: {name: 1}});
    if (page && newRouter)
      Router.setList(page._id);
  }
});

