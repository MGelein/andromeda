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
  var TEXT_LOAD_URL = "http://www.perseus.tufts.edu/hopper/loadquery";
  var SEARCH_URL = "http://www.perseus.tufts.edu/hopper/searchresults?q=";
  var MORPH_URL = "http://www.perseus.tufts.edu/hopper/";
  var DICT_CACHE_SIZE = 10;
  //some example URLS for the lexicon
  //GREEK
  var LSJ_URL = "?doc=Perseus:text:1999.04.0057:entry=kate/rxomai";//LSJ
  var ML_URL = "?doc=Perseus:text:1999.04.0057:entry=kate/rxomai";//Middle Liddel
  var AUT_URL = "?doc=Perseus:text:1999.04.0073:entry=kate/rxomai";//Autenrieth
  //LATIN
  var LWS_URL = "?doc=Perseus:text:1999.04.0059:entry=tu";//Lewis & Short
  var ELW_URL = "?doc=Perseus:text:1999.04.0060:entry=tu";//Elementary Lewis

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
          _a.environment.text.doc = TEXT_LOAD_URL + $(currentLink).attr('href');
          _a.environment.text.name = $(currentLink).attr('title');
          _a.environment.text.title = $(jResult.find('#header_text').get(0)).find('h1').get(0).textContent;
          loadText();

          //try to find all the translations
          var index = 0;
          while (true){
            var transHeaders = jResult.find('#translation' + index + ' .header');
            if(transHeaders.length < 1) break; //no transHeader was found, should be none left
            var transHeader = transHeaders.get(0);
            _a.environment.translations.push({
              title: transHeader.textContent.split('\n')[3],
              doc: TEXT_LOAD_URL + $($(transHeader).find('.toggle').get(1)).attr('href').replace('text', '')
            });
            index++;
          }
          loadTranslations();
        }
        removeGreyOut();
    }});
  };


  /**
   * Loads a single translation into the translation cell
   */
  var loadTranslation = function(html, title){
    $('#translationContent').html(html);
    $('#translationHeader').html('Translation: <span class="titleName">' + title + '</span>');
  }

   /**
   * Loads all the translations into the translations object. Only displays the first result.
   */
  var loadTranslations = function(){
    //show that we're loading the data
    $('#translationContent').html('');
    _a.environment.translations.dropdown = '';

    //For each of the translations
    $.each(_a.environment.translations, function(index, translation){
      $.ajax({url: translation.doc, success: function(result){
        result = result.replace(/<hr[^>]*>/g,"");//replace <hr>
        result = result.replace(/<img[^>]*>/g,"");//replace <img>
        //save the data in the object
        translation.data = result;

        //add this translation to the dropdown html
        _a.environment.translations.dropdown += "<div class='dropdownLink' resultIndex='" + index + "'>"
                                                + "<span class='dropdownIcon'/>" + translation.title + "</div>";

        //if this is the first translation object, load it into the GUI
        if(index == 0) loadTranslation(result, translation.title);
      }});
    });

    //Show the list of translations on click on the header
    $('#translationHeader').unbind('click').click(function(event){
      event.stopPropagation();
      var headerDropdown = $('#headerDropdown')
      if(!_a.ui.dropdownShowing){
        _a.ui.dropdownShowing = true;
        var positionDropdown = function(){
          var transHeader = $('#translationHeader');
          var offset = transHeader.offset();
          headerDropdown.offset({top: 0, left: 0});
          headerDropdown.html(_a.environment.translations.dropdown);
          headerDropdown.offset({top: offset.top + transHeader.height() , left: offset.left});
          headerDropdown.innerWidth(transHeader.outerWidth());
        }
        positionDropdown();
        //reposition on resize
        $(window).unbind('resize').resize(positionDropdown);
        //hide on click anywhere outside of the headerDropdown
        $(document).click(function(){hideDropdown();});

        //make the currently selected one different
        headerDropdown.find('.dropdownLink').each(function(index, link){
          if($('#translationHeader').text().indexOf($(link).text()) == -1) return;
          $($(link).find('.dropdownIcon').get(0)).addClass('dropdownActiveIcon');
        });

        //finally fade in the dropdown menu
        headerDropdown.fadeIn();

        //attach click listeners to the dropdown
        headerDropdown.find('.dropdownLink').click(function(event){
          loadTranslation(_a.environment.translations[$(this).attr('resultIndex')].data, $(this).text());
        });
      }else{
        hideDropdown();
      }
    });
  }

  /**
   * You can call this function to hide the dropdownMenu for the header
   */
  var hideDropdown = function(){
    var headerDropdown = $('#headerDropdown');
    $(window).unbind('resize');
    $(document).unbind('click');
    _a.ui.dropdownShowing = false;
    headerDropdown.html('');
    headerDropdown.offset({top: 0, left: 0});
    headerDropdown.innerWidth(0);
    headerDropdown.hide();
  }

  /**
   * Loads a text from Perseus
   */
  var loadText = function(){
    //Show that we're loading
    $('#textHeader').html('Text: Loading');
    $('#textContent').html('');

    //load it asynchronously
    $.ajax({url: _a.environment.text.doc, success: function(result){
      //remove the horizontal line above the text
      result = result.replace(/<hr[^>]*>/g,"");

      $('#textContent').html(result);
      $('#textHeader').html('Text: <span class="titleName">' + _a.environment.text.title + " | " + _a.environment.text.name + "</span>");

      //overwrite the default <a> behaviour
      registerWordHandlers();
    }});
  }

  /**
   * Just loads the word
   */
  var loadWord = function(html, title){
    $('#dictionaryHeader').html('Dictionary: ' + title);
    $('#dictionaryContent').html(html);
  }

  /**
   * Loads a dictionary definition from perseus dictionary
   */
  var loadDictionaryPerseus = function(url, title){
    //construct the link
    var morphUrl = MORPH_URL + url;

    //before loading the remote data, check if it is already cached
    var cached = false;
    $.each(_a.environment.dictionary.cache, function(index, word){
      if(word.wordUrl == morphUrl){
         loadWord(word.data, word.wordTitle);
         cached = true;
       }
    });
    //if we used the cached version, stop right here
    if(cached) return;

    //Start loading the word asynchronously
    $.ajax({url: morphUrl, success: function(result){
      //remove image links to prevent them from generating errors
      result = result.replace(/<img[^>]*>/g,"");

      //Take only the main column from the result page
      var mainColumn = $(result).find('#main_col').get(0);
      $('#dictionaryContent').html(mainColumn.innerHTML);
      $('#dictionaryContent table').addClass('table table-condensed table-striped');
      //for now remove the word frequency statistics and the option to open in other lexica
      $('#dictionaryContent .word_freq').remove();
      $('#dictionaryContent p').remove();

      //show the word
      loadWord($('#dictionaryContent').html(), title);

      //create the cache object
      var cache = {
        wordTitle : title,
        data : $('#dictionaryContent').html(),
        wordUrl: morphUrl
      }

      //add the result to the cache
      _a.environment.dictionary.cache.unshift(cache);
      //if we have too many cached, remove the oldest one
      if(_a.environment.dictionary.cache.length > DICT_CACHE_SIZE) _a.environment.dictionary.cache.pop();
      //recreate the data to display on header click
      _a.environment.dictionary.dropdown = '';
      $.each(_a.environment.dictionary.cache, function(index, word){
        _a.environment.dictionary.dropdown += "<div class='dropdownLink' resultIndex=" + index +
                          "><span class='dropdownIcon'/>" + word.wordTitle + "</div>";
      });

      //re-add the listener for the header
      $('#dictionaryHeader').unbind('click').click(function(event){
        //prevent the event from bubbling
        event.stopPropagation();
        var headerDropdown = $('#headerDropdown')
        if(!_a.ui.dropdownShowing){
          _a.ui.dropdownShowing = true;
          var positionDropdown = function(){
            var dictHeader = $('#dictionaryHeader');
            var offset = dictHeader.offset();
            headerDropdown.offset({top: 0, left: 0});
            headerDropdown.html(_a.environment.dictionary.dropdown);
            headerDropdown.offset({top: offset.top + dictHeader.height() , left: offset.left});
            headerDropdown.innerWidth(dictHeader.outerWidth());
          }
          positionDropdown();
          //reposition on resize
          $(window).unbind('resize').resize(positionDropdown);
          //hide on click anywhere outside of the headerDropdown
          $(document).click(function(){hideDropdown();});

          //make the currently selected one different
          headerDropdown.find('.dropdownLink').each(function(index, link){
            if($('#dictionaryHeader').text().indexOf($(link).text()) == -1) return;
            $($(link).find('.dropdownIcon').get(0)).addClass('dropdownActiveIcon');
          });

          //finally fade in the dropdown menu
          headerDropdown.fadeIn();

          //attach click listeners to the dropdown
          headerDropdown.find('.dropdownLink').click(function(event){
            loadWord(_a.environment.dictionary.cache[$(this).attr('resultIndex')].data, $(this).text());
          });
        }else{
          hideDropdown();
        }
      });
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
      var lineNumberElement = $(this).prevAll('span').get(0);
      var lineNumber = (lineNumberElement == undefined) ? "" : lineNumberElement.textContent;
      var wordTitle = $(this).text() + ((lineNumberElement == undefined) ? "" : (": " + lineNumber));
      loadDictionaryPerseus($(this).attr('href'), wordTitle);
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
    registerClickHandlers: registerClickHandlers,
    dropdownShowing: false
  };

  _a.environment = {
    text: {},
    translations: [],
    dictionary: {
      cache: []
    }
  }
})(andromeda);

/**
 * Called when the document is done loading
 */
$(document).ready(function(){
  andromeda.ui.registerClickHandlers();
  $('#headerDropdown').hide();
});
