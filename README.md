# Semantic Annotation Tool for PDF documents

This is a separate development of the above-mentioned [project](https://github.com/AKSW/semann), that concentrates on DBpedia Lookup functionality.

## Project Current state
This project originates from https://github.com/AKSW/semann and is concurrently developed on https://github.com/saifulnipo/eis-semantic-annotation from where this is forked. Eventually the two parallel forks will be merged into https://github.com/AKSW/semann.

### Currently working features:
- Load and render a PDF file within half-page and render other half with custom GUI.
- Detect selected text on the page using `window.getSelection()` method and add a new annotation for snippet.
- [Add annotation](https://github.com/AKSW/semann/wiki/Documentation#how-to-add-annotations)
- [View available annotation of currently loaded documents](https://github.com/AKSW/semann/wiki/Documentation#how-to-fetch-existing-annotations)
- [Find similar publications](https://github.com/AKSW/semann/wiki/Documentation#find-similar-publications)
- Link selected text to DBpedia.org ontology

### Work in progress:
None, this is a dead fork. Further work is continued under AKSW/semann.

## Documentation
- [Base documentation](https://github.com/AKSW/semann/wiki)
- [Current development](https://github.com/jaanatak/eis-semantic-annotation/wiki)

## Used libraries

[PDF.js](http://mozilla.github.io/pdf.js/) - Viewer Example is used as a base for the project.  
[Twitter bootstrap](http://getbootstrap.com/) - used for UI.  
[jQuery](http://jquery.com/) - used for DOM manipulations, required by Twitter bootstrap.  
[Typeahead.js](https://github.com/twitter/typeahead.js) - used for autosuggestion in input boxes.  
[Rangy](https://code.google.com/p/rangy/) - A cross-browser JavaScript range and selection library.  
[DBpedia Lookup](https://github.com/dbpedia/lookup) - looks up DBpedia URIs by related keywords.  

## Backend Database Used
- [virtuoso](http://virtuoso.openlinksw.com/)
