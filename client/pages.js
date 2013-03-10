var Pages = new Meteor.Collection("pages");
// var Paras = new Meteor.Collection("paras");
// var parasHandle = Meteor.subscribe("paras"); // probably needs to be more efficient, TBD XXX
var pagesHandle = Meteor.subscribe("pages"); // probably needs to be more efficient, TBD XXX
var Redirects = new Meteor.Collection("redirects");
var DOING_TRANSITIONS = false; // XXX turned off for now

Session.set("idStack", []); // default

/*///////////////////////

Adds support for passing arguments to partials. Arguments are merged with 
the context for rendering only (non destructive). Use `:token` syntax to 
replace parts of the template path. Tokens are replace in order.

USAGE: {{$ 'path.to.partial' context=newContext foo='bar' }}
USAGE: {{$ 'path.:1.:2' replaceOne replaceTwo foo='bar' }}

///////////////////////////////*/

Handlebars.registerHelper('passid', function(partial) {
  if (!partial) console.error("No partial name given.")

  var values = Array.prototype.slice.call(arguments,1)
  var opts = values.pop()
  var done, value

  while (!done) {
    value = values.pop()
    if (value) partial = partial.replace(/:[^\.]+/, value)
    else done = true
  }

console.log("partial", partial);
console.log(opts);
  partial = Handlebars._default_helpers[partial]
  if (!partial) return ''

  var context = _.extend({}, opts.context||this, _.omit(opts, 'context', 'fn', 'inverse'))
  return new Handlebars.SafeString( partial(context) )
})

Handlebars.registerHelper('$', function(partial) {
  if (!partial) console.error("No partial name given.")

  var values = Array.prototype.slice.call(arguments,1)
  var opts = values.pop()
  var done, value

  while (!done) {
    value = values.pop()
    if (value) partial = partial.replace(/:[^\.]+/, value)
    else done = true
  }

console.log("partial", partial);
console.log(opts);
  partial = Handlebars._default_helpers[partial]
  if (!partial) return ''

  var context = _.extend({}, opts.context||this, _.omit(opts, 'context', 'fn', 'inverse'))
  return new Handlebars.SafeString( partial(context) )
})


// -- Search --

