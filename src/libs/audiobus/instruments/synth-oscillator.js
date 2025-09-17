//const OSCILLATORS = [ "sine", "triangle"]
import { noteNumberToFrequency } from "../note-model.js"
import { loadWaveTable } from "./wave-tables.js"
// import { BiquadFilterNode, OscillatorNode, AudioContext } from "standardized-audio-context"

export const OSCILLATORS = [ "sine", "square", "sawtooth", "triangle" ]
const SILENCE = 0.00000000009
export default class SynthOscillator{

    options = {

        // default amplitude
        gain:0.2,       // ratio 0-1

        attack:0.4,     // in s
        decay:0.9,     // in s
        sustain:0.85,    // ratio 0-1
        release:0.3,    // in s
        
        minDuration: .6,

        shape:OSCILLATORS[0],

        arpeggioDuration:0.2,
        slideDuration: 0.006,
        fadeDuration:0.2,

        filterGain :0.7,
        filterCutOff :2200,
        filterOverdrive:2.5,
        filterResonance :1.8,

        filterAttack :0.2,
        filterDecay :0.08,
        filterSustain :0.8,
        filterRelease :0.2,

        reuseOscillators:true
    }
    
    // arpeggioIntervals = []
    customWave = null

    #id = "SynthOscillator"

    get id(){
        return this.#id
    }
    set id(value){
        this.#id = value
    }

    get now(){
        return this.audioContext.currentTime
    }

    get gain(){
        return this.options.gain
    }

    set gain(value){
        this.options.gain = value
    }

    get volume(){
        return this.gainNode.gain.value
    }

    set volume(value){
        const now = this.now
        this.gainNode.gain.cancelScheduledValues(now)
        // this.gainNode.gain.value = value
        this.gainNode.gain.linearRampToValueAtTime( value, now + this.options.fadeDuration )
    }

    get frequency(){
        return this.oscillator.frequency.value
    }

    set frequency(value){
        if (!this.oscillator){
            console.warn("No oscillator", this)
            return
        }
        this.glide( value, this.options.slideDuration )
    }

	set shape(value){
        // there are 3 different sources of shapes :
        switch (typeof value ){

            case 'string':   
                if (OSCILLATORS.includes(value))
                {
                    // 1. the oscillator type
                    // console.info("SynthOscillator::STANDARD"+ this.options, value)
                    if ( this.oscillator )
                    {
                        this.oscillator.type = value
                    }
                    this.customWave = null

                }else {

                    // 2. attempt to load in customWave JSON data from a URI
                    this.loadWaveTable(value).then( waves => {
                        this.setWaveTable( waves )
                        // console.info("SynthOscillator::CUSTOM URI"+this.options, value, {waves} )
                    } )     
                } 
                break
        
            case 'object':
                // 3. customWave data with real and imag arrays
                this.setWaveTable( value )
                // console.info("SynthOscillator::CUSTOM DATA"+this.options, value )
                break

            default: 
                console.warn("SynthOscillator::UNKNOWN TYPE", value)
        }
    
        this.options.shape = value
	}

	get shape(){
		return this.options.shape
	}

    set Q(value){
        // this.filter.Q.value = value
        this.filterNode.Q.cancelScheduledValues(this.now)
        this.filterNode.Q.linearRampToValueAtTime( value, this.now + this.options.slideDuration)
    }

    get Q(){
        return this.filterNode.Q.value
    }

    set detune(value){
        this.oscillator.detune.value = value
    }

    get detune(){
        return this.oscillator.detune.value
    }

    set filterCutOff(value){
        this.filterNode.frequency.cancelScheduledValues(this.now)
        this.filterNode.frequency.linearRampToValueAtTime( value, this.now + this.options.slideDuration)
    }
    get filterCutOff(){
        return this.filterNode.frequency.value
    }

    set filterType(value){
        this.filterNode.type = value
    }

    // set arpeggio( intervals ){
    //     this.arpeggioIntervals = intervals
    // }

    // get arpeggio(){
    //     return this.arpeggioIntervals
    // }

    get output(){
        return this.dcFilterNode
    }

