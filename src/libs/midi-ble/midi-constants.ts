
// MIDI Status Constants
export const NOTE_OFF = 8
export const NOTE_ON = 9
export const POLYPHONIC_AFTERTOUCH = 10
export const CONTROL_CHANGE = 11
export const PROGRAM_CHANGE = 12
export const CHANNEL_AT = 13
export const PITCH_BEND = 14

export const ACTIVE_SENSING = 254

export const MIDI_TYPES: Record<number, string> = {
    [NOTE_OFF]: 'noteoff',
    [NOTE_ON]: 'noteon',
    [POLYPHONIC_AFTERTOUCH]: 'polyat',
    [CONTROL_CHANGE]: 'controlchange',
    [PROGRAM_CHANGE]: 'programchange',
    [CHANNEL_AT]: 'channelat',
    [PITCH_BEND]: 'pitchbend'
}