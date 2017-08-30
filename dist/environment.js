var Environment = (function () {
    function Environment() {
        this.translations = [];
        this.text = new AndromedaText();
        this.notes = new AndromedaNotes();
        this.dictionary = new AndromedaDictionary();
    }
    ;
    return Environment;
}());
