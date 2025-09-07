/**
 * Create a MIDI Device per connection
 * then pass in all note on and note off data
 * in realtime and this will update and mediate
 * the timing and the quantisation via the update 
 * method that should be run at 24 ticks per quarternote 
 */

import MIDIRequestedCommand from './midi-requested-command.ts'

export default class MIDIDevice{

    requestedCommands = new Map()
    name = "Unknown Device"

    constructor( deviceName ){
        if (deviceName)
        {
            this.name = deviceName
        }
        console.info("Quanitsable MIDI Device Created!", this )
    }

    /**
     * Note ON - create a Command and store for later use
     * @param {Note} noteEvent 
     * @returns Whether or not the note was already playin
     */
    noteOn( noteEvent, timestamp, velocity=1 ){
        // see if one exists and re-use or create a new one
        let command 
        if (this.requestedCommands.has(noteEvent.number))
        {
            // the same note has been requested so we overwrite the 
            // original note with this new note
            command = this.requestedCommands.get(noteEvent.number)
            // this.requestedCommands.set( noteEvent.number, command )
        }else{
            command = new MIDIRequestedCommand( noteEvent )
        }
        // overwrite the command
        command.noteOn( noteEvent.number, noteEvent.velocity, timestamp)
        this.requestedCommands.set( noteEvent.number, command )
        console.info(this.name + " MIDI Device Note ON", noteEvent.number, {noteEvent, command}, this.requestedCommands )
        return command
    }

    /**
     * Note OFF - Find the related command and utilise
     * @param {Note} noteEvent 
     */
    noteOff( noteEvent, timestamp ){
        // don't delete the command!
        // just update the end time
        if (this.requestedCommands.has(noteEvent.number))
        {
            // the same note has been requested so we overwrite the 
            // original note with this new note
            const command = this.requestedCommands.get(noteEvent.number)
            // overwrite the command
            command.noteOff( noteEvent.number, timestamp )

             console.info( this.name + " MIDI Device Note OFF", noteEvent.number, {noteEvent, command}, this.requestedCommands )
        }else{
            console.info( this.name + "MIDI Device requested note off but note not playing", noteEvent)
        }
        // this.requestedCommands.delete( noteEvent.number )
       
    }

    /**
     * Loop through all future commands and see if they are now
     * ready to be triggered
     * @returns all commands that have been triggered
     */
    update( timestamp, division=0 ){

        const output = []
        // console.info("MIDI Device",this, timestamp, this.requestedCommands)

        this.requestedCommands.forEach( command => {
            // console.info("MIDI Device",this, time, this.requestedCommands)
            // trigger commands if now is their time!
            const updated = command.update(timestamp, division)
            // if the command is ready to be triggered, trigger it!
            if (updated)
            {
                output.push( command )
                this.requestedCommands.delete( command.number )
                console.info(this.name + "Quanitsable MIDI Device Command Triggered",timestamp, {command, updated} )
            }else{
                console.info(this.name + "Quanitsable MIDI Device Tested Command and ignored",timestamp, {command, updated} )
            }
        })
        return output
    }
}