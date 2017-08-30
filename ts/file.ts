class AndromedaFile{
    //Reference to the main app
    andromeda:Andromeda;

    /**
     * Pass a reference to the main application to initialize
     * @param a a reference to the main app
     */
    constructor(a:Andromeda){
        this.andromeda = a;
    }

    /**
     * This method takes care of the actual downloading of the files
     * @param fileName 
     */
    save(fileName:string, env:Environment){
        var href = "data:text/json;charset=utf-8," + encodeURI(JSON.stringify(env));
        var link = document.createElement("a");
        link.download = fileName;
        link.href = href;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        $(link).remove();
    }

    /**
     * Called when we load a file
     * @param {File} file the file to load
     */
    load(file:File){
        //instantiate the fileReader.
      var reader = new FileReader();
      reader.onload = (function(event: FileReaderEvent){
        //get the data from the event
        var data = event.currentTarget.result;
        //decode and parse the data as JSON
        var env = JSON.parse(decodeURI((data)));
        //remove all the greyed-out classes
        $('.greyed-out').removeClass('greyed-out');
        //Hide the dropdown
        andromeda.ui.dropdown.hide();

        //set the env variables
        andromeda.environment = env;
        //start loading all the stuff back into memory
        andromeda.ext.loadText();
        andromeda.ext.loadTrans();
        //empty the note and dictionary content
        $('#noteContent').html('');
        $('#dictionaryContent').html('');
        //reload all the notes
        $.each(andromeda.environment.notes.all, function(index, note){
            andromeda.environment.notes.toAdd = note;
            andromeda.ext.addNote();
        });
        //reload the dict
        andromeda.ext.loadDictionaryCache();
      });
      //we only care about the first file. Should be the only file available to select
      reader.readAsText(file);
    }
}