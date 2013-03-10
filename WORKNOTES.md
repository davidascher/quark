Work Notes
==========

Priorities:
    * what is the plugin model -- edit through the web as an option? [after all, if it's my wiki, auth is enough]
    	* role of data, visualizations
		* Pages should have a type: page, link, image, json, code?
		** oops, broke reordering -- figure out whether reordering is a chunk feature.

    * figure out auth UI for pages -- personal, peers, public
	* what does my take on federation look like?  (what's easiest way to setup a sub-domain?)
    * do i render foreign wikipages in the same place?
    * installable plugins, if you run into a page that requires a plugin you don't have

Big Open Questions
	* what does social search look like? agents asking nodes?  search as one of many verbs?

URL strategy:
	* main URL is the shareable URL - should refer to the main page (or when we get to it, multiple pages)
	* there are other gettable URLs to refer to page + history, page + search 

UX thoughts:
	* there's a fine line between navigating / browsing / searching and curation as form of authoring, record keeping etc.
	* this could make bookmarking useful (facilitate move from archived url to useful url)
	* Different focus for different form factors
		* Desktop is for authoring, searching, curating
		* Tablet is for reading/searching/browsing, curating
		* Phone is for reading & searching
	* Showing History
		* At least, a back button if there is history back there (code?)
		* Consider a zoomed in d3 graph to give context, and incite people down productive paths
			* larger, loved or linked pages are bigger
	* think about typographic mood

Desirable features:
	* distraction-free editor mode (e.g. github style) [UX]

Learning projects
	* css animations
	* touch events
	* explore moving some code over to coffee

Feedback:
	* deploy on ascher.ca
	* add towtruck
	* show to ward, wex
	* make initial screencast - focus on ease of editing & curating pages

TODO
    * nail transitions to and from?	
	* escape search terms (e.g. to do multi-word searches) & sql-sanitize them
	* do mongo search of page titles
	* think about SQL schema so that para keys and page keys are SQL IDs.
	* detect page name collision on new page creation
	* allow people to create page w/o linking
	* make it easy to list orphaned pages?
	* data model revision:
		* make pages keep track of links out? (how to do visualization well?)
		* combine paragraphs into pages? [talk to simon about data model]

Deferred features
	* screenshots of links in database (easy, see 	https://github.com/fzaninotto/screenshot-as-a-service)

Testing Strategy
	* put phone/tablet/desktop switch in main UI for testing
 	* manual tests:
		* dragging cards not clipped by search strip
	* test suite (past bugs)
		* hearting/unhearting
		* editing page title
	 	* following resulting redirects
		* editing not first page title
	* search (local & remote)

UX
	* search sidebar goes away when not searching (or there's a way to make it be the same as browse)
	* modes?  navigate vs. author page vs. search vs. curate?
	* better failure discovery when bing search fails

	* css transitions to indicate navigation between cards (see https://github.com/tmeasday/meteor-transitioner but with gecko bug)
	* going from search results to curated list
		* curating search results -- just throw away irrelevant cards?
	* drag from search panes onto current pane.
	* make a curated search a first-class page (live, or frozen?)
	* merge links with paragraphs?

	* get bookmark's contents in the mix
	* get bookmark queue in mongo
	* spider bookmarks in most recent first order

	* think about search interactions, curating search results
	* mock up social search & central search

	* make personal:
		* when not logged in, can't edit?
		* or make not-logged-in-edits suggestions for curation?
	 	
	* make alive

Technical debt:
	* figure out why extra calls to setPage
	* clean up JS console junk
	* redirects get scanned periodically to fix links from internal pages
	* (someday: redirects get broadcast to peers)
	* is it possible to do the urlgather code inside of meteor? (single process would be better!)

Open questions
	* show redirects?
	* tagging: simple or faceted?  just text search?  need visual feedback likely.  tag:foo -> markup
	* include tweets, or just tweeted links?  if tweets, only mine and the ones i reply to?  replies to me?

Think about cards - current card, searched cards, past cards?
think harder about federation - maybe setup micro server farm process per topic?

