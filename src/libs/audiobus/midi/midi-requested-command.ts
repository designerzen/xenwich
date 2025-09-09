/**
 * This is a way to create an event that is scheduled for the future
 * 
 */

import MIDICommand from "./midi-command.ts"

export default class MIDIRequestedCommand extends MIDICommand{

    // only update this when it is a modulo of this
    #snap = 16

    // 
    #event

    constructor( noteEvent, velocity ){
        super( velocity )
        this.#event = noteEvent
    }

    /**
     * Check to see if this 
     * @param timestamp {Number}
     * @param division {Number}
     * @returns {Boolean}
     */
    update( timestamp, division=0 )
    {
        const remaining = timestamp - (this.startAt ?? 0)
        // compare timestamps and see if this is scheduled to have already begun
        if (remaining > 0)
        {
            console.info("This should have begun!", remaining)
            if (division % this.#snap === 0)
            {
                // trigger!
                return true
            }

        }else{
            console.info("still waiting for musical event", remaining)
        }

        return super.update(timestamp, division)
    }

    /**
     * Clone this Event
     * @param timestampOffset 
     * @returns 
     */
    clone( timestampOffset=0 ){
        const command = new MIDIRequestedCommand( this.#event )
        this.noteOn( this.number, this.velocity, this.startAt - timestampOffset  )
        this.noteOff( this.number, this.endAt - timestampOffset )
        return command
    }
}