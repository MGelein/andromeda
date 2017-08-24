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
    //empty the note and dictionary content
    $('#noteContent').html('');
    $('#dictionaryContent').html('');

    //start loading the actual text
    startLoadingText(perseusUrl);
  }

  /**
   * Starts the actual loading of a valid perseus url. Either points to a search result, or
   * to an actual text page. This parses the pages and points the loading of the data to the right
   * urls
   */
  var startLoadingText = function(perseusUrl){
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

          //log each `.current` to form a locus
          _a.environment.text.locus = '';
          jResult.find('.current').each(function(index, val){
             var part = $(val).attr('title');

             //capitalize each word correctly and trim it
             part = _a.util.ucfirst(part);
             part = part.trim();

            //Special case of sections, they need to be incorporated into the chapter
            if(part.indexOf('ection') != -1){
              _a.environment.text.locus += part.replace('Section ', '.');
            }else{
              _a.environment.text.locus += ', ' + part;
            }
          });
          //take of the first two characters;
          _a.environment.text.locus = _a.environment.text.locus.substr(2);

          //get a link to the current page from the result and save it in the global andromeda environment object
          var currentLink = jResult.find('.current').filter(':last').get(0);
          _a.environment.text.doc = TEXT_LOAD_URL + $(currentLink).attr('href');
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
   * Handles the selection event of the mainText
   */
  var selectionHandler = function(event){
    var sel = _a.util.getSelected();
    //if this is not a selection, hide the addNote and stop
    if(sel.isCollapsed) {hideAddNote(); return;}
    //get the start and endNode
    var startNode = sel.anchorNode;
    var endNode = sel.focusNode;
    //don't allow empty or only whitespace selections
    if(sel.toString().trim().length == 0) return;

    //2 = the magical number that means the node order is backwards :D
    if(startNode.compareDocumentPosition(endNode) == 2){//if we are selecting backwards, swap the start and end
      var tempNode = endNode;
      endNode = startNode;
      startNode = tempNode;
    }

    //get the startLocus from the element
    var startLocus = getLocusFromElement(startNode);
    var addNote = $('#addNote');

    //save the information for this note
    var toAdd = {
      locus: startLocus,
      text: sel.toString()
    }
    //save it in the env variables
    _a.environment.note.toAdd = toAdd;

    //positions the addNote button
    var positionAddNote = function(){
      //normalize to the containing element
      if($(startNode.parentNode).is('a')) startNode = startNode.parentNode;
      var startEl = $(startNode);
      if(!startEl.is('a')){
        startEl = startEl.prev();
      }
      var offset = startEl.offset();
      //if no offset could be found, return!
      if(offset == undefined) return;
      //set the addNote position
      addNote.offset({top: 0, left: 0});
      addNote.offset({top: offset.top - startEl.height() * 2, left: offset.left});
    }
    positionAddNote();
    //reposition on resize
    $(window).unbind('resize').resize(positionAddNote);
    //hide on click anywhere outside of the button
    $(document).mousedown(hideAddNote);

    //finally fade in the button
    addNote.fadeIn();
  }

  /**
   * Addes a new Note to the note object
   */
  var addNewNote = function(event){
    //stop the event from propagating but also hide the button
    if(event != undefined) event.stopPropagation();
    hideAddNote();

    //start working with the note that needs to be added
    var toAdd = _a.environment.note.toAdd;
    var text = toAdd.text;
    //clean the text, remove returns and newlines
    text = text.replace(/[\n\r]/g, ' ');
    toAdd.text = text;
    //now split it into words and only use the first two and last two words as the blurb
    var words = text.split(' ');
    var blurb = text;
    //if there are more than 4 words
    if(words.length > 4){
        blurb = words[0] + ' ' + words[1] + '[..]' + words[words.length - 2] + ' ' + words[words.length - 1];
    }
    //add the created blurb to the to-add object
    toAdd.blurb = blurb;

    //add it to the displayed data
    loadNoteDisplay(toAdd);
  }

  /**
   * Adds a new note to the note display
   *
   */
  var loadNoteDisplay = function(note){
    var pointPart = note.locus.replace(/ /g, '_').split('.');
    var locusParts = pointPart[0].split(',_');
    //if there was a point part
    if(pointPart.length > 1) locusParts.push(pointPart[1]);

    var secondLevelClass = 'secondLevel';
    if(locusParts.length == 2) secondLevelClass = 'thirdLevel';

    //for each of the locus parts generate an element if it didn't already exist
    $.each(locusParts, function(index, part){
        if(index == 0){
          //check if this header has not been created yet
          if($('#noteContent').find('#note-' + part).length == 0){
            $('#noteContent').append(
              '<div class="topLevel" id="note-' + part + '">'
              + '<span class="collapseButton">▼</span><h5>'
              + part.replace('_', ' ') + '</h5>'
              +'</div>'
            );//▶

            //sort the top level divs
            $('#noteContent').find('.topLevel').sort(function(a, b){
              var locA = $(a).find('h5').get(0).textContent;
              var locB = $(b).find('h5').get(0).textContent;
              return compareLoci(locA, locB);
            }).appendTo($('#noteContent'));
          }
        }else if(index == 1){
          if($('#noteContent').find('#note-' + locusParts[0] + '-' + part).length == 0){
            $('#noteContent').find('#note-' + locusParts[0]).append(
              '<div class="' + secondLevelClass + '" id="note-' + locusParts[0] + '-' + part + '"><span class="level2Name">'
              + part.replace('_', ' ') + '</span><span class="collapseButton">▼</span></div>'
            );

            //sort the second level divs
            $('#note-' + locusParts[0]).find('.' + secondLevelClass).sort(function(a, b){
              var locA = $(a).find('.level2Name').get(0).textContent;
              var locB = $(b).find('.level2Name').get(0).textContent;
              return compareLoci(locA, locB);
            }).appendTo($('#note-' + locusParts[0]));
          }
        }else if(index == 2){
          if($('#noteContent').find('#note-' + locusParts[0] + '-' + locusParts[1] + '-' + part).length == 0){
            $('#noteContent').find('#note-' + locusParts[0] + '-' + locusParts[1]).append(
              '<div class="thirdLevel" id="note-' + locusParts[0] + '-' + locusParts[1] + '-' + part + '"><span class="level3Name">'
              + part.replace('_', '') + '</span><span class="collapseButton">▼</span></div>'
            );

            //sort the third level divs
            $('#note-' + locusParts[0] + '-' + locusParts[1]).find('.thirdLevel').sort(function(a, b){
              var locA = $(a).find('.level3Name').get(0).textContent;
              var locB = $(b).find('.level3Name').get(0).textContent;
              return compareLoci(locA, locB);
            }).appendTo($('#note-' + locusParts[0] + '-' + locusParts[1]));
          }
        }
    });
    //once a new level indicator has been added, re-add all the collapse stuff
    $('.collapseButton').unbind('click').click(function(event){
      if($(this).text() == '▼'){
        $(this).parent().find('> div').fadeOut();
        $(this).text('▶');
      }else{
        $(this).parent().find('> div').fadeIn();
        $(this).text('▼');
      }
    });

    //now that we're sure a parent element exist, append the note to it
    var noteHolderId = 'note-' + locusParts.join('-');
    if(note.data == undefined || note.data.length < 1){
      note.data = "[Click To Edit]";
    }
    $('#' + noteHolderId).append(
      '<div class="note"><div class="noteLemma">'
      + note.blurb +  '&nbsp;:&nbsp;'
      + '<button class="float-right btn btn-outline-primary btn-sm btn-xs removeNoteButton" onclick="andromeda.search.removeNote(this)">✖</button>'
      + '</div><div class="noteData">'
      + note.data + '</div></div>'
    );

    //if the noteHolder is collapsed that we're adding to, uncollapse it
    var collapseBut = $('#' + noteHolderId).find('.collapseButton');
    if(collapseBut.text() == '▶'){
      collapseBut.click();
    }

    //Bind the noteData Edit click
    $('.noteData').unbind('click').click(function(event){
        //allow the content to be edited
        $(this).attr('contenteditable', 'true');

        //stop the content editing on enter press
        $(this).keydown(function(event){
          if(event.keyCode == 13 && !event.shiftKey){
            $(this).attr('contenteditable', 'false');
          }
        });
    });
  }

  /**
   * Called by the remove button. Contains a ref to the remove button of the
   * note to be removed
   */
  var removeNote = function(btn){
    //first get a ref to the note that holds the button
    var note = $(btn).parent().parent();
    //check if the parent of this note contains other notes that the one we're removing
    //also implement a failsafe to prevent it deleting every div up to the document root. Stop at '#noteContent'
    while(note.parent().find('.note').length == 1 && note.parent().attr('id') != 'noteContent'){
      note = note.parent();
    }
    //finally remove the content
    note.fadeOut().promise().done(function(){this.remove();});
  }

  /**
   * Compare function, returns if one should be before the other
   */
  var compareLoci = function(locA, locB){
      //split on spaces
      var partsA = locA.split(' ');
      var partsB = locB.split(' ');
      var partB, partA;
      for(var i = 0; i < partsA.length; i++){
        //get the corresponding parts
        partA = partsA[i];
        partB = partsB[i];
        if(isNaN(partA) || isNaN(partB)){
          if(partA < partB) return -1;
          if(partA > partB) return 1;
          //if they are the same, continue this loop
        }else{
          var numA = parseFloat(partA);
          var numB = parseFloat(partB);
          if(numA < numB) return -1;
          if(numA > numB) return 1;
        }
      }
      //if you reach this, they are apparently identical
      return 0;
  }

  /**
   * Hides the add Note Btton
   */
  var hideAddNote = function(){
    var addNote = $('#addNote');
    addNote.offset({top: 0, left: 0});
    addNote.hide();
    $(document).unbind('mousedown');
    $(window).unbind('resize');
    //Try to remove the selection
    if (window.getSelection) {
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }
    } else if (document.selection) {  // IE?
      document.selection.empty();
    }
  }

  /**
   * Loads a text from Perseus
   */
  var loadText = function(){
    //Show that we're loading
    $('#textHeader').html('Text: Loading');
    $('#textContent').html('');

    //bind the selection listener
    $('#textContent').unbind('mouseup').mouseup(selectionHandler);

    //load it asynchronously
    $.ajax({url: _a.environment.text.doc, success: function(result){
      //remove the horizontal line above the text
      result = result.replace(/<hr[^>]*>/g,"");

      $('#textContent').html(result);
      $('#textHeader').html('Text: <span class="titleName">' + _a.environment.text.title + " | " + _a.environment.text.locus + "</span>");

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
  var loadWord = function(html, title, loc){
    _a.environment.dictionary.current = {
      text: title,
      locus: loc,
      data: ''
    };
    $('#dictionaryHeader').html('Dictionary: <span class="dictLemma">' + title + '</span> <span class="locus">' + loc + '</span>');
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
      $('#dictionaryContent table').addClass('table table-sm table-striped');

      //add the add to notes button
      var addToNoteButton = "<button class='btn btn-sm btn-outline-primary btn-xs' onclick='andromeda.search.addDictNote(event, this)'>+Notes</button>";
      $('#dictionaryContent .lemma_header').append(addToNoteButton);
      //for now remove the word frequency statistics
      $('#dictionaryContent .word_freq').remove();
      //Move all lexica links to the end of the lemma
      $('#dictionaryContent a[href="#lexicon"]').each(function(index, value){
        $(value).closest('.lemma').append(value);
        $(value).addClass('btn btn-primary btn-sm btn-xs lexLink');
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
          headerDropdown.find('.dropdownLink').each(function(index, link){              //apparently there are multiple forms of space.... o.0
            var dictHeaderText = $('#dictionaryHeader').text().replace('Dictionary:', '').trim().replace(' ', '').replace(' ', '');
            var linkHeaderText = $(link).text().trim().replace(' ', '');
            if(dictHeaderText != linkHeaderText) return;
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
   * Adds a new note form the dictionary. Includes a reference to the button that calls this function
   * @param  {Event} event The event fired by the button
   * @param  {Element} btn   The button
   */
  var addDictNote = function(event, btn){
    event.stopPropagation();
    //get the lemmaHeader
    var lemmaHeader = $(btn).parent().get(0);
    var lemma = $(lemmaHeader).find('h4').get(0);
    var lemmaDef = $(lemmaHeader).find('.lemma_definition').get(0);

    _a.environment.note.toAdd = {
      locus: _a.environment.dictionary.current.locus,
      text: _a.environment.dictionary.current.text,
      data: lemma.textContent + "&nbsp;=&nbsp;" + lemmaDef.textContent
    };

    addNewNote(undefined);
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
      loadWord(result, wordTitle, '');
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
                        "><span class='dropdownIcon'/><span class='dictLemma'>" + word.wordTitle + '</span><span class="locus">' + word.loc + "</span></div>";
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
      //get the title of the word. What the Dict. query is titled
      var wordTitle =  $(this).text();
      //get the locus from the element
      var locus = getLocusFromElement(this);

      loadDictionaryPerseus($(this).attr('href'),wordTitle, locus);
    });
  }

  /**
   * Constructs the locus from the provided element and the knowledge of the document
   * @param  {Element} el the HTML element that we want to get the locus of
   * @return {String}     the locus string
   */
  var getLocusFromElement = function(el){
    //first get a copy of the text locus
    var locus = _a.environment.text.locus;
    //check if it is a text node within a word or it is the actual word element
    if($(el.parentNode).is('a')) el = el.parentNode;
    //get the linenumber element previous to this element
    var lineNumberElement = $(el).prevAll('span').get(0);
    //The linenumber is the previous linenumber if there was one
    var lineNumber = (lineNumberElement == undefined) ? "" : lineNumberElement.textContent;
    //the last part of the locus
    var lastPart = locus.split(', ').pop();
    //If no linenumber pev
    if(lineNumber.length < 1){
      //based on the type of lastpart, let's
      if(lastPart.startsWith('Book')){
        lineNumber = '1';
      }else if(lastPart.startsWith('Chapter')){
        if(lastPart.indexOf(".") != -1){//If we already included a section number
          lineNumber = '';
        }else{
          lineNumber = '1';
        }
      }else if(lastPart.startsWith('Poem')){
        lineNumber = '' + ($(el).prevAll('br').length + 1);
      }else if(lastPart.startsWith('Lines')){
        lineNumber = lastPart.split(' ')[1].split('-')[0];
      }
    }
    //if the lastpart is a lines scope (Lines 1-50), remove it.
    if(lastPart.startsWith('Lines')){
      locus = locus.replace(', ' + lastPart, '');
    }
    //if we have found or created a linnumber, separate it with a period
    if(lineNumber.length > 0) locus += '.';
    return locus + lineNumber;
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

  _a.util = {
    /**
     * Uppercase for the first letter of every word in a sentence. Utiltity function
     * @param  {String} s the string you want to modify
     * @return {String}   The Modified String With Uppercase For Each Word
     */
    ucfirst : function(s){
      var words = s.split(' ');
      var res = [];
      var temp;
      for(var i in words){
        temp = words[i].toLowerCase();
        temp = temp.charAt(0).toUpperCase() + temp.substr(1);
        res.push(temp);
      }
      return res.join(' ');
    },

    /**
     * Returns the text that is currently selected
     * @return {String} the selected text
     */
    getSelected : function(){
      var t = '';
      if (window.getSelection) {
          t = window.getSelection();
      } else if (document.getSelection) {
          t = document.getSelection();
      } else if (document.selection) {
          t = document.selection.createRange().text;
      }
      return t;
    }
  };

  _a.search = {
    perseus: searchPerseus,
    loadLexicon: loadLexicon,
    addNote : addNewNote,
    addDictNote: addDictNote,
    removeNote: removeNote
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
    },
    note: {
      all: [],
      toAdd: {}
    }
  }
})(andromeda);

/**
 * Called when the document is done loading
 */
$(document).ready(function(){
  andromeda.ui.registerClickHandlers();
  $('#headerDropdown').hide();
  $('#addNote').hide();
});
