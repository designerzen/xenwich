import { formatTimeStampFromSeconds } from "../libs/audiobus/timing/timer"
import NoteVisualiser from './note-visualiser.js'
import SVGKeyboard from './keyboard-svg.js'

const DOM_ID_MIDI_INPUTS = "midi-input-commands"
const DOM_ID_MIDI_OUTPUTS = "midi-output-commands"
const DOM_ID_MIDI_DEVICES = "midi-devices"
const DOM_ID_CLOCK = "clock"
const DOM_ID_SELECTOR_SCALE = "scale-selector"
const DOM_ID_RANGE_TEMPO = "tempo"
const DOM_ID_BPM = "bpm"

export default class UI{

    constructor( keyboardNotes, onNoteOn, onNoteOff ){
        this.devices = document.getElementById(DOM_ID_MIDI_DEVICES)
        
        this.inputs = document.getElementById(DOM_ID_MIDI_INPUTS)
        this.outputs = document.getElementById(DOM_ID_MIDI_OUTPUTS)
        
        this.elementClock = document.getElementById(DOM_ID_CLOCK)
        this.elementScaleSelector = document.getElementById(DOM_ID_SELECTOR_SCALE)
        this.elementTempo = document.getElementById(DOM_ID_RANGE_TEMPO)
        this.elementBPM = document.getElementById(DOM_ID_BPM)
        
        const wallpaperCanvas = document.getElementById("wallpaper")
        this.noteVisualiser = new NoteVisualiser( keyboardNotes, wallpaperCanvas, false, 0 ) // ALL_KEYBOARD_NOTES
        // wallpaperCanvas.addEventListener( "dblclick", e => scale === SCALES[ (SCALES.indexOf(scale) + 1) % SCALES.length] )

        this.keyboard = new SVGKeyboard( keyboardNotes, onNoteOn, onNoteOff )
        this.keyboardElement = document.body.appendChild(  this.keyboard.asElement )
    }


    /**
     * 
     * @param {MIDIDevice} device 
     * @param {Number} index 
     */
    addDevice( device, index ){
        this.devices.innerHTML += `MIDI Device #${index} : ${device.manufacturer} ${device.name} <br>`
    }

    /**
     * 
     * @param {MIDIDevice} device 
     * @param {Number} index 
     */
    addInput( device, index ){
        this.inputs.innerHTML += `MIDI Device #${index} : ${device.manufacturer} ${device.name} <br>`
    }

    /**
     * setTempo(tempo)
     * @param {Number} tempo 
     */
    setTempo(tempo){
        this.elementTempo.value = tempo
        this.elementBPM.textContent = tempo
    }

    whenTempoChangesRun(callback){
        this.elementTempo.addEventListener("input", e=>{
            const tempo  = this.elementTempo.value
            callback && callback(tempo) 
            this.elementBPM.textContent = tempo
        })
    }
    
    /**
     * 
     * @param {Function} callback 
     */
    whenNewScaleIsSelected(callback){
        this.elementScaleSelector.addEventListener("change", e=>callback(this.elementScaleSelector.value) )
    }

    /**
     * 
     * @param {MIDIDevice} device 
     * @param {Number} index 
     */
    addOutput( device, index ){
        this.outputs.innerHTML += `MIDI Device #${index} : ${device.manufacturer} ${device.name} <br>`
    }

    addCommand(command){
        this.inputs.innerHTML += `MIDI Command START #${command} <br>`
    }

    removeCommand(command){
        this.inputs.innerHTML += `MIDI Command STOP #${command} <br>`
    }

    updateClock( values ){
         const { 
            divisionsElapsed,
            bar, bars, 
            barsElapsed, timePassed, 
            elapsed, expected, drift, level, intervals, lag
        } = values

        this.elementClock.innerHTML = `${String(bar).padStart(2, '0')}:${bars}:${String(barsElapsed).padStart(3, '0')} [${String(divisionsElapsed).padStart(2, '0')}] ${formatTimeStampFromSeconds(elapsed)} seconds`
        // this.elementClock.innerHTML = `${bar}:${bars}:${barsElapsed} [${divisionsElapsed}] ${intervals}, ${elapsed.toFixed(2)} seconds`
    }

    noteOn(note) {
        this.noteVisualiser.noteOn( note )
        this.keyboard.setKeyAsActive( note )
    }

    noteOff(note) {
        this.noteVisualiser.noteOff( note )
        this.keyboard.setKeyAsInactive( note )
    }

    /**
     * 
     * @param {String} errorMessage 
     */
    showError( errorMessage )
    {
        this.inputs.innerHTML = errorMessage
    }
}