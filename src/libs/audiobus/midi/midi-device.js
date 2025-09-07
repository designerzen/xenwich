/**
 * Create a MIDI Device per connection
 * then pass in all note on and note off data
 * in realtime and this will update and mediate
 * the timing and the quantisation via the update 
 * method that should be run at 24 ticks per quarternote 
 */

import MIDIRequestedCommand from './midi-requested-command.js'

export default class MIDIDevice{

    requestedCommands = new Map()

    constructor( MIDIDevice ){
        console.info("Quanitsable MIDI Device Created!", MIDIDevice )
    }

    /**
     * Note ON - create a Command and store for later use
     * @param {Note} noteEvent 
     * @returns Whether or not the note was already playin
     */
    noteOn( noteEvent ){
        // see if one exists and re-use or create a new one
        let command 
        if (this.requestedCommands.has(noteEvent.number))
        {
            // the same note has been requested so we overwrite the 
            // original note with this new note
            command = this.requestedCommands.get(noteEvent.number)
            // overwrite the command

            this.requestedCommands.set( noteEvent.number, command )
            return null // 
        }
        command = new MIDIRequestedCommand( noteEvent )
        this.requestedCommands.set( noteEvent.number, command )
        console.info("Quanitsable MIDI Device Note ON", noteEvent.number, noteEvent, this.requestedCommands )
        return command
    }

    /**
     * Note OFF - Find the related command and utilise
     * @param {Note} noteEvent 
     */
    noteOff( noteEvent ){
        // don't delete the command!
        // just update the end time
        // this.requestedCommands.delete( noteEvent.number )
        console.info("Quanitsable MIDI Device Note OFF", noteEvent.number, noteEvent, this.requestedCommands )
    }

    /**
     * Loop through all future commands and see if they are now
     * ready to be triggered
     * @returns all commands that have been triggered
     */
    update( time ){
        const output = []
        this.requestedCommands.forEach( command => {
            // trigger commands if now is their time!
            const updated = command.update(time)
            // if the command is ready to be triggered, trigger it!
            if (updated)
            {
                output.push( command )
                this.requestedCommands.delete( command.number )
                console.info("Quanitsable MIDI Device Command Triggered", {command, updated} )
            }else{
                console.info("Quanitsable MIDI Device Tested Command and ignored", {command, updated} )
            }
        })
        return output
    }
}