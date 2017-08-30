class AndromedaTranslation{
    //The document URL for this passage of the translation.
    doc:string;
    //The HTML data for this passage of the translation
    data:string;
    //The translation title for this passage of the translation
    title:string;

    /**
     * Creates a new translation with the specified title
     * @param title 
     */
    constructor(title:string){
        this.title = title;
    }
}