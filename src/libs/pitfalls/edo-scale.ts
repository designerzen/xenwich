/*
edoscale.mjs - EdoScale defines equal division of the octave (EDO) scale in Ls notation
             - Port of pitfalls/lib/Scale.lua - see <https://github.com/robmckinnon/pitfalls/blob/main/lib/Scale.lua>
Copyright (C) 2025 Rob McKinnon
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
const M:Number = 2
const L:Number = 1
const S:Number = 0

const LABELS = ['s', 'L', 'M']

export default class EdoScale {

    #tonic:Number = 1
    #mode:Number = 1
    #maxSteps:Number = 12
    #minSteps:Number = 3
    length:Number = -1

    #large:Number
    #medium:Number
    #small:Number

    step:[]Number = []
    stepbackup:[]Number = [L, L, S, L, L, L, S, L, L, L, S, L, L, L, S, L]

    #sequence = null

    divisions = []
    edivisions = null


    get hasMedium() {
        return this.step.some((_, i) => this.step[this.getOffset(i)] === M)
    }

    get sequence() {
        return this.step.map((_, i) => this.getStepSize(i)).join('')
    }

    set sequence( sequenceValues ){
        // FIXME: array comparison doesn't work like this
        if (this.#sequence !== sequenceValues) 
        {
            this.#sequence = sequenceValues
            this.length = sequenceValues.length
            this.step = []
            for (let i = 0; i < sequenceValues.length; i++) {
                const char = sequenceValues[i]
                this.step[i] = char === 'L' ? L : char === 'M' ? M : S
            }
            this.updateEdo()
        }
    }

    set mode(modeValue:Number) {
        this.#mode = modeValue
    }

    set tonic(tonicValue:Number) {
        this.#tonic = tonicValue
    }

    set maxSteps(maxValue:Number) {
        this.#maxSteps = maxValue
    }

    set minSteps(minValue:Number) {
        this.#minSteps = minValue
    }

    set small(s:Number) {
        if (this.#small !== s) {
            this.#small = s
            this.updateEdo()
        }
    }

    set medium(m:Number) {
        if (this.#medium !== m) {
            this.#medium = m
            this.updateEdo()
        }
    }

    set large(l:Number) {
        if (this.#large !== l) 
        {
            this.#large = l
            this.updateEdo()
        }
    }

    /**
     * 
     * @param large 
     * @param small 
     * @param sequence 
     * @param medium 
     */
    constructor(large, small, sequence, medium=undefined) {
        this.#large = large
        this.#medium = medium || large
        this.#small = small
        this.sequence = sequence
    }
   
    getStepSize(i) {
        return LABELS[this.step[this.getOffset(i)]]
    }

    getStepValue(i) {
        const step = this.step[this.getOffset(i)];
        return step === L ? this.#large : step === M ? this.#medium : this.#small;
    }

    getOffset(i) {
        if (this.#mode === 1) {
            return i
        } else {
            const offset = (this.#mode - 1 + i) % this.length
            return offset === 0 ? this.length : offset
        }
    }

    changeMode(d) {
        const orig = this.#mode
        this.#mode = Math.max(1, Math.min(orig + d, this.length))
        return orig !== this.#mode
    }

    changeTonic(d) {
        const orig = this.#tonic
        this.#tonic = Math.max(1, Math.min(orig + d, this.edivisions))
        return orig !== this.#tonic
    }

    updateEdo() {
        const orig = this.edivisions;
        this.edivisions = this.step.reduce((sum, _, i) => {
            this.divisions[i] = sum;
            return sum + this.getStepValue(i);
        }, 0);
        // console.log(this.divisions);
        const changed = orig !== this.edivisions;
        if (changed) {
            this.#tonic = Math.max(1, Math.min(this.#tonic, this.edivisions));
        }
        return changed;
    }

    changeStep(d, i) {
        const index = this.getOffset(i)
        const orig = this.step[index]
        this.step[index] = Math.max(S, Math.min(this.step[index] + d, M))
        this.stepbackup[index] = this.step[index]
        const changed = orig !== this.step[index]
        if (changed) {
            this.updateEdo()
        }
        return changed
    }

    changeLarge(d) {
        const orig = this.#large
        this.large = Math.max(this.#small + 1, Math.min(this.#large + d, this.#large + 1))
        const changed = this.#large !== orig
        if (changed) {
            if (this.#large <= this.#medium) {
                this.medium = (Math.max(this.#small + 1, Math.min(this.#large - 1, this.#large)))
            }
            this.updateEdo()
        }
        return changed
    }

    changeMedium(d) {
        const orig = this.#medium
        this.medium = (Math.max(this.#small + 1, Math.min(this.#medium + d, this.#large - 1)))
        const changed = this.#medium !== orig
        if (changed) {
            this.updateEdo()
        }
        return changed
    }

    changeSmall(d) {
        const orig = this.#small
        const value = this.#small + d

        if (this.hasMedium) {
            this.small = Math.max(1, Math.min(value, this.#medium - 1))
        } else {
            this.small = Math.max(1, Math.min(value, this.#large - 1))
        }

        const changed = this.#small !== orig
        if (changed) {
            if (this.#small >= this.#medium) {
                this.medium = Math.max(this.#small + 1, Math.min(this.#large))
            }
            this.updateEdo()
        }
        return changed
    }

    changeLength(d) {
        const orig = this.length
        if (d === 1) {
            this.length = Math.min(this.length + 1, this.#maxSteps)
        } else if (d === -1) {
            this.length = Math.max(this.length - 1, this.#minSteps)
        }

        const changed = this.length !== orig
        if (changed) {
            this.#mode = 1
            if (d === 1) {
                this.step[this.length] = this.stepbackup[this.length] || L
            } else if (d === -1 && this.length >= this.#minSteps) {
                this.step.pop()
            }
            this.updateEdo()
        }
        return changed
    }
}