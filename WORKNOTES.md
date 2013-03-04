Work Notes

Big Open Questions
	* what does my take on federation look like?  (what's easiest way to setup a sub-domain?)

URL strategy:
	- main URL is the shareable URL - should refer to the main page (or when we get to it, multiple pages)
	- there are other gettable URLs to refer to page + history, page + search 

UX thoughts:
	- there's a fine line between navigating / browsing / searching and curation as form of authoring, record keeping etc.
	- this could make bookmarking useful (facilitate move from archived url to useful url)
	- Different focus for different form factors
		- Desktop is for authoring, searching, curating
		- Tablet is for reading/searching/browsing, curating
		- Phone is for reading & searching
	- Showing History
		- At least, a back button if there is history back there (code?)
		- Consider a zoomed in d3 graph to give context, and incite people down productive paths
			- larger, loved or linked pages are bigger

- explore moving some code over to coffee
- chrome whitespace in links?
- chrome doesn't unescape urls, figure out whether to slugify
- make easy to deploy to show it, and to get towtruck working

TODO

* escape search terms (e.g. to do multi-word searches) & sql-sanitize them
* on rename, history gets borked because the old page no longer exists.  fix.

Deferred features
	- screenshots of links in database (easy, see 	https://github.com/fzaninotto/screenshot-as-a-service)

Code
  - do mongo search of page titles
  - Pages should have a type: page, link, image, json, code?
  - think about SQL schema so that para keys and page keys are SQL IDs.
  - need to slugify?

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
  - better failure discovery when bing search fails

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
	- figure out why extra calls to setPage
	- clean up JS console junk
	- redirects get scanned periodically to fix links from internal pages
	- (someday: redirects get broadcast to peers)
	- is it possible to do the urlgather code inside of meteor? (single process would be better!)

Open questions
	- show redirects?
	- tagging: simple or faceted?  just text search?  need visual feedback likely.  tag:foo -> markup
	- include tweets, or just tweeted links?  if tweets, only mine and the ones i reply to?  replies to me?

Think about cards - current card, searched cards, past cards?
think harder about federation - maybe setup micro server farm process per topic?

