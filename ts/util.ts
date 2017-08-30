class AndromedaUtil{

    
    constructor(){};

    /**
     * Uppercase for the first letter of every word in a sentence. Utiltity function
     * @param  {String} s the string you want to modify
     * @return {String}   The Modified String With Uppercase For Each Word
     */
    ucfirst (s){
    var words = s.split(' ');
    var res = [];
    var temp;
    for(var i in words){
        temp = words[i].toLowerCase();
        temp = temp.charAt(0).toUpperCase() + temp.substr(1);
        res.push(temp);
    }
    return res.join(' ');
    }

    /**
     * Returns the Selection object that is currently selected
     * @return {Selection} the selection
     */
    getSelection():Selection{
        var t:Selection;
        if (window.getSelection) {
            t = window.getSelection();
        } else if (document.getSelection) {
            t = document.getSelection();
        }
        return t;
    }
}