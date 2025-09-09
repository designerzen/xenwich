import './assets/style/index.scss'

import UI from './components/ui.js'

import AudioTimer from './libs/audiobus/timing/timer.audio.js'
import { WebMidi } from 'webmidi'
import MIDIDevice from './libs/audiobus/midi/midi-device.ts'

import NoteModel from './libs/audiobus/note-model.js'
import { loadSavedValues } from './libs/audiotool/audio-tool-io.ts'

const ALL_MIDI_CHANNELS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]

// All connected MIDI Devices
const MIDIDevices = []
let timer = null
let timeLastBarBegan = 0

// this is just a buffer for the onscreen keyboard
let onscreenKeyboardMIDIDevice:MIDIDevice = null

// Feed this for X amount of BARS
let buffer = []
let currentRecordingMeasure = 0
const BARS_TO_RECORD = 1

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
    const device = new MIDIDevice( `${connectedMIDIDevice.manufacturer} ${connectedMIDIDevice.name}` )
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
        WebMidi.inputs.forEach((device, index) => {
            // Monitor inputs from the MIDI devices attached
            const availableMIDIDevice = connectToMIDIDevice( device, index )
            MIDIDevices.push( availableMIDIDevice )
        })
    }
}

/**
 * EVENT: Buffer is full of data... restarting LOOP!
 */
const onRecordingMusicalEventsLoopBegin = ( activeAudioEvents ) => {

    if (activeAudioEvents.length > 0)
    {
        const musicalEvents = activeAudioEvents.map( audioEvent => {
            return audioEvent.clone( timeLastBarBegan )
        })
         console.info("Active musicalEvents", musicalEvents)
    }
}

/**
 * 
 * @param e 
 */
const onNoteOnRequestedFromOnscreenKeyboard = (e) => {
    console.info("Key pressed - send out MIDI", e )
    ui.noteOn( e )
    onscreenKeyboardMIDIDevice.noteOn( e, timer.now )
}

/**
 * 
 * @param e 
 */
const onNoteOffRequestedFromOnscreenKeyboard = (e) => {
    console.info("Key off - send out MIDI", e )
    ui.noteOff( e )
    onscreenKeyboardMIDIDevice.noteOff( e, timer.now )
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

    // If bar is at zero point we check to see if the buffer
    // needs to be reset....
    if ( divisionsElapsed===0 ){
        // ui.noteOn( )
        currentRecordingMeasure++

        if (currentRecordingMeasure > BARS_TO_RECORD)
        {
            currentRecordingMeasure = 0
            timeLastBarBegan = timer.now
            onRecordingMusicalEventsLoopBegin(buffer)
            buffer = []
            // console.info("TICK:BUFFER RESET", values )
        }else{
            // console.info("TICK:IGNORE")
        }
    }else{
        //  console.info("TICK:", {bar, divisionsElapsed})
    }

    let hasUpdates = false
    // check to see if any events have happened since
    // the last bar
    const updates = MIDIDevices.map( (midiDevice, index) => {
        const deviceCommandsReadyToTrigger = midiDevice.update( timer.now, divisionsElapsed )
        
        if (deviceCommandsReadyToTrigger.length > 0)
        {
            hasUpdates = true
            // create copies of the triggers and ensure they start at same position in time
            buffer.push(...deviceCommandsReadyToTrigger)
            console.info(index, "TICK:MusicalEvents", midiDevice.name, {deviceCommandsReadyToTrigger} )
        }
        
        return deviceCommandsReadyToTrigger
    })

    // console.info("TICK:MIDIDevices", MIDIDevices )

    // Do we have any events that we need to trigger in this period?
    if (hasUpdates)
    {
        console.info("TICK:hasUpdates", {buffer, updates} )
        // UPDATE UI with all midi events
        // that are going to be triggered at this stage
    }else{
        // console.info("TICK:NO UPDATES", updates )
    }

    // save all new musical events in the buffer
    // buffer.push()

    // now action the updates
    // console.info("TICK", values )
}


/**
 * AudioContext is now available
 * @param event 
 */
const onAudioContextAvailable = async (event) => {

    const audioContext = new AudioContext()
    timer = new AudioTimer( audioContext )

    ui = new UI( ALL_KEYBOARD_NOTES, onNoteOnRequestedFromOnscreenKeyboard, onNoteOffRequestedFromOnscreenKeyboard )
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

    onscreenKeyboardMIDIDevice = new MIDIDevice("SVG Keyboared")
    MIDIDevices.push( onscreenKeyboardMIDIDevice )

    // This loads the AudioTool stuff
    const isPreviousUser = loadSavedValues()

    if (isPreviousUser)
    {
        // WELCOME BACK!
        // await handleAutoConnect()
    }

    // connect to audioTool and start a new project
    // await handleConnectWithPAT( (document.getElementById('pat-input') as HTMLInputElement).value.trim() )
}

document.addEventListener("mousedown", onAudioContextAvailable, {once:true} )