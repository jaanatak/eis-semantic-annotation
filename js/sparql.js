/**
 This file contain all the necessary sparql related queries,
 that need to perform.

 @authors : A Q M Saiful Islam, Jaana Takis
 @dependency
 {
    scientificAnnotation.js
    highlight.js
 }

 */

"use strict";
var sparql  = {

    SERVER_ADDRESS : "http://localhost:8890/sparql",

    // annotation properties
    PREFIX_FILE : "http://eis.iai.uni-bonn.de/semann/pdf/",
    PREFIX_PUB : "http://eis.iai.uni-bonn.de/semann/publication/",
    PREFIX_RDFS : "http://www.w3.org/2000/rdf-schema#",
    PREFIX_SEMANN : "http://eis.iai.uni-bonn.de/semann/owl#",
    PREFIX_SEMANNP : "http://eis.iai.uni-bonn.de/semann/property#",
    triple: { //holds triple SPO values to be added into the database
        "subject": {"uri": null, "label": null},
        "property": {"uri": null, "label": null},
        "object": {"uri": null, "label": null},
        emptyObject: function(tripleObject) {
            sparql.triple[tripleObject].uri = null;
            sparql.triple[tripleObject].label = null;
        },
        setObject: function(tripleObject, uriValue, labelValue) {
            sparql.triple[tripleObject].uri = uriValue;
            sparql.triple[tripleObject].label = labelValue;
        },
        empty: function() {
            this.emptyObject("subject");
            this.emptyObject("property");
            this.emptyObject("object");
        }
    }, 
    defaultProperties: [],
        
    // For showing similar search result, the maximum size of the list
    SIMILAR_RESULT_LIMIT : 10,

    // For auto complete property and object maximum size of the list
    AUTO_COMPLETE_RESULT_LIMIT : 200,

    /**
     *Read data form sparql table and display
     *
     * @return void
     */
    showDataFromSparql:function (){

        var q = sparql.resource();
        var selectQuery = 'SELECT distinct str(?excerpt) as ?excerpt str(?SUBJECT) as ?SUBJECT str(?PROPERTY) as ?PROPERTY str(?OBJECT) as ?OBJECT FROM  <'+scientificAnnotation.GRAPH_NAME+'> WHERE ' +
            '{ ' +
                q.File + ' '+ q.hasExcerpt + ' ?excerpt . ' +
                '?excerpt ' + q.label + ' ?SUBJECT. ?excerpt ?prop ?obj. ' +
                '?prop ' + q.label + ' ?PROPERTY. ' +
                '?obj ' + q.label + ' ?OBJECT.' +
            '}';

        $.ajax({
            type: "GET",
            url: sparql.SERVER_ADDRESS,
            data: {
                query: selectQuery,
                format: "application/json"
            },
            async: true,
            dataType: "jsonp",
            crossDomain: true,
            cache: false,
            success: function(response){

                if( response!= null && response.results.bindings.length >0) {
                    scientificAnnotation.hideProgressBar();
                    scientificAnnotation.displayAvailableAnnotationFromSparql();
                    var fragments = sparqlResponseParser.parseResponse(response);
                    highlight.rangy_highlight(fragments);
                } else {
                    scientificAnnotation.noAvailableAnnotationFromSparql();
                }
            },
            error: function(jqXHR, exception){
                var errorTxt= sparql.getStandardErrorMessage(jqXHR, exception);
                scientificAnnotation.hideProgressBar();
                scientificAnnotation.showErrorMessage(errorTxt);
            }
        });
    },

    /**
     * prepare and send the ajax request for add annotation.
     *
     * @param property
     * @param subject
     * @param object
     * @param textStartPos
     * @param textEndPos
     * @param rangyPage
     * @param rangyFragment
     *
     * @return void
     */
    addAnnotation:function(textStartPos, textEndPos, rangyPage, rangyFragment){
        //check that the triple is not corrupt
        if ($('#subjectValueInput').val() != sparql.triple.subject.label || $('#propertyValueInput').val() != sparql.triple.property.label || $('#objectValueInput').val() != sparql.triple.object.label) {
            var error = "Error! User defined triple values do not match globally stored ones.";
            if (scientificAnnotation.DEBUG) console.error(error);
            scientificAnnotation.showErrorMessage(error,true);
            return false;
        }
        if (!sparql.triple.subject.label || !sparql.triple.property.label || !sparql.triple.object.label) {
            var error = "Error! Some or all of the user defined triple values are missing in the global variable.";
            if (scientificAnnotation.DEBUG) if (scientificAnnotation.DEBUG) console.error(error);
            scientificAnnotation.showErrorMessage(error,true);
            return false;
        }
        var defineSubjectType = true;
        if (!sparql.triple.subject.uri) {
            defineSubjectType = false;
        }
        if (!sparql.triple.property.uri) {
            var localUri = sparql.PREFIX_SEMANNP + ':' +sparql.camelCase(sparql.triple.property.label, true);
            sparql.triple.property.uri = localUri;
        }
        if (!sparql.triple.object.uri) {
            var localUri = sparql.PREFIX_SEMANN +sparql.camelCase(sparql.triple.object.label, false);
            sparql.triple.object.uri = localUri;
        }
        
        var currentPage = $('#pageNumber').val();
        var charStart = textStartPos, charEnd = textEndPos,length = (textEndPos - textStartPos);
	    var fileFragment = '#page='+currentPage+'?char='+charStart+','+charEnd+';length='+length+',UTF-8&rangyPage='+rangyPage+'&rangyFragment='+rangyFragment;
	    var q = sparql.resource(fileFragment);
        var camelProp = sparql.camelCase(sparql.triple.property.label, true);
        var camelObject = sparql.camelCase(sparql.triple.object.label, false);

        var insertQuery =
                'prefix semann: <'+sparql.PREFIX_SEMANN+'>' +'\n'+
                'prefix semannp: <'+sparql.PREFIX_SEMANNP+'>'+'\n'+
            'INSERT DATA ' +'\n'+
            '{ ' +'\n'+
                'GRAPH <'+scientificAnnotation.GRAPH_NAME+'> ' +'\n'+
                '{ ' +'\n'+
                        q.File+' a ' +q.Publication+ '. '+'\n'+
                        q.File+' ' + q.hasExcerpt + ' '+ q.Excerpt +' .'+'\n';
        if (defineSubjectType) {
            insertQuery = insertQuery + q.Excerpt +' a <' +sparql.triple.subject.uri+ '> .' + '\n';
        }
        insertQuery = insertQuery +
                        q.Excerpt +' ' + q.label + ' "'+sparql.triple.subject.label+'"@en; ' +'\n'+
                        '<'+sparql.triple.property.uri +'> <'+sparql.triple.object.uri+'> .'+'\n'+
                        '<'+sparql.triple.property.uri+'>  ' + q.label + ' "'+sparql.triple.property.label+'"@en. '+'\n'+
                        '<'+sparql.triple.object.uri+'> ' + q.label + ' "'+sparql.triple.object.label+'"@en. '+'\n'+
                '} ' +'\n'+
            '}';
        
        if (scientificAnnotation.DEBUG) console.log(insertQuery);
        $.ajax({
            type: "GET",
            url: sparql.SERVER_ADDRESS,
            data: {
                query: insertQuery,
                format: "application/json"
            },
            async: true,
            dataType: "jsonp",
            crossDomain: true,
            cache: false,
            success: function(response){
                sparql.bindAutoCompleteProperty(null, null);
                sparql.bindAutoCompleteObject();
                scientificAnnotation.hideAnnotationDisplayTable();
                scientificAnnotation.hideProgressBar();
                scientificAnnotation.showSuccessMessage('Annotation successfully added');
            },
            error: function(jqXHR, exception){
                var errorTxt= sparql.getStandardErrorMessage(jqXHR ,exception);
                scientificAnnotation.hideProgressBar();
                scientificAnnotation.showErrorMessage(errorTxt);
            }
        });
    },

    /**
     * Provide the data for the auto complete in the  object field
     *
     * @param searchItem
     * @returns {Array}
     */
    bindAutoCompleteObject :function(){

        var q = sparql.resource();
        var selectQuery = 'SELECT distinct str(?o) as ?OBJECT str(?label) as ?LABEL FROM  <'+scientificAnnotation.GRAPH_NAME+'> ' +'\n'+
            ' WHERE ' +'\n'+
            '{ ' +'\n'+
                '?o ' + q.label + ' ?label ' +'\n'+
                'FILTER(STRSTARTS(STR(?o), "'+sparql.PREFIX_SEMANN+'"))' +'\n'+
            '} ORDER BY fn:lower-case(?OBJECT) LIMIT '+sparql.AUTO_COMPLETE_RESULT_LIMIT;

        var source = null;

        $.ajax({
            type: "GET",
            url: sparql.SERVER_ADDRESS,
            data: {
                query: selectQuery,
                format: "application/json"
            },
            async: true,
            dataType: "jsonp",
            crossDomain: true,
            cache: false,
            success: function(response){
                source = sparqlResponseParser.parseResource(response);
                scientificAnnotation.setAutoComputeDataForField(source, 'objectValueInput');
            },
            error: function(jqXHR, exception){
                var errorTxt= sparql.getStandardErrorMessage(jqXHR, exception);
                scientificAnnotation.showErrorMessage(errorTxt);
            }
        });

        return source;
    },

    /**
     * Provide the data for the auto complete in the property field
     *
     * @param dbpedia.org URI as a subject if it was redefined as a class by the user. 'null' if subject is a literal.
     * @param URIs of superclasses of the subject class. 'null' if subject is a literal.
     * @returns {Array} an Array of properties and labels.
     */
    bindAutoCompleteProperty :function(selectedSubject, relatedClasses){       
        var q = sparql.resource();
        var selectQuery;
        var getDefaultProperties = false;
        if (!selectedSubject) getDefaultProperties = true; // local search of non-dpedia properties
        if (getDefaultProperties) {
            selectQuery = 'SELECT distinct str(?p) as ?PROPERTY str(?label) as ?LABEL FROM  <'+scientificAnnotation.GRAPH_NAME+'> ' +'\n'+
            ' WHERE ' +'\n'+
            '{ ' +'\n'+
                '?p ' + q.label + ' ?label ' +'\n'+
                'FILTER(STRSTARTS(STR(?p), "'+sparql.PREFIX_SEMANNP+'"))' +'\n'+
            '} ORDER BY fn:lower-case(?PROPERTY) LIMIT '+sparql.AUTO_COMPLETE_RESULT_LIMIT;
        } else { //used when the user defined the subject as a dbpedia class
            selectQuery = 'select distinct ?PROPERTY ?LABEL where { ' +'\n'+
                '{  <' +selectedSubject+ '> ?PROPERTY ?o. } ' +'\n';
            $.each(relatedClasses, function(i, item) {
                    selectQuery = selectQuery + 'UNION {  ?PROPERTY rdfs:domain <' +item+ '>. } ' + '\n';
            });
            selectQuery = selectQuery + '?PROPERTY rdfs:label ?LABEL. FILTER (lang(?LABEL) = "en")' +'\n'+
                '}' +'\n'+
                'ORDER BY fn:lower-case(?PROPERTY) LIMIT '+sparql.AUTO_COMPLETE_RESULT_LIMIT;
        }
        if (scientificAnnotation.DEBUG) console.log('Triggering query:\n' +selectQuery);
        
        var source = null;

        $.ajax({
            type: "GET",
            url: sparql.SERVER_ADDRESS,
            data: {
                query: selectQuery,
                format: "application/json"
            },
            async: true,
            dataType: "jsonp",
            crossDomain: true,
            cache: false,
            success: function(response){
                source = sparqlResponseParser.parseResource(response);
                if (getDefaultProperties) sparql.defaultProperties = source;
                if (source.length > 0) {
                    scientificAnnotation.setAutoComputeDataForField(source, 'propertyValueInput');
                } else { //no results, revert to default ones
                    scientificAnnotation.setAutoComputeDataForField(sparql.defaultProperties);
                }
            },
            error: function(jqXHR, exception){
                var errorTxt= sparql.getStandardErrorMessage(jqXHR, exception);
                scientificAnnotation.showErrorMessage(errorTxt);
            }
        });

        return source;
    },


    /**
     * Provide the data for the auto complete in the property field
     *
     * @param searchItem
     * @returns {Array}
     */
    findSimilarFiles :function(){

        var q = sparql.resource();
        var selectQuery =
            ' SELECT ?file ' +'\n'+
                ' WHERE ' +'\n'+
                '{' +
                    'SELECT ?file ?s ?p ?o ?curr_o FROM <'+scientificAnnotation.GRAPH_NAME+'> ' +'\n'+
                    ' WHERE ' +'\n'+
                    '{' +'\n'+
                        '{' +'\n'+
                            q.File+' '+q.hasExcerpt+' ?curr_excerpt .' +'\n'+
                            '?curr_excerpt ?curr_prop ?curr_obj.' +'\n'+
                            '?curr_obj ' + q.label + ' ?curr_o.' +'\n'+
                        '}' +'\n'+
                        '{' +'\n'+
                            '?file '+q.hasExcerpt+' ?excerpt .' +'\n'+
                            '?excerpt ' + q.label + ' ?s. ?excerpt ?prop ?obj.' +'\n'+
                            '?prop ' + q.label + ' ?p.' +'\n'+
                            '?obj ' + q.label + ' ?o.' +'\n'+
                        '}' +'\n'+
                        ' FILTER (?obj in (?curr_obj) and !sameTerm('+q.File+', ?file))' +'\n'+
                    '}' +'\n'+
                '}' +'\n'+
                ' GROUP BY ?file ' +'\n'+
                ' ORDER BY DESC(count(?file))  LIMIT '+sparql.SIMILAR_RESULT_LIMIT ;

        var source = null;

        $.ajax({
            type: "GET",
            url: sparql.SERVER_ADDRESS,
            data: {
                query: selectQuery,
                format: "application/json"
            },
            async: true,
            dataType: "jsonp",
            crossDomain: true,
            cache: false,
            success: function(response){
                source = sparqlResponseParser.parseSimilarSearch(response);
                scientificAnnotation.hideProgressBar();
                scientificAnnotation.setSimilarSearchResult(source);
            },
            error: function(jqXHR, exception){
                var errorTxt= sparql.getStandardErrorMessage(jqXHR ,exception);
                scientificAnnotation.hideProgressBar();
                scientificAnnotation.showErrorMessage(errorTxt);
            }
        });

        return source;
    },

    /**
     * Return the camelCase of a sentences (Hello World --> helloWorld)
     *
     * @param str
     * @returns {XML|string|void|*}
     */
    camelCase :function (str, isProperty){
        str = str.toLowerCase().replace(/ (.)/g, function(match, group1) {
            return group1.toUpperCase();
        });
        if (!isProperty) str = str.charAt(0).toUpperCase() + str.substr(1); //for resources the first letter is in capital
        return  str;
    },
    
    /**
     * Return the URI of resources to be used in sparql queries.
     *
     * @param optional file fragment location 
     * @returns object with resources you can use in sparql queries.
     */
    resource :function (fragment) {

        var fileURI = sparql.PREFIX_FILE + encodeURI(document.title.toString());
        var excerptURI = fileURI + fragment;
        var hasExcerptURI = sparql.PREFIX_PUB + 'hasExcerpt';

        return {
            File:			'<'+fileURI+'>',
            hasExcerpt:	'<'+hasExcerptURI+'>',
            label:			'<'+sparql.PREFIX_RDFS+'label>',
            Publication:		'<'+sparql.PREFIX_PUB+'Publication>',
            Excerpt:		'<'+excerptURI+'>'
        }
    },

    /**
     * Return the standard error message if the server communication is failed
     *
     * @param exception
     * @param jqXHR
     */
    getStandardErrorMessage:function(jqXHR, exception){
        var errorTxt = "Error occurred when sending data to the server: "+ sparql.SERVER_ADDRESS;

        if (jqXHR.status === 0) {
            errorTxt = errorTxt + '<br>Not connected. Verify network.';
        } else if (jqXHR.status == 404) {
            errorTxt = errorTxt + '<br>Request cannot be fulfilled by the server. Check whether the \n(a) sparql endpoint is available at the above address \n(b) query contains bad syntax.';
        } else if (jqXHR.status == 500) {
            errorTxt = errorTxt + '<br>Internal server error [500].';
        } else if (exception === 'parsererror') {
            errorTxt = errorTxt + '<br>Requested JSON parse failed.';
        } else if (exception === 'timeout') {
            errorTxt = errorTxt + '<br>Timeout error.';
        } else if (exception === 'abort') {
            errorTxt = errorTxt + '<br>Ajax request aborted.';
        } else {
            errorTxt = errorTxt + '<br>Uncaught Error.\n' + jqXHR.responseText;
        }
        if (scientificAnnotation.DEBUG) console.error(errorTxt);
        return errorTxt;
    }
};
