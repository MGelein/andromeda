/**
 * Generated to make sure we can parse FileReader events
 */
interface FileReaderEventTarget extends EventTarget{
    result: string;
}

interface FileReaderEvent extends Event{
    currentTarget: FileReaderEventTarget;
    getMessage(): string;
}