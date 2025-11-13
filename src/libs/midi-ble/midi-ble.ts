// Auto-select based on platform
// @ts-ignore
import noble from '@stoprocent/noble'
import {ACTIVE_SENSING, CHANNEL_AT, CONTROL_CHANGE, MIDI_TYPES, NOTE_OFF, NOTE_ON, PITCH_BEND, POLYPHONIC_AFTERTOUCH, PROGRAM_CHANGE} from './midi-constants.ts'
import {BLUETOOTH_STATE_CHANGED, BLUETOOTH_STATE_CHARACTERISTIC_CHANGED, BLUETOOTH_STATE_DISCOVER_DEVICES, BLUETOOTH_STATE_POWERED_ON} from './ble-constants.ts'

const MIDI_LOG_PREFIX = '[MIDI-BLE] '

// MIDI UUIDs
const MIDI_SERVICE_UUID = '03b80e5aede84b33a7516ce34ec4c700'
const MIDI_CHARACTERISTIC_UUID = '7772e5db38684112a1a9f2669d106bf3'

const MIDI_SERVICE_UUIDS = [MIDI_SERVICE_UUID]
const MIDI_CHARACTERISTIC_UUIDS = [MIDI_CHARACTERISTIC_UUID]

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

interface Peripheral {
    uuid: string
    connect(callback: (error: Error | null) => void): void
    discoverSomeServicesAndCharacteristics(
        serviceIds: string[],
        characteristicIds: string[],
        callback: (error: Error | null, services?: any[], characteristics?: any[]) => void
    ): void
}



/**
 * Generate MIDI timestamp bytes for BLE packet from a timestamp
 * otherwise create the timestamp bytes for the current time
 * 
 * @param time 
 * @returns TimestampBytes
 */
const getTimestampBytes = ( time?:number|undefined ): TimestampBytes => {
    const now = time ?? Date.now()
    const timestamp = now.toString(2).split('').reverse()
    // encode into correct format
    const byte0 = ['1', '0', timestamp[12], timestamp[11], timestamp[10], timestamp[9], timestamp[8], timestamp[7]]
    const byte1 = ['1', timestamp[6], timestamp[5], timestamp[4], timestamp[3], timestamp[2], timestamp[1], timestamp[0]]
    return {
        header: parseInt(byte0.join(''), 2),
        messageTimestamp: parseInt(byte1.join(''), 2)
    }
}

/**
 * Displays error messages (currently only to console)
 */
const onError = (e: Error): void => {
    console.error(MIDI_LOG_PREFIX, e, e.message)
}


/**
 * Handle connected peripheral and discover services/characteristics
 * 
 * @param peripheral 
 * @param callback 
 */
const onPeripheralConnected = (peripheral: Peripheral, callback: MidiCallback): void => {
    peripheral.discoverSomeServicesAndCharacteristics(
        MIDI_SERVICE_UUIDS,
        MIDI_CHARACTERISTIC_UUIDS,
        (error, services, characteristics) => {
            if (error) {
                onError(error)
                return null
            }

            console.info( MIDI_LOG_PREFIX, 'discovered Services', services)
            console.info( MIDI_LOG_PREFIX, 'discovered Characteristics', characteristics)
          
            if (services && characteristics) {
                return servicesAndCharacteristics(peripheral.uuid, services, characteristics, callback)
            }
        }
    )
}

/**
 * Initialize Noble BLE library with error handlers
 */
export const watchForBlueToothLightStateChange = (): void => {

    noble.on(BLUETOOTH_STATE_CHANGED, (state: string) => {
        console.log( MIDI_LOG_PREFIX, 'State Change', state)
               
        switch (state )
        {
            case BLUETOOTH_STATE_POWERED_ON:
                break

            default:
                noble.stopScanning()
        }
    })
        
    // catch errors
    noble.on('error', onError)
    // @ts-ignore - accessing private bindings
    noble._bindings.on('error', onError)
}

/**
 * Parse MIDI data from BLE characteristic
 * 
 * @param data array of numbers from BLE characteristic
 * @returns {Object}
 */
