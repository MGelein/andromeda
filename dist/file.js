var AndromedaFile = (function () {
    function AndromedaFile(a) {
        this.andromeda = a;
    }
    AndromedaFile.prototype.save = function (fileName, env) {
        var href = "data:text/json;charset=utf-8," + encodeURI(JSON.stringify(env));
        var link = document.createElement("a");
        link.download = fileName;
        link.href = href;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        $(link).remove();
    };
    AndromedaFile.prototype.load = function (file) {
        var reader = new FileReader();
        reader.onload = (function (event) {
            var data = event.currentTarget.result;
            var env = JSON.parse(decodeURI((data)));
            $('.greyed-out').removeClass('greyed-out');
            andromeda.ui.dropdown.hide();
            andromeda.environment = env;
            andromeda.ext.loadText();
            andromeda.ext.loadTrans();
            $('#noteContent').html('');
            $('#dictionaryContent').html('');
            $.each(andromeda.environment.notes.all, function (index, note) {
                andromeda.environment.notes.toAdd = note;
                andromeda.ext.addNote();
            });
            andromeda.ext.loadDictionaryCache();
        });
        reader.readAsText(file);
    };
    return AndromedaFile;
}());
