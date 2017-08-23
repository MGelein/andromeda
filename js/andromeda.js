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

  //contains the HTML for the text dropdown. Just saved in a variable to not pollute the code
  var textDropdownHTML = "<div class='row'><hr>"
  + "<div class='col-sm-12 text-center'><h4>Navigation</h4></div>"
  + "<div class='col-sm-6 text-center'><span id='prevSeg' class='greyed-out'>◀&nbsp;Previous Segment</span></div>"
  + "<div class='col-sm-6 text-center'><span id='nextSeg' class='greyed-out'>&nbsp;Next Segment&nbsp;▶</span></div><hr>"
  + "<div class='col-sm-12 text-center'><h4>Save &amp; Load</h4></div>"
  + "</div>";

  /**
   * This function is called by the 'Load From Perseus Button'
   * It parses the UI query box and does some input sanitizing
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

    startLoadingText(perseusUrl);
  }

  /**
   * Starts the actual loading of a valid perseus url. Either points to a search result, or
   * to an actual text page. This parses the pages and points the loading of the data to the right
   * urls
   */
  var startLoadingText = function(perseusUrl){
    //set the dictionary and notes to ask the user to start doing something
    var dictionaryNotUsed = "<br><h3>No Dictionary</h3><p>There are no word queries to display. To get started using the dictionary click a word in the main text in the middle column.</p>";
    var notesNotUsed = "<br><h3>No Notes</h3><p>There are no notes to display. To get started taking notes make a selection in the main text in the middle column and press the 'Add Note' button.</p>";
    $('#dictionaryContent').html(dictionaryNotUsed);
    $('#noteContent').html(notesNotUsed);

    //reset the environment variables
    _a.environment.translations = [];
    _a.environment.text = {};

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
          //result = result.replace(/<img[^>]*>/g,"");
          //Instead of removing, replace all img with span to prevent the src from firing
          result = result.replace(/<img/g, '<span');
          var jResult = $(result);

          //get a link to the current page from the result and save it in the global andromeda environment object
          var currentLink = jResult.find('.current').filter(':last').get(0);
          _a.environment.text.doc = TEXT_LOAD_URL + $(currentLink).attr('href');
          _a.environment.text.name = $(currentLink).attr('title');
          _a.environment.text.section = $(jResult.find('.current').get(0)).attr('title');
          _a.environment.text.title = $(jResult.find('#header_text').get(0)).find('h1').get(0).textContent;
          //get the prev and next segment
          var nextArrow = jResult.find('.arrow span[alt="next"]').get(0);
          var prevArrow = jResult.find('.arrow span[alt="previous"]').get(0);
          //save the url ref to the next and prev segment
          if(nextArrow != undefined){
             _a.environment.text.next = MORPH_URL + $(nextArrow).parent().attr('href');
          }else{
             _a.environment.text.next = undefined;
          }
          if(prevArrow != undefined){
            _a.environment.text.prev = MORPH_URL + $(prevArrow).parent().attr('href');
          }else{
            _a.environment.text.prev = undefined;
          }
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
        //remove all the greyed-out classes
        $('.greyed-out').removeClass('greyed-out');
        hideDropdown();
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

      _a.environment.text.dropdown = textDropdownHTML;

      //Create the textHeader handler
      $('#textHeader').unbind('click').click(function(event){
        event.stopPropagation();
        var headerDropdown = $('#headerDropdown')
        if(!_a.ui.dropdownShowing){
          _a.ui.dropdownShowing = true;
          var positionDropdown = function(){
            var textHeader = $('#textHeader');
            var offset = textHeader.offset();
            headerDropdown.offset({top: 0, left: 0});
            headerDropdown.html(_a.environment.text.dropdown);
            headerDropdown.offset({top: offset.top + textHeader.height() , left: offset.left});
            headerDropdown.innerWidth(textHeader.outerWidth());
          }
          positionDropdown();
          //reposition on resize
          $(window).unbind('resize').resize(positionDropdown);
          //hide on click anywhere outside of the headerDropdown
          $(document).click(function(){hideDropdown();});

          //add the next and prev segment handlers
          if(_a.environment.text.next != undefined){
            var nextSeg = $(headerDropdown.find('#nextSeg').get(0));
            nextSeg.addClass('textNav').removeClass('greyed-out');
            nextSeg.unbind('click').click(function(event){
              event.stopPropagation();
              nextSeg.html('Loading...');
              startLoadingText(_a.environment.text.next);
            });
          }
          if(_a.environment.text.prev != undefined){
            var prevSeg = $(headerDropdown.find('#prevSeg').get(0));
            prevSeg.addClass('textNav').removeClass('greyed-out');
            prevSeg.unbind('click').click(function(event){
              event.stopPropagation();
              prevSeg.html('Loading...');
              startLoadingText(_a.environment.text.prev);
            });
          }

          //finally fade in the dropdown menu
          headerDropdown.fadeIn();
        }else{
          hideDropdown();
        }
      });
    }});
  }

  /**
   * Just loads the word
   */
  var loadWord = function(html, title, locus){
    $('#dictionaryHeader').html('Dictionary: ' + title + ' <span class="locus">' + locus + '</span>');
    $('#dictionaryContent').html(html);
  }

  /**
   * Loads a dictionary definition from perseus dictionary
   */
  var loadDictionaryPerseus = function(url, title, locus){
    //construct the link
    var morphUrl = MORPH_URL + url;

    //before loading the remote data, check if it is already cached
    var cached = false;
    $.each(_a.environment.dictionary.cache, function(index, word){
      if(word.wordUrl == morphUrl){
         loadWord(word.data, word.wordTitle, word.loc);
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
      //for now remove the word frequency statistics
      $('#dictionaryContent .word_freq').remove();
      //Move all lexica links to the end of the lemma
      $('#dictionaryContent a[href="#lexicon"]').each(function(index, value){
        $(value).closest('.lemma').append(value);
        $(value).addClass('btn btn-primary btn-sm lexLink');
        //overwrite any old click behaviour
        $(value).removeAttr('onclick');
        $(value).prop('onclick', null);
        //reset the href attribute
        $(value).attr('href', '#');
        //remove '-link' from the id so it can be used from hereonout
        var id = $(value).attr('id');
        $(value).attr('id', id.substr(0, id.length - 5));
      });
      $('#dictionaryContent p').remove();
      //If there was no result, at least display that
      if($('#dictionaryContent').html().trim().length == 0){
        $('#dictionaryContent').html("<h3>Sorry!</h3><p>It looks like no result could be found for that word.</p>");
      }

      //Handle the click of the lexicon request button
      $("#dictionaryContent").find('.lexLink').attr('onclick', 'andromeda.search.loadLexicon(event, this);');

      //show the word
      loadWord($('#dictionaryContent').html(), title, locus);

      //cache this specific word
      cacheDictWord(title, $('#dictionaryContent').html(), morphUrl, locus);


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
            var cachedObj = _a.environment.dictionary.cache[$(this).attr('resultIndex')];
            loadWord(cachedObj.data, cachedObj.wordTitle, cachedObj.loc);
          });
        }else{
          hideDropdown();
        }
      });
    }});
  }

  /**
   * Called by the lexicon links
   * @param  {Event} event the mouse event, to stop propagation
   * @param  {Element} link  the clicked anchor element
   */
  var loadLexicon = function(event, link){
    event.stopPropagation();
    //get the data from the link
    var lexiconName = link.textContent;
    var lemmaName = $(link).closest('.lemma').find('h4').get(0).textContent;
    var wordTitle = lemmaName + "&nbsp;<span class='lexiconName'>(" + lexiconName + ")</span>";
    var lexiconUrl = TEXT_LOAD_URL + "?doc=" + link.id;

    //check if it is already cached
    var cached = false;
    $.each(_a.environment.dictionary.cache, function(index, word){
      if(word.wordUrl == lexiconUrl){
        loadWord(word.data, word.wordTitle, word.loc);
        cached = true;
       }
    });
    if(cached) return;

    $.ajax({url: lexiconUrl, success: function(result){
      cacheDictWord(wordTitle, result, lexiconUrl, '');
      loadWord(result, wordTitle);
    }});
  }

  /**
   * Handles the caching of words, prevents the cache from exceeding the limits,
   * recreates the dropdown menu
   * @method cacheDictWord
   */
  var cacheDictWord = function(title, html, url, locus){
    var cache = {
      wordTitle: title,
      data: html,
      wordUrl: url,
      loc: locus
    }
    //add the result to the cache
    _a.environment.dictionary.cache.unshift(cache);
    //if we have too many cached, remove the oldest one
    if(_a.environment.dictionary.cache.length > DICT_CACHE_SIZE) _a.environment.dictionary.cache.pop();
    //recreate the data to display on header click
    _a.environment.dictionary.dropdown = '';
    $.each(_a.environment.dictionary.cache, function(index, word){
      _a.environment.dictionary.dropdown += "<div class='dropdownLink' resultIndex=" + index +
                        "><span class='dropdownIcon'/>" + word.wordTitle + ' ' + word.loc + "</div>";
    });
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

      //Linenumbering shit. Construct a locus. THis is hell
      var lineNumberElement = $(this).prevAll('span').get(0);

      //The linenumber is the previous linenumber if there was one
      var lineNumber = (lineNumberElement == undefined) ? "" : lineNumberElement.textContent;
      var txtName = _a.environment.text.name;
      //if there wasn't try to find out what the first one should be based onthe textname
      if(lineNumberElement == undefined){
        if(txtName.startsWith('lines')){
          lineNumber = txtName.split(' ')[1].split('-')[0];
        }else if(txtName.startsWith('chapter') || txtName.startsWith('book')){
          lineNumber = '1';
        }else if(txtName.startsWith('poem')){
          lineNumber = '';
        }
      }
      var wordTitle = $(this).text();
      //preface the section name, only if it is not identical to the text name
      var locus = (_a.environment.text.section !== _a.environment.text.name) ? _a.environment.text.section : '';
      //append the textName to the locus only if the name is not a line summary
      locus += (!txtName.startsWith('lines'))? _a.environment.text.name : '';
      //if we have added anything to the locus thus far and we still need to add a linenumber, separate with a dot
      if(locus.length > 0 && lineNumber.length > 0) locus += '.';
      locus += lineNumber.toString();
      loadDictionaryPerseus($(this).attr('href'), wordTitle, locus);
    });
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
    perseus: searchPerseus,
    loadLexicon: loadLexicon
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