const parseBluetoothLightDataPacket = (data: number[]): ParsedMidiData | false => {
    const status:number = data[2]

    if (status === ACTIVE_SENSING) {
        return false
    }

    const data1:number = data[3]
    const data2:number = data[4]

    const channel:number = (status & 0xf) + 1
    const type:number = status >> 4

    // strongly typed object
    return { type, channel, data1, data2 }
}

/**
 * Handle incoming MIDI data from BLE characteristic
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

    if (type === NOTE_ON) {

        if (data2 === 0) {
            callback.noteOff({ note: data1, channel })
        } else {
            callback.noteOn({ note: data1, velocity: data2, channel })
        }

    } else if (type === NOTE_OFF) {
        callback.noteOff({ note: data1, channel })
    } else if (type === CONTROL_CHANGE) {
        callback.controlChange({ controlNumber: data1, value: data2, channel })
    } else if (type === POLYPHONIC_AFTERTOUCH) {
        // TODO: Polyphonic aftertouch not implemented
    } else if (type === PROGRAM_CHANGE) {
        callback.programChange({ controlNumber: data1, value: data2, channel })
    } else if (type === CHANNEL_AT) {
        // TODO: Channel aftertouch not implemented
    } else if (type === PITCH_BEND) {
        // TODO: Pitch bend not implemented
    }
}

/**
 * Discover and subscribe to MIDI characteristics
 * 
 * @param _uuid 
 * @param _services 
 * @param characteristics 
 * @param callback 
 */
const servicesAndCharacteristics = (
    _uuid: string,
    _services: any[],
    characteristics: any[],
    callback: MidiCallback
): void => {
    const characteristic = characteristics[0]
    const onData = createBlueToothLightDataReceivedCallback(characteristic.uuid, callback)
    characteristic.addEventListener(BLUETOOTH_STATE_CHARACTERISTIC_CHANGED, (event: any) => onData(event.target.value))
    callback.setCharacteristic(characteristic)
}


/**
 * Handle discovered peripheral and initiate connection
 * 
 * @param peripheral 
 * @param callback 
 * @returns 
 */
const connectPeripheral = (peripheral: Peripheral, callback: MidiCallback): void => {

    if (!peripheral) {
        console.info(MIDI_LOG_PREFIX, 'No BLE Peripherals discovered.')
        return 
    }
       
    console.info( MIDI_LOG_PREFIX, 'Connect to BLE peripheral ...')

    peripheral.connect((error: Error | null) => {
        if (error) {
            onError(error)
            return
        }
        console.info( MIDI_LOG_PREFIX, 'Connected to peripheral', peripheral)
        return onPeripheralConnected(peripheral, callback)
    })
}

/**
 * Start scanning for MIDI BLE peripherals
 *
 * @param callback 
 * @param allowDuplicates 
 */
export const scanForBluetoothPeripherals = (callback: MidiCallback, allowDuplicates:boolean = false): void => { 
    noble.on( BLUETOOTH_STATE_DISCOVER_DEVICES, (peripheral: Peripheral) => {
        console.info( MIDI_LOG_PREFIX, 'peripheral discovered', peripheral)
        noble.stopScanning()
        connectPeripheral(peripheral, callback)
    })
    noble.startScanning(MIDI_SERVICE_UUIDS, allowDuplicates)
}

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
export const dispatchPacket = async ( characteristic:any, midiStatus:number, midiFirstCommand:number, midiSecondCommand:number = 0, timestamp:number|undefined=undefined ) => {
    const { header, messageTimestamp }:TimestampBytes = getTimestampBytes(timestamp)
    const packet:Uint8Array = new Uint8Array([header, messageTimestamp, midiStatus, midiFirstCommand, midiSecondCommand])
    return await characteristic.writeValue(packet)
}

/**
 * Send MIDI Note On message via BLE
 * 
 * @param characteristic 
 * @param channel 
 * @param note 
 * @param velocity 
 * @returns {Promise}
 */
