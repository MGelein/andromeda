class AndromedaUI{
    //A ref  to the base application
    andromeda:Andromeda;
    //Holds all the dropdown HTML data as strings
    dropdown:Dropdown = new Dropdown();

    /**
     * Pass a reference to the main application to initialize
     * @param a a reference to the main app
     */
    constructor(a:Andromeda){
        this.andromeda = a;
    }

    /**
     * Registers all the click handlers for the UI
     */
    registerClickHandlers():void{
        //Click handler of the Load From Perseus Button
        $('#loadFromPerseusButton').click(function(){
            andromeda.ext.perseus($('#loadFromPerseusButton'), $('#loadFromPerseusQuery'));
        });
        $('#loadFromPerseusQuery').keydown(function(e){
            if(e.keyCode == 13){
                andromeda.ext.perseus($('#loadFromPerseusButton'), $('#loadFromPerseusQuery'));
            }
        });
        $('#loadFromFileButton').change(function(event){
            andromeda.file.load((event.target as HTMLInputElement).files[0]);
        });
    }
}