    constructor(audioContext, options={}){
        this.audioContext = audioContext
        this.options = Object.assign({}, this.options, options)

        // Add a highpass filter at 20Hz to remove DC offset
        this.dcFilterNode = new BiquadFilterNode(audioContext, {
            type: 'highpass',
            frequency: 20,
            Q: 0.707
        })

        this.filterNode = new BiquadFilterNode( audioContext, {
            type : 'lowpass',
            Q:this.options.filterResonance,
            frequency:this.options.filterCutOff,
            detune:0,
            gain:1
        })

        this.gainNode = audioContext.createGain()
        this.gainNode.gain.value = 0  // start silently

        // Connect: filterNode -> gainNode -> dcFilterNode
        this.filterNode.connect(this.gainNode)
        this.gainNode.connect(this.dcFilterNode)
        // this.dcFilterNode.connect(audioContext.destination) // connect externally as needed

        if (options.shape)
        {
            this.shape = options.shape
        }

        this.isNoteDown = false
    }

    /**
     * 
     * @param {OscillatorNode} oscillator 
     */
    destroyOscillator(oscillator){
        oscillator.stop()
        oscillator.disconnect()
        oscillator = null
        this.active = false
    }

    /**
     * 
     * @param {Number} frequency 
     * @param {Number} startTime 
     */
    createOscillator( frequency=440, startTime = this.audioContext.currentTime  ){
        
        this.oscillator = this.audioContext.createOscillator()

        // if (this.customWave)
        // {
        //     // this.oscillator.setPeriodicWave(this.customWave)
        //     // console.info("Setting periodic wave", this.customWave )
        // }else{
        //       // console.info("Setting oscilliator type", this.shape )
        // }

        this.shape = this.options.shape // OSCILLATORS[Math.floor(Math.random() * OSCILLATORS.length)]
        this.oscillator.frequency.value = frequency
        this.oscillator.connect(this.gainNode)
        this.oscillator.start(startTime)
        this.active = true
    }

    setRandomTimbre(){
        this.shape = OSCILLATORS[Math.floor(Math.random() * OSCILLATORS.length)]
    }

    /**
     * 
     * @param {*} tonic 
     * @param {*} intervals 
     * @param {*} repetitions 
     */
    addArpeggioAtIntervals( tonic, intervals=[], repetitions=24 ){
        const now = this.now
        let startTime = now
        let frequency = tonic.noteNumber
        const frequencies = intervals.map( note => noteNumberToFrequency(frequency + note) ) 
        
        for (let i=0; i < repetitions; ++i)
        {
            intervals.forEach((interval, index) => {
            
                this.oscillator.frequency.setValueAtTime( frequencies[index], startTime )
                startTime += this.options.arpeggioDuration

                // console.info("start time", startTime )
                // this.oscillator.frequency.linearRampToValueAtTime( frequency + interval, startTime )
            })            
        }
    }

    addTremelo( depth=0.5 ){
        const now = this.now
        this.tremoloOscillator = this.audioContext.createOscillator()
        this.tremoloOscillator.type = 'sine'
        this.tremoloOscillator.frequency.value = this.oscillator.frequency.value

        const tremoloGain = this.audioContext.createGain()
        tremoloGain.gain.value = depth  
        this.tremoloOscillator.connect(tremoloGain)
        tremoloGain.connect(this.oscillator.frequency)
        this.tremoloOscillator.start(now)
    }

