// TODOs

// new UI for creating new pages: asks for a name; editing names -> makes 302s and tweaks backlinks.
// make some pages starrable


var Pages = new Meteor.Collection("pages");
var Paras = new Meteor.Collection("paras");
var Redirects = new Meteor.Collection("redirects");
var showdown;
var parasHandle = null;
var pagesHandle = null;
var router;
Session.set("idStack", []); // default

parasHandle = Meteor.subscribe("paras"); // probably needs to be more efficient, TBD XXX


Template.slider.helpers({
  currentScreen: function() {
    console.log('in currentScreen')
    x = Meteor.Transitioner.currentPage();
    console.log("CURRENSCREEN",x);
    return x;
  },
  nextScreen: function() {
    console.log('in nextScreen')
    return Meteor.Transitioner.nextPage();
  }
});


function doSearch(searchterm) {
  var results = [];
  var pages = {};
  var pageIds = [];
  if (! searchterm) {
    Session.set("doing-search", false);
    return;
  }

  Session.set("doing-search", true);
  Session.set("done-local-search", false);
  Session.set("done-remote-search", false);
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
    Session.set("no-local-search-results", (results.length == 0));
    Session.set("searchresults", results);
  });

  Session.set("remotesearchresults", null);
  Meteor.call("searchremote", searchterm, function(err, remote) {
    Session.set("remotesearchresults", remote);
    Session.set("no-remote-search-results", (remote.length == 0));
  });
}

Template.main.loading = function() {
  console.log('handle is ready:', parasHandle.ready());
  return parasHandle && !parasHandle.ready();
}

Template.main.nolocalsearchresults = function() {
  return Session.get('no-local-search-results');
}
Template.main.noremotesearchresults = function() {
  return Session.get('no-remote-search-results');
}

Template.fourohfour.url_name = function() {
  console.log(Meteor.Router);
  // path = Meteor.router._currentPath;
  // if (!path) return '';
  // return unescape(path.slice(1));
}

Template.fourohfour.events({
  'click .doit': function(evt) {
    console.log("doing the doit");
    var name = Template.fourohfour.url_name();
    var timestamp = (new Date()).getTime();
    console.log(this);
    var newpageId = Pages.insert({name: name, mtime: timestamp});
    Paras.insert({
      index: 0,
      'page': newpageId,
      'content': ["This is an default page. Very sad.  Make it personal?"]
    })
    // router.go(name);
  }
})

Template.main.rendered = function() {
  $(".draggable-card").draggable({ opacity: 0.7, helper: "clone" });

  $( ".trash" ).droppable({
    accept: ".droppable-card",
    activeClass: "ready",
    hoverClass: "activated",
    drop: function(event, ui) {

    }
  });

  $( ".page" ).droppable({
    accept: ".draggable-card",
    activeClass: "ready",
    hoverClass: "activated",
    drop: function(event, ui) {
      var droppedPageId = ui.draggable.attr('data-id');
      var type = ui.draggable.attr('type');
      var pageId = $(event.target).attr('data-id');
      var timestamp = (new Date()).getTime();
      var index = Paras.find({page: pageId}).count() + 1;
      var content;
      if (type === "page") {
        var pageName = Pages.findOne(droppedPageId).name;
        content = ["[[" + pageName + "]]"];
      } else {
        content = ["[" + droppedPageId + ' ' + ui.draggable.attr('data-label') + "]"];
      }
      Paras.insert({
        index: index,
        'page': pageId,
        'content': content
      })
      ui.draggable.remove();
    }
  });
};

Template.onePage.topmostpage = function() {
  var stackIds = Session.get("idStack");
  if (!stackIds) return;
  var id = stackIds[stackIds.length-1];
  var page = Pages.findOne(id);
  return page;
}

Template.main.pagestack = function() {
  var stackIds = Session.get("idStack");
  if (!stackIds || stackIds.length < 2) return; // history starts one page ago
  var pages = []; // new Meteor.Collection();
  for (var i = 0; i < stackIds.length - 1; i++) {
    var p = Pages.findOne(stackIds[i]);
    if (p) {
      pages.push(p);
    }
  }
  return pages;
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
    // var pageName = Session.get("pageId");
    var id = this._id;
    var index = Paras.find({page: id}).count() + 1;
    var p = Paras.insert({
      index: index,
      'page': id,
      'content': ["Make this paragraph say what you want it to."]
    })
    Session.set("editing_para", p);
    Meteor.flush(); // force DOM redraw, so we can focus the edit field
    activateInput($("#para-textarea")); // XXX hacky - assumes only one such thing in page.
  }
})

