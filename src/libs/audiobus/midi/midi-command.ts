/**
 * This is a way to create a musical event
 * that can be sent to other methods in order
 * to control them. This is the backbone of the app
 * and these get sent everywhere that this are valod
 * 
 * This is one of the classic MIDI controls
 * from Note On to Note Off to PitchBend etc.
 */
export default class MIDICommand{

    get number(){
        return this.#number
    }
    get velocity(){
        return this.#velocity
    }
    get startAt(){
        return this.#startAt
    }
    get endAt(){
        return this.#endAt
    }
   
    #number
    #velocity
    #startAt
    #endAt

    constructor(){
      
    }

    /**
     * Start note at
     * @param {Number} noteNumber 
     * @param {Number} velocity 
     * @param {Number} timestamp 
     */
    noteOn( noteNumber, velocity, timestamp ){
        this.#number = noteNumber
        this.#velocity = velocity
        this.#startAt = timestamp
    }
    
    /**
     * End note at
     * @param {Number} noteNumber 
     * @param {Number} timestamp 
     */
    noteOff( noteNumber, timestamp ){
        this.#number = noteNumber
        this.#endAt = timestamp
    }

    /**
     * Run many times until it is complete
     */
    update( timestamp, division ){
        // see if it is time to trigger this command!
        return false
    }

    clone( timestampOffset=0 ){
        const command = new MIDICommand()
        this.noteOn( this.number, this.velocity, timestampOffset  )
        this.noteOff( this.#number, timestampOffset )
        return command
    }
}