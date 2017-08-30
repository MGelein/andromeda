class AndromedaDictionary{
    //Holds the word that is currently showing
    current:AndromedaWord;
    //Holds all the cache objects that have been saved to prevent unnecessary network traffic
    cache:AndromedaWord[] = [];

    constructor(){};

}

/**
 * Holds a single word
 */
class AndromedaWord{
    //morph url of the word
    url:string;
    //title of the word. Also known as lemma
    title:string;
    //Locus of the lemma. Place we're referring to
    locus:string;
    //Data of the note. contains HTML string
    data:string;
    
    
    constructor(){};
}