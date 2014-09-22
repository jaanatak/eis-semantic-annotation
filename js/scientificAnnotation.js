/**
This file is the main entry point for this tools for all the event
 that need to perform.

@authors : A Q M Saiful Islam, Jaana Takis
@dependency:
 {
    sparql.js
    highlight.js
 }
 */
"use strict";
var scientificAnnotation  = {

    GRAPH_NAME : 'scientificAnnotation',
    DEBUG: true, //determines whether to log to console window

    // selected text position info
    selectedTextPosition:null,

    /**
     * bind the click event for
     * add annotation,
     * show similar search and
     * show available query
     *
     * @return void
     */
    bindClickEventForButtons: function () {

        $("#simpleAnnotateButton").bind("click", function () {
            scientificAnnotation.showSimpleAnnotatePanel($(this));
        });

        $("#addAnnotationButton").bind("click", function () {
            scientificAnnotation.addAnnotation();
        });

        $("#showSimilarSearchButton").bind("click", function () {
            scientificAnnotation.showSimilarSearchResult();
        });

        $("#queryButton").bind("click", function () {
            scientificAnnotation.fetchDataFromDatabase();
        });

        $("#annotateTableButton").bind("click", function () {
            scientificAnnotation.annotateTable();
        });
	
        $("#dbLookupButton").bind("click", function () { //jaana test - this should be later bound to onchange event or an existing method below
            dbLookup.showDataFromDBlookup($('#subjectValueInput').val());
        });
        
        $("#tripleView").bind("click", function () { //jaana test - delete when done testing userTriple
            if (scientificAnnotation.DEBUG) console.log("Triple view: \n" +JSON.stringify(sparql.triple, null, 4));
        });
        
        $("#camelButton").bind("click", function () { //jaana test - delete when done testing userTriple
           alert(sparql.camelCase($('#subjectValueInput').val(), false));
        });
        
    },

    /**
     * bind events for
     * subject input,
     * object input
     * property input
     *
     * @return void
     */
    bindEventForInputs: function () {
        $("#subjectValueInput").bind("change", function () {
            var trimmedValue = $.trim($('#subjectValueInput').val());
            $('#subjectValueInput').val(trimmedValue);
            sparql.triple.setObject("subject", null, trimmedValue);
            if (scientificAnnotation.DEBUG) console.log("Triple view: \n" +JSON.stringify(sparql.triple, null, 4));
        });
	/*
        $("#propertyValueInput").bind("change", function () {
            alert();
            sparql.triple.setObject("property", null, $('#propertyValueInput').val());
            if (scientificAnnotation.DEBUG) console.log("Triple view: \n" +JSON.stringify(sparql.triple, null, 4));
        });
	
        $("#objectValueInput").bind("change", function () {
            alert();
            sparql.triple.setObject("object", null, $('#objectValueInput').val());
            if (scientificAnnotation.DEBUG) console.log("Triple view: \n" +JSON.stringify(sparql.triple, null, 4));
        });
*/
    },


    /**
     * show the simple annotate panel
     * @param button
     */
    showSimpleAnnotatePanel : function (button) {
        var simpleAnnotateWindow = $('#simpleAnnotatePanel');
        if (simpleAnnotateWindow.is(':visible')) {
            simpleAnnotateWindow.hide();
            button.text('Show Simple Annotate Panel');
        } else {
            simpleAnnotateWindow.fadeIn(500);
            button.text('Hide Simple Annotate Panel');
        }
    },

    /**
     * Set auto compute data for property or object field
     *
     * @param {Array of objects} containing query results for a requested resource (objects or properties)
     * @param {String} input field ID, where to output the list of values
     * @return void
     *
     */
    setAutoComputeDataForField :function(resources, inputId){
        var propertyField = $('#'+inputId);
        propertyField.typeahead('destroy');
        propertyField.typeahead(
		{
			local: resources
		}
        ).on('typeahead:selected', function(event, data) { //triggers when user selects an item from the list
            if (scientificAnnotation.DEBUG) console.log(inputId+'> User selected: ' + JSON.stringify(data, null, 4));
            if (inputId.indexOf("property") >= 0) {
                sparql.triple.setObject("property", data.uri, data.value);
            }
            else if (inputId.indexOf("object") >= 0) {
                sparql.triple.setObject("object", data.uri, data.value);
            }
            if (scientificAnnotation.DEBUG) console.log("Triple view: \n" +JSON.stringify(sparql.triple, null, 4));
            //if (scientificAnnotation.DEBUG) console.log("SPO triple currently: \n" +JSON.stringify(sparql.triple, null, 4));
            return data.uri; //return resource URI
        });
    },

    /**
     * Set similar search result
     *
     * @param searchResult
     * @return void
     */
    setSimilarSearchResult :function(searchResult){

        var similarPubsList = $("#similarPubsList");

        if(searchResult.length > 0) {
            scientificAnnotation.hideAnnotationDisplayTable();
            similarPubsList.empty();
            for(var i = 0; i < searchResult.length; i++) {
                similarPubsList.append(
                    '<a href="'+searchResult[i]+'" class="list-group-item">'+searchResult[i]+'</a>'
                );
            }
            similarPubsList.fadeIn(500);// show the result
        } else {
            scientificAnnotation.showWarningMessage('No similar result found.');
        }

    },

    /**
     * Return the selected Position details
     *
     * @returns {{start: number, end: number, rangyFragment: (highlight.rangy_serialize.Rangy|*), rangyPage: (highlight.rangy_serialize.Page|*)}}
     */
    getSelectionCharOffsetsWithin: function () {
        var currentPage =  $('#pageNumber').val();
        var element=document.body;
        var sel, range;
        var start = 0, end = 0, previousPagesCharCount = 0;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.rangeCount) {
                range = sel.getRangeAt(sel.rangeCount - 1);
                start = scientificAnnotation.getBodyTextOffset(range.startContainer, range.startOffset,element);
                end = scientificAnnotation.getBodyTextOffset(range.endContainer, range.endOffset,element);
                sel.removeAllRanges();
                sel.addRange(range);
                previousPagesCharCount = scientificAnnotation.getPreviousPagesCharacterCount(currentPage);
            }
        }

        if(start > previousPagesCharCount) {
            start = start - previousPagesCharCount;
        }

        if(end > previousPagesCharCount){
            end = end - previousPagesCharCount;
        }

	var rangy_result = highlight.rangy_serialize();
	
        return {
            start: start,
            end: end,
            rangyFragment: rangy_result.Rangy,
            rangyPage: rangy_result.Page	
        };
    },

    /**
     * Get selected body text
     *
     * @param node
     * @param offset
     * @param element
     * @returns {Number}
     */
    getBodyTextOffset:function(node, offset,element) {
        var sel = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(element);
        range.setEnd(node, offset);
        sel.removeAllRanges();
        sel.addRange(range);
        return sel.toString().length;
    },

    /**
     * Get the total character size of a single pdf page
     *
     * @param pageNumber
     * @returns {number}
     */
    getPageTotalCharLength : function(pageIndex){
        var count = 0;
        var textContent = PDFFindController.pdfPageSource.pages[pageIndex].getTextContent();
        if(textContent != null && textContent._value !== null){
            var lines = textContent._value.bidiTexts;
            var page_text = "";
            var last_block = null;
            for( var k = 0; k < lines.length; k++ ){
                var block = lines[k];
                if( last_block != null && last_block.str[last_block.str.length-1] != ' '){
                    if( block.x < last_block.x ){
                        page_text += "\r\n";
                    }
                    else if ( last_block.y != block.y && ( last_block.str.match(/^(\s?[a-zA-Z])$|^(.+\s[a-zA-Z])$/) == null ))
                        page_text += ' ';
                }
                page_text += block.str;
                last_block = block;
            }

            count = page_text.length;
        }

       return count;
   },

    /**
     * Get all characters before current page
     *
     * @param currentPage
     * @returns {number}
     */
    getPreviousPagesCharacterCount : function(currentPage){
        var previousPagesCharCount = 0;
            for(var i=0; i<currentPage -1;i++){
                previousPagesCharCount += scientificAnnotation.getPageTotalCharLength(i);
            }
        return previousPagesCharCount;
    },

    /**
     * bind mouse event for click in the page for select the document
     *
     * @return void
     */
    bindMouseUpEventForPDFViewer: function () {

        $("#viewer").bind("mouseup", function () {
            var proceed = scientificAnnotation.isSelectionInPDF();
            if (proceed) {
                var text=scientificAnnotation.getSelectedTextFromPDF();
                if (text && $('#simpleAnnotatePanel').is(':visible')) {
                    scientificAnnotation.setTextValue(text);
                    scientificAnnotation.selectedTextPosition = scientificAnnotation.getSelectionCharOffsetsWithin();
                    dbLookup.showDataFromDBlookup($('#subjectValueInput').val());
                }
            }
        });
    },

    /**
     * bind the mouse click event in the displayed table rows to
     * highlight the subject part in the whole document
     * @return void
     */
    bindAnnotationTableSubjectClickEvent: function () {

        $('#sparqlTable').on('click', 'tr', function() {
            var subject = this.cells[0];  // the first <td>
            subject = subject.innerHTML
            if(subject != ''){
                subject = $.trim(subject);
                PDFFindBar.searchAndHighlight(subject);
            }
        });
    },

    /**
     * clear the values of input text field
     * @return void
     */
    clearInputField:function (){
        $('#propertyValueInput').val('');
        $('#subjectValueInput').val('');
        $('#objectValueInput').val('');
        //undefines the triple object values
        sparql.triple.empty();
    },

    /**
     * set the input
     * @param selectedText
     * @return void
     */
    setTextValue:function(selectedText) {
        $('#subjectValueInput').val(selectedText);
        sparql.triple.setObject("subject", null, selectedText);
    },

    /**
     * Get the selected text form pdf doc
     * @returns {string}
     */
    getSelectedTextFromPDF : function(){
        return highlight.fixWhitespace();
    },

    /**
     * perform the adding of  annotation
     * @return void
     */
    addAnnotation:function(){
        
       var propertyValue = $('#propertyValueInput').val();
       var subjectValue = $('#subjectValueInput').val();
       var objectValue = $('#objectValueInput').val();

        propertyValue = $.trim(propertyValue);
        subjectValue = $.trim(subjectValue);
        objectValue = $.trim(objectValue);
        //some cleaning up
        sparql.triple.property.label = propertyValue;
        sparql.triple.subject.label = subjectValue;
        sparql.triple.object.label = objectValue;
        $('#propertyValueInput').val(propertyValue);
        $('#subjectValueInput').val(subjectValue);
        $('#objectValueInput').val(objectValue);
        
        var rangyFragment = null;
        var rangyPage = null;

        var textPosition = scientificAnnotation.selectedTextPosition;
        var startPos = 0, endPos = 0;

        if(textPosition != null){
            startPos = textPosition.start;
            endPos = textPosition.end;
            rangyFragment = textPosition.rangyFragment;
            rangyPage = textPosition.rangyPage;
        }
	
       if(!propertyValue || !subjectValue || !objectValue) {
           scientificAnnotation.showErrorMessage('Empty fields. Please provide values and try again',true);
           if (scientificAnnotation.DEBUG) console.error('Empty fields. Please provide values and try again',true);
       } else {
           scientificAnnotation.showProgressBar('Adding annotation...');
           scientificAnnotation.appendAnnotationInDisplayPanel();
           var success = sparql.addAnnotation(startPos, endPos, rangyPage, rangyFragment);
           alert(success);
           if (success) scientificAnnotation.clearInputField();
       }
    },

    /**
     * Show the added annotation of the document
     * @return void
     */
    appendAnnotationInDisplayPanel : function (){

        var previousHtml = $('#displayAnnotationResult').html();
        var subject = sparql.triple.subject.label;
        var property = sparql.triple.property.label;
        var object = sparql.triple.object.label;
        //add links where possible
        if (sparql.triple.subject.uri) {
            subject = '<a href="'+sparql.triple.subject.uri+'" target="_blank">' + subject + '</a>';
        }
        if (sparql.triple.property.uri) {
            property = '<a href="'+sparql.triple.property.uri+'" target="_blank">' + property + '</a>';
        }
        if (sparql.triple.object.uri) {
            object = '<a href="'+sparql.triple.object.uri+'" target="_blank">' + object + '</a>';
        }
        scientificAnnotation.clearAnnotationDisplayPanel();
        $('#displayAnnotationResult').append(
                '<p><strong>Subject:</strong><br/>'+subject+'</p>' +
                '<p><strong>Property:</strong><br/>'+property+'</p>' +
                '<p><strong>Object:</strong><br/>'+object+'</p><br/>'+
                 previousHtml
        );
    },

    /**
     * clear available annotations
     */
    clearAnnotationDisplayPanel:function (){
        $('#displayAnnotationResult').empty();
    },

    /**
     * clear the similar search window and hide
     */
    clearSimilarSearchResult:function(){
        var similarPubsList = $("#similarPubsList");
        similarPubsList.empty();
        similarPubsList.fadeOut(300);
    },


    /**
     * Reset the annotation display tables
     * @return void
     */
    resetAnnotationTable:function (){
        $('#displayTableTitle').empty();
        $('#displaySparqlTableRows').empty();
    },

    /**
     * Show the added annotation of the document from spaql
     * @param propertyValue
     * @param subjectValue
     * @param objectiveValue
     * @return void
     */
    addDataToSparqlTableView : function (subjectValue ,propertyValue, objectValue){

        $('#sparqlTable tr:last').after(
            '<tr>' +
                '<td>'+subjectValue+'</td>' +
                '<td>'+propertyValue+'</td>' +
                '<td>'+objectValue+'</td>' +
                '</tr>'
        );
    },

    /**
     * Create the tables for viewing the available data from the db
     * @return void
     */
    createSparqlTable:function(){
        $('#displayTableTitle').empty();
        $('#displayTableTitle').append(
            '<br><p>Available annotation of this file:::</p><br>'
        );

        $('#displaySparqlTableRows').empty();
        $('#displaySparqlTableRows').append(
            "<table id='sparqlTable' width='100%' >"+
                "<tr>"+
                    "<th width='50%'> Subject </th> <th width='20%'> Property </th> <th width='30%'> Object </th>"+
                "</tr>"+
            "</table>"
        );

        scientificAnnotation.bindAnnotationTableSubjectClickEvent();
    },

    /**
     * Showing the available annotation tables
     * @return void
     */
    displayAvailableAnnotationFromSparql:function(){

        scientificAnnotation.clearAnnotationDisplayPanel();
        $('#displayTableTitle').show();
        scientificAnnotation.createSparqlTable();
        $('#displaySparqlTableRows').show();
    },

    /**
     * Showing the available annotation tables
     * @return void
     */
    noAvailableAnnotationFromSparql:function(){
        scientificAnnotation.showWarningMessage('No available annotation found  of this file');
        scientificAnnotation.hideProgressBar();
    },

    /**
     * Hide the available annotation table
     * @return void
     */
    hideAnnotationDisplayTable:function(){
        $('#displayTableTitle').hide();
        $('#displaySparqlTableRows').hide();
    },

    /**
     * Fetch the data from database
     * @return void
     */
    fetchDataFromDatabase : function () {
        var outputTable = $('#displaySparqlTableRows');
        var displayFileInfoTitle = $('#displayTableTitle');
        scientificAnnotation.clearSimilarSearchResult();
        scientificAnnotation.showProgressBar('Loading data ....');
        sparql.showDataFromSparql();
        outputTable.fadeIn(500);
        displayFileInfoTitle.fadeIn(500);
    },

    /**
     *  Annotate tabular structure in pdf file
     *  @return void
     */
    annotateTable : function() {
        if(tableAnnotator.isTableSelectionValid()) {
            var selectedTableCellTexts = tableAnnotator.getSelectedTableCellTexts();
            if (scientificAnnotation.DEBUG) console.log(selectedTableCellTexts);
            alert(selectedTableCellTexts);
        } else {
            alert('Table selection is not proper :-(');
        }
    },

    /**
     * Display similar search
     * @return void
     */
    showSimilarSearchResult:function(){
        var similarPubsList = $("#similarPubsList");
        if (similarPubsList.is(':visible')) {
            similarPubsList.fadeOut(300);
        }

        scientificAnnotation.showProgressBar('Finding similar result...');
        sparql.findSimilarFiles();

    },

    /**
     * Display success message
     * @param message
     * @return void
     */
    showSuccessMessage:function (message) {
        var selector = '.alert-success';
        $(selector).html(message);
        $(selector).fadeIn(1000);
        $(selector).delay(1500).fadeOut();
    },

    /**
     * Display error message
     * @param message
     * @return void
     */
    showErrorMessage:function (message, isHide) {

        var isHide = isHide || false;
        var selector = '.alert-danger';
        $(selector).html(message);
        $(selector).fadeIn(500);
        if(isHide == true) {
            $(selector).delay(1500).fadeOut();
        }else {
            $(selector).show();
        }
    },

    /**
     * Display warning message
     * @param message
     */
    showWarningMessage:function (message) {
        var selector = '.alert-warning';
        $(selector).html(message);
        $(selector).fadeIn(500);
        $(selector).delay(1500).fadeOut();
    },


    /**
     * Show progress bar
     * @param message
     * @return void
     */
    showProgressBar: function(message){
        $('.progress-bar').html(message);
        $('.progress').fadeIn();
    },

    /**
     * Hide progress bar
     * @return void
     */
    hideProgressBar: function(){
        $('.progress').fadeOut();
    },

    /**
     * Checks if active selection is made in PDF. 
     * @return {Boolean}
     */
    isSelectionInPDF: function(){
        var node, selection;
        if (window.getSelection) {
            selection = getSelection();
            node = selection.anchorNode;
        }
        if (!node && document.selection) {
            selection = document.selection;
            var range = selection.getRangeAt ? selection.getRangeAt(0) : selection.createRange();
            node = range.commonAncestorContainer ? range.commonAncestorContainer :
                    range.parentElement ? range.parentElement() : range.item(0);
        }
        if ($(node).closest('#viewer').length > 0) { //if node exists
            return true;
        } else { 
            return false; //avoids the problem where selection is not made in PDF but mouse released over PDF file. We want to ignore these cases.
        }
    },

    /**
     * Initialize the document
     *
     * @return void
     */
    init:function(){
        scientificAnnotation.bindClickEventForButtons();
        scientificAnnotation.bindEventForInputs();
        scientificAnnotation.bindMouseUpEventForPDFViewer();
        sparql.bindAutoCompleteProperty(null, null);
        sparql.bindAutoCompleteObject();
    }
};

/**
 * document on ready method
 */
$(function () {
    scientificAnnotation.init();
    highlight.init();
});