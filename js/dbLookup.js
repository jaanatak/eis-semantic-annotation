/**
 This file contain all the necessary DBpedia Lookup (https://github.com/dbpedia/lookup) related queries,

 @authors : Jaana Takis
 @dependency
 {
    scientificAnnotation.js
 }

 */

"use strict";
var dbLookup  = {
    SERVICE_ADDRESS : "http://lookup.dbpedia.org/api/search/KeywordSearch",
    PARAM_CLASS: "QueryClass",
    PARAM_STRING: "QueryString",
    PARAM_MAXHITS: "MaxHits",
    //jaana test - test fn for json string for when there is no internet
    /*json: {
        results: [
            {
                uri: "http://dbpedia.org/resource/Berlin",
                label: "Berlin",
                description: "Berlin is the capital city of Germany and one of the 16 states of Germany. With a population of 3.5 million people, Berlin is Germany's largest city and is the second most populous city proper and the eighth most populous urban area in the European Union. Located in northeastern Germany, it is the center of the Berlin-Brandenburg Metropolitan Region, which has 5.9 million residents from over 190 nations. Located in the European Plains, Berlin is influenced by a temperate seasonal climate.",
                refCount: 18984,
                classes: [
                    {
                        uri: "http://dbpedia.org/ontology/Place",
                        label: "place"
                    },
                    {
                        uri: "http://schema.org/City",
                        label: "city"
                    },
                    {
                        uri: "http://schema.org/Place",
                        label: "place"
                    },
                    {
                        uri: "http://dbpedia.org/ontology/City",
                        label: "city"
                    },
                    {
                        uri: "http://www.w3.org/2002/07/owl#Thing",
                        label: "owl#Thing"
                    },
                    {
                        uri: "http://dbpedia.org/ontology/PopulatedPlace",
                        label: "populated place"
                    },
                    {
                        uri: "http://dbpedia.org/ontology/Settlement",
                        label: "settlement"
                    }
                ],
                categories: [
                    {
                        uri: "http://dbpedia.org/resource/Category:States_and_territories_established_in_1237",
                        label: "States and territories established in 1237"
                    },
                    {
                        uri: "http://dbpedia.org/resource/Category:City-states",
                        label: "City-states"
                    },
                    {
                        uri: "http://dbpedia.org/resource/Category:States_of_Germany",
                        label: "States of Germany"
                    },
                    {
                        uri: "http://dbpedia.org/resource/Category:Populated_places_established_in_the_13th_century",
                        label: "Populated places established in the 13th century"
                    },
                    {
                        uri: "http://dbpedia.org/resource/Category:German_state_capitals",
                        label: "German state capitals"
                    },
                    {
                        uri: "http://dbpedia.org/resource/Category:Berlin",
                        label: "Berlin"
                    },
                    {
                        uri: "http://dbpedia.org/resource/Category:Host_cities_of_the_Summer_Olympic_Games",
                        label: "Host cities of the Summer Olympic Games"
                    },
                    {
                        uri: "http://dbpedia.org/resource/Category:Members_of_the_Hanseatic_League",
                        label: "Members of the Hanseatic League"
                    },
                    {
                        uri: "http://dbpedia.org/resource/Category:Capitals_in_Europe",
                        label: "Capitals in Europe"
                    },
                    {
                        uri: "http://dbpedia.org/resource/Category:European_Capitals_of_Culture",
                        label: "European Capitals of Culture"
                    }
                ],
                templates: [],
                redirects: []
            }
        ]
    }, */

    dbResponse: null,
    dbSubjectResponse: null,
    dbObjectResponse: null,
    
    /**
     *Query data from DBpedia Lookup service and display
     * @param text 
     * @param String that denotes the ID of the element where to display the results
     * @return void
     */
    showDataFromDBlookup:function (keyword, displayInElementId){
        scientificAnnotation.showProgressBar('Querying DBpedia Lookup...');
        //test function for when there is no internet - jaana test
        if (dbLookup.json != undefined) {
            var fakeResponse;
            if (displayInElementId.indexOf("displaySubjectURI") >= 0) {
                dbLookup.dbSubjectResponse = dbLookup.json;
                fakeResponse = dbLookup.json;
            }
            else if (displayInElementId.indexOf("displayObjectURI") >= 0) {
                dbLookup.dbObjectResponse = dbLookup.json;
                fakeResponse = dbLookup.json;
            }
            if (scientificAnnotation.DEBUG) console.log(JSON.stringify(fakeResponse, null, 4));
            var message = dbLookup.formatResponse(fakeResponse, displayInElementId);
            if (message) {
                dbLookup.showResults(message, displayInElementId);
            } else {
                dbLookup.showResults("No matches found in DBpedia.org.", displayInElementId, true);
            }
            return;
        }
	// test end - delete if needed
        if (!keyword) keyword = "Berlin";  //jaana test
        var queryParameters = dbLookup.queryParameters(keyword, null, null);
        if (queryParameters) {
            var url = dbLookup.SERVICE_ADDRESS+"?"+queryParameters;
            if (scientificAnnotation.DEBUG) console.log("Contacting " + url);
            $.ajax({
                type: 'GET',
                url: url,
                //below is needed to force JSON requests against DBpedia Lookup service
                beforeSend: function(xhrObj) {
                    xhrObj.setRequestHeader("Accept","application/json");
                },
                dataType: 'json',
                xhrFields: {
                    withCredentials: false
                },
                headers: {
                },
                success: function(response) {
                    // Here's where you handle a successful response.
                    //if (scientificAnnotation.DEBUG) console.log("Success. Returned results: "+response.results.length);
                    if (scientificAnnotation.DEBUG) console.log(JSON.stringify(response, null, 4));
                    if (displayInElementId.indexOf("displaySubjectURI") >= 0) {
                        dbLookup.dbSubjectResponse = response;
                    } else if (displayInElementId.indexOf("displayObjectURI") >= 0) {
                        dbLookup.dbObjectResponse = response;
                    }
                    var message = dbLookup.formatResponse(response, displayInElementId);
                    if (message) {
                        dbLookup.showResults(message, displayInElementId);
                    } else {
                        dbLookup.showResults("No matches found in DBpedia.org.", displayInElementId, true);
                    }
                    scientificAnnotation.hideProgressBar();
                },
                error: function(jqXHR, exception){
                    var errorTxt= dbLookup.getStandardErrorMessage(jqXHR ,exception);
                    scientificAnnotation.showErrorMessage(errorTxt);
                    if (scientificAnnotation.DEBUG) console.log(errorTxt);
                    scientificAnnotation.hideProgressBar();
                }
            });
        }
    },
    
    /**
     * Return the URI parameters to be used in querying.
     *
     * @param triple subject as a string for which a DBpedia URI should be found. 
     * @param optional DBpedia class from ontology that the results should have.
     * @param optional maximum number of returned results (default: 5).
     * @returns object with resources you can use in dbLookup queries.
     */
    queryParameters :function (qString, qClass, qMaxHits) {
        var parameters;
        if (qString) {
            parameters = dbLookup.PARAM_STRING + "=" + encodeURIComponent(qString);
        } else {
            if (scientificAnnotation.DEBUG) console.log("Cannot query DBpedia Lookup service - subject missing!");
            return null;
        }
        if (qClass) {
            parameters = parameters +  "&" + dbLookup.PARAM_CLASS + "=" + encodeURIComponent(qClass);
        }
        if (qMaxHits  && qMaxHits > 0) {
            parameters = parameters +  "&" + dbLookup.PARAM_MAXHITS + "=" + qMaxHits;
        }
        //if (scientificAnnotation.DEBUG) console.log("DBpedia Lookup service's query parameters: " + parameters);
        return parameters;
    },

    /**
     * Show the returned results from DBpedia Lookup in the div #displaySubjectURI.
     * @param JSON response object.
     * @return String containing formated DBpedia response,
     */
    formatResponse : function(response, elementID){
        if (response.results.length > 0) {
            var htmlTemplate;
            if (elementID.indexOf("displaySubjectURI") >= 0) {
                htmlTemplate = "<a href='#href' onclick='dbLookup.getSubjectBindings(#onclick); return false;' target='_blank' title='#description'>#label #classes</a>";
            }
            if (elementID.indexOf("displayObjectURI") >= 0) {
                htmlTemplate = "<a href='#href' onclick='dbLookup.getObjectBindings(#onclick); return false;' target='_blank' title='#description'>#label #classes</a>";
            }
            if (!htmlTemplate) { 
                console.error('No html template defined for element ID = "'+elementID+'"');
                scientificAnnotation.showErrorMessage('There are results from they query but no element with the name "'+elementID+'" to display it in.',true);
                return null;
            }
            var html = "";
            var br = "";
            $.each(response.results, function(i, item) {
                var uriClasses = dbLookup.getUriClasses(item.classes, "dbpedia.org");
                var classes = "";
                if (uriClasses.labels.length > 0) classes = "[" + uriClasses.labels.toString() + "]";
                html += br;
                html = html + htmlTemplate.replace("#href", item.uri).replace("#description", item.description).replace("#label", item.label).replace("#classes", classes).replace("#onclick", i);
                br = "</br>"
            });
            if (html.length > 0) html = "Is this the same as any of the below?<br/>" + html;
            return html;
        } else {
            return null;
        }
    },
    
    /**
     * fetches data associated with key = "classes" from json response based on given filter.
     * @param JSON object
     * @param String to filter uri values for, eg. "dbpedia.org"
     * @return object containing URI and label arrays for the filtered data.
     */
    getUriClasses : function(classlist, filterDomain){
        var classURIs = [];
        var classLabels = [];
        $.each(classlist, function(i, item) {
            if (filterDomain && item.uri.toLowerCase().indexOf(filterDomain) >= 0) {
                classURIs.push(item.uri);
                classLabels.push(item.label);
            }
        });
        //if (classLabels.length > 0) classLabels = "[" + classLabels + "]";
        //if (scientificAnnotation.DEBUG) console.log("classURIs: " + classURIs.toString());
        return {
            URIs:       classURIs,
            labels:     classLabels,
        }
    },
    
    /**
     * Prepares necessary data before binding of URIs to its properties can take place.
     * @param refers to results[index] in JSON object dbResponse, initialised when user selects a subject from the list.
     * @return false, avoids opening the selected <href\> link in the browser.
     */
    getSubjectBindings : function(index){
		var selectedResource = dbLookup.dbSubjectResponse.results[index].uri;
		if (scientificAnnotation.DEBUG) console.log("User selected subject URI = " + selectedResource);
        sparql.triple.setObject("subject", selectedResource, $('#subjectValueInput').val());
        //undefines the P O  values of the triple
        $('#propertyValueInput').val('');
        sparql.triple.emptyObject("property");
        $('#objectValueInput').val('');
        sparql.triple.emptyObject("object");
		var relatedClasses = dbLookup.getUriClasses(dbLookup.dbSubjectResponse.results[index].classes, "dbpedia.org").URIs;
		if (scientificAnnotation.DEBUG) console.log("\trelated classes: " + relatedClasses.toString());
		sparql.bindAutoCompleteProperty(selectedResource, relatedClasses);
		return false;
    },
    
    /**
     * Prepares necessary data before binding of URIs to its properties can take place.
     * @param refers to results[index] in JSON object dbResponse, initialised when user selects a subject from the list.
     * @return false, avoids opening the selected <href\> link in the browser.
     */
    getObjectBindings : function(index){
		var selectedResource = dbLookup.dbObjectResponse.results[index].uri;
		if (scientificAnnotation.DEBUG) console.log("User selected object URI = " + selectedResource);
        sparql.triple.setObject("object", selectedResource, $('#objectValueInput').val());
		var relatedClasses = dbLookup.getUriClasses(dbLookup.dbObjectResponse.results[index].classes, "dbpedia.org").URIs;
		if (scientificAnnotation.DEBUG) console.log("\trelated classes: " + relatedClasses.toString());
		return false;
    },
    
    /**
     * Display success message
     * @param message
     * @param element id where to display the results
     * @param optional boolean value to define whether to show message temporarily only.
     * @return void
     */
    showResults:function(message, displayInElementId, isHide) {
        var isHide = isHide || false;
        var elementID = '#'+displayInElementId;
        var selector = $(elementID);
        selector.html(message);
        selector.fadeIn(1000);
        if(isHide == true) {
            selector.delay(1500).fadeOut();
        }else {
            selector.show();
        }
    },

    /**
     * Return the standard error message if the server communication is failed
     *
     * @param exception
     * @param jqXHR
     */
    getStandardErrorMessage:function(jqXHR, exception){
        var errorTxt = "Error occurred when sending data to the server: "+ dbLookup.SERVICE_ADDRESS;

        if (jqXHR.status === 0) {
            errorTxt = errorTxt + '<br>Not connected. Verify network.';
        } else if (jqXHR.status == 404) {
            errorTxt = errorTxt + '<br>Request cannot be fulfilled by the server. Check whether the \n(a) DBpedia Lookup Service is available at the above address \n(b) query contains bad syntax.';
        } else if (jqXHR.status == 500) {
            errorTxt = errorTxt + '<br>Internal server error [500].';
        } else if (exception === 'parsererror') {
            errorTxt = errorTxt + '<br>Requested JSON parse failed, possibly due to no results being returned.';
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
