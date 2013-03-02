quark
=====

Build notes:
 - needs jquery-ui that matches jquery or para reordering won't work.

Microfeatures
 x renamed pages register redirects serverside [this feel great as a user]
 x click away from textbox should escape / save it
 x persist reorderings through index tweakings
 x import a real corpus (my recipes?)
 x find markdown->html clientside renderer (coauthor code?)
 x get bootstrap.js to read from fs to import recipes into wiki
 x addon to look at history, extract recent urls
 x post handler node.js -> mongo
 x use justext to extract content, store that in sqlite & mongo
 x figure out which subprocess node module to use to outsource jobs to python/justext.
x BACK BUTTON

Todos:

- clean up JS console junk
- chrome whitespace in links?
- chrome doesn't unescape urls, figure out whether to slugify


- on rename, history gets borked because the old page no longer exists.  fix.

Code
  - do mongo search of page titles
  - Pages should have a type: page, link, image, json, code?
  - think about SQL schema so that para keys and page keys are SQL IDs.

Testing
 - put phone/tablet/desktop switch in main UI for testing
 - manual tests:
 	- dragging cards not clipped by search strip
 - test suite (past bugs)
	 - hearting/unhearting
	 - editing page title
	   - following resulting redirects
	   - editing not first page title
	 - search


UX
  - search sidebar goes away when not searching (or there's a way to make it be the same as browse)
  - modes?  navigate vs. author page vs. search vs. curate?

  - think about scrolling regions, e.g.:


           +---------------------+------------------+
           |                     | search field  |OK|
           |  +---------------+  +------------------+
           |  |+---------------+ | +----+ +----+ +--+
           |  ||+---------------+|<|    | |    | | >|
           |  |||               || |    | |    | |  |
           |  |||  page title   |+-+----+-+----+-+--+
           |  |||               || +----+ +----+ +--+
           |  |||               ||<|    | |    | | >|
           |  |||               || |    | |    | |  |
           |  |||     body3t    |+-+----+-+----+-+--+
           |  |||               ||  +----+          |
           |  +||               ||  +--------+  g   |
           |   +|               ||  +--------+      |
           |    +---------------+|  +----+          |
           +---------------------+----+------+------+

  - css transitions to indicate navigation between cards (see https://github.com/tmeasday/meteor-transitioner but with gecko bug)
  - going from search results to curated list
    - curating search results -- just throw away irrelevant cards?
    - drag from search panes onto current pane.
    - make a curated search a first-class page (live, or frozen?)
    - merge links with paragraphs?

  - get bookmark's contents in the mix
	- get bookmark queue in mongo
	- spider bookmarks in most recent first order

  - think about search interactions, curating search results
	- mock up social search & central search

  - make personal:
	  - when not logged in, can't edit?
	  - or make not-logged-in-edits suggestions for curation?
	 	
	- make alive
	 - new -> json, code blobs
	 - realtime content - how should it be indicated?

 - think about urls, routing, etc.
 
Technical debt:
	- redirects get scanned periodically to fix links from internal pages
	- (someday: redirects get broadcast to peers)
	- is it possible to do the urlgather code inside of meteor? (single process would be better!)

Open questions
	- show redirects?
	- tagging: simple or faceted?  just text search?  need visual feedback likely.  tag:foo -> markup
	- include tweets, or just tweeted links?  if tweets, only mine and the ones i reply to?  replies to me?

Think about cards - current card, searched cards, past cards?
think harder about federation - maybe setup micro server farm process per topic?

