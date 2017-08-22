"use strict";

/**
 * Global access object
 * @type {Object}
 */
var andromeda = {
  version: 0.1,
  author: 'Mees Gelein'
};

/**
 * Anonymous namespace function
 */
(function(_a){
  //Perseus%3Atext%3A1999.02.0003%3Apoem%3D1
  var TEXT_LOAD_URL = "http://www.perseus.tufts.edu/hopper/loadquery";
  var SEARCH_URL = "http://www.perseus.tufts.edu/hopper/searchresults?q=";
  var MORPH_URL = "http://www.perseus.tufts.edu/hopper/";

  /**
   * This function is called by the 'Load From Perseus Button'
   */
  var searchPerseus = function(){
    //load the query from the UI and check its length
    var query = $('#loadFromPerseusQuery').val().trim();
    $('#loadFromPerseusQuery').val('');
    if(query.length == 0) return;

    //show that we're loading from perseus
    $('#loadFromPerseusButton').val('Loading...').removeClass('btn-primary').addClass('btn-warning');

    //decide what to do based on the input.
    //Either load the page, or forward the name to the search page
    var perseusUrl = query;
    if(!query.startsWith('http')){
      perseusUrl = SEARCH_URL +  encodeURI(query);
    }

    //Start the asynchronous request
    $.ajax({url: perseusUrl, success: function(result){
        //If the entered query was ambiguous or not a perseus URL
        if(result.indexOf('<title>Perseus Search results</title>') != -1 || result.indexOf('<link href="/js/perseusld/perseusld.css" rel="stylesheet" type="text/css"/>') == -1){
          $('#loadFromPerseusButton').val('Not A Known Text').removeClass('btn-warning').addClass('btn-danger');
          setTimeout(function(){
            $('#loadFromPerseusButton').val('Load From Perseus').removeClass('btn-danger').addClass('btn-primary');
          }, 2000);
        }else{
          //remove image links to prevent them from generating errors
          result = result.replace(/<img[^>]*>/g,"");
          var jResult = $(result)

          //get a link to the current page from the result and save it in the global andromeda environment object
          var currentLink = jResult.find('.current').get(0);
          _a.environment.textDoc = $(currentLink).attr('href');
          _a.environment.textName = $(currentLink).attr('title');
          var textHeaderTitle = $(jResult.find('#header_text').get(0)).find('h1').get(0).textContent;
          _a.environment.textTitle = textHeaderTitle;
          loadDocPerseus('text', _a.environment.textDoc);

          //find the translations
          var translationHeader = jResult.find('#translation0 .header').get(0);
          _a.environment.transTitle = translationHeader.textContent.split('\n')[3];
          _a.environment.transDoc = $($(translationHeader).find('.toggle').get(1)).attr('href').replace('text', '');
          loadDocPerseus('translation', _a.environment.transDoc);

          //try to find all the translations
          var index = 0;
          while (true){
            var transHeaders = jResult.find('#translation' + index + ' .header');
            if(transHeaders.length < 1) break; //no transHeader was found, should be none left
            var transHeader = transHeaders.get(0);
            _a.environment.translations.push({
              title: transHeader.textContent.split('\n')[3],
              doc: $($(translationHeader).find('.toggle').get(1)).attr('href').replace('text', '')
            });
            index++;
          }
          console.log(_a.environment.translations);
        }
        removeGreyOut();
    }});
  };

  /**
   * Loads the provided document into the div with the provided id
   *
   * @method loadDocPerseus
   * @param {String} target the target 'translation' or 'text' are valid
   * @param {String} doc  the document URL parameter
   */
  var loadDocPerseus = function(target, doc){
    //normalize the string
    target = target.toLowerCase().trim();
    //build the document load url from the parts
    var docUrl = TEXT_LOAD_URL + doc;

    //Show the loading in the header and empty the contents of the target
    if(target == 'text'){
      $('#textHeader').html('Text: Loading');
      $('#textContent').html('');
    }else if(target == 'translation'){
      $('#translationHeader').html('Translation: Loading');
      $('#textContent').html('');
    }

    //load it asynchronously
    $.ajax({url: docUrl, success: function(result){
      //remove the horizontal line above the text
      result = result.replace(/<hr[^>]*>/g,"");

      //set the result div based on the target
      if(target == 'text'){
        $('#textContent').html(result);
        $('#textHeader').html('Text: <span class="titleName">' + _a.environment.textTitle + " | " + _a.environment.textName + "</span>");
      }else if(target == 'translation'){
        $('#translationContent').html(result);
        $('#translationHeader').html('Translation: <span class="titleName">' + _a.environment.transTitle + "</span>");
      }
      registerWordHandlers();
    }});
  }

  /**
   * Loads a dictionary definition into perseus dictionary
   */
  var loadDictionaryPerseus = function(url){
    //construct the link
    var morphUrl = MORPH_URL + url;

    //Start loading the word asynchronously
    $.ajax({url: morphUrl, success: function(result){
      //remove image links to prevent them from generating errors
      result = result.replace(/<img[^>]*>/g,"");

      //Take only the main column
      var mainColumn = $(result).find('#main_col').get(0);
      $('#dictionaryContent').html(mainColumn.innerHTML);
      $('#dictionaryContent table').addClass('table table-condensed table-striped');
      //for now remove the word frequency statistics and the option to open in other lexica
      $('#dictionaryContent .word_freq').remove();
      $('#dictionaryContent p').remove();
    }});
  }

  /**
   * Unbinds all word event handlers and rebinds them all. Necessary if we reload texts
   */
  var registerWordHandlers = function(){
    //remove previous assignements
    $('.text a').unbind('click').attr('onclick', '');

    //create new event handlers
    $('.text a').click(function(event){
      event.preventDefault();
      loadDictionaryPerseus($(this).attr('href'));
    });
  }

  /**
   * Removes the grey out effect from all necessary divs
   */
  var removeGreyOut = function(){
    $('.greyed-out').removeClass('greyed-out');
  }

  /**
   * Registers all the click handlers for the UI
   * @return {[type]} [description]
   */
  var registerClickHandlers = function(){
    //Click handler of the Load From Perseus Button
    $('#loadFromPerseusButton').click(function(){
      andromeda.search.perseus();
    });

    $('#loadFromPerseusQuery').keydown(function(e){
    if(e.keyCode == 13){
      searchPerseus();
    }
});
  }

  _a.search = {
    perseus: searchPerseus
  };

  _a.ui = {
    registerClickHandlers: registerClickHandlers
  };

  _a.environment = {
    textDoc: "",
    textTitle: "",
    textName: "",
    translations: []
  }
})(andromeda);

/**
 * Called when the document is done loading
 */
$(document).ready(function(){
  andromeda.ui.registerClickHandlers();
});
