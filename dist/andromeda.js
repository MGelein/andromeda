"use strict";
var Andromeda = (function () {
    function Andromeda(version, author) {
        this.environment = new Environment();
        this.util = new AndromedaUtil();
        this.ui = new AndromedaUI(this);
        this.file = new AndromedaFile(this);
        this.ext = new AndromedaExternal();
        this.version = version;
        this.author = author;
    }
    return Andromeda;
}());
var andromeda = new Andromeda(0.5, 'Mees Gelein');
(function (_a) {
    var TEXT_LOAD_URL = "http://www.perseus.tufts.edu/hopper/loadquery";
    var SEARCH_URL = "http://www.perseus.tufts.edu/hopper/searchresults?q=";
    var MORPH_URL = "http://www.perseus.tufts.edu/hopper/";
    var DICT_CACHE_SIZE = 10;
    var textDropdownHTML = "<div class='row'><hr>"
        + "<div class='col-sm-12 text-center'><h4>Navigation</h4></div>"
        + "<div class='col-sm-5 text-center'><span id='prevSeg' class='btn btn-sm btn-xs btn-outline-secondary disabled noPointer'>◀&nbsp;Previous Segment</span></div>"
        + "<div class='col-sm-2 text-center'><span id='newSeg' class='btn btn-sm btn-xs btn-outline-primary'>New Query</span></div>"
        + "<div class='col-sm-5 text-center'><span id='nextSeg' class='btn btn-sm btn-xs btn-outline-secondary disabled noPointer'>&nbsp;Next Segment&nbsp;▶</span></div><hr>"
        + "<div class='col-sm-12 text-center'><h4>Save &amp; Load</h4></div>"
        + "<div class='col-sm-1'></div>"
        + "<div class='col-sm-4 text-center'><span id='saveButton' class='btn btn-sm btn-xs btn-outline-primary btn-block'>Save</span></div>"
        + "<div class='col-sm-2 '></div>"
        + "<div class='col-sm-4 text-center'><span id='loadButton' class='btn btn-sm btn-xs btn-outline-primary btn-block'>Load</span></div><hr>"
        + "<div class='col-sm-1'></div>"
        + "</div>";
    function searchPerseus(btn, field, startFromScratch) {
        if (startFromScratch === void 0) { startFromScratch = true; }
        var query = field.val().trim();
        field.val('');
        if (query.length == 0)
            return;
        btn.val('Loading...').removeClass('btn-primary').addClass('btn-warning');
        var perseusUrl = query;
        if (query.indexOf('http') != 0) {
            perseusUrl = SEARCH_URL + encodeURI(query);
        }
        if (startFromScratch) {
            $('#noteContent').html('');
            $('#dictionaryContent').html('');
        }
        startLoadingText(perseusUrl);
    }
    function startLoadingText(perseusUrl) {
        _a.environment.translations = [];
        _a.environment.text = new AndromedaText();
        $.ajax({ url: perseusUrl, success: function (result) {
                if (result.indexOf('<title>Perseus Search results</title>') != -1 || result.indexOf('<link href="/js/perseusld/perseusld.css" rel="stylesheet" type="text/css"/>') == -1) {
                    var newSegBut = $('#newSegDiv').find('#newSegQueryButton');
                    newSegBut.val('Not A Know Text').removeClass('btn-warning').addClass('btn-danger');
                    $('#loadFromPerseusButton').val('Not A Known Text').removeClass('btn-warning').addClass('btn-danger');
                    setTimeout(function () {
                        newSegBut.val('Load From Perseus').removeClass('btn-danger').addClass('btn-primary');
                        $('#loadFromPerseusButton').val('Load From Perseus').removeClass('btn-danger').addClass('btn-primary');
                    }, 2000);
                }
                else {
                    $($('#newSegDiv').fadeOut()).promise().done(function () {
                        var newSegBut = $('#newSegDiv').find('#newSegQueryButton');
                        newSegBut.val('Load From Perseus').removeClass('btn-warning').addClass('btn-primary');
                    });
                    result = result.replace(/<img/g, '<span');
                    var jResult = $(result);
                    _a.environment.text.locus = '';
                    jResult.find('.current').each(function (index, val) {
                        var part = $(val).attr('title');
                        part = _a.util.ucfirst(part);
                        part = part.trim();
                        if (part.indexOf('ection') != -1) {
                            _a.environment.text.locus += part.replace('Section ', '.');
                        }
                        else {
                            _a.environment.text.locus += ', ' + part;
                        }
                    });
                    _a.environment.text.locus = _a.environment.text.locus.substr(2);
                    _a.environment.text.shortcut = jResult.find('#header_jump_form > input[name="doc"]').val();
                    var currentLink = jResult.find('.current').filter(':last').get(0);
                    _a.environment.text.doc = TEXT_LOAD_URL + $(currentLink).attr('href');
                    var title = $(jResult.find('#header_text').get(0)).find('h1').get(0).textContent;
                    _a.environment.text.title = title.replace(/[\s]/g, ' ').replace(/\s\s+/g, ' ').trim();
                    var nextArrow = jResult.find('.arrow span[alt="next"]').get(0);
                    var prevArrow = jResult.find('.arrow span[alt="previous"]').get(0);
                    if (nextArrow != undefined) {
                        _a.environment.text.next = MORPH_URL + $(nextArrow).parent().attr('href');
                    }
                    else {
                        _a.environment.text.next = undefined;
                    }
                    if (prevArrow != undefined) {
                        _a.environment.text.prev = MORPH_URL + $(prevArrow).parent().attr('href');
                    }
                    else {
                        _a.environment.text.prev = undefined;
                    }
                    loadText();
                    var index = 0;
                    while (true) {
                        var transHeaders = jResult.find('#translation' + index + ' .header');
                        if (transHeaders.length < 1)
                            break;
                        var transHeader = transHeaders.get(0);
                        var translation = new AndromedaTranslation(transHeader.textContent.split('\n')[3]);
                        translation.doc = TEXT_LOAD_URL + $($(transHeader).find('.toggle').get(1)).attr('href').replace('text', '');
                        _a.environment.translations.push(translation);
                        index++;
                    }
                    loadTranslations();
                }
                $('.greyed-out').removeClass('greyed-out');
                _a.ui.dropdown.hide();
            } });
    }
    ;
    var loadTranslation = function (html, title) {
        $('#translationContent').html(html);
        $('#translationHeader').html('Translation: <span class="titleName">' + title + '</span>');
    };
    var loadTranslations = function () {
        $('#translationContent').html('');
        _a.ui.dropdown.translation = '';
        $.each(_a.environment.translations, function (index, translation) {
            $.ajax({ url: translation.doc, success: function (result) {
                    result = result.replace(/<hr[^>]*>/g, "");
                    result = result.replace(/<img[^>]*>/g, "");
                    translation.data = result;
                    _a.ui.dropdown.translation += "<div class='dropdownLink' resultIndex='" + index + "'>"
                        + "<span class='dropdownIcon'/>" + translation.title + "</div>";
                    if (index == 0)
                        loadTranslation(result, translation.title);
                } });
        });
        $('#translationHeader').unbind('click').click(function (event) {
            event.stopPropagation();
            var headerDropdown = $('#headerDropdown');
            if (!_a.ui.dropdown.showing) {
                _a.ui.dropdown.showing = true;
                var positionDropdown = function () {
                    var transHeader = $('#translationHeader');
                    var offset = transHeader.offset();
                    headerDropdown.offset({ top: 0, left: 0 });
                    headerDropdown.html(_a.ui.dropdown.translation);
                    headerDropdown.offset({ top: offset.top + transHeader.height(), left: offset.left });
                    headerDropdown.innerWidth(transHeader.outerWidth());
                };
                positionDropdown();
                $(window).unbind('resize').resize(positionDropdown);
                $(document).click(function () { _a.ui.dropdown.hide(); });
                headerDropdown.find('.dropdownLink').each(function (index, link) {
                    if ($('#translationHeader').text().indexOf($(link).text()) == -1)
                        return;
                    $($(link).find('.dropdownIcon').get(0)).addClass('dropdownActiveIcon');
                });
                headerDropdown.fadeIn();
                headerDropdown.find('.dropdownLink').click(function (event) {
                    loadTranslation(_a.environment.translations[$(this).attr('resultIndex')].data, $(this).text());
                });
            }
            else {
                _a.ui.dropdown.hide();
            }
        });
    };
    var selectionHandler = function (event) {
        var sel = _a.util.getSelection();
        if (sel.isCollapsed) {
            hideAddNote();
            return;
        }
        var startNode = sel.anchorNode;
        var endNode = sel.focusNode;
        if (sel.toString().trim().length == 0)
            return;
        if (startNode.compareDocumentPosition(endNode) == 2) {
            var tempNode = endNode;
            endNode = startNode;
            startNode = tempNode;
        }
        var startLocus = getLocusFromElement(startNode);
        var addNote = $('#addNote');
        var toAdd = new AndromedaNote(startLocus);
        toAdd.text = sel.toString();
        _a.environment.notes.toAdd = toAdd;
        var positionAddNote = function () {
            if ($(startNode.parentNode).is('a'))
                startNode = startNode.parentNode;
            var startEl = $(startNode);
            if (!startEl.is('a')) {
                startEl = startEl.prev();
            }
            var offset = startEl.offset();
            if (offset == undefined)
                return;
            addNote.offset({ top: 0, left: 0 });
            addNote.offset({ top: offset.top - startEl.height() * 2, left: offset.left });
        };
        positionAddNote();
        $(window).unbind('resize').resize(positionAddNote);
        $(document).mousedown(hideAddNote);
        addNote.fadeIn();
    };
    var addNewNote = function (event) {
        if (event != undefined)
            event.stopPropagation();
        hideAddNote();
        var toAdd = _a.environment.notes.toAdd;
        var text = toAdd.text;
        text = text.replace(/[\n\r]/g, ' ');
        toAdd.text = text;
        var words = text.split(' ');
        var blurb = text;
        if (words.length > 4) {
            blurb = words[0] + ' ' + words[1] + '[..]' + words[words.length - 2] + ' ' + words[words.length - 1];
        }
        toAdd.blurb = blurb;
        if (event != undefined)
            toAdd.type = 'user';
        loadNoteDisplay(toAdd);
    };
    var loadNoteDisplay = function (note) {
        if (_a.environment.notes.all.indexOf(note) == -1) {
            note.id = -1;
            while (true) {
                note.id++;
                var matchFound = false;
                $.each(_a.environment.notes.all, function (i, n) {
                    if (note.id == n.id) {
                        matchFound = true;
                        return false;
                    }
                });
                if (!matchFound)
                    break;
            }
            _a.environment.notes.all.push(note);
        }
        var pointPart = note.locus.replace(/ /g, '_').split('.');
        var locusParts = pointPart[0].split(',_');
        if (pointPart.length > 1)
            locusParts.push(pointPart[1]);
        var secondLevelClass = 'secondLevel';
        if (locusParts.length == 2)
            secondLevelClass = 'thirdLevel';
        $.each(locusParts, function (index, part) {
            if (index == 0) {
                if ($('#noteContent').find('#note-' + part).length == 0) {
                    $('#noteContent').append('<div class="topLevel" id="note-' + part + '">'
                        + '<span class="collapseButton text-primary">▼</span><h5>'
                        + part.replace('_', ' ') + '</h5>'
                        + '</div>');
                    $('#noteContent').find('.topLevel').sort(function (a, b) {
                        var locA = $(a).find('h5').get(0).textContent;
                        var locB = $(b).find('h5').get(0).textContent;
                        return compareLoci(locA, locB);
                    }).appendTo($('#noteContent'));
                }
            }
            else if (index == 1) {
                if ($('#noteContent').find('#note-' + locusParts[0] + '-' + part).length == 0) {
                    $('#noteContent').find('#note-' + locusParts[0]).append('<div class="' + secondLevelClass + '" id="note-' + locusParts[0] + '-' + part + '"><span class="level2Name">'
                        + part.replace('_', ' ') + '</span><span class="collapseButton text-primary">▼</span></div>');
                    $('#note-' + locusParts[0]).find('.' + secondLevelClass).sort(function (a, b) {
                        var locA = $(a).find('.level2Name').get(0).textContent;
                        var locB = $(b).find('.level2Name').get(0).textContent;
                        return compareLoci(locA, locB);
                    }).appendTo($('#note-' + locusParts[0]));
                }
            }
            else if (index == 2) {
                if ($('#noteContent').find('#note-' + locusParts[0] + '-' + locusParts[1] + '-' + part).length == 0) {
                    $('#noteContent').find('#note-' + locusParts[0] + '-' + locusParts[1]).append('<div class="thirdLevel" id="note-' + locusParts[0] + '-' + locusParts[1] + '-' + part + '"><span class="level3Name">'
                        + part.replace('_', '') + '</span><span class="collapseButton text-primary">▼</span></div>');
                    $('#note-' + locusParts[0] + '-' + locusParts[1]).find('.thirdLevel').sort(function (a, b) {
                        var locA = $(a).find('.level3Name').get(0).textContent;
                        var locB = $(b).find('.level3Name').get(0).textContent;
                        return compareLoci(locA, locB);
                    }).appendTo($('#note-' + locusParts[0] + '-' + locusParts[1]));
                }
            }
        });
        $('.collapseButton').unbind('click').click(function (event) {
            if ($(this).text() == '▼') {
                $(this).parent().find('> div').fadeOut();
                $(this).text('▶');
            }
            else {
                $(this).parent().find('> div').fadeIn();
                $(this).text('▼');
            }
        });
        var noteHolderId = 'note-' + locusParts.join('-');
        if (note.data == undefined || note.data.length < 1) {
            note.data = "[Click To Edit]";
        }
        $('#' + noteHolderId).append('<div class="note" note-id="' + note.id + '"><div class="noteLemma">'
            + note.blurb + '&nbsp;:&nbsp;'
            + '<button class="float-right btn btn-outline-primary btn-sm btn-xs removeNoteButton" onclick="andromeda.ext.removeNote(this)">✖</button>'
            + '</div><div class="noteData">'
            + note.data + '</div></div>');
        var collapseBut = $('#' + noteHolderId).find('.collapseButton');
        if (collapseBut.text() == '▶') {
            collapseBut.click();
        }
        $('.noteData').unbind('click').click(function (event) {
            $(this).attr('contenteditable', 'true');
            $(this).keydown(function (event) {
                if (event.keyCode == 13 && !event.shiftKey) {
                    var noteId = parseFloat($(this).parent().attr('note-id'));
                    var i, max = _a.environment.notes.all.length, note;
                    for (i = 0; i < max; i++) {
                        if (_a.environment.notes.all[i].id == noteId) {
                            _a.environment.notes.all[i].data = $(this).html();
                        }
                    }
                    $(this).attr('contenteditable', 'false');
                }
            });
            $(this).unbind('focusout').focusout(function (event) {
                $(this).attr('contenteditable', 'false');
                var noteId = parseFloat($(this).parent().attr('note-id'));
                var i, max = _a.environment.notes.all.length, note;
                for (i = 0; i < max; i++) {
                    if (_a.environment.notes.all[i].id == noteId) {
                        $(this).html(_a.environment.notes.all[i].data);
                    }
                }
            });
        });
        console.log(note.type);
        if (note.type == 'dict')
            return;
        $('#' + noteHolderId).find('div[note-id="' + note.id + '"]').find('.noteData').click();
        setTimeout(function () {
            var noteDataEl = $('#' + noteHolderId).find('div[note-id="' + note.id + '"]').find('.noteData').get(0);
            noteDataEl.focus();
            var range = document.createRange();
            range.selectNodeContents(noteDataEl);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
        }, 200);
    };
    var removeNote = function (btn) {
        var note = $(btn).parent().parent();
        var noteId = note.attr('note-id');
        while (note.parent().find('.note').length == 1 && note.parent().attr('id') != 'noteContent') {
            note = note.parent();
        }
        note.fadeOut().promise().done(function () { this.remove(); });
        var i = 0;
        var max = _a.environment.notes.all.length;
        var n;
        for (i = 0; i < max; i++) {
            n = _a.environment.notes.all[i];
            if (n.id == noteId) {
                _a.environment.notes.all.splice(i, 1);
            }
        }
    };
    var compareLoci = function (locA, locB) {
        var partsA = locA.split(' ');
        var partsB = locB.split(' ');
        var partB, partA;
        for (var i = 0; i < partsA.length; i++) {
            partA = partsA[i];
            partB = partsB[i];
            if (isNaN(partA) || isNaN(partB)) {
                if (partA < partB)
                    return -1;
                if (partA > partB)
                    return 1;
            }
            else {
                var numA = parseFloat(partA);
                var numB = parseFloat(partB);
                if (numA < numB)
                    return -1;
                if (numA > numB)
                    return 1;
            }
        }
        return 0;
    };
    var hideAddNote = function () {
        var addNote = $('#addNote');
        addNote.offset({ top: 0, left: 0 });
        addNote.hide();
        $(document).unbind('mousedown');
        $(window).unbind('resize');
        if (window.getSelection) {
            if (window.getSelection().empty) {
                window.getSelection().empty();
            }
            else if (window.getSelection().removeAllRanges) {
                window.getSelection().removeAllRanges();
            }
        }
    };
    var loadText = function () {
        $('#textHeader').html('Text: Loading');
        $('#textContent').html('');
        $('#textContent').unbind('mouseup').mouseup(selectionHandler);
        $.ajax({ url: _a.environment.text.doc, success: function (result) {
                result = result.replace(/<hr[^>]*>/g, "");
                $('#textContent').html(result);
                $('#textHeader').html('Text: <span class="titleName">' + _a.environment.text.title + " | " + _a.environment.text.locus + "</span>");
                registerWordHandlers();
                _a.ui.dropdown.text = textDropdownHTML;
                $('#textHeader').unbind('click').click(function (event) {
                    event.stopPropagation();
                    var headerDropdown = $('#headerDropdown');
                    if (!_a.ui.dropdown.showing) {
                        _a.ui.dropdown.showing = true;
                        var positionDropdown = function () {
                            var textHeader = $('#textHeader');
                            var offset = textHeader.offset();
                            headerDropdown.offset({ top: 0, left: 0 });
                            headerDropdown.html(_a.ui.dropdown.text);
                            headerDropdown.offset({ top: offset.top + textHeader.height(), left: offset.left });
                            headerDropdown.innerWidth(textHeader.outerWidth());
                        };
                        positionDropdown();
                        $(window).unbind('resize').resize(positionDropdown);
                        $(document).click(function () { _a.ui.dropdown.hide(); });
                        if (_a.environment.text.next != undefined) {
                            var nextSeg = $(headerDropdown.find('#nextSeg').get(0));
                            nextSeg.addClass('btn-outline-primary').removeClass('btn-outline-secondary disabled noPointer');
                            nextSeg.unbind('click').click(function (event) {
                                event.stopPropagation();
                                nextSeg.html('Loading...');
                                startLoadingText(_a.environment.text.next);
                            });
                        }
                        if (_a.environment.text.prev != undefined) {
                            var prevSeg = $(headerDropdown.find('#prevSeg').get(0));
                            prevSeg.addClass('btn-outline-primary').removeClass('btn-outline-secondary disabled noPointers');
                            prevSeg.unbind('click').click(function (event) {
                                event.stopPropagation();
                                prevSeg.html('Loading...');
                                startLoadingText(_a.environment.text.prev);
                            });
                        }
                        var newSeg = $(headerDropdown.find('#newSeg').get(0));
                        newSeg.unbind('click').click(function () {
                            var newSegDiv = $('#newSegDiv');
                            newSegDiv.fadeIn();
                            newSegDiv.find('#location').text(_a.environment.text.title + ' ' + _a.environment.text.locus);
                            newSegDiv.find('#perseusShortcut').text(_a.environment.text.shortcut);
                            newSegDiv.find('#newSegCloseButton').unbind('click').click(function () {
                                newSegDiv.fadeOut();
                            });
                            newSegDiv.find('#newSegContent').unbind('click').click(function (event) {
                                event.stopPropagation();
                            });
                            newSegDiv.unbind('click').click(function () {
                                newSegDiv.fadeOut();
                            });
                            newSegDiv.find('#newSegQuery').unbind('keydown').keydown(function (event) {
                                if (event.keyCode == 13) {
                                    searchPerseus($('#newSegQueryButton'), $('#newSegQuery'), false);
                                }
                            });
                            newSegDiv.find('#newSegQueryButton').unbind('click').click(function () {
                                searchPerseus($('#newSegQueryButton'), $('#newSegQuery'), false);
                            });
                            newSegDiv.find('#newSegQuery').focus();
                        });
                        headerDropdown.find('#saveButton').unbind('click').click(function (event) {
                            _a.file.save(_a.environment.text.title + '.json', _a.environment);
                        });
                        headerDropdown.fadeIn();
                    }
                    else {
                        _a.ui.dropdown.hide();
                    }
                });
            } });
    };
    var loadWord = function (word) {
        _a.environment.dictionary.current = word;
        $('#dictionaryHeader').html('Dictionary: <span class="dictLemma">' + word.wordTitle + '</span> <span class="locus">' + word.loc + '</span>');
        $('#dictionaryContent').html(word.data);
    };
    var loadDictionaryCache = function () {
        var word = _a.environment.dictionary.current;
        $.each(_a.environment.dictionary.cache, function (index, word) {
            loadDictionaryPerseus(word.url.replace(MORPH_URL, ''), word.title, word.locus, true);
        });
        loadWord(word);
    };
    var loadDictionaryPerseus = function (url, title, locus, ignoreCache) {
        if (ignoreCache === void 0) { ignoreCache = false; }
        var morphUrl = MORPH_URL + url;
        var cached = false;
        $.each(_a.environment.dictionary.cache, function (index, word) {
            if (word.url == morphUrl) {
                loadWord(word);
                cached = true;
            }
        });
        if (cached && !ignoreCache)
            return;
        if (!cached) {
            $.ajax({ url: morphUrl, success: function (result) {
                    result = result.replace(/<img[^>]*>/g, "");
                    var mainColumn = $(result).find('#main_col').get(0);
                    $('#dictionaryContent').html(mainColumn.innerHTML);
                    $('#dictionaryContent table').addClass('table table-sm table-striped');
                    var addToNoteButton = "<button class='btn btn-sm btn-outline-primary btn-xs' onclick='andromeda.ext.addDictNote(event, this)'>+Notes</button>";
                    $('#dictionaryContent .lemma_header').append(addToNoteButton);
                    $('#dictionaryContent .word_freq').remove();
                    $('#dictionaryContent a[href="#lexicon"]').each(function (index, value) {
                        $(value).closest('.lemma').append(value);
                        $(value).addClass('btn btn-primary btn-sm btn-xs lexLink');
                        $(value).removeAttr('onclick');
                        $(value).prop('onclick', null);
                        $(value).attr('href', '#');
                        var id = $(value).attr('id');
                        $(value).attr('id', id.substr(0, id.length - 5));
                    });
                    $('#dictionaryContent p').remove();
                    if ($('#dictionaryContent').html().trim().length == 0) {
                        $('#dictionaryContent').html("<h3>Sorry!</h3><p>It looks like no result could be found for that word.</p>");
                    }
                    $("#dictionaryContent").find('.lexLink').attr('onclick', 'andromeda.ext.loadLexicon(event, this);');
                    cacheDictWord(title, $('#dictionaryContent').html(), morphUrl, locus);
                    loadWord(_a.environment.dictionary.cache[0]);
                } });
        }
        $('#dictionaryHeader').unbind('click').click(function (event) {
            event.stopPropagation();
            var headerDropdown = $('#headerDropdown');
            if (!_a.ui.dropdown.showing) {
                _a.ui.dropdown.showing = true;
                var positionDropdown = function () {
                    var dictHeader = $('#dictionaryHeader');
                    var offset = dictHeader.offset();
                    headerDropdown.offset({ top: 0, left: 0 });
                    headerDropdown.html(_a.ui.dropdown.dictionary);
                    headerDropdown.offset({ top: offset.top + dictHeader.height(), left: offset.left });
                    headerDropdown.innerWidth(dictHeader.outerWidth());
                };
                positionDropdown();
                $(window).unbind('resize').resize(positionDropdown);
                $(document).click(function () { _a.ui.dropdown.hide(); });
                headerDropdown.find('.dropdownLink').each(function (index, link) {
                    var dictHeaderText = $('#dictionaryHeader').text().replace('Dictionary:', '').trim().replace(' ', '').replace(' ', '');
                    var linkHeaderText = $(link).text().trim().replace(' ', '');
                    if (dictHeaderText != linkHeaderText)
                        return;
                    $($(link).find('.dropdownIcon').get(0)).addClass('dropdownActiveIcon');
                });
                headerDropdown.fadeIn();
                headerDropdown.find('.dropdownLink').click(function (event) {
                    var cachedObj = _a.environment.dictionary.cache[$(this).attr('resultIndex')];
                    loadWord(cachedObj);
                });
            }
            else {
                _a.ui.dropdown.hide();
            }
        });
    };
    var addDictNote = function (event, btn) {
        event.stopPropagation();
        var lemmaHeader = $(btn).parent().get(0);
        var lemma = $(lemmaHeader).find('h4').get(0);
        var lemmaDef = $(lemmaHeader).find('.lemma_definition').get(0);
        var toAdd = new AndromedaNote(_a.environment.dictionary.current.locus);
        toAdd.type = 'dict';
        toAdd.text = _a.environment.dictionary.current.title;
        toAdd.data = lemma.textContent + "&nbsp;=&nbsp;" + lemmaDef.textContent;
        _a.environment.notes.toAdd = toAdd;
        addNewNote(undefined);
    };
    var loadLexicon = function (event, link) {
        event.stopPropagation();
        var lexiconName = link.textContent;
        var lemmaName = $(link).closest('.lemma').find('h4').get(0).textContent;
        var wordTitle = lemmaName + "&nbsp;<span class='lexiconName'>(" + lexiconName + ")</span>";
        var lexiconUrl = TEXT_LOAD_URL + "?doc=" + link.id;
        var cached = false;
        $.each(_a.environment.dictionary.cache, function (index, word) {
            if (word.url == lexiconUrl) {
                loadWord(word);
                cached = true;
            }
        });
        if (cached)
            return;
        $.ajax({ url: lexiconUrl, success: function (result) {
                cacheDictWord(wordTitle, result, lexiconUrl, '');
                loadWord(_a.environment.dictionary.cache[0]);
            } });
    };
    var cacheDictWord = function (title, html, url, locus) {
        var word = new AndromedaWord();
        word.title = title;
        word.data = html;
        word.url = url;
        word.locus = locus;
        _a.environment.dictionary.cache.unshift(word);
        if (_a.environment.dictionary.cache.length > DICT_CACHE_SIZE)
            _a.environment.dictionary.cache.pop();
        recreateDictHeader();
    };
    var recreateDictHeader = function () {
        _a.ui.dropdown.dictionary = '';
        $.each(_a.environment.dictionary.cache, function (index, word) {
            _a.ui.dropdown.dictionary += "<div class='dropdownLink' resultIndex=" + index +
                "><span class='dropdownIcon'/><span class='dictLemma'>" + word.title + '</span><span class="locus">' + word.locus + "</span></div>";
        });
    };
    var registerWordHandlers = function () {
        $('.text a').unbind('click').attr('onclick', '');
        $('.text a').click(function (event) {
            event.preventDefault();
            var wordTitle = $(this).text();
            var locus = getLocusFromElement(this);
            loadDictionaryPerseus($(this).attr('href'), wordTitle, locus);
        });
    };
    var getLocusFromElement = function (el) {
        var locus = _a.environment.text.locus;
        if ($(el.parentNode).is('a'))
            el = el.parentNode;
        var lineNumberElement = $(el).prevAll('span').get(0);
        var lineNumber = (lineNumberElement == undefined) ? "" : lineNumberElement.textContent;
        var lastPart = locus.split(', ').pop();
        if (lineNumber.length < 1) {
            if (lastPart.indexOf('Book') == 0) {
                lineNumber = '1';
            }
            else if (lastPart.indexOf('Chapter') == 0) {
                if (lastPart.indexOf(".") != -1) {
                    lineNumber = '';
                }
                else {
                    lineNumber = '1';
                }
            }
            else if (lastPart.indexOf('Poem') == 9) {
                lineNumber = '' + ($(el).prevAll('br').length + 1);
            }
            else if (lastPart.indexOf('Lines') == 0) {
                lineNumber = lastPart.split(' ')[1].split('-')[0];
            }
        }
        if (lastPart.indexOf('Lines') == 0) {
            locus = locus.replace(', ' + lastPart, '');
        }
        if (lineNumber.length > 0)
            locus += '.';
        return locus + lineNumber;
    };
    var registerClickHandlers = function () {
        $('#loadFromPerseusButton').click(function () {
            searchPerseus($('#loadFromPerseusButton'), $('#loadFromPerseusQuery'));
        });
        $('#loadFromPerseusQuery').keydown(function (e) {
            if (e.keyCode == 13) {
                searchPerseus($('#loadFromPerseusButton'), $('#loadFromPerseusQuery'));
            }
        });
        $('#loadFromFileButton').change(function (event) {
            _a.file.load(event.target.files[0]);
        });
    };
    _a.ext.perseus = searchPerseus;
    _a.ext.loadLexicon = loadLexicon;
    _a.ext.addDictNote = addDictNote;
    _a.ext.addNote = addNewNote;
    _a.ext.removeNote = removeNote;
    _a.ext.loadText = loadText;
    _a.ext.loadDictionaryCache = loadDictionaryCache;
    _a.ext.loadTrans = loadTranslations;
})(andromeda);
$(document).ready(function () {
    andromeda.ui.registerClickHandlers();
    $('#headerDropdown').hide();
    $('#addNote').hide();
    $('#newSegDiv').hide();
});
