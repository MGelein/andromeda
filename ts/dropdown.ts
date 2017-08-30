class Dropdown{
    //A flag if the header dropdown is currently showing
    showing:boolean = false;

    //Holds the HTML data for the translation dropdown
    translation:string;

    //Holds the HTML data for the text dropdown
    text:string;

    //Holds the HTML data for the dictionary dropdown
    dictionary:string;

    
    constructor(){};

    /**
    * You can call this function to hide the dropdownMenu for the header
    */
    hide(){
        var headerDropdown = $('#headerDropdown');
        $(window).unbind('resize');
        $(document).unbind('click');
        this.showing = false;
        headerDropdown.html('');
        headerDropdown.offset({top: 0, left: 0});
        headerDropdown.innerWidth(0);
        headerDropdown.hide();
    }
}