Template.newlink.events({
  'click': function(evt) {
    // var pageName = Session.get("pageId");
    var id = this._id;
    var index = Paras.find({page: id}).count() + 1;
    var p = Paras.insert({
      index: index,
      'page': id,
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
    var pageId = this._id;
    // var pageId = Session.get("pageId");
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
  console.log(evt);
  Session.set("editing_title", null);
  var oldpagename = $(evt.target).attr('original-value');
  var page = Pages.findOne({'name': oldpagename});
  if (!page) return;
  console.log(page);
  var newpagename = tmpl.find("#title-input").value;
  console.log("new name", newpagename);
  Pages.update(page._id, {$set: {name: newpagename}})
  // XXX clean up history so old name goes away XXX TODO
  Redirects.insert({old_name: oldpagename, original_id: page._id})
  Meteor.Router.to('/' + newpagename);
  Session.set("editand", null);
  // register a redirect serverside
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
      console.log(evt);
      console.log(evt.target);
      console.log(evt.originalTarget);
      endPagetitleEditing(evt, tmpl);
    }
  }
})

Template.heart.events({
  'click i.heart': function(evt, tmpl) {
    Pages.update(this, {$set: {starred: !this.starred}})
  }
})

Template.page.preserve(['#root']);

Template.page.offset = function() {
  var stack = Session.get("idStack");
  for (var i = 0; i < stack.length; i++) {
    if (stack[i] === this._id) {
      return i;
    }
  }
  return 'none'; // XXX should never happen.
}

Template.page.depth = function() {
  var stack = Session.get("idStack");
  for (var i = 0; i < stack.length; i++) {
    if (stack[i] === this._id) {
      return stack.length - i - 1;
    }
  }
  return 'none'; // XXX should never happen.
}


Template.page.rendered = function() {
  // this.data is the Page
  if (!this.data) return;
  $(".sortable").sortable({ handle: ".drag-handle", 
    update: updateParagraphOrder,
    placeholder: "paragraph-placeholder"
  });
  $( ".drag-handle" ).disableSelection();
  $( ".para" ).enableSelection();
}

Template.page.paras = function() {
	return Paras.find({"page": this._id}, {sort: {index: 1}});
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
  var para = Paras.findOne(id);
  var pageId = para.page; // Session.get("pageId");
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
    if (! Session.get("editing_para")) return; // otherwise random paragraphs get deleted!
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
  // return escape(name);
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
  var rows = $(event.target).find('.para');
  _.each(rows, function(element,index,list) {
    var id = $(element).data('id');
    Paras.update({_id: id}, {$set: {index: index}});
  });
}


function setHomePage() {
  Session.set("idStack", ['Welcome']); // default home page
  console.log('returning main template');
  return 'main';
}

function setPage (unescapedPageName) {
  console.log("in setPage", unescapedPageName);
  var page = Pages.findOne({'name': unescapedPageName})
  if (!page) { // we don't have data yet, offer to create one
    var redirect = Redirects.findOne({old_name: unescapedPageName});
    if (redirect) {
      console.log("FOUND A REDIRECT!", redirect)
      var newpage = Pages.findOne(redirect.original_id);
      Meteor.Router.to('/'+newpage.name); // XXX this is flashy =(
      return;
    } else {
      id = '404'; // this will trigger the right template thing.
    }
  } else {
    id = page._id;
  }
  var stack = Session.get("idStack");
  for (var i = 0; i < stack.length; i++) {
    if (stack[i] === id) {
      stack.splice(i, 1);
      break;
    }
  }
  stack.push(id);
  stack = stack.slice(-4);
  Session.set("idStack", stack)
  return 'main';
}

Meteor.Router.add({
  '/': setHomePage,
  '/:name': setPage
});
Meteor.startup(function () {
  console.log("meteor started");
});



