/**
 * Tonic
 * Supertonic
 * Mediant
 * Subdominant
 * Dominant
 * Submediant
 * Leading Tone
 * Sub-Tonic
 * 
 * Charles Goes Dancing At Every Big Fun Celebration.
 * From G D A E B...
 * 
 */

const ROOT_FREQUENCY = 440 // 440 //frequency of A (coomon value is 440Hz)
const ROOT_F_BY_32 = ROOT_FREQUENCY / 32
export const noteNumberToFrequency = noteNumber => ROOT_F_BY_32 * (2 ** ((noteNumber - 9) / 12))

const KEY_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]
const SOUNDS_SOLFEGE = ["Do","Do #","Re","Re #","Mi","Fa","Fa #","Sol","Sol #","La","La #","Si"]

// const SHARPS = [1,3,6,8,10]
const SHARPS = [false, true, false, true, false, false, true, false, true, false, true, false]
// const FLATS = [false, true, false, true, false, false, true, false, true, false, true, false]

export const QUANTITY_NOTES = KEY_NAMES.length

export const noteNumberToKeyName = noteNumber => KEY_NAMES[noteNumber % QUANTITY_NOTES]
export const noteNumberToOctave = noteNumber => Math.floor(noteNumber / QUANTITY_NOTES) - 1
export const isSharp = noteNumber => SHARPS[noteNumber % QUANTITY_NOTES] 
export const isFlat = noteNumber => isSharp(noteNumber)

// convert a letter and an octave to a noteNumber
export const keyAndOctaveAsNoteNumber = (key, octave=4, isAccidental=false) => KEY_NAMES.indexOf(key) + (octave * 12) + (isAccidental ? 1 : 0)

export default class NoteModel{

    // noteName
	// noteNumber
    // noteKey 
	// frequency
	// octave
    // accidental
    // sound
    // alternate
        
    get colour(){
        return "rgb("+360*(this.sequenceIndex%12)/12+",150,150)"
        return "hsl("+360*(this.sequenceIndex%12)/12+",5%,80%)"
    }


    set noteNumber(noteNumber){
        this.number = noteNumber
        this.sequenceIndex = noteNumber % QUANTITY_NOTES
        this.noteKey =  noteNumberToKeyName( noteNumber )  
        this.octave = noteNumberToOctave( noteNumber )
        this.noteName =  this.noteKey + this.octave
        this.frequency = noteNumberToFrequency( noteNumber )
        this.accidental = isSharp( noteNumber )
        this.sound = SOUNDS_SOLFEGE[noteNumber % SOUNDS_SOLFEGE.length]
        this.alternate = this.accidental ? 
            noteNumberToKeyName( noteNumber + 1 ) + " Flat"  :
            this.noteName 
    }

    get noteNumber(){
        return this.number
    }

    constructor( noteNumber ){
       this.noteNumber = noteNumber
    }

    toString(){
        return "[Note: "+this.noteNumber+" key:"+this.noteKey+"  octave:" + this.octave + " sound:" + this.sound+"  ] Freq:"+ this.frequency
    }
}