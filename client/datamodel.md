Data model:

A page is the key unit of navigation.

A page consists of a sequence of chunks.

Chunks have a type (and maybe some subtypes or attributes TBD).

Extant:
-------

Type: para

	a paragraph of markdown styled text, with wiki style links to pages on the same site, as well as hyperlinks.

Planned:
--------

Type: json

	a blob of json, with a simple editor, a barely visible UI, to be used by data-using chunks.

Type: visualization

	a chunk of JS, which uses up visual space however it wants.  Will often look for JSON blobs nearby.

Type: recipe

	a rich UI for recipes, which lets people add e.g. logs of when made, how, considered tweaks, etc., and has a step-through UI as well.

