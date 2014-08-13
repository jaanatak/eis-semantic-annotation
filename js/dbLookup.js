/**
 This file contain all the necessary DBpedia Lookup (https://github.com/dbpedia/lookup) related queries,

 @authors : Jaana Takis
 @dependency
 {
    scientificAnnotation.js
 }

 */


var dbLookup  = {
    SERVICE_ADDRESS : "http://lookup.dbpedia.org/api/search/KeywordSearch",
    PARAM_CLASS: "QueryClass",
    PARAM_STRING: "QueryString",
    PARAM_MAXHITS: "MaxHits",
    
    /**
     *Query data from DBpedia Lookup service and display
     *
     * @return void
     */
    showDataFromDBlookup:function (subject){
        if (subject == null) subject = "Berlin";  //jaana test
        var queryParameters = dbLookup.queryParameters(subject, null, null);
        if (queryParameters != null) {
            var url = dbLookup.SERVICE_ADDRESS+"?"+queryParameters;
            console.log("Contacting " + url);
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
                    console.log("Success. Returned results: "+response.results.length);
                    console.log(JSON.stringify(response, null, 4));
                    var info = dbLookup.addDataToDisplaySubjectURI(response);
                    dbLookup.showSubjectURI(info);
                },
                error: function(jqXHR, exception){
                    var errorTxt= dbLookup.getStandardErrorMessage(jqXHR ,exception);
                    scientificAnnotation.showErrorMessage(errorTxt);
                    console.log(errorTxt);
                    //scientificAnnotation.hideProgressBar();
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
        if (qString != null && qString.length > 0) {
            parameters = dbLookup.PARAM_STRING + "=" + encodeURIComponent(qString);
        } else {
            console.log("Cannot query DBpedia Lookup service - subject missing!");
            return null;
        }
        if (qClass != null && qClass.length > 0) {
            parameters = parameters +  "&" + dbLookup.PARAM_CLASS + "=" + encodeURIComponent(qClass);
        }
        if (qMaxHits != null && qMaxHits > 0) {
            parameters = parameters +  "&" + dbLookup.PARAM_MAXHITS + "=" + qMaxHits;
        }
        //console.log("DBpedia Lookup service's query parameters: " + parameters);
        return parameters;
    },

    /**
     * Show the returned results from DBpedia Lookup in the div #displaySubjectURI.
     * @param JSON response object.
     * @return html code to inject into the div.
     */
    addDataToDisplaySubjectURI : function(response){
        if (response.results.length > 0) {
            var htmlTemplate = "<a href='#href' title='#description'>#label #class</a>";
            var html = "";
            var br = "";
            $.each(response.results, function(i, item) {
                html += br;
                html = html + htmlTemplate.replace("#href", item.uri).replace("#description", item.description).replace("#label", item.label).replace("#class", dbLookup.getUriClasses(item.classes, "dbpedia.org"));
                br = "</br>"
            });
            return html;
        } else {
            return "No matches found in DBpedia.";
        }
    },
    
    /**
     * fetches labels associated with key = "classes" from json response based on given filter.
     * @param JSON object
     * @param String to filter uri values for, eg. "dbpedia.org"
     * @return comma separated list of labels
     */
    getUriClasses : function(classlist, filterDomain){
        var classes = "";
        var comma = "";
        $.each(classlist, function(i, item) {
            if (filterDomain != null && item.uri.toLowerCase().indexOf(filterDomain) >= 0) {
                classes += comma;
                classes = classes + item.label;
                comma = ", ";
            }
        });
        if (classes.length > 0) classes = "[" + classes + "]";
        return classes;
    },
    
    /**
     * Display success message
     * @param message
     * @return void
     */
    showSubjectURI:function(message) {
        var selector = $('#displaySubjectURI');
        selector.html(message);
        selector.fadeIn(1000);
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
        return errorTxt;
    }
 
};
