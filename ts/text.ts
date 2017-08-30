class AndromedaText{
    //The locus of the text as a String representation
    locus:string;
    //The perseus shortcut to this passage: e.g. Thuc. 1.1.1
    shortcut:string;
    //The link to the document page of this passage
    doc:string;
    //The title of this document.
    title:string;
    //A link to the next passage. Undefined if there is no next passage
    next:string;
    //A link to the previous passage. Undefined if there is no previous passage
    prev:string;

    
    constructor(){};
}