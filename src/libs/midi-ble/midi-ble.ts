import {MIDI_ACTIVE_SENSING, MIDI_CHANNEL_PRESSURE, MIDI_CONTROL_CHANGE, MIDI_TYPES, MIDI_NOTE_OFF, MIDI_NOTE_ON, MIDI_PITCH_BEND, MIDI_POLYPHONIC_KEY_PRESSURE, MIDI_PROGRAM_CHANGE} from './midi-constants.ts'

// Type Definitions & Interfaces
interface MidiCallback {
    setCharacteristicChannel(uuid: string, channel: number): void
    setCharacteristic(characteristic: any): void
    noteOff(data: { note: number; channel: number }): void
    noteOn(data: { note: number; velocity: number; channel: number }): void
    controlChange(data: { controlNumber: number; value: number; channel: number }): void
    programChange(data: { controlNumber: number; value: number; channel: number }): void
}

interface ParsedMidiData {
    type: number
    channel: number
    data1: number
    data2: number
}

interface TimestampBytes {
    header: number
    messageTimestamp: number
}

const MIDI_LOG_PREFIX = '[MIDI-BLE]'

// RX MIDI Data Handler --------------------------------------------------------------------------------------

/**
 * Parse MIDI data from BLE characteristic
 * 
 * @param data array of numbers from BLE characteristic
 * @returns {Object}
 */
const parseBluetoothLightDataPacket = (data: number[]): ParsedMidiData | false => {
    const status:number = data[2]

    if (status === MIDI_ACTIVE_SENSING) {
        return false
    }

    const channel:number = (status & 0xf) + 1
    const type:number = status >> 4

    const data1:number = data[3]
    const data2:number = data[4]

    return { type, channel, data1, data2 }
}

/**
 * Handle incoming MIDI data from BLE characteristic
 * via this delicous curry
 * 
 * @param uuid 
 * @param callback 
 * @returns Function
 */
const createBlueToothLightDataReceivedCallback = (uuid: string, callback: MidiCallback) => (data: any): void => {
    const array: number[] = Array.from(data)
    const result:ParsedMidiData|false = parseBluetoothLightDataPacket(array)
    
    if (!result) {
        return
    }

    const { type, channel, data1, data2 }:ParsedMidiData = result
  
    console.log(`type: ${MIDI_TYPES[type]} channel: ${channel} data1: ${data1} data2: ${data2}`)

    if (channel !== null) {
        callback.setCharacteristicChannel(uuid, channel)
    }

    if (type === MIDI_NOTE_ON) {

        if (data2 === 0) {
            callback.noteOff({ note: data1, channel })
        } else {
            callback.noteOn({ note: data1, velocity: data2, channel })
        }

    } else if (type === MIDI_NOTE_OFF) {
        callback.noteOff({ note: data1, channel })
    } else if (type === MIDI_CONTROL_CHANGE) {
        callback.controlChange({ controlNumber: data1, value: data2, channel })
    } else if (type === MIDI_POLYPHONIC_KEY_PRESSURE) {
        // TODO: Polyphonic aftertouch not implemented
    } else if (type === MIDI_PROGRAM_CHANGE) {
        callback.programChange({ controlNumber: data1, value: data2, channel })
    } else if (type === MIDI_CHANNEL_PRESSURE) {
        // TODO: Channel aftertouch not implemented
    } else if (type === MIDI_PITCH_BEND) {
        // TODO: Pitch bend not implemented
    }
}


// TX MIDI Data Creator --------------------------------------------------------------------------------------

/**
 * Generate MIDI timestamp bytes for BLE packet from a timestamp
 * otherwise create the timestamp bytes for the current time
 * BLE MIDI timestamp is 13 bits, split into 2 bytes: 
 * 
 *  header (MSB)
 *  messageTimestamp (LSB)
 * 
 * @param time 
 * @returns TimestampBytes
 */
const getTimestampBytes = ( time?:number|undefined ): TimestampBytes => {
    // BLE MIDI timestamp is 13 bits, split into 2 bytes: header (MSB) + messageTimestamp (LSB)
    // NB. Use a small relative timestamp instead of Date.now() to avoid truncation issues
    const timestamp = (time ?? performance.now()) & 8191
    return { 
        header:((timestamp >> 7) | 0x80) & 0xBF,
        messageTimestamp: (timestamp & 0x7F) | 0x80
    }
}

/**
 * MIDI uses channels 0-15, but users specify 1-16, so subtract 1
 * @param channel 
 * @returns {number}
 */
const getChannelEncoded = (channel:number=1) => Math.max(1, channel - 1) & 0x0f

const toHex = (n:number):string => `0x${n.toString(16).padStart(2, '0')}`

// MIDI Transactions --------------------------------------------------------------------------------------

/**
 * TODO: Create MIDI 2.0 compliant packets
 * Send data to the BTLE characteristic
 * 
 * @param characteristic 
 * @param midiStatus 
 * @param midiFirstCommand 
 * @param midiSecondCommand 
 * @param timestamp
 * @returns 
 */
