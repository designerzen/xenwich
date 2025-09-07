/**
 * This is a way to create an event that is scheduled for the future
 * 
 */

import MIDICommand from "./midi-command"

export default class MIDIRequestedCommand extends MIDICommand{

    // only update this when it is a modulo of this
    #snap = 16

    get number(){
        return this.event.number
    }

    constructor( noteEvent ){
        super()
        this.event = noteEvent
    }

    update( timestamp )
    {
     
        if (timestamp % this. #snap === 0)
        {
            // trigger!
        }
        return super.update(timestamp)
    }
}