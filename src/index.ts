import './assets/style/index.scss'
import "./libs/audiotool/audio-tool-io.ts"

import UI from './components/ui.js'

import AudioTimer from './libs/audiobus/timing/timer.audio.js'
import { WebMidi } from 'webmidi'
import MIDIDevice from './libs/audiobus/midi/midi-device.js'

import NoteModel from './libs/audiobus/note-model.js'

const ALL_MIDI_CHANNELS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]

// All connected MIDI Devices
let MIDIDevices = []
let timer = null

// visuals
let ui:UI = null

// For onscreen keyboard
const keyboardKeys = ( new Array(128) ).fill("")
// Full keyboard with all notes including those we do not want the user to play
const ALL_KEYBOARD_NOTES = keyboardKeys.map((keyboardKeys,index)=> new NoteModel( index ))
// Grab a good sounding part (not too bassy, not too trebly)
const KEYBOARD_NOTES = ALL_KEYBOARD_NOTES.slice( 41, 94 )


/**
 * EVENT
 * MIDI Input received - delegate to classes
 * @param event 
 */
const onMIDIEvent = ( event, activeMIDIDevice, connectedMIDIDevice, index ) => {    
    // Now test each "Requested Event" and facilitate
    // loop through our queue of requested events...
    // document.body.innerHTML+= `${event.note.name} <br>`
    const note = event.note
    const { name, number, occtave, release } = note

    switch(event.type)
    {
        case "noteon":  
            const alreadyPlaying = activeMIDIDevice.noteOn( note )
            
            // midiCommandRequests.push(command)
            // ui.addCommand( command )
            if (!alreadyPlaying)
            {
                // here we add this note to the device map
                console.info("MIDI NOTE ON Event!", alreadyPlaying, {note, event, activeMIDIDevice, connectedMIDIDevice, index} )    
            }else{
                
                console.info("IGNORE MIDI NOTE ON Event!", alreadyPlaying, {note, event, activeMIDIDevice, connectedMIDIDevice, index} )    
            }
           
            break

        case "noteoff":
            console.info("MIDI NOTE OFF Event!", {event, activeMIDIDevice, connectedMIDIDevice, index} )
            // find the 
            // ui.removeCommand( command )
            
            activeMIDIDevice.noteOff( note )
            break
        
        // TODO: Don't ignore stuff like pitch bend
    }
}

/**
 * Connect to ALL MIDI Devices currently connected
 */
const connectToMIDIDevice = ( connectedMIDIDevice, index:number ) => {
    const device = new MIDIDevice( connectedMIDIDevice )
    connectedMIDIDevice.addListener("noteon", event => onMIDIEvent( event, device, connectedMIDIDevice, index ), {channels:ALL_MIDI_CHANNELS })
    connectedMIDIDevice.addListener("noteoff", event => onMIDIEvent( event, device, connectedMIDIDevice, index ), {channels:ALL_MIDI_CHANNELS })

    ui.addDevice( connectedMIDIDevice, index )

    console.info("connectToMIDIDevices", { device, connectedMIDIDevice, index})

    return device
}

/**
 * EVENT:
 * Cannot Continue!?
 * @param reason String
 */
const onUltimateFailure = (reason:String) => {
    console.error("MIDI Failed" , reason )
    ui.showError( reason )
}

/**
 * EVENT: 
 * MIDI IS available, let us check for MIDI devices connected
 * @param event 
 */
const onMIDIDevicesAvailable = event => {
    // Display available MIDI input devices
    if (WebMidi.inputs.length < 1) {
        onUltimateFailure(  "No MIDI devices detected." )
    } else {
        // save a link to all connected MIDI devices
        MIDIDevices = WebMidi.inputs.map((device, index) => {
            // Monitor inputs from the MIDI devices attached
            return connectToMIDIDevice( device, index )
        })
    }
}

/**
 * EVENT:
 * Bar TICK - 24 divisions per quarter note
 * @param values 
 */
const onTick = values => {
    const { 
        divisionsElapsed,
        bar, bars, 
        barsElapsed, timePassed, 
        elapsed, expected, drift, level, intervals, lag
    } = values

    // Loop through all commands and see if they are ready to action yet
//    const updates = midiCommandRequests.map( (command, index) => {
//         const ready = command.update()
//         return ready
//     })

    ui.updateClock( values )

    MIDIDevices.forEach( midiDevice => {
        const updates = midiDevice.update( timer.now )
        console.info("TICK:MIDIDevices", {midiDevice, updates} )
    })

    // testing
    if (bar === 0){
        // ui.noteOn( )
    }

    // now action the updates
    // console.info("TICK", values )
}

const onNoteOnRequested = (e) => {
    console.info("Key pressed - send out MIDI", e )
    ui.noteOn( e )
}

const onNoteOffRequested = (e) => {
    console.info("Key off - send out MIDI", e )
    ui.noteOff( e )
}

/**
 * AudioContext is now available
 * @param event 
 */
const onAudioContextAvailable = async (event) => {

    const audioContext = new AudioContext()
    const timer = new AudioTimer( audioContext )

    ui = new UI( ALL_KEYBOARD_NOTES, onNoteOnRequested, onNoteOffRequested )
    ui.setTempo( timer.BPM )
    ui.whenTempoChangesRun( tempo => {
        console.info( "whenTempoChangesRun", tempo )
        timer.BPM = tempo
    })

    // also now monitor for MIDI inputs...
    WebMidi
        .enable()
        .then(onMIDIDevicesAvailable)
        .catch(err => onUltimateFailure(err))

    timer.startTimer( onTick )
    
}

document.addEventListener("mousedown", onAudioContextAvailable, {once:true} )