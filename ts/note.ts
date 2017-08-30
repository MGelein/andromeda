/**
 * General purpose notes object. Holds all the notes etc.
 */
class AndromedaNotes{
    //the note that we're busy adding to the notes list
    toAdd:AndromedaNote;
    //List of all the notes we have
    all:AndromedaNote[] = [];

    
    constructor(){};
}
/**
 * A single note
 */
class AndromedaNote{
    //The text of the note. This is the text the note talks about.
    text:string;
    //The short version of the text. Used to display long passages
    blurb:string;
    //The type of note. Currently 'dict' or 'user'
    type:string;
    //The locus of the place this note talks about
    locus:string;
    //The id-number of this specific note
    id:number;
    //The HTML data string that contains the actual content of the note
    data:string;

    /**
     * Constructs a new note talking about the provided locus
     * @param locus 
     */
    constructor(locus:string){
        this.locus = locus;
    }
}