    /**
     * Note ON
     * @param {Note} note - Model data
     * @param {Number} velocity - strength of the note
     * @param {Array<Number>} arp - intervals
     * @param {Number} delay - number to pause before playing
     */
    noteOn( note, velocity=1, arp=null, delay=0 ){
       
        const frequency = note.frequency
        const startTime = this.now + delay
		const filterPeak = this.options.filterCutOff * this.options.filterOverdrive
        const filterSustain = this.options.filterCutOff + (filterPeak - this.options.filterCutOff) * this.options.filterSustain
         
        // fade in envelope ADsr
        const amplitude = velocity * this.options.gain
        const amplitudeSustain = amplitude * this.options.sustain

        this.gainNode.gain.cancelScheduledValues(startTime)
        // this.gainNode.gain.setValueAtTime( SILENCE, startTime )
		// Attack
        this.gainNode.gain.linearRampToValueAtTime( amplitude, startTime + this.options.attack )
        // Decay to Sustain
        this.gainNode.gain.linearRampToValueAtTime( amplitudeSustain, startTime + this.options.attack + this.options.decay )

		// Shape the note
		// this.filterNode.frequency.cancelScheduledValues(startTime)
		// this.filterNode.frequency.setValueAtTime(this.options.filterCutOff, startTime)
        // this.filterNode.frequency.linearRampToValueAtTime(filterPeak, startTime + this.options.filterAttack)
        // this.filterNode.frequency.linearRampToValueAtTime(filterSustain, startTime + this.options.filterAttack + this.options.filterDecay )

        if (!this.isNoteDown)
        {
            if (this.options.reuseOscillators){
       
                if( !this.oscillator ){
                     this.createOscillator( frequency, startTime )	
                }else{
                    // reuse existing, no glide
                    this.glide( frequency, 3 )
                }
       
            }else{

               if( this.oscillator ){
                    this.destroyOscillator(this.oscillator)
                }
                this.createOscillator( frequency, startTime )	
            }
         
        }else{
            // reuse existing and glide
            this.frequency = frequency
        }

        if (arp)
        {
             this.addArpeggioAtIntervals( note, arp )
        }
       
        this.isNoteDown = true
        this.startedAt = startTime
        return this
    }
    
    /**
     * Note OFF
     * This starts the process of stopping the note
     * by creating a smooth transition to silence from 
     * the current amplitude via release time.
     * @param {Note} note - Model data
     * @returns 
     */
    noteOff( note ){
        if (!this.isNoteDown ){
            console.warn("noteOff IGNORED - note NOT playing", note, this )
            return
        }
        const releaseDuration = Math.max(this.options.release, this.options.filterRelease)
        
        const now = this.now
        const elapsed = now - this.startedAt

        // const timeAddition = 

        // Ensure minimum duration - elapsed 
        const extendNow = elapsed < this.options.minDuration ? 
            now + this.options.minDuration : 
            now

        // Use a longer minimum release time (e.g. 400ms)
       const stopTime = extendNow + releaseDuration
   
       console.warn("noteOff - note too short?",  elapsed < this.options.minDuration, {now, extendNow, stopTime, elapsed} )


        // Cancel any scheduled gain changes and start from current value
        // const currentAmplitude = this.gainNode.gain.value
        this.gainNode.gain.cancelScheduledValues( extendNow )
        // this.gainNode.gain.setValueAtTime(currentAmplitude, now)
        // Use linear ramp for fade out
        this.gainNode.gain.linearRampToValueAtTime( SILENCE, extendNow + this.options.release )
        // this.gainNode.gain.setValueAtTime(currentAmplitude, now)

        // Apply filter fade out
        // this.filterNode.frequency.cancelScheduledValues(extendNow)
        // this.filterNode.frequency.linearRampToValueAtTime(this.options.filterCutOff, extendNow + this.options.filterRelease )

        // Schedule the oscillator to stop and disconnect after the envelope has completed
        if (!this.options.reuseOscillators && this.oscillator) {
            // const killOscillatorTime = 0.03 + stopTime
            
            // FIXME:
            //this.oscillator.stop( killOscillatorTime )
            // Disconnect after stop to avoid DC offset
            // setTimeout(() => {
            //     try { osc.disconnect() } catch(e) {}
            
            // }, (killOscillatorTime - now) * 1000)
        }

        this.isNoteDown = false
        this.startedAt = -1
        return this
    }

    glide( value, duration = 0 ){
        const now = this.now
        this.oscillator.frequency.cancelScheduledValues(now)
        this.oscillator.frequency.linearRampToValueAtTime( value, now + duration )
    }

    async loadWaveTable(waveTableName=TB303_Square){
        return await loadWaveTable(waveTableName)
    }

    setWaveTable(waveTable){
        const {real, imag} = waveTable
        const waveData = this.audioContext.createPeriodicWave(real, imag, { disableNormalization: true })
        // reshape any playing oscillators
        if ( this.oscillator)
        {
            this.oscillator.setPeriodicWave(waveData)
        }
        this.customWave = waveData
        return waveData
    }
}