const dispatchBLEPacket = async ( characteristic:any, midiStatus:number, midiFirstCommand:number, midiSecondCommand:number = 0, timestamp:number|undefined=undefined ) => {
    const { header, messageTimestamp }:TimestampBytes = getTimestampBytes(timestamp)
    const packet:Uint8Array = new Uint8Array([header, messageTimestamp, midiStatus, midiFirstCommand, midiSecondCommand])
    
    console.log(MIDI_LOG_PREFIX, 'Sending packet:', {
        header: `0x${header.toString(16).padStart(2, '0')}`,
        messageTimestamp: `0x${toHex(messageTimestamp)}`,
        midiStatus: `0x${toHex(midiStatus)}`,
        midiAction: MIDI_TYPES[midiStatus],
        midiFirstCommand,
        midiSecondCommand,
        packetBytes: Array.from(packet).map(b => `0x${toHex(b)}` ),
        packet,
        characteristic
    })
    
    try {
        await characteristic.writeValue(packet)
        console.log(MIDI_LOG_PREFIX, 'Packet sent successfully', packet )
        return true

    } catch (err: any) {

        console.error(MIDI_LOG_PREFIX, 'Failed to send packet:', {
            error: err && err.message ? err.message : String(err),
            packet,
            characteristic: characteristic ? characteristic.uuid : 'no uuid'
        })
        throw err
    }

    return false
}




/**
 * Send MIDI Note On message via BLE
 * 
 * @param characteristic 
 * @param channel (1-16)
 * @param note 
 * @param velocity 
 * @returns {Promise}
 */
export const sendBLENoteOn = async (
    characteristic: BluetoothRemoteGATTCharacteristic,
    channel: number | null,
    note: number,
    velocity: number
): Promise<void | null> => {
 
    // no channel to send to, so exit early
    if (channel === null) { return null }

    const midiStatus:number = getChannelEncoded(channel) | MIDI_NOTE_ON
    // const midiStatus:number = getChannelEncoded(channel) | MIDI_NOTE_ON
    return await dispatchBLEPacket( characteristic, midiStatus, note, velocity )
}

/**
 * Send MIDI Note Off message via BLE
 * 
 * @param characteristic 
 * @param channel (1-16)
 * @param note 
 * @param velocity 
 * @returns {Promise}
 */
export const sendBLENoteOff = async (
    characteristic: BluetoothRemoteGATTCharacteristic,
    channel: number | null,
    note: number,
    velocity: number = 0
): Promise<void | null> => {
    if (channel === null) { return null }
    const midiStatus:number = getChannelEncoded(channel) | MIDI_NOTE_OFF
    return await dispatchBLEPacket( characteristic, midiStatus, note, velocity )
}

/**
 * Send MIDI Control Change message via BLE
 * 
 * @param characteristic 
 * @param channel (1-16)
 * @param controlNumber 
 * @param value 
 * @returns {Promise}
 */
export const sendBLEControlChange = async (
    characteristic: BluetoothRemoteGATTCharacteristic,
    channel: number | null,
    controlNumber: number,
    value: number
): Promise<void | null> => {
    // no channel to send to, so exit early
    if (channel === null) { return null }
    const midiStatus:number = getChannelEncoded(channel) | MIDI_CONTROL_CHANGE
    return await dispatchBLEPacket( characteristic, midiStatus, controlNumber, value )
}


/**
 * Send MIDI Program Change message via BLE
 * 
 * @param characteristic 
 * @param channel (1-16)
 * @param program 
 * @returns {Promise}
 */
export const sendBLEProgramChange = async (
    characteristic: BluetoothRemoteGATTCharacteristic,
    channel: number | null,
    program: number
): Promise<void | null> => {
    // no channel to send to, so exit early
    if (channel === null) { return null }
    const midiStatus = getChannelEncoded(channel) | MIDI_PROGRAM_CHANGE
    return await dispatchBLEPacket( characteristic, midiStatus, program )
}


/**
 * Send MIDI Polyphonic Aftertouch message via BLE
 * 
 * @param characteristic 
 * @param channel (1-16)
 * @param note 
 * @param pressure 
 * @returns {Promise}
 */
export const sendBLEPolyphonicAftertouch = async (
    characteristic: BluetoothRemoteGATTCharacteristic,
    channel: number | null,
    note: number,
    pressure: number
): Promise<void | null> => {
    // no channel to send to, so exit early
    if (channel === null) { return null }
    const midiStatus:number = getChannelEncoded(channel) | MIDI_POLYPHONIC_KEY_PRESSURE
    return await dispatchBLEPacket( characteristic, midiStatus, note, pressure )
}

/**
 * Send MIDI Channel Aftertouch message via BLE
 * 
 * @param characteristic 
 * @param channel (1-16)
 * @param pressure 
 * @returns {Promise}
 */
export const sendBLEChannelAftertouch = async (
    characteristic: BluetoothRemoteGATTCharacteristic,
    channel: number | null,
    pressure: number
): Promise<void | null> => {
    // no channel to send to, so exit early
    if (channel === null) { return null }
    const midiStatus:number = getChannelEncoded(channel) | MIDI_CHANNEL_PRESSURE
    return await dispatchBLEPacket( characteristic, midiStatus, pressure )
}

/**
 * Send MIDI Pitch Bend message via BLE
 * 
 * @param characteristic 
 * @param channel (1-16)
 * @param lsb Least Significant Byte (0-127)
 * @param msb Most Significant Byte (0-127)
 * @returns {Promise}
 */
export const sendBLEPitchBend = async (
    characteristic: BluetoothRemoteGATTCharacteristic,
    channel: number | null,
    lsb: number,
    msb: number
): Promise<void | null> => {
    // no channel to send to, so exit early
    if (channel === null) { return null }
    const midiStatus:number = getChannelEncoded(channel) | MIDI_PITCH_BEND
    return await dispatchBLEPacket( characteristic, midiStatus, lsb, msb )
}