export const sendNoteOn = async (
    characteristic: any,
    channel: number | null,
    note: number,
    velocity: number
): Promise<void | null> => {
    
    // no channel to send to, so exit early
    if (channel === null) 
    {
        return null
    }

    const midiStatus:number = (channel & 0x0f) | NOTE_ON
    return await dispatchPacket( characteristic, midiStatus, note, velocity )
}

/**
 * Send MIDI Note Off message via BLE
 * 
 * @param characteristic 
 * @param channel 
 * @param note 
 * @param velocity 
 * @returns {Promise}
 */
export const sendNoteOff = async (
    characteristic: any,
    channel: number | null,
    note: number,
    velocity: number = 0
): Promise<void | null> => {
    
    // no channel to send to, so exit early
    if (channel === null) 
    {
        return null
    }

    const midiStatus:number = (channel & 0x0f) | NOTE_OFF
    return await dispatchPacket( characteristic, midiStatus, note, velocity )
}

/**
 * Send MIDI Control Change message via BLE
 * 
 * @param characteristic 
 * @param channel 
 * @param controlNumber 
 * @param value 
 * @returns {Promise}
 */
export const sendControlChange = async (
    characteristic: any,
    channel: number | null,
    controlNumber: number,
    value: number
): Promise<void | null> => {
    
    // no channel to send to, so exit early
    if (channel === null) 
    {
        return null
    }

    // FIXME: This would be different in MIDI2.0
    const midiStatus:number = (channel & 0x0f) | CONTROL_CHANGE
    return await dispatchPacket( characteristic, midiStatus, controlNumber, value )
}


/**
 * Send MIDI Program Change message via BLE
 * 
 * @param characteristic 
 * @param channel 
 * @param program 
 * @returns {Promise}
 */
export const sendProgramChange = async (
    characteristic: any,
    channel: number | null,
    program: number
): Promise<void | null> => {

    // no channel to send to, so exit early
    if (channel === null) 
    {
        return null
    }

    // TODO: This would be different in MIDI2.0
    const midiStatus = (channel & 0x0f) | PROGRAM_CHANGE
    return await dispatchPacket( characteristic, midiStatus, program )
}


/**
 * Send MIDI Polyphonic Aftertouch message via BLE
 * 
 * @param characteristic 
 * @param channel 
 * @param note 
 * @param pressure 
 * @returns {Promise}
 */
export const sendPolyphonicAftertouch = async (
    characteristic: any,
    channel: number | null,
    note: number,
    pressure: number
): Promise<void | null> => {
    
    // no channel to send to, so exit early
    if (channel === null) 
    {
        return null
    }

    const midiStatus:number = (channel & 0x0f) | POLYPHONIC_AFTERTOUCH
    return await dispatchPacket( characteristic, midiStatus, note, pressure )
}

/**
 * Send MIDI Channel Aftertouch message via BLE
 * 
 * @param characteristic 
 * @param channel 
 * @param pressure 
 * @returns {Promise}
 */
export const sendChannelAftertouch = async (
    characteristic: any,
    channel: number | null,
    pressure: number
): Promise<void | null> => {
    
    // no channel to send to, so exit early
    if (channel === null) 
    {
        return null
    }

    const midiStatus:number = (channel & 0x0f) | CHANNEL_AT
    return await dispatchPacket( characteristic, midiStatus, pressure )
}

/**
 * Send MIDI Pitch Bend message via BLE
 * 
 * @param characteristic 
 * @param channel 
 * @param lsb Least Significant Byte (0-127)
 * @param msb Most Significant Byte (0-127)
 * @returns {Promise}
 */
export const sendPitchBend = async (
    characteristic: any,
    channel: number | null,
    lsb: number,
    msb: number
): Promise<void | null> => {
    
    // no channel to send to, so exit early
    if (channel === null) 
    {
        return null
    }

    const midiStatus:number = (channel & 0x0f) | PITCH_BEND
    return await dispatchPacket( characteristic, midiStatus, lsb, msb )
}