function doSearch(searchterm) {
  var results = [];
  if (! searchterm) {
    Session.set("doing-search", false);
    return;
  }

  Session.set("doing-search", true);
  Session.set("done-local-search", false);
  Session.set("done-remote-search", false);
  Meteor.call("search", searchterm, function(err, local) {
    for (i = 0; i < local.length; i++) {
      var page = Pages.findOne(local[i]['pageId']);
      var p = {'name': page.name, 'pageId': page._id, snippets: []};
      snippets = local[i]['snippets'];
      p['snippets'] = ["<p>" + snippets.split('\n').join('</p><p>') + "</p>"];
      results.push(p);
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

// -- main template --

Template.main.loading = function() {
  return pagesHandle && !pagesHandle.ready();
}

Template.main.nextPage = function() {
  if (Session.get('nextPage'))
    return Pages.findOne({'name': Session.get('nextPage')});
}

Template.main.transitioning = function() {
  return Session.get("transitioning");
}

Template.main.nolocalsearchresults = function() {
  return Session.get('no-local-search-results');
}

Template.main.noremotesearchresults = function() {
  return Session.get('no-remote-search-results');
}

Template.page.redirected_from = function() {
  return Session.get("redirected-from");
}

Template.page.equal = function(a,b) {
  return a == b;
}

Template.page.chunk = function() {
  // type is the type of template we need
  var type = this.type;
  // find the template?
  return Template[type](this);
}

Template.fourohfour.url_name = function() {
  return Session.get('targetpath')
}

Template.main.rendered = function() {
  $(".draggable-card").draggable({ opacity: 0.7, helper: "clone" });

  $( ".page" ).droppable({
    accept: ".draggable-card",
    activeClass: "ready",
    hoverClass: "activated",
    drop: function(event, ui) {
      var droppedPageId = ui.draggable.attr('data-id');
      var type = ui.draggable.attr('type');
      var pageId = $(event.target).attr('data-id');
      var page = Pages.findOne(pageId);
      var timestamp = (new Date()).getTime();

      var content;
      if (type === "page") {
        var droppedPage = Pages.findOne(droppedPageId);
        if (!droppedPage) {
          console.log("Uh-oh -- couldn't find page ", droppedPageId, ", maybe there's a corrupt sqlite?");
          return;
        }

        var pageName = droppedPage.name;
        // escape ]'s in pagenames XXX
        content = "[[" + pageName + "]]";
      } else {
        content = "[" + droppedPageId + ' ' + ui.draggable.attr('data-label') + "]";
      }
      para = {type: 'para', value: content, guid: guid(), pageId: page._id};
      var contents = page.contents;
      contents.push(para);
      Pages.update(pageId, {$set: {contents: contents, mtime: timestamp}});
      ui.draggable.remove();
    }
  });
};

Template.main.topmostpage = function() {
  var stackIds = Session.get("idStack");
  if (!stackIds) return;
  var id = stackIds[stackIds.length-1];
  var page = Pages.findOne(id);
  return page;
}

// not currently used, but ready in case we want to display history
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


// -- 404 handling: offer to create a new page --

Template.fourohfour.events({
  'click .doit': function(evt) {
    var name = Session.get('targetpath')
    var timestamp = (new Date()).getTime();
    var newpageId = Pages.insert({name: name, mtime: timestamp,
      contents: [{type: 'para', value: "This is an default page. Very sad.  Make it personal?",
      guid: guid()}]});
    var stack = Session.get("idStack")
    stack.push(name);
    Session.set("idStack", stack)
  }
})

// -- new paragraph template --

function addParaToPage(page, defaultValue) {
  contents = page.contents;
  var id = guid();
  contents.push({type: 'para', value: defaultValue, guid: id});
  var timestamp = (new Date()).getTime();
  Pages.update(page._id, {$set: {contents: contents, mtime: timestamp}});
  Session.set("editing_para", id); 
  Meteor.flush(); // force DOM redraw, so we can focus the edit field
  activateInput($("#para-textarea")); // XXX hacky - assumes only one such thing in page.
}

Template.newpara.events({
  'click': function(evt) {
    addParaToPage(this, "Make this paragraph say what you want it to.");
  }
})

// -- new link template --

Template.newlink.events({
  'click': function(evt) {
    addParaToPage(this, "This is how you add a link to a [http://www.mozilla.org page on another website]");
  }
})

// -- new page button template --

function generateNewPageName() {
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
  return newpagename;
}

Template.newpage.events({
  'click': function(evt) {
    // this creates a paragraph containing a link to a page that doesn't exist.
    // and inserts it at the end of the current page.
    var newpagename = generateNewPageName();
    addParaToPage(this, "Link to a [[" + newpagename + "]]");
  }
})

// -- heartable pages, and their lists

Template.heart.events({
  'click i.heart': function(evt, tmpl) {
    Pages.update(this._id, {$set: {starred: !this.starred}})
  }
})

Template.heartedpages.pages = function() {
  return Pages.find({starred: true}, {sort: {name: 1}}); // alpha
};

Template.recentpages.pages = function() {
  return Pages.find({}, {sort: {mtime: -1}}); // most recently modified first
};

// -- editable page titles --

Template.editablepagetitle.editing_title = function() {
  return Session.get("editing_title");
}

var endPagetitleEditing = function(evt, tmpl) {
  evt.stopPropagation();
  evt.preventDefault();
  Session.set("editing_title", null);
  var oldpagename = $(evt.target).attr('original-value');
  var page = Pages.findOne({'name': oldpagename});
  if (!page) return;
  var newpagename = tmpl.find("#title-input").value;
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
      endPagetitleEditing(evt, tmpl);
    }
  }
})

// This will return the template that corresponds to the type attribute
// of the object that it's applied to.  So
//  {{dispatchtype object}}
// if object.type == orange, will be equivalent to
//  {{>orange object}}

Handlebars.registerHelper('dispatchtype', function(chunk, options) {
  return new Handlebars.SafeString(Template[chunk.type](this));
});

// -- this is needed for css transitions, which we may not need -- not clear whether we need all of these

Template.page.preserve(['.wrap', '.card', '#root']);

// -- the page template

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

Template.page.contents = function() {
  var chunks = this.contents;
  var pageId = this._id;
  _.each(chunks, function(chunk) {
    if (! chunk.guid)
      chunk.guid = guid();
  });
  return chunks;
}


var activateInput = function (input) {
  input.focus();
  input.select();
};

var startEditParagraph = function(para, tmpl) {
  var guid = para.guid;
  Session.set("editing_para", guid);
  Session.set("editand", guid);
  Meteor.flush(); // force DOM redraw, so we can focus the edit field
  activateInput(tmpl.find("#para-textarea"));
}

var renderInternalLink = function(match, name) {
  var slug = name.replace('"', '&quot;', 'g');
  var slug = name.replace("'", '&squot;', 'g');
  return "<a class=\"internal\" data=\"" + slug + "\" href=\"/" + slug + "\" title=\"" + "\">" + name + "</a>";
};

Handlebars.registerHelper('linkify', function(content, options) {
  var original = content;
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
  var contents = [];
  var chunks = $(event.target).closest('.page').find(".chunk");
  _.each(chunks, function(element,index,list) {
    contents.push(JSON.parse($(element).attr('data-json')));
  });
  var id = $(event.target).closest('.page').attr('data-id');
  Pages.update(id, {$set: {contents: contents}})
}


function setHomePage() {
  Session.set("idStack", ['Welcome']); // default home page
  return 'main';
}

function setPage (unescapedPageName) {
  var stack = Session.get("idStack");
  var page = Pages.findOne({'name': unescapedPageName})
  if (DOING_TRANSITIONS) {
    // console.log("in setPage", stack, stack[stack.length - 1], page);
    // console.log("TRANSITIONING, BABY");
    // Session.set("nextPage", unescapedPageName);
    // Meteor.flush();
    // Session.set("transitioning", true);
    // Meteor.flush();
  }
  if (!page) { // we don't have data yet, offer to create one
    var redirect = Redirects.findOne({old_name: unescapedPageName});
    if (redirect) {
      var newpage = Pages.findOne(redirect.original_id);
      var target = newpage.name;
      if (newpage._id == stack[stack.length-1]) { // we're likely doing a back button want to skip past redirect
        target = stack[stack.length-2]; // XXX is it possible that there isn't one?
      }
      Meteor.defer(function() {
        // We store the from and to, so we can detect on page render whether we need to indicate
        // that there was a redirection.
        Session.set('redirected-from', unescapedPageName)
        Session.set('redirected-to', target)
        Meteor.Router.to('/'+target);
      })
      return;
    } else {
      Session.set('targetpath', unescapedPageName)
      id = '404'; // this will trigger the right template thing.
    }
  } else {
    if (Session.get('redirected-to') != unescapedPageName) {
      // it's a non-redirected visit, so clear the markers.
      Session.set('redirected-from', '')
      Session.set('redirected-to', '')
    }
    id = page._id;
  }
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



