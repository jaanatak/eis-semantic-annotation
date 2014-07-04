# Master Thesis Prototype

This is a web-based semantic annotation tool for research papers in PDF format.<br>
This tool allows you to semantically annotate (as RDF triples) text in research papers which is then used for recommending similar papers that the end user might find relevant. 

## Project Current state
This project originates from https://github.com/AKSW/semann and is concurrently developed on https://github.com/saifulnipo/eis-semantic-annotation from where this is forked. Whilst the parallel development under saifulnipo concentrates on annotating tables in PDF, this project concentrates on the further development of the [find similar publications](https://github.com/saifulnipo/eis-semantic-annotation/wiki/Documentation#find-similar-publications) functionality. Eventually the two parallel forks will be merged into https://github.com/AKSW/semann.

### Currently working features:
- Load and render a PDF file within half-page and render other half with custom GUI.
- Detect selected text on the page using `window.getSelection()` method and add a new annotation for snippet.
- [Add annotation](https://github.com/saifulnipo/eis-semantic-annotation/wiki/Documentation#how-to-add-annotations)
- [View available annotation of currently loaded documents](https://github.com/saifulnipo/eis-semantic-annotation/wiki/Documentation#how-to-fetch-existing-annotations)
- [Find similar publications](https://github.com/saifulnipo/eis-semantic-annotation/wiki/Documentation#find-similar-publications)

### Work in progress:
- Further development of [find similar publications](https://github.com/saifulnipo/eis-semantic-annotation/wiki/Documentation#find-similar-publications) functionality.

## Documentation
- [Base Documentation](https://github.com/saifulnipo/eis-semantic-annotation/wiki)
- [Current development](https://github.com/jaanatak/eis-semantic-annotation/wiki)

## Used libraries

[PDF.js](http://mozilla.github.io/pdf.js/) - Viewer Example is used as a base for the project  
[Twitter bootstrap](http://getbootstrap.com/) - used for UI  
[jQuery](http://jquery.com/) - used for DOM manipulations, required by Twitter bootstrap  
[Typeahead.js](https://github.com/twitter/typeahead.js) - used for autosuggestion in input boxes  
[Rangy](https://code.google.com/p/rangy/) - A cross-browser JavaScript range and selection library.

## Backend Database Used
- [virtuoso](http://virtuoso.openlinksw.com/)
