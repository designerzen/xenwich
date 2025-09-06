var $hx_exports = typeof exports != "undefined" ? exports : typeof window != "undefined" ? window : typeof self != "undefined" ? self : this;
$hx_exports["GoldenData"] = $hx_exports["GoldenData"] || {};
$hx_exports["Mode"] = $hx_exports["Mode"] || {};
var $global = typeof window != "undefined" ? window : typeof global != "undefined" ? global : typeof self != "undefined" ? self : this;
var $hxClasses = $hxClasses || {},$estr = function() { return js_Boot.__string_rec(this,''); },$hxEnums = $hxEnums || {},$_;
function $extend(from, fields) {
	var proto = Object.create(from);
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var Tuple2 = $hxClasses["Tuple2"] = function(_0,_1) {
	this._0 = _0;
	this._1 = _1;
};
Tuple2.__name__ = "Tuple2";
Tuple2.prototype = {
	_0: null
	,_1: null
	,__class__: Tuple2
};
var ChordParser = $hxClasses["ChordParser"] = function(key,mode) {
	this.key = key;
	this.mode = mode;
};
ChordParser.__name__ = "ChordParser";
ChordParser.prototype = {
	key: null
	,mode: null
	,parseSeparator: function(inputString) {
		var separators = ["|",",","&"];
		if(inputString.length > 0 && separators.indexOf(inputString.charAt(0)) != -1) {
			return new Tuple2(inputString.charAt(0),HxOverrides.substr(inputString,1,null));
		} else {
			return new Tuple2(null,inputString);
		}
	}
	,parseTranspose: function(inputString) {
		var transposeChars_b = "";
		while(inputString.length > 0 && [",","|"].indexOf(inputString.charAt(0)) == -1) {
			transposeChars_b += Std.string(inputString.charAt(0));
			inputString = HxOverrides.substr(inputString,1,null);
		}
		var transposeString = StringTools.trim(transposeChars_b);
		if(transposeString.charAt(0) != ">" && transposeString.charAt(0) != "<") {
			throw haxe_Exception.thrown("Expected '>' or '<' at the start of '" + transposeString + "'");
		}
		var transposeValue = Std.parseInt(HxOverrides.substr(transposeString,1,null));
		if(transposeString.charAt(0) == ">") {
			this.key += transposeValue;
		} else {
			this.key -= transposeValue;
		}
		return inputString;
	}
	,parseItem: function(inputString) {
		var itemChars_b = "";
		var insideParentheses = false;
		while(inputString.length > 0 && (insideParentheses || [",","|","&",">","<"].indexOf(inputString.charAt(0)) == -1)) {
			var char = inputString.charAt(0);
			if(char == "(") {
				insideParentheses = true;
			} else if(char == ")") {
				insideParentheses = false;
			}
			itemChars_b += char == null ? "null" : "" + char;
			inputString = HxOverrides.substr(inputString,1,null);
		}
		return new Tuple2(StringTools.trim(itemChars_b),inputString);
	}
	,countOccurrences: function(str,char) {
		var count = 0;
		var _g = 0;
		var _g1 = str.length;
		while(_g < _g1) {
			var i = _g++;
			if(str.charAt(i) == char) {
				++count;
			}
		}
		return count;
	}
	,parseBracket: function(itemString) {
		var extension = null;
		var parts = itemString.split("(");
		if(parts[0].length > 0) {
			extension = Std.parseInt(parts[0]);
		}
		var bracketContent = HxOverrides.substr(parts[1],0,parts[1].length - 1);
		if(bracketContent.indexOf("!") != -1) {
			var modeParts = bracketContent.split("!");
			var degree = Std.parseInt(modeParts[0]);
			var modeNumber = Std.parseInt(modeParts[1]);
			var chord = new ChordThing(this.key,this.mode,degree);
			var newMode;
			if(this.mode == Mode.getMajorMode()) {
				newMode = Mode.constructNthMajorMode(modeNumber);
			} else if(this.mode == Mode.getHarmonicMinorMode()) {
				newMode = Mode.constructNthHarmonicMinorMode(modeNumber);
			} else if(this.mode == Mode.getMelodicMinorMode()) {
				newMode = Mode.constructNthMelodicMinorMode(modeNumber);
			} else if(this.mode == Mode.getMinorMode()) {
				newMode = Mode.constructNthMinorMode(modeNumber);
			} else {
				throw haxe_Exception.thrown("Cannot get nth mode of unknown scale");
			}
			chord.set_mode(newMode);
			if(extension != null) {
				if(extension == 7) {
					chord.seventh();
				} else if(extension == 9) {
					chord.ninth();
				}
			}
			return chord;
		} else {
			var secondaryParts = bracketContent.split("/");
			var secondaryDegree = Std.parseInt(secondaryParts[0]);
			var degree = Std.parseInt(secondaryParts[1]);
			var chord = new ChordThing(this.key,this.mode,degree);
			chord.set_as_secondary(secondaryDegree);
			if(extension != null) {
				if(extension == 7) {
					chord.seventh();
				} else if(extension == 9) {
					chord.ninth();
				}
			}
			return chord;
		}
	}
	,interpretItem: function(itemString) {
		var isModalInterchange = false;
		if(itemString.charAt(0) == "-") {
			isModalInterchange = true;
			itemString = HxOverrides.substr(itemString,1,null);
		}
		var inversion = 0;
		if(itemString.indexOf("i") != -1) {
			inversion = this.countOccurrences(itemString,"i");
			itemString = itemString.split("i").join("");
		}
		if(itemString.indexOf("(") != -1 && itemString.indexOf(")") != -1) {
			var chord = this.parseBracket(itemString);
			chord.set_inversion(inversion);
			return chord;
		}
		var itemValue = Std.parseInt(itemString);
		var modeToUse = isModalInterchange ? this.mode == Mode.getMajorMode() ? Mode.getMinorMode() : Mode.getMajorMode() : this.mode;
		var chord;
		if(1 <= itemValue && itemValue <= 7) {
			chord = new ChordThing(this.key,modeToUse,itemValue);
		} else if(61 <= itemValue && itemValue <= 67) {
			chord = new ChordThing(this.key,modeToUse,itemValue - 60).sixth();
		} else if(71 <= itemValue && itemValue <= 77) {
			chord = new ChordThing(this.key,modeToUse,itemValue - 70).seventh();
		} else if(91 <= itemValue && itemValue <= 97) {
			chord = new ChordThing(this.key,modeToUse,itemValue - 90).ninth();
		} else {
			throw haxe_Exception.thrown("Unexpected item value: " + itemString);
		}
		chord.set_inversion(inversion);
		return chord;
	}
	,parseMode: function(inputString) {
		var modeChars_b = "";
		while(inputString.length > 0 && [",","|"].indexOf(inputString.charAt(0)) == -1) {
			modeChars_b += Std.string(inputString.charAt(0));
			inputString = HxOverrides.substr(inputString,1,null);
		}
		var modeString = StringTools.trim(modeChars_b);
		if(modeString.length < 2) {
			throw haxe_Exception.thrown("Expected mode specifier after '!'. Use !M, !m, !hm, or !mm");
		}
		var modeSpec = modeString.charAt(1);
		switch(modeSpec) {
		case "M":
			this.mode = Mode.getMajorMode();
			break;
		case "h":
			if(modeString.length < 3 || modeString.charAt(2) != "m") {
				throw haxe_Exception.thrown("Expected 'hm' for harmonic minor mode");
			}
			this.mode = Mode.getHarmonicMinorMode();
			break;
		case "m":
			if(modeString.length >= 3 && modeString.charAt(2) == "m") {
				this.mode = Mode.getMelodicMinorMode();
			} else {
				this.mode = Mode.getMinorMode();
			}
			break;
		default:
			throw haxe_Exception.thrown("Invalid mode specifier: " + modeSpec + ". Use !M, !m, !hm, or !mm");
		}
		return inputString;
	}
	,parse: function(inputString) {
		var chords = [];
		var voiceLeadNext = false;
		while(inputString.length > 0) {
			var sepResult = this.parseSeparator(inputString);
			var separator = sepResult._0;
			inputString = sepResult._1;
			if(separator == "&") {
				voiceLeadNext = true;
			}
			if(inputString.length > 0) {
				if(inputString.charAt(0) == "!") {
					inputString = this.parseMode(inputString);
				} else if(inputString.charAt(0) == ">" || inputString.charAt(0) == "<") {
					inputString = this.parseTranspose(inputString);
				} else {
					var itemResult = this.parseItem(inputString);
					var itemString = itemResult._0;
					inputString = itemResult._1;
					var chord = this.interpretItem(itemString);
					if(voiceLeadNext) {
						chord.set_voice_leading();
					}
					chords.push(chord);
				}
			}
		}
		return chords;
	}
	,__class__: ChordParser
};
var IChordProgression = $hxClasses["IChordProgression"] = $hx_exports["IChordProgression"] = function() { };
IChordProgression.__name__ = "IChordProgression";
IChordProgression.__isInterface__ = true;
IChordProgression.prototype = {
	toChordThings: null
	,toNotes: null
	,getChordNames: null
	,__class__: IChordProgression
};
var ChordProgression = $hxClasses["ChordProgression"] = $hx_exports["ChordProgression"] = function(key,mode,scoreString) {
	this.key = key;
	this.mode = mode;
	this.scoreString = scoreString;
	this.recalc();
};
ChordProgression.__name__ = "ChordProgression";
ChordProgression.__interfaces__ = [IChordProgression];
ChordProgression.prototype = {
	key: null
	,mode: null
	,scoreString: null
	,chordThings: null
	,recalc: function() {
		this.chordThings = this.toChordThings();
	}
	,toChordThings: function() {
		return new ChordParser(this.key,this.mode).parse(this.scoreString);
	}
	,toNotes: function() {
		var chords = [];
		var prev_chord = null;
		var _g = 0;
		var _g1 = this.chordThings;
		while(_g < _g1.length) {
			var ct = _g1[_g];
			++_g;
			var chord = ct.generateChordNotes();
			if(prev_chord != null && ct.modifiers.indexOf(Modifier.VOICE_LEADING) != -1) {
				chord = this.voice_lead(prev_chord,chord);
			}
			chords.push(chord);
			prev_chord = chord;
		}
		return chords;
	}
	,voice_lead: function(prevChord,nextChord) {
		return nextChord;
	}
	,getChordNames: function() {
		var names = [];
		var _g = 0;
		var _g1 = this.chordThings;
		while(_g < _g1.length) {
			var ct = _g1[_g];
			++_g;
			names.push(ct.getChordName());
		}
		return names;
	}
	,__class__: ChordProgression
};
var StutteredChordProgression = $hxClasses["StutteredChordProgression"] = $hx_exports["StutteredChordProgression"] = function(progression,stutterCount) {
	this.progression = progression;
	this.stutterCount = stutterCount;
};
StutteredChordProgression.__name__ = "StutteredChordProgression";
StutteredChordProgression.__interfaces__ = [IChordProgression];
StutteredChordProgression.prototype = {
	progression: null
	,stutterCount: null
	,setStutterCount: function(count) {
		this.stutterCount = count;
		return this;
	}
	,getStutterCount: function() {
		return this.stutterCount;
	}
	,stutterArray: function(items) {
		if(this.stutterCount <= 0 || items.length <= 0) {
			return items;
		}
		var count = Math.min(this.stutterCount,items.length) | 0;
		var fragment = items.slice(0,count);
		var result = [];
		while(result.length < items.length) result = result.concat(fragment);
		return result.slice(0,items.length);
	}
	,toChordThings: function() {
		return this.stutterArray(this.progression.toChordThings());
	}
	,toNotes: function() {
		return this.stutterArray(this.progression.toNotes());
	}
	,getChordNames: function() {
		return this.stutterArray(this.progression.getChordNames());
	}
	,__class__: StutteredChordProgression
};
var ChordThing = $hxClasses["ChordThing"] = function(key,mode,degree,length) {
	if(length == null) {
		length = 1;
	}
	this.key = key;
	this.mode = mode;
	this.degree = degree;
	this.length = length;
	this.modifiers = [];
	this.inversion = 0;
	this.secondary_degree = null;
};
ChordThing.__name__ = "ChordThing";
ChordThing.prototype = {
	key: null
	,mode: null
	,degree: null
	,length: null
	,modifiers: null
	,inversion: null
	,secondary_degree: null
	,valueEquals: function(other) {
		if(!((other) instanceof ChordThing)) {
			return false;
		}
		var otherChord = js_Boot.__cast(other , ChordThing);
		if(this.key != otherChord.key || !this.mode.valueEquals(otherChord.mode) || this.degree != otherChord.degree || this.length != otherChord.length || this.inversion != otherChord.inversion) {
			return false;
		}
		if(this.modifiers.length != otherChord.modifiers.length) {
			return false;
		}
		var _g = 0;
		var _g1 = this.modifiers.length;
		while(_g < _g1) {
			var i = _g++;
			if(this.modifiers[i] != otherChord.modifiers[i]) {
				return false;
			}
		}
		return true;
	}
	,set_as_secondary: function(secondary_degree) {
		this.modifiers.push(Modifier.SECONDARY);
		this.secondary_degree = secondary_degree;
		return this;
	}
	,swap_mode: function() {
		if(this.mode.valueEquals(Mode.getMajorMode())) {
			this.mode = Mode.getMinorMode();
		} else {
			this.mode = Mode.getMajorMode();
		}
		return this;
	}
	,seventh: function() {
		if(this.modifiers.indexOf(Modifier.NINTH) != -1) {
			this.modifiers.splice(this.modifiers.indexOf(Modifier.NINTH),1);
		}
		if(this.modifiers.indexOf(Modifier.SIXTH) != -1) {
			this.modifiers.splice(this.modifiers.indexOf(Modifier.SIXTH),1);
		}
		this.modifiers.push(Modifier.SEVENTH);
		return this;
	}
	,ninth: function() {
		if(this.modifiers.indexOf(Modifier.SEVENTH) != -1) {
			this.modifiers.splice(this.modifiers.indexOf(Modifier.SEVENTH),1);
		}
		if(this.modifiers.indexOf(Modifier.SIXTH) != -1) {
			this.modifiers.splice(this.modifiers.indexOf(Modifier.SIXTH),1);
		}
		this.modifiers.push(Modifier.NINTH);
		return this;
	}
	,sixth: function() {
		if(this.modifiers.indexOf(Modifier.SEVENTH) != -1) {
			this.modifiers.splice(this.modifiers.indexOf(Modifier.SEVENTH),1);
		}
		if(this.modifiers.indexOf(Modifier.NINTH) != -1) {
			this.modifiers.splice(this.modifiers.indexOf(Modifier.NINTH),1);
		}
		this.modifiers.push(Modifier.SIXTH);
		return this;
	}
	,set_inversion: function(inversion) {
		this.inversion = inversion;
		return this;
	}
	,set_voice_leading: function() {
		this.modifiers.push(Modifier.VOICE_LEADING);
		return this;
	}
	,toString: function() {
		var modeStr = this.mode.valueEquals(Mode.getMajorMode()) ? "MAJOR" : "MINOR";
		var degree_repr = this.modifiers.indexOf(Modifier.SECONDARY) != -1 ? "(" + this.secondary_degree + "/" + this.degree + ")" : "" + this.degree;
		return "ChordThing(" + this.key + "," + modeStr + "," + degree_repr + "," + this.inversion + "," + this.length + ") + " + this.modifiers.toString();
	}
	,clone: function() {
		var ct = new ChordThing(this.key,this.mode,this.degree,this.length);
		ct.modifiers = this.modifiers.slice();
		ct.inversion = this.inversion;
		ct.secondary_degree = this.secondary_degree;
		return ct;
	}
	,has_extensions: function() {
		if(this.modifiers.indexOf(Modifier.SEVENTH) == -1) {
			return this.modifiers.indexOf(Modifier.NINTH) != -1;
		} else {
			return true;
		}
	}
	,get_mode: function() {
		return this.mode;
	}
	,calculateAsSecondaryChord: function() {
		var new_tonic = this.mode.nth_from(this.key,this.degree);
		var ct = new ChordThing(new_tonic,Mode.getMajorMode(),this.secondary_degree,this.length);
		if(this.modifiers.indexOf(Modifier.SEVENTH) != -1) {
			ct.seventh();
		}
		if(this.modifiers.indexOf(Modifier.NINTH) != -1) {
			ct.ninth();
		}
		ct.set_inversion(this.inversion);
		return ct;
	}
	,generateChordNotes: function() {
		if(this.modifiers.indexOf(Modifier.SECONDARY) != -1 && this.secondary_degree != null) {
			return this.calculateAsSecondaryChord().generateChordNotes();
		}
		var chord;
		if(this.modifiers.indexOf(Modifier.NINTH) != -1) {
			chord = this.mode.make_ninth(this.key,this.degree);
		} else if(this.modifiers.indexOf(Modifier.SEVENTH) != -1) {
			chord = this.mode.make_seventh(this.key,this.degree);
		} else if(this.modifiers.indexOf(Modifier.SIXTH) != -1) {
			chord = this.mode.make_sixth(this.key,this.degree);
		} else {
			chord = this.mode.make_triad(this.key,this.degree);
		}
		var _g = 0;
		var _g1 = this.inversion;
		while(_g < _g1) {
			var i = _g++;
			chord.push(chord.shift() + 12);
		}
		return chord;
	}
	,midiToNoteName: function(midiNote,includeOctave) {
		if(includeOctave == null) {
			includeOctave = false;
		}
		var noteNames = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
		var noteName = noteNames[midiNote % 12];
		if(includeOctave) {
			var octave = Math.floor(midiNote / 12) - 1;
			return noteName + octave;
		}
		return noteName;
	}
	,calculateRootNote: function() {
		var intervals = this.mode.valueEquals(Mode.getMajorMode()) ? [0,2,4,5,7,9,11] : [0,2,3,5,7,8,10];
		var degreeIndex = (this.degree - 1) % 7;
		var semitoneOffset = intervals[degreeIndex];
		return this.key + semitoneOffset;
	}
	,getBassNote: function() {
		if(this.inversion == 0) {
			return this.calculateRootNote();
		}
		var originalChord = this.clone();
		originalChord.inversion = 0;
		var chordNotes = originalChord.generateChordNotes();
		var inversionIndex = Math.min(this.inversion,chordNotes.length - 1) | 0;
		return chordNotes[inversionIndex];
	}
	,determineChordQuality: function() {
		var originalChord = this.clone();
		originalChord.inversion = 0;
		var chordNotes = originalChord.generateChordNotes();
		if(chordNotes.length < 3) {
			return "";
		}
		var root = chordNotes[0];
		var third = chordNotes[1];
		var fifth = chordNotes[2];
		var thirdInterval = third - root;
		var fifthInterval = fifth - root;
		if(thirdInterval == 4 && fifthInterval == 7) {
			return "";
		} else if(thirdInterval == 3 && fifthInterval == 7) {
			return "m";
		} else if(thirdInterval == 3 && fifthInterval == 6) {
			return "dim";
		} else if(thirdInterval == 4 && fifthInterval == 8) {
			return "aug";
		} else if(thirdInterval == 4) {
			return "";
		} else {
			return "m";
		}
	}
	,determineExtension: function() {
		if(!this.has_extensions()) {
			return "";
		}
		if(this.modifiers.indexOf(Modifier.SEVENTH) != -1) {
			return "7";
		}
		if(this.modifiers.indexOf(Modifier.NINTH) != -1) {
			return "9";
		}
		return "";
	}
	,getChordName: function() {
		if(this.modifiers.indexOf(Modifier.SECONDARY) != -1 && this.secondary_degree != null) {
			var secondaryChord = this.calculateAsSecondaryChord();
			return secondaryChord.getChordName();
		}
		var rootNote = this.calculateRootNote();
		var rootName = this.midiToNoteName(rootNote);
		var quality = this.determineChordQuality();
		var chordName = rootName + quality;
		var extension = this.determineExtension();
		chordName += extension;
		if(this.inversion > 0) {
			var bassNote = this.getBassNote();
			var bassName = this.midiToNoteName(bassNote);
			chordName += "/" + bassName;
		}
		return chordName;
	}
	,set_mode: function(newMode) {
		this.mode = newMode;
	}
	,__class__: ChordThing
};
var EReg = $hxClasses["EReg"] = function(r,opt) {
	this.r = new RegExp(r,opt.split("u").join(""));
};
EReg.__name__ = "EReg";
EReg.escape = function(s) {
	return s.replace(EReg.escapeRe,"\\$&");
};
EReg.prototype = {
	r: null
	,match: function(s) {
		if(this.r.global) {
			this.r.lastIndex = 0;
		}
		this.r.m = this.r.exec(s);
		this.r.s = s;
		return this.r.m != null;
	}
	,matched: function(n) {
		if(this.r.m != null && n >= 0 && n < this.r.m.length) {
			return this.r.m[n];
		} else {
			throw haxe_Exception.thrown("EReg::matched");
		}
	}
	,matchedLeft: function() {
		if(this.r.m == null) {
			throw haxe_Exception.thrown("No string matched");
		}
		return HxOverrides.substr(this.r.s,0,this.r.m.index);
	}
	,matchedRight: function() {
		if(this.r.m == null) {
			throw haxe_Exception.thrown("No string matched");
		}
		var sz = this.r.m.index + this.r.m[0].length;
		return HxOverrides.substr(this.r.s,sz,this.r.s.length - sz);
	}
	,matchedPos: function() {
		if(this.r.m == null) {
			throw haxe_Exception.thrown("No string matched");
		}
		return { pos : this.r.m.index, len : this.r.m[0].length};
	}
	,matchSub: function(s,pos,len) {
		if(len == null) {
			len = -1;
		}
		if(this.r.global) {
			this.r.lastIndex = pos;
			this.r.m = this.r.exec(len < 0 ? s : HxOverrides.substr(s,0,pos + len));
			var b = this.r.m != null;
			if(b) {
				this.r.s = s;
			}
			return b;
		} else {
			var b = this.match(len < 0 ? HxOverrides.substr(s,pos,null) : HxOverrides.substr(s,pos,len));
			if(b) {
				this.r.s = s;
				this.r.m.index += pos;
			}
			return b;
		}
	}
	,split: function(s) {
		var d = "#__delim__#";
		return s.replace(this.r,d).split(d);
	}
	,replace: function(s,by) {
		return s.replace(this.r,by);
	}
	,map: function(s,f) {
		var offset = 0;
		var buf_b = "";
		while(true) {
			if(offset >= s.length) {
				break;
			} else if(!this.matchSub(s,offset)) {
				buf_b += Std.string(HxOverrides.substr(s,offset,null));
				break;
			}
			var p = this.matchedPos();
			buf_b += Std.string(HxOverrides.substr(s,offset,p.pos - offset));
			buf_b += Std.string(f(this));
			if(p.len == 0) {
				buf_b += Std.string(HxOverrides.substr(s,p.pos,1));
				offset = p.pos + 1;
			} else {
				offset = p.pos + p.len;
			}
			if(!this.r.global) {
				break;
			}
		}
		if(!this.r.global && offset > 0 && offset < s.length) {
			buf_b += Std.string(HxOverrides.substr(s,offset,null));
		}
		return buf_b;
	}
	,__class__: EReg
};
var EnumValue = {};
EnumValue.match = function(this1,pattern) {
	return false;
};
var GoldenData = $hxClasses["GoldenData"] = $hx_exports["GoldenData"] = function() {
	this.root = 60;
	this.mode = 0;
	this.chordSequence = "1,4,5,1";
	this.stutter = 0;
	this.bpm = 120;
	this.chordDuration = 4;
	this.ppq = 960;
	this.lines = [];
	this.lastSerializedString = "";
};
GoldenData.__name__ = "GoldenData";
GoldenData.makeFromJSON = $hx_exports["GoldenData"]["makeFromJSON"] = function(json,deserializationHelper) {
	var data = JSON.parse(json);
	var result = new GoldenData();
	result.root = data.root;
	result.mode = data.mode;
	result.chordSequence = data.chordSequence;
	result.stutter = data.stutter;
	result.bpm = data.bpm;
	result.chordDuration = data.chordDuration;
	result.ppq = data.ppq;
	result.lines = [];
	var _g = 0;
	var _g1 = data.lines;
	while(_g < _g1.length) {
		var lineData = _g1[_g];
		++_g;
		try {
			var line = deserializationHelper.helpMake("LineData",JSON.stringify(lineData));
			result.lines.push(line);
		} catch( _g2 ) {
			haxe_NativeStackTrace.lastError = _g2;
			var _g3 = haxe_Exception.caught(_g2).unwrap();
			if(typeof(_g3) == "string") {
				var e = _g3;
				haxe_Log.trace("Error deserializing line: " + e,{ fileName : "src/goldenpond/GoldenData.hx", lineNumber : 259, className : "GoldenData", methodName : "makeFromJSON"});
				continue;
			} else {
				throw _g2;
			}
		}
	}
	return result;
};
GoldenData.prototype = {
	root: null
	,mode: null
	,chordSequence: null
	,stutter: null
	,bpm: null
	,chordDuration: null
	,ppq: null
	,lines: null
	,lastSerializedString: null
	,addLine: function(pattern,instrumentContext) {
		this.lines.push(new LineData(pattern,instrumentContext));
		return this;
	}
	,setMode: function(modeIndex) {
		this.mode = modeIndex;
		return this;
	}
	,setPPQ: function(ppq) {
		this.ppq = ppq;
		return this;
	}
	,makeMode: function() {
		switch(this.mode) {
		case 0:
			return Mode.getMajorMode();
		case 1:
			return Mode.getMinorMode();
		case 2:
			return Mode.getHarmonicMinorMode();
		case 3:
			return Mode.getMelodicMinorMode();
		default:
			return Mode.getMajorMode();
		}
	}
	,makeChordProgression: function() {
		var baseProgression = new ChordProgression(this.root,this.makeMode(),this.chordSequence);
		if(this.stutter > 0) {
			return new StutteredChordProgression(baseProgression,this.stutter);
		}
		return baseProgression;
	}
	,makeTimeManipulator: function() {
		return new TimeManipulator().setPPQ(this.ppq).setChordDuration(this.chordDuration).setBPM(this.bpm);
	}
	,makeLineGenerator: function(lineIndex) {
		if(lineIndex < 0 || lineIndex >= this.lines.length) {
			throw haxe_Exception.thrown("Invalid line index: " + lineIndex);
		}
		var line = this.lines[lineIndex];
		var timeManipulator = this.makeTimeManipulator();
		var progression = this.makeChordProgression();
		return LineGenerator.createFromPattern(timeManipulator,progression,line.pattern,line.instrumentContext);
	}
	,hasChanged: function() {
		var currentString = this.toJSON();
		var changed = currentString != this.lastSerializedString;
		this.lastSerializedString = currentString;
		return changed;
	}
	,toString: function() {
		var modeNames = ["major","minor","harmonic minor","melodic minor"];
		var modeName = modeNames[this.mode];
		var result = "GoldenPond Project\n";
		result += "-------------------------------------------\n";
		result += "Root: " + this.root + "\n";
		result += "Mode: " + modeName + " (" + this.mode + ")\n";
		result += "Chord Sequence: " + this.chordSequence + "\n";
		result += "Stutter: " + this.stutter + "\n";
		result += "BPM: " + this.bpm + "\n";
		result += "Chord Duration: " + this.chordDuration + "\n";
		result += "PPQ: " + this.ppq + "\n";
		result += "Lines:\n";
		var _g = 0;
		var _g1 = this.lines.length;
		while(_g < _g1) {
			var i = _g++;
			var line = this.lines[i];
			result += "  Line " + (i + 1) + ": Pattern=\"" + line.pattern + "\", InstrumentContext=" + line.instrumentContext.toString() + "\n";
		}
		result += "-------------------------------------------\n";
		return result;
	}
	,toJSON: function() {
		var data = this.root;
		var data1 = this.mode;
		var data2 = this.chordSequence;
		var data3 = this.stutter;
		var data4 = this.bpm;
		var data5 = this.chordDuration;
		var data6 = this.ppq;
		var _this = this.lines;
		var result = new Array(_this.length);
		var _g = 0;
		var _g1 = _this.length;
		while(_g < _g1) {
			var i = _g++;
			var line = _this[i];
			result[i] = { pattern : line.pattern, instrumentContextCode : line.instrumentContext.getCode(), instrumentContextData : line.instrumentContext.toJSON()};
		}
		var data7 = { root : data, mode : data1, chordSequence : data2, stutter : data3, bpm : data4, chordDuration : data5, ppq : data6, lines : result};
		return JSON.stringify(data7);
	}
	,correct: function(noteToCorrect,timeInTicks,previousNote) {
		var direction = 0;
		if(previousNote != null) {
			if(noteToCorrect > previousNote) {
				direction = 1;
			} else if(noteToCorrect < previousNote) {
				direction = -1;
			}
		}
		var scaleNotes = this.getScaleForChordAtTime(timeInTicks,noteToCorrect,previousNote);
		if(scaleNotes == null || scaleNotes.length == 0) {
			return noteToCorrect;
		}
		return this.mapToNearestInScale(noteToCorrect,scaleNotes,direction);
	}
	,getScaleForChordAtTime: function(timeInTicks,noteToCorrect,previousNote) {
		var timeManipulator = this.makeTimeManipulator();
		var progression = this.makeChordProgression();
		var chordDurationInTicks = timeManipulator.chordTicks;
		if(chordDurationInTicks <= 0) {
			return null;
		}
		var chordIndex = Math.floor(timeInTicks / chordDurationInTicks);
		var chordThings = progression.toChordThings();
		if(chordThings == null || chordThings.length == 0) {
			return null;
		}
		var activeChord = chordThings[chordIndex % chordThings.length];
		var direction = 0;
		if(previousNote != null) {
			if(noteToCorrect > previousNote) {
				direction = 1;
			} else if(noteToCorrect < previousNote) {
				direction = -1;
			}
		}
		var tonic = activeChord.key;
		var intervals = activeChord.mode.intervals;
		if(activeChord.mode.valueEquals(Mode.getMelodicMinorMode()) && direction == -1) {
			intervals = Mode.getMinorMode().intervals;
		}
		var scale = [tonic];
		var currentNote = tonic;
		currentNote += intervals[0 % intervals.length];
		scale.push(currentNote);
		currentNote += intervals[1 % intervals.length];
		scale.push(currentNote);
		currentNote += intervals[2 % intervals.length];
		scale.push(currentNote);
		currentNote += intervals[3 % intervals.length];
		scale.push(currentNote);
		currentNote += intervals[4 % intervals.length];
		scale.push(currentNote);
		currentNote += intervals[5 % intervals.length];
		scale.push(currentNote);
		return scale;
	}
	,mapToNearestInScale: function(noteIn,scaleNotes,direction) {
		if(scaleNotes == null || scaleNotes.length == 0) {
			return noteIn;
		}
		var noteInClass = noteIn % 12;
		var minDistance = 12;
		var candidates = [];
		var _g = 0;
		while(_g < scaleNotes.length) {
			var scaleNote = scaleNotes[_g];
			++_g;
			var scaleNoteClass = scaleNote % 12;
			var distance = Math.abs(noteInClass - scaleNoteClass) | 0;
			if(distance > 6) {
				distance = 12 - distance;
			}
			if(distance < minDistance) {
				minDistance = distance;
			}
		}
		var _g = 0;
		while(_g < scaleNotes.length) {
			var scaleNote = scaleNotes[_g];
			++_g;
			var scaleNoteClass = scaleNote % 12;
			var distance = Math.abs(noteInClass - scaleNoteClass) | 0;
			if(distance > 6) {
				distance = 12 - distance;
			}
			if(distance == minDistance) {
				if(candidates.indexOf(scaleNoteClass) == -1) {
					candidates.push(scaleNoteClass);
				}
			}
		}
		if(candidates.length == 0) {
			return noteIn;
		}
		var closestNoteClass = -1;
		if(candidates.length == 1) {
			closestNoteClass = candidates[0];
		} else if(direction == 1) {
			var higherNote = -1;
			var _g = 0;
			while(_g < candidates.length) {
				var c = candidates[_g];
				++_g;
				var diff = c - noteInClass;
				if(diff < -6) {
					diff += 12;
				}
				if(diff > 0) {
					if(higherNote == -1) {
						higherNote = c;
					}
				}
			}
			if(higherNote != -1) {
				closestNoteClass = higherNote;
			} else {
				closestNoteClass = candidates[0];
			}
		} else {
			closestNoteClass = candidates[0];
		}
		if(closestNoteClass == -1) {
			return noteIn;
		}
		var originalOctaveBase = noteIn - noteInClass;
		var correctedNote = originalOctaveBase + closestNoteClass;
		if(Math.abs(correctedNote - noteIn) > 6.0) {
			if(noteIn < correctedNote) {
				correctedNote -= 12;
			} else {
				correctedNote += 12;
			}
		}
		return correctedNote;
	}
	,__class__: GoldenData
};
var ISerializable = $hxClasses["ISerializable"] = $hx_exports["ISerializable"] = function() { };
ISerializable.__name__ = "ISerializable";
ISerializable.__isInterface__ = true;
ISerializable.prototype = {
	toString: null
	,toJSON: null
	,getCode: null
	,__class__: ISerializable
};
var LineData = $hxClasses["LineData"] = function(pattern,instrumentContext) {
	this.pattern = pattern;
	this.instrumentContext = instrumentContext;
};
LineData.__name__ = "LineData";
LineData.__interfaces__ = [ISerializable];
LineData.prototype = {
	pattern: null
	,instrumentContext: null
	,toString: function() {
		return "LineData[pattern: " + this.pattern + ", instrumentContext: " + this.instrumentContext.toString() + "]";
	}
	,toJSON: function() {
		return JSON.stringify({ pattern : this.pattern, instrumentContextCode : this.instrumentContext.getCode(), instrumentContextData : this.instrumentContext.toJSON()});
	}
	,getCode: function() {
		return "LineData";
	}
	,__class__: LineData
};
var HxOverrides = $hxClasses["HxOverrides"] = function() { };
HxOverrides.__name__ = "HxOverrides";
HxOverrides.dateStr = function(date) {
	var m = date.getMonth() + 1;
	var d = date.getDate();
	var h = date.getHours();
	var mi = date.getMinutes();
	var s = date.getSeconds();
	return date.getFullYear() + "-" + (m < 10 ? "0" + m : "" + m) + "-" + (d < 10 ? "0" + d : "" + d) + " " + (h < 10 ? "0" + h : "" + h) + ":" + (mi < 10 ? "0" + mi : "" + mi) + ":" + (s < 10 ? "0" + s : "" + s);
};
HxOverrides.strDate = function(s) {
	switch(s.length) {
	case 8:
		var k = s.split(":");
		var d = new Date();
		d["setTime"](0);
		d["setUTCHours"](k[0]);
		d["setUTCMinutes"](k[1]);
		d["setUTCSeconds"](k[2]);
		return d;
	case 10:
		var k = s.split("-");
		return new Date(k[0],k[1] - 1,k[2],0,0,0);
	case 19:
		var k = s.split(" ");
		var y = k[0].split("-");
		var t = k[1].split(":");
		return new Date(y[0],y[1] - 1,y[2],t[0],t[1],t[2]);
	default:
		throw haxe_Exception.thrown("Invalid date format : " + s);
	}
};
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) {
		return undefined;
	}
	return x;
};
HxOverrides.substr = function(s,pos,len) {
	if(len == null) {
		len = s.length;
	} else if(len < 0) {
		if(pos == 0) {
			len = s.length + len;
		} else {
			return "";
		}
	}
	return s.substr(pos,len);
};
HxOverrides.indexOf = function(a,obj,i) {
	var len = a.length;
	if(i < 0) {
		i += len;
		if(i < 0) {
			i = 0;
		}
	}
	while(i < len) {
		if(((a[i]) === obj)) {
			return i;
		}
		++i;
	}
	return -1;
};
HxOverrides.lastIndexOf = function(a,obj,i) {
	var len = a.length;
	if(i >= len) {
		i = len - 1;
	} else if(i < 0) {
		i += len;
	}
	while(i >= 0) {
		if(((a[i]) === obj)) {
			return i;
		}
		--i;
	}
	return -1;
};
HxOverrides.remove = function(a,obj) {
	var i = a.indexOf(obj);
	if(i == -1) {
		return false;
	}
	a.splice(i,1);
	return true;
};
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
};
HxOverrides.keyValueIter = function(a) {
	return new haxe_iterators_ArrayKeyValueIterator(a);
};
HxOverrides.now = function() {
	return Date.now();
};
var IntIterator = $hxClasses["IntIterator"] = function(min,max) {
	this.min = min;
	this.max = max;
};
IntIterator.__name__ = "IntIterator";
IntIterator.prototype = {
	min: null
	,max: null
	,hasNext: function() {
		return this.min < this.max;
	}
	,next: function() {
		return this.min++;
	}
	,__class__: IntIterator
};
Math.__name__ = "Math";
var Modifier = $hxEnums["Modifier"] = { __ename__:"Modifier",__constructs__:null
	,SEVENTH: {_hx_name:"SEVENTH",_hx_index:0,__enum__:"Modifier",toString:$estr}
	,NINTH: {_hx_name:"NINTH",_hx_index:1,__enum__:"Modifier",toString:$estr}
	,SIXTH: {_hx_name:"SIXTH",_hx_index:2,__enum__:"Modifier",toString:$estr}
	,SECONDARY: {_hx_name:"SECONDARY",_hx_index:3,__enum__:"Modifier",toString:$estr}
	,VOICE_LEADING: {_hx_name:"VOICE_LEADING",_hx_index:4,__enum__:"Modifier",toString:$estr}
};
Modifier.__constructs__ = [Modifier.SEVENTH,Modifier.NINTH,Modifier.SIXTH,Modifier.SECONDARY,Modifier.VOICE_LEADING];
Modifier.__empty_constructs__ = [Modifier.SEVENTH,Modifier.NINTH,Modifier.SIXTH,Modifier.SECONDARY,Modifier.VOICE_LEADING];
var _$Mode_BaseScale = $hxEnums["_Mode.BaseScale"] = { __ename__:"_Mode.BaseScale",__constructs__:null
	,MAJOR: {_hx_name:"MAJOR",_hx_index:0,__enum__:"_Mode.BaseScale",toString:$estr}
	,MELODIC_MINOR: {_hx_name:"MELODIC_MINOR",_hx_index:1,__enum__:"_Mode.BaseScale",toString:$estr}
	,HARMONIC_MINOR: {_hx_name:"HARMONIC_MINOR",_hx_index:2,__enum__:"_Mode.BaseScale",toString:$estr}
};
_$Mode_BaseScale.__constructs__ = [_$Mode_BaseScale.MAJOR,_$Mode_BaseScale.MELODIC_MINOR,_$Mode_BaseScale.HARMONIC_MINOR];
_$Mode_BaseScale.__empty_constructs__ = [_$Mode_BaseScale.MAJOR,_$Mode_BaseScale.MELODIC_MINOR,_$Mode_BaseScale.HARMONIC_MINOR];
var Mode = $hxClasses["Mode"] = $hx_exports["Mode"] = function(intervals) {
	this.intervals = intervals;
};
Mode.__name__ = "Mode";
Mode.modeMap = null;
Mode.constructMajorMode = function(offset) {
	var intervals = [];
	intervals.push(Mode.major_intervals[(offset - 1) % 7]);
	intervals.push(Mode.major_intervals[(1 + offset - 1) % 7]);
	intervals.push(Mode.major_intervals[(2 + offset - 1) % 7]);
	intervals.push(Mode.major_intervals[(3 + offset - 1) % 7]);
	intervals.push(Mode.major_intervals[(4 + offset - 1) % 7]);
	intervals.push(Mode.major_intervals[(5 + offset - 1) % 7]);
	intervals.push(Mode.major_intervals[(6 + offset - 1) % 7]);
	return new Mode(intervals);
};
Mode.constructMelodicMinorMode = function(offset) {
	var intervals = [];
	intervals.push(Mode.melodic_minor_intervals[(offset - 1) % 7]);
	intervals.push(Mode.melodic_minor_intervals[(1 + offset - 1) % 7]);
	intervals.push(Mode.melodic_minor_intervals[(2 + offset - 1) % 7]);
	intervals.push(Mode.melodic_minor_intervals[(3 + offset - 1) % 7]);
	intervals.push(Mode.melodic_minor_intervals[(4 + offset - 1) % 7]);
	intervals.push(Mode.melodic_minor_intervals[(5 + offset - 1) % 7]);
	intervals.push(Mode.melodic_minor_intervals[(6 + offset - 1) % 7]);
	return new Mode(intervals);
};
Mode.constructHarmonicMinorMode = function(offset) {
	var intervals = [];
	intervals.push(Mode.harmonic_minor_intervals[(offset - 1) % 7]);
	intervals.push(Mode.harmonic_minor_intervals[(1 + offset - 1) % 7]);
	intervals.push(Mode.harmonic_minor_intervals[(2 + offset - 1) % 7]);
	intervals.push(Mode.harmonic_minor_intervals[(3 + offset - 1) % 7]);
	intervals.push(Mode.harmonic_minor_intervals[(4 + offset - 1) % 7]);
	intervals.push(Mode.harmonic_minor_intervals[(5 + offset - 1) % 7]);
	intervals.push(Mode.harmonic_minor_intervals[(6 + offset - 1) % 7]);
	return new Mode(intervals);
};
Mode.initializeModeMap = function() {
	if(Mode.modeMap == null) {
		Mode.modeMap = new haxe_ds_EnumValueMap();
		var majorModes = [];
		majorModes.push(Mode.constructMajorMode(1));
		majorModes.push(Mode.constructMajorMode(2));
		majorModes.push(Mode.constructMajorMode(3));
		majorModes.push(Mode.constructMajorMode(4));
		majorModes.push(Mode.constructMajorMode(5));
		majorModes.push(Mode.constructMajorMode(6));
		majorModes.push(Mode.constructMajorMode(7));
		Mode.modeMap.set(_$Mode_BaseScale.MAJOR,majorModes);
		var melodicMinorModes = [];
		melodicMinorModes.push(Mode.constructMelodicMinorMode(1));
		melodicMinorModes.push(Mode.constructMelodicMinorMode(2));
		melodicMinorModes.push(Mode.constructMelodicMinorMode(3));
		melodicMinorModes.push(Mode.constructMelodicMinorMode(4));
		melodicMinorModes.push(Mode.constructMelodicMinorMode(5));
		melodicMinorModes.push(Mode.constructMelodicMinorMode(6));
		melodicMinorModes.push(Mode.constructMelodicMinorMode(7));
		Mode.modeMap.set(_$Mode_BaseScale.MELODIC_MINOR,melodicMinorModes);
		var harmonicMinorModes = [];
		harmonicMinorModes.push(Mode.constructHarmonicMinorMode(1));
		harmonicMinorModes.push(Mode.constructHarmonicMinorMode(2));
		harmonicMinorModes.push(Mode.constructHarmonicMinorMode(3));
		harmonicMinorModes.push(Mode.constructHarmonicMinorMode(4));
		harmonicMinorModes.push(Mode.constructHarmonicMinorMode(5));
		harmonicMinorModes.push(Mode.constructHarmonicMinorMode(6));
		harmonicMinorModes.push(Mode.constructHarmonicMinorMode(7));
		Mode.modeMap.set(_$Mode_BaseScale.HARMONIC_MINOR,harmonicMinorModes);
	}
};
Mode.getMode = function(baseScale,modeNumber) {
	Mode.initializeModeMap();
	if(modeNumber < 1 || modeNumber > 7) {
		throw haxe_Exception.thrown("Mode number must be between 1 and 7");
	}
	return Mode.modeMap.get(baseScale)[modeNumber - 1];
};
Mode.getMajorMode = function() {
	Mode.initializeModeMap();
	return Mode.getMode(_$Mode_BaseScale.MAJOR,1);
};
Mode.getMinorMode = function() {
	Mode.initializeModeMap();
	return Mode.getMode(_$Mode_BaseScale.MAJOR,6);
};
Mode.getHarmonicMinorMode = function() {
	Mode.initializeModeMap();
	return Mode.getMode(_$Mode_BaseScale.HARMONIC_MINOR,1);
};
Mode.getMelodicMinorMode = function() {
	Mode.initializeModeMap();
	return Mode.getMode(_$Mode_BaseScale.MELODIC_MINOR,1);
};
Mode.getDorianMode = function() {
	Mode.initializeModeMap();
	return Mode.getMode(_$Mode_BaseScale.MAJOR,2);
};
Mode.getPhrygianMode = function() {
	Mode.initializeModeMap();
	return Mode.getMode(_$Mode_BaseScale.MAJOR,3);
};
Mode.getLydianMode = function() {
	Mode.initializeModeMap();
	return Mode.getMode(_$Mode_BaseScale.MAJOR,4);
};
Mode.getMixolydianMode = function() {
	Mode.initializeModeMap();
	return Mode.getMode(_$Mode_BaseScale.MAJOR,5);
};
Mode.getAeolianMode = function() {
	Mode.initializeModeMap();
	return Mode.getMode(_$Mode_BaseScale.MAJOR,6);
};
Mode.getLocrianMode = function() {
	Mode.initializeModeMap();
	return Mode.getMode(_$Mode_BaseScale.MAJOR,7);
};
Mode.constructNthMajorMode = function(offset) {
	Mode.initializeModeMap();
	return Mode.getMode(_$Mode_BaseScale.MAJOR,offset);
};
Mode.constructNthHarmonicMinorMode = function(offset) {
	Mode.initializeModeMap();
	return Mode.getMode(_$Mode_BaseScale.HARMONIC_MINOR,offset);
};
Mode.constructNthMelodicMinorMode = function(offset) {
	Mode.initializeModeMap();
	return Mode.getMode(_$Mode_BaseScale.MELODIC_MINOR,offset);
};
Mode.constructNthMinorMode = function(n) {
	return Mode.constructNthMajorMode(n);
};
Mode.prototype = {
	intervals: null
	,nth_from: function(root,n) {
		if(n == 1) {
			return root;
		}
		var note = root;
		var _g = 0;
		var _g1 = n - 1;
		while(_g < _g1) {
			var i = _g++;
			note += this.intervals[i % this.intervals.length];
		}
		return note;
	}
	,make_chord_from_pattern: function(root,n,pat) {
		var _gthis = this;
		var result = new Array(pat.length);
		var _g = 0;
		var _g1 = pat.length;
		while(_g < _g1) {
			var i = _g++;
			result[i] = _gthis.nth_from(root,n + pat[i] - 1);
		}
		return result;
	}
	,make_triad: function(root,n) {
		return this.make_chord_from_pattern(root,n,[1,3,5]);
	}
	,make_sixth: function(root,n) {
		return this.make_chord_from_pattern(root,n,[1,3,5,6]);
	}
	,make_seventh: function(root,n) {
		return this.make_chord_from_pattern(root,n,[1,3,5,7]);
	}
	,make_ninth: function(root,n) {
		return this.make_chord_from_pattern(root,n,[1,3,5,7,9]);
	}
	,valueEquals: function(other) {
		if(!((other) instanceof Mode)) {
			return false;
		}
		var otherMode = js_Boot.__cast(other , Mode);
		if(otherMode == null) {
			return false;
		}
		if(this.intervals.length != otherMode.intervals.length) {
			return false;
		}
		var _g = 0;
		var _g1 = this.intervals.length;
		while(_g < _g1) {
			var i = _g++;
			if(this.intervals[i] != otherMode.intervals[i]) {
				return false;
			}
		}
		return true;
	}
	,hashCode: function() {
		var hash = 17;
		var _g = 0;
		var _g1 = this.intervals;
		while(_g < _g1.length) {
			var interval = _g1[_g];
			++_g;
			hash = hash * 31 + interval;
		}
		return hash;
	}
	,__class__: Mode
};
var haxe_ds_Map = {};
haxe_ds_Map.set = function(this1,key,value) {
	this1.set(key,value);
};
haxe_ds_Map.get = function(this1,key) {
	return this1.get(key);
};
haxe_ds_Map.exists = function(this1,key) {
	return this1.exists(key);
};
haxe_ds_Map.remove = function(this1,key) {
	return this1.remove(key);
};
haxe_ds_Map.keys = function(this1) {
	return this1.keys();
};
haxe_ds_Map.iterator = function(this1) {
	return this1.iterator();
};
haxe_ds_Map.keyValueIterator = function(this1) {
	return this1.keyValueIterator();
};
haxe_ds_Map.copy = function(this1) {
	return this1.copy();
};
haxe_ds_Map.toString = function(this1) {
	return this1.toString();
};
haxe_ds_Map.clear = function(this1) {
	this1.clear();
};
haxe_ds_Map.arrayWrite = function(this1,k,v) {
	this1.set(k,v);
	return v;
};
haxe_ds_Map.toStringMap = function(t) {
	return new haxe_ds_StringMap();
};
haxe_ds_Map.toIntMap = function(t) {
	return new haxe_ds_IntMap();
};
haxe_ds_Map.toEnumValueMapMap = function(t) {
	return new haxe_ds_EnumValueMap();
};
haxe_ds_Map.toObjectMap = function(t) {
	return new haxe_ds_ObjectMap();
};
haxe_ds_Map.fromStringMap = function(map) {
	return map;
};
haxe_ds_Map.fromIntMap = function(map) {
	return map;
};
haxe_ds_Map.fromObjectMap = function(map) {
	return map;
};
var Reflect = $hxClasses["Reflect"] = function() { };
Reflect.__name__ = "Reflect";
Reflect.hasField = function(o,field) {
	return Object.prototype.hasOwnProperty.call(o,field);
};
Reflect.field = function(o,field) {
	try {
		return o[field];
	} catch( _g ) {
		haxe_NativeStackTrace.lastError = _g;
		return null;
	}
};
Reflect.setField = function(o,field,value) {
	o[field] = value;
};
Reflect.getProperty = function(o,field) {
	var tmp;
	if(o == null) {
		return null;
	} else {
		var tmp1;
		if(o.__properties__) {
			tmp = o.__properties__["get_" + field];
			tmp1 = tmp;
		} else {
			tmp1 = false;
		}
		if(tmp1) {
			return o[tmp]();
		} else {
			return o[field];
		}
	}
};
Reflect.setProperty = function(o,field,value) {
	var tmp;
	var tmp1;
	if(o.__properties__) {
		tmp = o.__properties__["set_" + field];
		tmp1 = tmp;
	} else {
		tmp1 = false;
	}
	if(tmp1) {
		o[tmp](value);
	} else {
		o[field] = value;
	}
};
Reflect.callMethod = function(o,func,args) {
	return func.apply(o,args);
};
Reflect.fields = function(o) {
	var a = [];
	if(o != null) {
		var hasOwnProperty = Object.prototype.hasOwnProperty;
		for( var f in o ) {
		if(f != "__id__" && f != "hx__closures__" && hasOwnProperty.call(o,f)) {
			a.push(f);
		}
		}
	}
	return a;
};
Reflect.isFunction = function(f) {
	if(typeof(f) == "function") {
		return !(f.__name__ || f.__ename__);
	} else {
		return false;
	}
};
Reflect.compare = function(a,b) {
	if(a == b) {
		return 0;
	} else if(a > b) {
		return 1;
	} else {
		return -1;
	}
};
Reflect.compareMethods = function(f1,f2) {
	if(f1 == f2) {
		return true;
	}
	if(!Reflect.isFunction(f1) || !Reflect.isFunction(f2)) {
		return false;
	}
	if(f1.scope == f2.scope && f1.method == f2.method) {
		return f1.method != null;
	} else {
		return false;
	}
};
Reflect.isObject = function(v) {
	if(v == null) {
		return false;
	}
	var t = typeof(v);
	if(!(t == "string" || t == "object" && v.__enum__ == null)) {
		if(t == "function") {
			return (v.__name__ || v.__ename__) != null;
		} else {
			return false;
		}
	} else {
		return true;
	}
};
Reflect.isEnumValue = function(v) {
	if(v != null) {
		return v.__enum__ != null;
	} else {
		return false;
	}
};
Reflect.deleteField = function(o,field) {
	if(!Object.prototype.hasOwnProperty.call(o,field)) {
		return false;
	}
	delete(o[field]);
	return true;
};
Reflect.copy = function(o) {
	if(o == null) {
		return null;
	}
	var o2 = { };
	var _g = 0;
	var _g1 = Reflect.fields(o);
	while(_g < _g1.length) {
		var f = _g1[_g];
		++_g;
		o2[f] = Reflect.field(o,f);
	}
	return o2;
};
Reflect.makeVarArgs = function(f) {
	return function() {
		var a = Array.prototype.slice;
		var a1 = arguments;
		var a2 = a.call(a1);
		return f(a2);
	};
};
var SelectorType = $hxEnums["SelectorType"] = { __ename__:"SelectorType",__constructs__:null
	,Ascending: {_hx_name:"Ascending",_hx_index:0,__enum__:"SelectorType",toString:$estr}
	,Descending: {_hx_name:"Descending",_hx_index:1,__enum__:"SelectorType",toString:$estr}
	,Repeat: {_hx_name:"Repeat",_hx_index:2,__enum__:"SelectorType",toString:$estr}
	,FullChord: {_hx_name:"FullChord",_hx_index:3,__enum__:"SelectorType",toString:$estr}
	,Random: {_hx_name:"Random",_hx_index:4,__enum__:"SelectorType",toString:$estr}
	,RandomFromScale: {_hx_name:"RandomFromScale",_hx_index:5,__enum__:"SelectorType",toString:$estr}
	,SpecificNote: ($_=function(n) { return {_hx_index:6,n:n,__enum__:"SelectorType",toString:$estr}; },$_._hx_name="SpecificNote",$_.__params__ = ["n"],$_)
	,Rest: {_hx_name:"Rest",_hx_index:7,__enum__:"SelectorType",toString:$estr}
	,TopNote: {_hx_name:"TopNote",_hx_index:8,__enum__:"SelectorType",toString:$estr}
	,ScaleDegree: ($_=function(n) { return {_hx_index:9,n:n,__enum__:"SelectorType",toString:$estr}; },$_._hx_name="ScaleDegree",$_.__params__ = ["n"],$_)
};
SelectorType.__constructs__ = [SelectorType.Ascending,SelectorType.Descending,SelectorType.Repeat,SelectorType.FullChord,SelectorType.Random,SelectorType.RandomFromScale,SelectorType.SpecificNote,SelectorType.Rest,SelectorType.TopNote,SelectorType.ScaleDegree];
SelectorType.__empty_constructs__ = [SelectorType.Ascending,SelectorType.Descending,SelectorType.Repeat,SelectorType.FullChord,SelectorType.Random,SelectorType.RandomFromScale,SelectorType.Rest,SelectorType.TopNote];
var IRhythmGenerator = $hxClasses["IRhythmGenerator"] = function() { };
IRhythmGenerator.__name__ = "IRhythmGenerator";
IRhythmGenerator.__isInterface__ = true;
IRhythmGenerator.prototype = {
	hasNext: null
	,next: null
	,reset: null
	,getPatternLength: null
	,getTotalSteps: null
	,parseFailed: null
	,getSteps: null
	,__class__: IRhythmGenerator
};
var ExplicitRhythmGenerator = $hxClasses["ExplicitRhythmGenerator"] = $hx_exports["ExplicitRhythmGenerator"] = function(steps,density) {
	this.steps = steps;
	this.index = 0;
	this.density = density;
	this.totalSteps = steps.length * density;
};
ExplicitRhythmGenerator.__name__ = "ExplicitRhythmGenerator";
ExplicitRhythmGenerator.__interfaces__ = [IRhythmGenerator];
ExplicitRhythmGenerator.prototype = {
	steps: null
	,index: null
	,density: null
	,totalSteps: null
	,hasNext: function() {
		return true;
	}
	,next: function() {
		var selector = this.steps[this.index % this.steps.length];
		this.index = (this.index + 1) % this.totalSteps;
		return selector;
	}
	,reset: function() {
		this.index = 0;
	}
	,getPatternLength: function() {
		return this.steps.length;
	}
	,getTotalSteps: function() {
		return this.totalSteps;
	}
	,parseFailed: function() {
		return false;
	}
	,getSteps: function() {
		return this.steps;
	}
	,__class__: ExplicitRhythmGenerator
};
var SimpleRhythmGenerator = $hxClasses["SimpleRhythmGenerator"] = $hx_exports["SimpleRhythmGenerator"] = function(k,n,selector,density,offset) {
	if(offset == null) {
		offset = 0;
	}
	var steps = [];
	var _g = 0;
	var _g1 = n;
	while(_g < _g1) {
		var i = _g++;
		steps.push(SelectorType.Rest);
	}
	if(k >= n) {
		var _g = 0;
		var _g1 = n;
		while(_g < _g1) {
			var i = _g++;
			steps[i] = selector;
		}
	} else {
		var stepSize = n / k;
		var currentStep = 0.0;
		var _g = 0;
		var _g1 = k;
		while(_g < _g1) {
			var i = _g++;
			var pos = Math.floor(currentStep + 0.5);
			pos = (pos + offset) % n;
			steps[pos] = selector;
			currentStep += stepSize;
		}
	}
	ExplicitRhythmGenerator.call(this,steps,density);
};
SimpleRhythmGenerator.__name__ = "SimpleRhythmGenerator";
SimpleRhythmGenerator.__super__ = ExplicitRhythmGenerator;
SimpleRhythmGenerator.prototype = $extend(ExplicitRhythmGenerator.prototype,{
	__class__: SimpleRhythmGenerator
});
var BjorklundRhythmGenerator = $hxClasses["BjorklundRhythmGenerator"] = $hx_exports["BjorklundRhythmGenerator"] = function(k,n,selector,density,offset) {
	if(offset == null) {
		offset = 0;
	}
	k = Math.max(0,Math.min(k,n)) | 0;
	n = Math.max(1,n) | 0;
	var pattern = [];
	if(k <= 0) {
		var _g = [];
		var _g1 = 0;
		var _g2 = n;
		while(_g1 < _g2) {
			var i = _g1++;
			_g.push(SelectorType.Rest);
		}
		pattern = _g;
	} else if(k >= n) {
		var _g = [];
		var _g1 = 0;
		var _g2 = n;
		while(_g1 < _g2) {
			var i = _g1++;
			_g.push(selector);
		}
		pattern = _g;
	} else {
		var bits = this.bjorklund(k,n);
		if(offset > 0) {
			var _g = [];
			var _g1 = 0;
			var _g2 = n;
			while(_g1 < _g2) {
				var i = _g1++;
				_g.push(false);
			}
			var rotated = _g;
			var _g = 0;
			var _g1 = n;
			while(_g < _g1) {
				var i = _g++;
				var newPos = (i - offset + n) % n;
				rotated[i] = bits[newPos];
			}
			bits = rotated;
		}
		var result = new Array(bits.length);
		var _g = 0;
		var _g1 = bits.length;
		while(_g < _g1) {
			var i = _g++;
			result[i] = bits[i] ? selector : SelectorType.Rest;
		}
		pattern = result;
	}
	ExplicitRhythmGenerator.call(this,pattern,density);
};
BjorklundRhythmGenerator.__name__ = "BjorklundRhythmGenerator";
BjorklundRhythmGenerator.__super__ = ExplicitRhythmGenerator;
BjorklundRhythmGenerator.prototype = $extend(ExplicitRhythmGenerator.prototype,{
	bjorklund: function(k,n) {
		if(k <= 0) {
			var _g = [];
			var _g1 = 0;
			var _g2 = n;
			while(_g1 < _g2) {
				var i = _g1++;
				_g.push(false);
			}
			return _g;
		}
		if(k >= n) {
			var _g = [];
			var _g1 = 0;
			var _g2 = n;
			while(_g1 < _g2) {
				var i = _g1++;
				_g.push(true);
			}
			return _g;
		}
		return this.standardBjorklund(k,n);
	}
	,standardBjorklund: function(k,n) {
		var pattern = [];
		var counts = [];
		var remainders = [];
		var divisor = n - k;
		remainders.push(k);
		var level = 0;
		while(true) {
			counts.push(Math.floor(divisor / remainders[level]));
			remainders.push(divisor % remainders[level]);
			divisor = remainders[level];
			++level;
			if(remainders[level] <= 1) {
				break;
			}
		}
		counts.push(divisor);
		this.buildPatternRecursive(level,counts,remainders,pattern);
		var firstOneIndex = pattern.indexOf(1);
		if(firstOneIndex > 0) {
			pattern = pattern.slice(firstOneIndex).concat(pattern.slice(0,firstOneIndex));
		}
		var result = new Array(pattern.length);
		var _g = 0;
		var _g1 = pattern.length;
		while(_g < _g1) {
			var i = _g++;
			result[i] = pattern[i] == 1;
		}
		return result;
	}
	,buildPatternRecursive: function(level,counts,remainders,pattern) {
		if(level == -1) {
			pattern.push(0);
		} else if(level == -2) {
			pattern.push(1);
		} else {
			var _g = 0;
			var _g1 = counts[level];
			while(_g < _g1) {
				var i = _g++;
				this.buildPatternRecursive(level - 1,counts,remainders,pattern);
			}
			if(remainders[level] != 0) {
				this.buildPatternRecursive(level - 2,counts,remainders,pattern);
			}
		}
	}
	,__class__: BjorklundRhythmGenerator
});
var ParseFailedRhythmGenerator = $hxClasses["ParseFailedRhythmGenerator"] = $hx_exports["ParseFailedRhythmGenerator"] = function(patternLength) {
	if(patternLength == null) {
		patternLength = 1;
	}
	this.patternLength = patternLength;
};
ParseFailedRhythmGenerator.__name__ = "ParseFailedRhythmGenerator";
ParseFailedRhythmGenerator.__interfaces__ = [IRhythmGenerator];
ParseFailedRhythmGenerator.prototype = {
	patternLength: null
	,hasNext: function() {
		return true;
	}
	,next: function() {
		return SelectorType.Rest;
	}
	,reset: function() {
	}
	,getPatternLength: function() {
		return this.patternLength;
	}
	,getTotalSteps: function() {
		return this.patternLength;
	}
	,parseFailed: function() {
		return true;
	}
	,getSteps: function() {
		return [];
	}
	,__class__: ParseFailedRhythmGenerator
};
var RhythmLanguage = $hxClasses["RhythmLanguage"] = $hx_exports["RhythmLanguage"] = function() { };
RhythmLanguage.__name__ = "RhythmLanguage";
RhythmLanguage.makeRhythmGenerator = function(pattern) {
	return RhythmLanguage.parse(pattern);
};
RhythmLanguage.parse = function(input) {
	input = StringTools.trim(input);
	var euclidean = RhythmLanguage.parseEuclidean(input);
	if(!euclidean.parseFailed()) {
		return euclidean;
	}
	var explicit = RhythmLanguage.parseExplicit(input);
	if(!explicit.parseFailed()) {
		return explicit;
	}
	return new ParseFailedRhythmGenerator();
};
RhythmLanguage.parseEuclidean = function(input) {
	var regex = new EReg("^([0-9]+)([/%])([0-9]+)(\\+([0-9]+))?\\s+([><rc=tR]|[0-9])\\s+([0-9]+)$","");
	if(!regex.match(input)) {
		return new ParseFailedRhythmGenerator();
	}
	var k = Std.parseInt(regex.matched(1));
	var separator = regex.matched(2);
	var n = Std.parseInt(regex.matched(3));
	var offsetStr = regex.matched(5);
	var offset = offsetStr != null ? Std.parseInt(offsetStr) : 0;
	var selector = RhythmLanguage.parseSelectorType(regex.matched(6));
	var density = Std.parseInt(regex.matched(7));
	if(k == null || n == null || selector == null || density == null) {
		return new ParseFailedRhythmGenerator();
	}
	if(k <= 0 || n <= 0 || density <= 0) {
		return new ParseFailedRhythmGenerator();
	}
	if(separator == "%") {
		return new BjorklundRhythmGenerator(k,n,selector,density,offset);
	} else {
		return new SimpleRhythmGenerator(k,n,selector,density,offset);
	}
};
RhythmLanguage.parseExplicit = function(input) {
	var parts = input.split(" ");
	if(parts.length != 2) {
		return new ParseFailedRhythmGenerator();
	}
	var stepsStr = parts[0];
	var density = Std.parseInt(parts[1]);
	if(density == null || density <= 0) {
		return new ParseFailedRhythmGenerator();
	}
	var steps = [];
	var _g = 0;
	var _g1 = stepsStr.length;
	while(_g < _g1) {
		var i = _g++;
		var char = stepsStr.charAt(i);
		if(char == ".") {
			steps.push(SelectorType.Rest);
		} else {
			var selector = RhythmLanguage.parseSelectorType(char);
			if(selector == null) {
				return new ParseFailedRhythmGenerator();
			}
			steps.push(selector);
		}
	}
	return new ExplicitRhythmGenerator(steps,density);
};
RhythmLanguage.parseSelectorType = function(input) {
	switch(input) {
	case "<":
		return SelectorType.Descending;
	case "=":
		return SelectorType.Repeat;
	case ">":
		return SelectorType.Ascending;
	case "R":
		return SelectorType.RandomFromScale;
	case "c":
		return SelectorType.FullChord;
	case "r":
		return SelectorType.Random;
	case "t":
		return SelectorType.TopNote;
	default:
		var n = input;
		if(new EReg("^[1-9]$","").match(n)) {
			return SelectorType.SpecificNote(Std.parseInt(n));
		} else {
			return null;
		}
	}
};
var INote = $hxClasses["INote"] = $hx_exports["INote"] = function() { };
INote.__name__ = "INote";
INote.__isInterface__ = true;
INote.prototype = {
	getMidiNoteValue: null
	,getStartTime: null
	,getLength: null
	,__class__: INote
};
var IDeserializationHelper = $hxClasses["IDeserializationHelper"] = $hx_exports["IDeserializationHelper"] = function() { };
IDeserializationHelper.__name__ = "IDeserializationHelper";
IDeserializationHelper.__isInterface__ = true;
IDeserializationHelper.prototype = {
	helpMake: null
	,__class__: IDeserializationHelper
};
var IInstrumentContext = $hxClasses["IInstrumentContext"] = $hx_exports["IInstrumentContext"] = function() { };
IInstrumentContext.__name__ = "IInstrumentContext";
IInstrumentContext.__isInterface__ = true;
IInstrumentContext.__interfaces__ = [ISerializable];
IInstrumentContext.prototype = {
	makeNote: null
	,__class__: IInstrumentContext
};
var Note = $hxClasses["Note"] = $hx_exports["Note"] = function(chan,note,velocity,startTime,length) {
	this.chan = chan;
	this.note = note;
	this.startTime = startTime;
	this.length = length;
	this.velocity = velocity;
};
Note.__name__ = "Note";
Note.__interfaces__ = [INote];
Note.prototype = {
	chan: null
	,note: null
	,startTime: null
	,length: null
	,velocity: null
	,toString: function() {
		return "Note[chan: " + this.chan + ", note: " + this.note + ", vel: " + this.velocity + ", startTime: " + this.startTime + ", length: " + this.length + "]";
	}
	,toStruct: function() {
		return { chan : this.chan, note : this.note, velocity : this.velocity, startTime : this.startTime, length : this.length};
	}
	,valueEquals: function(other) {
		if(!((other) instanceof Note)) {
			return false;
		}
		var otherNote = js_Boot.__cast(other , Note);
		if(this.chan == otherNote.chan && this.note == otherNote.note && this.velocity == otherNote.velocity && this.startTime == otherNote.startTime) {
			return this.length == otherNote.length;
		} else {
			return false;
		}
	}
	,transpose: function(offset) {
		return new Note(this.chan,this.note + offset,this.velocity,this.startTime,this.length);
	}
	,getMidiNoteValue: function() {
		return this.note;
	}
	,getStartTime: function() {
		return this.startTime;
	}
	,getLength: function() {
		return this.length;
	}
	,__class__: Note
};
var ScoreUtilities = $hxClasses["ScoreUtilities"] = $hx_exports["ScoreUtilities"] = function() { };
ScoreUtilities.__name__ = "ScoreUtilities";
ScoreUtilities.transposeNotes = function(notes,offset,instrumentContext) {
	var _g = [];
	var _g1 = 0;
	while(_g1 < notes.length) {
		var n = notes[_g1];
		++_g1;
		_g.push(instrumentContext.makeNote(n.getMidiNoteValue() + offset,n.getStartTime(),n.getLength()));
	}
	return _g;
};
ScoreUtilities.makePianoRollSVG = function(notes,svgWidth,svgHeight) {
	var noteHeight = svgHeight / 100;
	var maxTime = 0.0;
	var _g = 0;
	while(_g < notes.length) {
		var note = notes[_g];
		++_g;
		maxTime = Math.max(maxTime,note.getStartTime() + note.getLength());
	}
	var timeScale = maxTime > 0 ? svgWidth / maxTime : 0.1;
	var pitchOffset = 20;
	var svg_b = "";
	svg_b += Std.string("<svg width=\"" + svgWidth + "\" height=\"" + svgHeight + "\" viewBox=\"0 0 " + svgWidth + " " + svgHeight + "\" xmlns=\"http://www.w3.org/2000/svg\">\n");
	var _g = 0;
	var _g1 = svgHeight / noteHeight | 0;
	while(_g < _g1) {
		var i = _g++;
		var y = i * noteHeight;
		svg_b += Std.string("<line x1=\"0\" y1=\"" + y + "\" x2=\"" + svgWidth + "\" y2=\"" + y + "\" stroke=\"#ddd\" />\n");
	}
	var _g = 0;
	while(_g < notes.length) {
		var note = notes[_g];
		++_g;
		var x = note.getStartTime() * timeScale;
		var y = svgHeight - (note.getMidiNoteValue() - pitchOffset) * noteHeight - noteHeight;
		var width = note.getLength() * timeScale;
		var height = noteHeight;
		if(isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
			haxe_Log.trace("Invalid note values: note=" + Std.string(note) + ", x=" + x + ", y=" + y + ", width=" + width + ", height=" + height,{ fileName : "src/goldenpond/ScoreUtilities.hx", lineNumber : 152, className : "ScoreUtilities", methodName : "makePianoRollSVG"});
			continue;
		}
		svg_b += Std.string("<rect x=\"" + x + "\" y=\"" + y + "\" width=\"" + width + "\" height=\"" + height + "\" fill=\"black\" />\n");
	}
	svg_b += "</svg>";
	return svg_b;
};
var Std = $hxClasses["Std"] = function() { };
Std.__name__ = "Std";
Std.is = function(v,t) {
	return js_Boot.__instanceof(v,t);
};
Std.isOfType = function(v,t) {
	return js_Boot.__instanceof(v,t);
};
Std.downcast = function(value,c) {
	if(js_Boot.__downcastCheck(value,c)) {
		return value;
	} else {
		return null;
	}
};
Std.instance = function(value,c) {
	if(js_Boot.__downcastCheck(value,c)) {
		return value;
	} else {
		return null;
	}
};
Std.string = function(s) {
	return js_Boot.__string_rec(s,"");
};
Std.int = function(x) {
	return x | 0;
};
Std.parseInt = function(x) {
	if(x != null) {
		var _g = 0;
		var _g1 = x.length;
		while(_g < _g1) {
			var i = _g++;
			var c = x.charCodeAt(i);
			if(c <= 8 || c >= 14 && c != 32 && c != 45) {
				var nc = x.charCodeAt(i + 1);
				var v = parseInt(x,nc == 120 || nc == 88 ? 16 : 10);
				if(isNaN(v)) {
					return null;
				} else {
					return v;
				}
			}
		}
	}
	return null;
};
Std.parseFloat = function(x) {
	return parseFloat(x);
};
Std.random = function(x) {
	if(x <= 0) {
		return 0;
	} else {
		return Math.floor(Math.random() * x);
	}
};
var StringBuf = $hxClasses["StringBuf"] = function() {
	this.b = "";
};
StringBuf.__name__ = "StringBuf";
StringBuf.prototype = {
	b: null
	,get_length: function() {
		return this.b.length;
	}
	,add: function(x) {
		this.b += Std.string(x);
	}
	,addChar: function(c) {
		this.b += String.fromCodePoint(c);
	}
	,addSub: function(s,pos,len) {
		this.b += len == null ? HxOverrides.substr(s,pos,null) : HxOverrides.substr(s,pos,len);
	}
	,toString: function() {
		return this.b;
	}
	,__class__: StringBuf
	,__properties__: {get_length:"get_length"}
};
var haxe_SysTools = $hxClasses["haxe.SysTools"] = function() { };
haxe_SysTools.__name__ = "haxe.SysTools";
haxe_SysTools.quoteUnixArg = function(argument) {
	if(argument == "") {
		return "''";
	}
	if(!new EReg("[^a-zA-Z0-9_@%+=:,./-]","").match(argument)) {
		return argument;
	}
	return "'" + StringTools.replace(argument,"'","'\"'\"'") + "'";
};
haxe_SysTools.quoteWinArg = function(argument,escapeMetaCharacters) {
	if(!new EReg("^[^ \t\\\\\"]+$","").match(argument)) {
		var result_b = "";
		var needquote = argument.indexOf(" ") != -1 || argument.indexOf("\t") != -1 || argument == "";
		if(needquote) {
			result_b += "\"";
		}
		var bs_buf = new StringBuf();
		var _g = 0;
		var _g1 = argument.length;
		while(_g < _g1) {
			var i = _g++;
			var _g2 = HxOverrides.cca(argument,i);
			if(_g2 == null) {
				var c = _g2;
				if(bs_buf.b.length > 0) {
					result_b += Std.string(bs_buf.b);
					bs_buf = new StringBuf();
				}
				result_b += String.fromCodePoint(c);
			} else {
				switch(_g2) {
				case 34:
					var bs = bs_buf.b;
					result_b += bs == null ? "null" : "" + bs;
					result_b += bs == null ? "null" : "" + bs;
					bs_buf = new StringBuf();
					result_b += "\\\"";
					break;
				case 92:
					bs_buf.b += "\\";
					break;
				default:
					var c1 = _g2;
					if(bs_buf.b.length > 0) {
						result_b += Std.string(bs_buf.b);
						bs_buf = new StringBuf();
					}
					result_b += String.fromCodePoint(c1);
				}
			}
		}
		result_b += Std.string(bs_buf.b);
		if(needquote) {
			result_b += Std.string(bs_buf.b);
			result_b += "\"";
		}
		argument = result_b;
	}
	if(escapeMetaCharacters) {
		var result_b = "";
		var _g = 0;
		var _g1 = argument.length;
		while(_g < _g1) {
			var i = _g++;
			var c = HxOverrides.cca(argument,i);
			if(haxe_SysTools.winMetaCharacters.indexOf(c) >= 0) {
				result_b += String.fromCodePoint(94);
			}
			result_b += String.fromCodePoint(c);
		}
		return result_b;
	} else {
		return argument;
	}
};
var StringTools = $hxClasses["StringTools"] = function() { };
StringTools.__name__ = "StringTools";
StringTools.urlEncode = function(s) {
	return encodeURIComponent(s);
};
StringTools.urlDecode = function(s) {
	return decodeURIComponent(s.split("+").join(" "));
};
StringTools.htmlEscape = function(s,quotes) {
	var buf_b = "";
	var _g_offset = 0;
	var _g_s = s;
	while(_g_offset < _g_s.length) {
		var s = _g_s;
		var index = _g_offset++;
		var c = s.charCodeAt(index);
		if(c >= 55296 && c <= 56319) {
			c = c - 55232 << 10 | s.charCodeAt(index + 1) & 1023;
		}
		var c1 = c;
		if(c1 >= 65536) {
			++_g_offset;
		}
		var code = c1;
		switch(code) {
		case 34:
			if(quotes) {
				buf_b += "&quot;";
			} else {
				buf_b += String.fromCodePoint(code);
			}
			break;
		case 38:
			buf_b += "&amp;";
			break;
		case 39:
			if(quotes) {
				buf_b += "&#039;";
			} else {
				buf_b += String.fromCodePoint(code);
			}
			break;
		case 60:
			buf_b += "&lt;";
			break;
		case 62:
			buf_b += "&gt;";
			break;
		default:
			buf_b += String.fromCodePoint(code);
		}
	}
	return buf_b;
};
StringTools.htmlUnescape = function(s) {
	return s.split("&gt;").join(">").split("&lt;").join("<").split("&quot;").join("\"").split("&#039;").join("'").split("&amp;").join("&");
};
StringTools.contains = function(s,value) {
	return s.indexOf(value) != -1;
};
StringTools.startsWith = function(s,start) {
	if(s.length >= start.length) {
		return s.lastIndexOf(start,0) == 0;
	} else {
		return false;
	}
};
StringTools.endsWith = function(s,end) {
	var elen = end.length;
	var slen = s.length;
	if(slen >= elen) {
		return s.indexOf(end,slen - elen) == slen - elen;
	} else {
		return false;
	}
};
StringTools.isSpace = function(s,pos) {
	var c = HxOverrides.cca(s,pos);
	if(!(c > 8 && c < 14)) {
		return c == 32;
	} else {
		return true;
	}
};
StringTools.ltrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,r)) ++r;
	if(r > 0) {
		return HxOverrides.substr(s,r,l - r);
	} else {
		return s;
	}
};
StringTools.rtrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,l - r - 1)) ++r;
	if(r > 0) {
		return HxOverrides.substr(s,0,l - r);
	} else {
		return s;
	}
};
StringTools.trim = function(s) {
	return StringTools.ltrim(StringTools.rtrim(s));
};
StringTools.lpad = function(s,c,l) {
	if(c.length <= 0) {
		return s;
	}
	var buf_b = "";
	l -= s.length;
	while(buf_b.length < l) buf_b += c == null ? "null" : "" + c;
	buf_b += s == null ? "null" : "" + s;
	return buf_b;
};
StringTools.rpad = function(s,c,l) {
	if(c.length <= 0) {
		return s;
	}
	var buf_b = "";
	buf_b += s == null ? "null" : "" + s;
	while(buf_b.length < l) buf_b += c == null ? "null" : "" + c;
	return buf_b;
};
StringTools.replace = function(s,sub,by) {
	return s.split(sub).join(by);
};
StringTools.hex = function(n,digits) {
	var s = "";
	var hexChars = "0123456789ABCDEF";
	while(true) {
		s = hexChars.charAt(n & 15) + s;
		n >>>= 4;
		if(!(n > 0)) {
			break;
		}
	}
	if(digits != null) {
		while(s.length < digits) s = "0" + s;
	}
	return s;
};
StringTools.fastCodeAt = function(s,index) {
	return s.charCodeAt(index);
};
StringTools.unsafeCodeAt = function(s,index) {
	return s.charCodeAt(index);
};
StringTools.iterator = function(s) {
	return new haxe_iterators_StringIterator(s);
};
StringTools.keyValueIterator = function(s) {
	return new haxe_iterators_StringKeyValueIterator(s);
};
StringTools.isEof = function(c) {
	return c != c;
};
StringTools.quoteUnixArg = function(argument) {
	if(argument == "") {
		return "''";
	} else if(!new EReg("[^a-zA-Z0-9_@%+=:,./-]","").match(argument)) {
		return argument;
	} else {
		return "'" + StringTools.replace(argument,"'","'\"'\"'") + "'";
	}
};
StringTools.quoteWinArg = function(argument,escapeMetaCharacters) {
	var argument1 = argument;
	if(!new EReg("^[^ \t\\\\\"]+$","").match(argument1)) {
		var result_b = "";
		var needquote = argument1.indexOf(" ") != -1 || argument1.indexOf("\t") != -1 || argument1 == "";
		if(needquote) {
			result_b += "\"";
		}
		var bs_buf = new StringBuf();
		var _g = 0;
		var _g1 = argument1.length;
		while(_g < _g1) {
			var i = _g++;
			var _g2 = HxOverrides.cca(argument1,i);
			if(_g2 == null) {
				var c = _g2;
				if(bs_buf.b.length > 0) {
					result_b += Std.string(bs_buf.b);
					bs_buf = new StringBuf();
				}
				result_b += String.fromCodePoint(c);
			} else {
				switch(_g2) {
				case 34:
					var bs = bs_buf.b;
					result_b += Std.string(bs);
					result_b += Std.string(bs);
					bs_buf = new StringBuf();
					result_b += "\\\"";
					break;
				case 92:
					bs_buf.b += "\\";
					break;
				default:
					var c1 = _g2;
					if(bs_buf.b.length > 0) {
						result_b += Std.string(bs_buf.b);
						bs_buf = new StringBuf();
					}
					result_b += String.fromCodePoint(c1);
				}
			}
		}
		result_b += Std.string(bs_buf.b);
		if(needquote) {
			result_b += Std.string(bs_buf.b);
			result_b += "\"";
		}
		argument1 = result_b;
	}
	if(escapeMetaCharacters) {
		var result_b = "";
		var _g = 0;
		var _g1 = argument1.length;
		while(_g < _g1) {
			var i = _g++;
			var c = HxOverrides.cca(argument1,i);
			if(haxe_SysTools.winMetaCharacters.indexOf(c) >= 0) {
				result_b += String.fromCodePoint(94);
			}
			result_b += String.fromCodePoint(c);
		}
		return result_b;
	} else {
		return argument1;
	}
};
StringTools.utf16CodePointAt = function(s,index) {
	var c = s.charCodeAt(index);
	if(c >= 55296 && c <= 56319) {
		c = c - 55232 << 10 | s.charCodeAt(index + 1) & 1023;
	}
	return c;
};
var SeqTypes = $hxEnums["SeqTypes"] = { __ename__:"SeqTypes",__constructs__:null
	,CHORDS: {_hx_name:"CHORDS",_hx_index:0,__enum__:"SeqTypes",toString:$estr}
	,ARPUP: {_hx_name:"ARPUP",_hx_index:1,__enum__:"SeqTypes",toString:$estr}
	,ARPDOWN: {_hx_name:"ARPDOWN",_hx_index:2,__enum__:"SeqTypes",toString:$estr}
	,BASS: {_hx_name:"BASS",_hx_index:3,__enum__:"SeqTypes",toString:$estr}
	,TOP: {_hx_name:"TOP",_hx_index:4,__enum__:"SeqTypes",toString:$estr}
	,RANDOM: {_hx_name:"RANDOM",_hx_index:5,__enum__:"SeqTypes",toString:$estr}
	,SCALE: {_hx_name:"SCALE",_hx_index:6,__enum__:"SeqTypes",toString:$estr}
};
SeqTypes.__constructs__ = [SeqTypes.CHORDS,SeqTypes.ARPUP,SeqTypes.ARPDOWN,SeqTypes.BASS,SeqTypes.TOP,SeqTypes.RANDOM,SeqTypes.SCALE];
SeqTypes.__empty_constructs__ = [SeqTypes.CHORDS,SeqTypes.ARPUP,SeqTypes.ARPDOWN,SeqTypes.BASS,SeqTypes.TOP,SeqTypes.RANDOM,SeqTypes.SCALE];
var DivisionValue = $hxEnums["DivisionValue"] = { __ename__:"DivisionValue",__constructs__:null
	,SIXTEENTH: {_hx_name:"SIXTEENTH",_hx_index:0,__enum__:"DivisionValue",toString:$estr}
	,TWELFTH: {_hx_name:"TWELFTH",_hx_index:1,__enum__:"DivisionValue",toString:$estr}
	,EIGHTH: {_hx_name:"EIGHTH",_hx_index:2,__enum__:"DivisionValue",toString:$estr}
	,SIXTH: {_hx_name:"SIXTH",_hx_index:3,__enum__:"DivisionValue",toString:$estr}
	,QUARTER: {_hx_name:"QUARTER",_hx_index:4,__enum__:"DivisionValue",toString:$estr}
	,THIRD: {_hx_name:"THIRD",_hx_index:5,__enum__:"DivisionValue",toString:$estr}
	,HALF: {_hx_name:"HALF",_hx_index:6,__enum__:"DivisionValue",toString:$estr}
	,WHOLE: {_hx_name:"WHOLE",_hx_index:7,__enum__:"DivisionValue",toString:$estr}
};
DivisionValue.__constructs__ = [DivisionValue.SIXTEENTH,DivisionValue.TWELFTH,DivisionValue.EIGHTH,DivisionValue.SIXTH,DivisionValue.QUARTER,DivisionValue.THIRD,DivisionValue.HALF,DivisionValue.WHOLE];
DivisionValue.__empty_constructs__ = [DivisionValue.SIXTEENTH,DivisionValue.TWELFTH,DivisionValue.EIGHTH,DivisionValue.SIXTH,DivisionValue.QUARTER,DivisionValue.THIRD,DivisionValue.HALF,DivisionValue.WHOLE];
var RhythmicDensity = $hxEnums["RhythmicDensity"] = { __ename__:"RhythmicDensity",__constructs__:null
	,SIXTEEN: {_hx_name:"SIXTEEN",_hx_index:0,__enum__:"RhythmicDensity",toString:$estr}
	,TWELVE: {_hx_name:"TWELVE",_hx_index:1,__enum__:"RhythmicDensity",toString:$estr}
	,EIGHT: {_hx_name:"EIGHT",_hx_index:2,__enum__:"RhythmicDensity",toString:$estr}
	,SIX: {_hx_name:"SIX",_hx_index:3,__enum__:"RhythmicDensity",toString:$estr}
	,FOUR: {_hx_name:"FOUR",_hx_index:4,__enum__:"RhythmicDensity",toString:$estr}
	,THREE: {_hx_name:"THREE",_hx_index:5,__enum__:"RhythmicDensity",toString:$estr}
	,TWO: {_hx_name:"TWO",_hx_index:6,__enum__:"RhythmicDensity",toString:$estr}
	,ONE: {_hx_name:"ONE",_hx_index:7,__enum__:"RhythmicDensity",toString:$estr}
};
RhythmicDensity.__constructs__ = [RhythmicDensity.SIXTEEN,RhythmicDensity.TWELVE,RhythmicDensity.EIGHT,RhythmicDensity.SIX,RhythmicDensity.FOUR,RhythmicDensity.THREE,RhythmicDensity.TWO,RhythmicDensity.ONE];
RhythmicDensity.__empty_constructs__ = [RhythmicDensity.SIXTEEN,RhythmicDensity.TWELVE,RhythmicDensity.EIGHT,RhythmicDensity.SIX,RhythmicDensity.FOUR,RhythmicDensity.THREE,RhythmicDensity.TWO,RhythmicDensity.ONE];
var ILineGenerator = $hxClasses["ILineGenerator"] = function() { };
ILineGenerator.__name__ = "ILineGenerator";
ILineGenerator.__isInterface__ = true;
ILineGenerator.prototype = {
	generateNotes: null
	,getPitches: null
	,getDurations: null
	,__class__: ILineGenerator
};
var ArpIterator = $hxClasses["ArpIterator"] = function(chord,step) {
	if(step == null) {
		step = 1;
	}
	this.chord = chord;
	this.noteIndex = 0;
	this.step = step;
};
ArpIterator.__name__ = "ArpIterator";
ArpIterator.prototype = {
	chord: null
	,noteIndex: null
	,step: null
	,hasNext: function() {
		return true;
	}
	,next: function() {
		var note = this.chord[this.noteIndex % this.chord.length];
		this.noteIndex = (this.noteIndex + this.step) % this.chord.length;
		return note;
	}
	,__class__: ArpIterator
};
var NoteSelectorIterator = $hxClasses["NoteSelectorIterator"] = function(chords,noteSelector) {
	this.chords = chords.toNotes();
	this.chordIndex = 0;
	this.noteSelector = noteSelector;
};
NoteSelectorIterator.__name__ = "NoteSelectorIterator";
NoteSelectorIterator.prototype = {
	chords: null
	,chordIndex: null
	,noteSelector: null
	,hasNext: function() {
		return this.chordIndex < this.chords.length;
	}
	,next: function() {
		var note = this.noteSelector(this.chords[this.chordIndex]);
		this.chordIndex++;
		return note;
	}
	,__class__: NoteSelectorIterator
};
var MenuHelper = $hxClasses["MenuHelper"] = $hx_exports["MenuHelper"] = function() { };
MenuHelper.__name__ = "MenuHelper";
MenuHelper.getDivisionNames = function() {
	return ["1/16","1/12","1/8","1/6","1/4","1/3","1/2","1"];
};
MenuHelper.getDivisionValues = function() {
	return [DivisionValue.SIXTEENTH,DivisionValue.TWELFTH,DivisionValue.EIGHTH,DivisionValue.SIXTH,DivisionValue.QUARTER,DivisionValue.THIRD,DivisionValue.HALF,DivisionValue.WHOLE];
};
MenuHelper.getDivisionFor = function(i) {
	return MenuHelper.getDivisionValues()[i];
};
MenuHelper.divisionValue2Numeric = function(dv) {
	var _g = new haxe_ds_EnumValueMap();
	_g.set(DivisionValue.SIXTEENTH,0.0625);
	_g.set(DivisionValue.TWELFTH,0.0833333333333333287);
	_g.set(DivisionValue.EIGHTH,0.125);
	_g.set(DivisionValue.SIXTH,0.166666666666666657);
	_g.set(DivisionValue.QUARTER,0.25);
	_g.set(DivisionValue.THIRD,0.333333333333333315);
	_g.set(DivisionValue.HALF,0.5);
	_g.set(DivisionValue.WHOLE,1);
	return _g.get(dv);
};
MenuHelper.getRhythmicDensityNames = function() {
	return ["16 patterns/chord","12 patterns/chord","8 patterns/chord","6 patterns/chord","4 patterns/chord","3 patterns/chord","2 patterns/chord","1 pattern/chord"];
};
MenuHelper.getRhythmicDensityValues = function() {
	return [RhythmicDensity.SIXTEEN,RhythmicDensity.TWELVE,RhythmicDensity.EIGHT,RhythmicDensity.SIX,RhythmicDensity.FOUR,RhythmicDensity.THREE,RhythmicDensity.TWO,RhythmicDensity.ONE];
};
MenuHelper.getRhythmicDensityFor = function(i) {
	return MenuHelper.getRhythmicDensityValues()[i];
};
MenuHelper.rhythmicDensityToNumeric = function(rd) {
	var _g = new haxe_ds_EnumValueMap();
	_g.set(RhythmicDensity.SIXTEEN,0.0625);
	_g.set(RhythmicDensity.TWELVE,0.0833333333333333287);
	_g.set(RhythmicDensity.EIGHT,0.125);
	_g.set(RhythmicDensity.SIX,0.166666666666666657);
	_g.set(RhythmicDensity.FOUR,0.25);
	_g.set(RhythmicDensity.THREE,0.333333333333333315);
	_g.set(RhythmicDensity.TWO,0.5);
	_g.set(RhythmicDensity.ONE,1);
	var result = _g.get(rd);
	return result;
};
var TimeManipulator = $hxClasses["TimeManipulator"] = $hx_exports["TimeManipulator"] = function() {
	this.ppq = 1000;
	this.chordDuration = 16;
	this.bpm = 120;
	this.recalc();
};
TimeManipulator.__name__ = "TimeManipulator";
TimeManipulator.prototype = {
	ppq: null
	,chordDuration: null
	,chordTicks: null
	,bpm: null
	,recalc: function() {
		this.chordTicks = this.ppq * this.chordDuration;
	}
	,setChordDuration: function(cl) {
		this.chordDuration = cl;
		this.recalc();
		return this;
	}
	,setPPQ: function(p) {
		this.ppq = p;
		this.recalc();
		return this;
	}
	,setBPM: function(b) {
		this.bpm = b;
		this.recalc();
		return this;
	}
	,toString: function() {
		return "\nTimeManipulator\n  PPQ: " + this.ppq + "\n  Chord Length Multiplier: " + this.chordDuration + "\n  quarterToMS: " + this.quarterToMS() + "\n  chordTicks:" + this.chordTicks;
	}
	,quarterToMS: function() {
		return 60 / this.bpm;
	}
	,getBPM: function() {
		return this.bpm;
	}
	,getPPQ: function() {
		return this.ppq;
	}
	,__class__: TimeManipulator
};
var MidiInstrumentContext = $hxClasses["MidiInstrumentContext"] = $hx_exports["MidiInstrumentContext"] = function(chan,velocity,gateLength,transpose) {
	this.chan = chan;
	this.velocity = velocity;
	this.gateLength = gateLength;
	this.transpose = transpose;
};
MidiInstrumentContext.__name__ = "MidiInstrumentContext";
MidiInstrumentContext.__interfaces__ = [IInstrumentContext];
MidiInstrumentContext.prototype = {
	chan: null
	,velocity: null
	,gateLength: null
	,transpose: null
	,getChannel: function() {
		return this.chan;
	}
	,makeNote: function(note,startTime,length) {
		return new Note(this.chan,note + this.transpose,this.velocity,startTime,length * this.gateLength);
	}
	,toString: function() {
		return "MidiInstrumentContext[chan: " + this.chan + ", velocity: " + this.velocity + ", gateLength: " + this.gateLength + ", transpose: " + this.transpose + "]";
	}
	,toJSON: function() {
		return JSON.stringify({ chan : this.chan, velocity : this.velocity, gateLength : this.gateLength, transpose : this.transpose});
	}
	,getCode: function() {
		return "MidiInstrumentContext";
	}
	,__class__: MidiInstrumentContext
};
var DeserializationHelper = $hxClasses["DeserializationHelper"] = $hx_exports["DeserializationHelper"] = function() {
};
DeserializationHelper.__name__ = "DeserializationHelper";
DeserializationHelper.__interfaces__ = [IDeserializationHelper];
DeserializationHelper.prototype = {
	helpMake: function(code,json) {
		switch(code) {
		case "LineData":
			var lineData = JSON.parse(json);
			var instrumentContext = this.helpMake(lineData.instrumentContextCode,lineData.instrumentContextData);
			return new LineData(lineData.pattern,instrumentContext);
		case "MidiInstrumentContext":
			var contextData = JSON.parse(json);
			return new MidiInstrumentContext(contextData.chan,contextData.velocity,contextData.gateLength,contextData.transpose);
		default:
			throw haxe_Exception.thrown("Unknown code: " + code);
		}
	}
	,__class__: DeserializationHelper
};
var LineGenerator = $hxClasses["LineGenerator"] = $hx_exports["LineGenerator"] = function(timeManipulator,seq,rhythmGenerator,instrumentContext) {
	this.timeManipulator = timeManipulator;
	this.seq = seq;
	this.rhythmGenerator = rhythmGenerator;
	this.instrumentContext = instrumentContext;
	this.cachedNotes = null;
	this.lastNoteIndex = -1;
	this.lastNoteValue = -1;
};
LineGenerator.__name__ = "LineGenerator";
LineGenerator.__interfaces__ = [ILineGenerator];
LineGenerator.create = function(timeManipulator,seq,rhythmGenerator,instrumentContext) {
	return new LineGenerator(timeManipulator,seq,rhythmGenerator,instrumentContext);
};
LineGenerator.createFromPattern = function(timeManipulator,seq,pattern,instrumentContext) {
	var rhythmGenerator = RhythmLanguage.makeRhythmGenerator(pattern);
	if(rhythmGenerator.parseFailed()) {
		throw haxe_Exception.thrown("Invalid rhythm pattern: \"" + pattern + "\"");
	}
	return LineGenerator.create(timeManipulator,seq,rhythmGenerator,instrumentContext);
};
LineGenerator.prototype = {
	timeManipulator: null
	,seq: null
	,rhythmGenerator: null
	,instrumentContext: null
	,cachedNotes: null
	,lastNoteIndex: null
	,lastNoteValue: null
	,selectNotesFromChord: function(selector,chordThing) {
		switch(selector._hx_index) {
		case 0:
			var chord = chordThing.generateChordNotes();
			this.lastNoteIndex = this.lastNoteIndex == -1 ? 0 : (this.lastNoteIndex + 1) % chord.length;
			this.lastNoteValue = chord[this.lastNoteIndex];
			return [this.lastNoteValue];
		case 1:
			var chord = chordThing.generateChordNotes();
			this.lastNoteIndex = this.lastNoteIndex == -1 ? chord.length - 1 : (this.lastNoteIndex - 1 + chord.length) % chord.length;
			this.lastNoteValue = chord[this.lastNoteIndex];
			return [this.lastNoteValue];
		case 2:
			if(this.lastNoteValue == -1) {
				var chord = chordThing.generateChordNotes();
				this.lastNoteIndex = 0;
				this.lastNoteValue = chord[0];
			}
			return [this.lastNoteValue];
		case 3:
			return chordThing.generateChordNotes();
		case 4:
			var chord = chordThing.generateChordNotes();
			this.lastNoteIndex = Math.floor(Math.random() * chord.length) | 0;
			this.lastNoteValue = chord[this.lastNoteIndex];
			return [this.lastNoteValue];
		case 5:
			var mode = chordThing.get_mode();
			var degree = Math.floor(Math.random() * 7) + 1 | 0;
			this.lastNoteValue = mode.nth_from(chordThing.key,degree);
			return [this.lastNoteValue];
		case 6:
			var n = selector.n;
			var chord = chordThing.generateChordNotes();
			this.lastNoteIndex = Math.min(n - 1,chord.length - 1) | 0;
			this.lastNoteValue = chord[this.lastNoteIndex];
			return [this.lastNoteValue];
		case 7:
			return [];
		case 8:
			var chord = chordThing.generateChordNotes();
			this.lastNoteIndex = chord.length - 1;
			this.lastNoteValue = chord[this.lastNoteIndex];
			return [this.lastNoteValue];
		case 9:
			var n = selector.n;
			if(n < 1 || n > 7) {
				return [];
			} else {
				var mode = chordThing.get_mode();
				this.lastNoteValue = mode.nth_from(chordThing.key,n);
				return [this.lastNoteValue];
			}
			break;
		}
	}
	,generateCachedNotes: function() {
		var notes = [];
		var currentTime = 0.0;
		var totalSteps = this.rhythmGenerator.getTotalSteps();
		var stepSize = this.timeManipulator.chordTicks / totalSteps;
		var _g = 0;
		var _g1 = this.seq.toChordThings();
		while(_g < _g1.length) {
			var ct = _g1[_g];
			++_g;
			this.lastNoteIndex = -1;
			this.lastNoteValue = -1;
			this.rhythmGenerator.reset();
			var _g2 = 0;
			var _g3 = totalSteps;
			while(_g2 < _g3) {
				var step = _g2++;
				var selector = this.rhythmGenerator.next();
				if(selector != SelectorType.Rest) {
					var notesToAdd = this.selectNotesFromChord(selector,ct);
					var _g4 = 0;
					while(_g4 < notesToAdd.length) {
						var note = notesToAdd[_g4];
						++_g4;
						notes.push(this.instrumentContext.makeNote(note,currentTime,stepSize));
					}
				}
				currentTime += stepSize;
			}
		}
		return notes;
	}
	,getPitches: function() {
		var pitches = [];
		var _g = 0;
		var _g1 = this.cachedNotes;
		while(_g < _g1.length) {
			var note = _g1[_g];
			++_g;
			pitches.push(note.getMidiNoteValue());
		}
		return pitches;
	}
	,getDurations: function() {
		var durations = [];
		if(this.cachedNotes.length == 0) {
			return durations;
		}
		var _g = 0;
		var _g1 = this.cachedNotes.length - 1;
		while(_g < _g1) {
			var i = _g++;
			var currentNote = this.cachedNotes[i];
			var nextNote = this.cachedNotes[i + 1];
			var duration = nextNote.getStartTime() - currentNote.getStartTime();
			durations.push(duration);
		}
		durations.push(this.cachedNotes[this.cachedNotes.length - 1].getLength());
		return durations;
	}
	,generateNotes: function(startTime) {
		if(this.cachedNotes == null) {
			this.cachedNotes = this.generateCachedNotes();
		}
		return this.cachedNotes;
	}
	,notesInSeconds: function(startTime) {
		var tickNotes = this.generateNotes(startTime);
		var secondsPerTick = 60.0 / (this.timeManipulator.getBPM() * this.timeManipulator.getPPQ());
		var result = [];
		var _g = 0;
		while(_g < tickNotes.length) {
			var n = tickNotes[_g];
			++_g;
			result.push(this.instrumentContext.makeNote(n.getMidiNoteValue(),n.getStartTime() * secondsPerTick,n.getLength() * secondsPerTick));
		}
		return result;
	}
	,__class__: LineGenerator
};
var ValueType = $hxEnums["ValueType"] = { __ename__:"ValueType",__constructs__:null
	,TNull: {_hx_name:"TNull",_hx_index:0,__enum__:"ValueType",toString:$estr}
	,TInt: {_hx_name:"TInt",_hx_index:1,__enum__:"ValueType",toString:$estr}
	,TFloat: {_hx_name:"TFloat",_hx_index:2,__enum__:"ValueType",toString:$estr}
	,TBool: {_hx_name:"TBool",_hx_index:3,__enum__:"ValueType",toString:$estr}
	,TObject: {_hx_name:"TObject",_hx_index:4,__enum__:"ValueType",toString:$estr}
	,TFunction: {_hx_name:"TFunction",_hx_index:5,__enum__:"ValueType",toString:$estr}
	,TClass: ($_=function(c) { return {_hx_index:6,c:c,__enum__:"ValueType",toString:$estr}; },$_._hx_name="TClass",$_.__params__ = ["c"],$_)
	,TEnum: ($_=function(e) { return {_hx_index:7,e:e,__enum__:"ValueType",toString:$estr}; },$_._hx_name="TEnum",$_.__params__ = ["e"],$_)
	,TUnknown: {_hx_name:"TUnknown",_hx_index:8,__enum__:"ValueType",toString:$estr}
};
ValueType.__constructs__ = [ValueType.TNull,ValueType.TInt,ValueType.TFloat,ValueType.TBool,ValueType.TObject,ValueType.TFunction,ValueType.TClass,ValueType.TEnum,ValueType.TUnknown];
ValueType.__empty_constructs__ = [ValueType.TNull,ValueType.TInt,ValueType.TFloat,ValueType.TBool,ValueType.TObject,ValueType.TFunction,ValueType.TUnknown];
var Type = $hxClasses["Type"] = function() { };
Type.__name__ = "Type";
Type.getClass = function(o) {
	return js_Boot.getClass(o);
};
Type.getEnum = function(o) {
	if(o == null) {
		return null;
	}
	return $hxEnums[o.__enum__];
};
Type.getSuperClass = function(c) {
	return c.__super__;
};
Type.getClassName = function(c) {
	return c.__name__;
};
Type.getEnumName = function(e) {
	return e.__ename__;
};
Type.resolveClass = function(name) {
	return $hxClasses[name];
};
Type.resolveEnum = function(name) {
	return $hxEnums[name];
};
Type.createInstance = function(cl,args) {
	var ctor = Function.prototype.bind.apply(cl,[null].concat(args));
	return new (ctor);
};
Type.createEmptyInstance = function(cl) {
	return Object.create(cl.prototype);
};
Type.createEnum = function(e,constr,params) {
	var f = Reflect.field(e,constr);
	if(f == null) {
		throw haxe_Exception.thrown("No such constructor " + constr);
	}
	if(Reflect.isFunction(f)) {
		if(params == null) {
			throw haxe_Exception.thrown("Constructor " + constr + " need parameters");
		}
		return f.apply(e,params);
	}
	if(params != null && params.length != 0) {
		throw haxe_Exception.thrown("Constructor " + constr + " does not need parameters");
	}
	return f;
};
Type.createEnumIndex = function(e,index,params) {
	var c;
	var _g = e.__constructs__[index];
	if(_g == null) {
		c = null;
	} else {
		var ctor = _g;
		c = ctor._hx_name;
	}
	if(c == null) {
		throw haxe_Exception.thrown(index + " is not a valid enum constructor index");
	}
	return Type.createEnum(e,c,params);
};
Type.getInstanceFields = function(c) {
	var a = [];
	for(var i in c.prototype) a.push(i);
	HxOverrides.remove(a,"__class__");
	HxOverrides.remove(a,"__properties__");
	return a;
};
Type.getClassFields = function(c) {
	var a = Reflect.fields(c);
	HxOverrides.remove(a,"__name__");
	HxOverrides.remove(a,"__interfaces__");
	HxOverrides.remove(a,"__properties__");
	HxOverrides.remove(a,"__super__");
	HxOverrides.remove(a,"__meta__");
	HxOverrides.remove(a,"prototype");
	return a;
};
Type.getEnumConstructs = function(e) {
	var _this = e.__constructs__;
	var result = new Array(_this.length);
	var _g = 0;
	var _g1 = _this.length;
	while(_g < _g1) {
		var i = _g++;
		result[i] = _this[i]._hx_name;
	}
	return result;
};
Type.typeof = function(v) {
	switch(typeof(v)) {
	case "boolean":
		return ValueType.TBool;
	case "function":
		if(v.__name__ || v.__ename__) {
			return ValueType.TObject;
		}
		return ValueType.TFunction;
	case "number":
		if(Math.ceil(v) == v % 2147483648.0) {
			return ValueType.TInt;
		}
		return ValueType.TFloat;
	case "object":
		if(v == null) {
			return ValueType.TNull;
		}
		var e = v.__enum__;
		if(e != null) {
			return ValueType.TEnum($hxEnums[e]);
		}
		var c = js_Boot.getClass(v);
		if(c != null) {
			return ValueType.TClass(c);
		}
		return ValueType.TObject;
	case "string":
		return ValueType.TClass(String);
	case "undefined":
		return ValueType.TNull;
	default:
		return ValueType.TUnknown;
	}
};
Type.enumEq = function(a,b) {
	if(a == b) {
		return true;
	}
	try {
		var e = a.__enum__;
		if(e == null || e != b.__enum__) {
			return false;
		}
		if(a._hx_index != b._hx_index) {
			return false;
		}
		var enm = $hxEnums[e];
		var params = enm.__constructs__[a._hx_index].__params__;
		var _g = 0;
		while(_g < params.length) {
			var f = params[_g];
			++_g;
			if(!Type.enumEq(a[f],b[f])) {
				return false;
			}
		}
	} catch( _g ) {
		haxe_NativeStackTrace.lastError = _g;
		return false;
	}
	return true;
};
Type.enumConstructor = function(e) {
	return $hxEnums[e.__enum__].__constructs__[e._hx_index]._hx_name;
};
Type.enumParameters = function(e) {
	var enm = $hxEnums[e.__enum__];
	var params = enm.__constructs__[e._hx_index].__params__;
	if(params != null) {
		var _g = [];
		var _g1 = 0;
		while(_g1 < params.length) {
			var p = params[_g1];
			++_g1;
			_g.push(e[p]);
		}
		return _g;
	} else {
		return [];
	}
};
Type.enumIndex = function(e) {
	return e._hx_index;
};
Type.allEnums = function(e) {
	return e.__empty_constructs__.slice();
};
var haxe_StackItem = $hxEnums["haxe.StackItem"] = { __ename__:"haxe.StackItem",__constructs__:null
	,CFunction: {_hx_name:"CFunction",_hx_index:0,__enum__:"haxe.StackItem",toString:$estr}
	,Module: ($_=function(m) { return {_hx_index:1,m:m,__enum__:"haxe.StackItem",toString:$estr}; },$_._hx_name="Module",$_.__params__ = ["m"],$_)
	,FilePos: ($_=function(s,file,line,column) { return {_hx_index:2,s:s,file:file,line:line,column:column,__enum__:"haxe.StackItem",toString:$estr}; },$_._hx_name="FilePos",$_.__params__ = ["s","file","line","column"],$_)
	,Method: ($_=function(classname,method) { return {_hx_index:3,classname:classname,method:method,__enum__:"haxe.StackItem",toString:$estr}; },$_._hx_name="Method",$_.__params__ = ["classname","method"],$_)
	,LocalFunction: ($_=function(v) { return {_hx_index:4,v:v,__enum__:"haxe.StackItem",toString:$estr}; },$_._hx_name="LocalFunction",$_.__params__ = ["v"],$_)
};
haxe_StackItem.__constructs__ = [haxe_StackItem.CFunction,haxe_StackItem.Module,haxe_StackItem.FilePos,haxe_StackItem.Method,haxe_StackItem.LocalFunction];
haxe_StackItem.__empty_constructs__ = [haxe_StackItem.CFunction];
var haxe_CallStack = {};
haxe_CallStack.__properties__ = {get_length:"get_length"};
haxe_CallStack.get_length = function(this1) {
	return this1.length;
};
haxe_CallStack.callStack = function() {
	return haxe_NativeStackTrace.toHaxe(haxe_NativeStackTrace.callStack());
};
haxe_CallStack.exceptionStack = function(fullStack) {
	if(fullStack == null) {
		fullStack = false;
	}
	var eStack = haxe_NativeStackTrace.toHaxe(haxe_NativeStackTrace.exceptionStack());
	return fullStack ? eStack : haxe_CallStack.subtract(eStack,haxe_CallStack.callStack());
};
haxe_CallStack.toString = function(stack) {
	var b = new StringBuf();
	var _g = 0;
	var _g1 = stack;
	while(_g < _g1.length) {
		var s = _g1[_g];
		++_g;
		b.b += "\nCalled from ";
		haxe_CallStack.itemToString(b,s);
	}
	return b.b;
};
haxe_CallStack.subtract = function(this1,stack) {
	var startIndex = -1;
	var i = -1;
	while(++i < this1.length) {
		var _g = 0;
		var _g1 = stack.length;
		while(_g < _g1) {
			var j = _g++;
			if(haxe_CallStack.equalItems(this1[i],stack[j])) {
				if(startIndex < 0) {
					startIndex = i;
				}
				++i;
				if(i >= this1.length) {
					break;
				}
			} else {
				startIndex = -1;
			}
		}
		if(startIndex >= 0) {
			break;
		}
	}
	if(startIndex >= 0) {
		return this1.slice(0,startIndex);
	} else {
		return this1;
	}
};
haxe_CallStack.copy = function(this1) {
	return this1.slice();
};
haxe_CallStack.get = function(this1,index) {
	return this1[index];
};
haxe_CallStack.asArray = function(this1) {
	return this1;
};
haxe_CallStack.equalItems = function(item1,item2) {
	if(item1 == null) {
		if(item2 == null) {
			return true;
		} else {
			return false;
		}
	} else {
		switch(item1._hx_index) {
		case 0:
			if(item2 == null) {
				return false;
			} else if(item2._hx_index == 0) {
				return true;
			} else {
				return false;
			}
			break;
		case 1:
			if(item2 == null) {
				return false;
			} else if(item2._hx_index == 1) {
				var m2 = item2.m;
				var m1 = item1.m;
				return m1 == m2;
			} else {
				return false;
			}
			break;
		case 2:
			if(item2 == null) {
				return false;
			} else if(item2._hx_index == 2) {
				var item21 = item2.s;
				var file2 = item2.file;
				var line2 = item2.line;
				var col2 = item2.column;
				var col1 = item1.column;
				var line1 = item1.line;
				var file1 = item1.file;
				var item11 = item1.s;
				if(file1 == file2 && line1 == line2 && col1 == col2) {
					return haxe_CallStack.equalItems(item11,item21);
				} else {
					return false;
				}
			} else {
				return false;
			}
			break;
		case 3:
			if(item2 == null) {
				return false;
			} else if(item2._hx_index == 3) {
				var class2 = item2.classname;
				var method2 = item2.method;
				var method1 = item1.method;
				var class1 = item1.classname;
				if(class1 == class2) {
					return method1 == method2;
				} else {
					return false;
				}
			} else {
				return false;
			}
			break;
		case 4:
			if(item2 == null) {
				return false;
			} else if(item2._hx_index == 4) {
				var v2 = item2.v;
				var v1 = item1.v;
				return v1 == v2;
			} else {
				return false;
			}
			break;
		}
	}
};
haxe_CallStack.exceptionToString = function(e) {
	if(e.get_previous() == null) {
		var tmp = "Exception: " + e.toString();
		var tmp1 = e.get_stack();
		return tmp + (tmp1 == null ? "null" : haxe_CallStack.toString(tmp1));
	}
	var result = "";
	var e1 = e;
	var prev = null;
	while(e1 != null) {
		if(prev == null) {
			var result1 = "Exception: " + e1.get_message();
			var tmp = e1.get_stack();
			result = result1 + (tmp == null ? "null" : haxe_CallStack.toString(tmp)) + result;
		} else {
			var prevStack = haxe_CallStack.subtract(e1.get_stack(),prev.get_stack());
			result = "Exception: " + e1.get_message() + (prevStack == null ? "null" : haxe_CallStack.toString(prevStack)) + "\n\nNext " + result;
		}
		prev = e1;
		e1 = e1.get_previous();
	}
	return result;
};
haxe_CallStack.itemToString = function(b,s) {
	switch(s._hx_index) {
	case 0:
		b.b += "a C function";
		break;
	case 1:
		var m = s.m;
		b.b += "module ";
		b.b += m == null ? "null" : "" + m;
		break;
	case 2:
		var s1 = s.s;
		var file = s.file;
		var line = s.line;
		var col = s.column;
		if(s1 != null) {
			haxe_CallStack.itemToString(b,s1);
			b.b += " (";
		}
		b.b += file == null ? "null" : "" + file;
		b.b += " line ";
		b.b += line == null ? "null" : "" + line;
		if(col != null) {
			b.b += " column ";
			b.b += col == null ? "null" : "" + col;
		}
		if(s1 != null) {
			b.b += ")";
		}
		break;
	case 3:
		var cname = s.classname;
		var meth = s.method;
		b.b += Std.string(cname == null ? "<unknown>" : cname);
		b.b += ".";
		b.b += meth == null ? "null" : "" + meth;
		break;
	case 4:
		var n = s.v;
		b.b += "local function #";
		b.b += n == null ? "null" : "" + n;
		break;
	}
};
var haxe_IMap = $hxClasses["haxe.IMap"] = function() { };
haxe_IMap.__name__ = "haxe.IMap";
haxe_IMap.__isInterface__ = true;
haxe_IMap.prototype = {
	get: null
	,set: null
	,exists: null
	,remove: null
	,keys: null
	,iterator: null
	,keyValueIterator: null
	,copy: null
	,toString: null
	,clear: null
	,__class__: haxe_IMap
};
var haxe_DynamicAccess = {};
haxe_DynamicAccess._new = function() {
	var this1 = { };
	return this1;
};
haxe_DynamicAccess.get = function(this1,key) {
	return this1[key];
};
haxe_DynamicAccess.set = function(this1,key,value) {
	return this1[key] = value;
};
haxe_DynamicAccess.exists = function(this1,key) {
	return Object.prototype.hasOwnProperty.call(this1,key);
};
haxe_DynamicAccess.remove = function(this1,key) {
	return Reflect.deleteField(this1,key);
};
haxe_DynamicAccess.keys = function(this1) {
	return Reflect.fields(this1);
};
haxe_DynamicAccess.copy = function(this1) {
	return Reflect.copy(this1);
};
haxe_DynamicAccess.iterator = function(this1) {
	return new haxe_iterators_DynamicAccessIterator(this1);
};
haxe_DynamicAccess.keyValueIterator = function(this1) {
	return new haxe_iterators_DynamicAccessKeyValueIterator(this1);
};
var haxe_Exception = $hxClasses["haxe.Exception"] = function(message,previous,native) {
	Error.call(this,message);
	this.message = message;
	this.__previousException = previous;
	this.__nativeException = native != null ? native : this;
	this.__skipStack = 0;
	var old = Error.prepareStackTrace;
	Error.prepareStackTrace = function(e) { return e.stack; }
	if(((native) instanceof Error)) {
		this.stack = native.stack;
	} else {
		var e = null;
		if(Error.captureStackTrace) {
			Error.captureStackTrace(this,haxe_Exception);
			e = this;
		} else {
			e = new Error();
			if(typeof(e.stack) == "undefined") {
				try { throw e; } catch(_) {}
				this.__skipStack++;
			}
		}
		this.stack = e.stack;
	}
	Error.prepareStackTrace = old;
};
haxe_Exception.__name__ = "haxe.Exception";
haxe_Exception.caught = function(value) {
	if(((value) instanceof haxe_Exception)) {
		return value;
	} else if(((value) instanceof Error)) {
		return new haxe_Exception(value.message,null,value);
	} else {
		return new haxe_ValueException(value,null,value);
	}
};
haxe_Exception.thrown = function(value) {
	if(((value) instanceof haxe_Exception)) {
		return value.get_native();
	} else if(((value) instanceof Error)) {
		return value;
	} else {
		var e = new haxe_ValueException(value);
		e.__skipStack++;
		return e;
	}
};
haxe_Exception.__super__ = Error;
haxe_Exception.prototype = $extend(Error.prototype,{
	__skipStack: null
	,__nativeException: null
	,__previousException: null
	,unwrap: function() {
		return this.__nativeException;
	}
	,toString: function() {
		return this.get_message();
	}
	,details: function() {
		if(this.get_previous() == null) {
			var tmp = "Exception: " + this.toString();
			var tmp1 = this.get_stack();
			return tmp + (tmp1 == null ? "null" : haxe_CallStack.toString(tmp1));
		} else {
			var result = "";
			var e = this;
			var prev = null;
			while(e != null) {
				if(prev == null) {
					var result1 = "Exception: " + e.get_message();
					var tmp = e.get_stack();
					result = result1 + (tmp == null ? "null" : haxe_CallStack.toString(tmp)) + result;
				} else {
					var prevStack = haxe_CallStack.subtract(e.get_stack(),prev.get_stack());
					result = "Exception: " + e.get_message() + (prevStack == null ? "null" : haxe_CallStack.toString(prevStack)) + "\n\nNext " + result;
				}
				prev = e;
				e = e.get_previous();
			}
			return result;
		}
	}
	,__shiftStack: function() {
		this.__skipStack++;
	}
	,get_message: function() {
		return this.message;
	}
	,get_previous: function() {
		return this.__previousException;
	}
	,get_native: function() {
		return this.__nativeException;
	}
	,get_stack: function() {
		var _g = this.__exceptionStack;
		if(_g == null) {
			var value = haxe_NativeStackTrace.toHaxe(haxe_NativeStackTrace.normalize(this.stack),this.__skipStack);
			this.setProperty("__exceptionStack",value);
			return value;
		} else {
			var s = _g;
			return s;
		}
	}
	,setProperty: function(name,value) {
		try {
			Object.defineProperty(this,name,{ value : value});
		} catch( _g ) {
			this[name] = value;
		}
	}
	,get___exceptionStack: function() {
		return this.__exceptionStack;
	}
	,set___exceptionStack: function(value) {
		this.setProperty("__exceptionStack",value);
		return value;
	}
	,get___skipStack: function() {
		return this.__skipStack;
	}
	,set___skipStack: function(value) {
		this.setProperty("__skipStack",value);
		return value;
	}
	,get___nativeException: function() {
		return this.__nativeException;
	}
	,set___nativeException: function(value) {
		this.setProperty("__nativeException",value);
		return value;
	}
	,get___previousException: function() {
		return this.__previousException;
	}
	,set___previousException: function(value) {
		this.setProperty("__previousException",value);
		return value;
	}
	,__class__: haxe_Exception
	,__properties__: {set___exceptionStack:"set___exceptionStack",get___exceptionStack:"get___exceptionStack",get_native:"get_native",get_previous:"get_previous",get_stack:"get_stack",get_message:"get_message"}
});
var haxe_Log = $hxClasses["haxe.Log"] = function() { };
haxe_Log.__name__ = "haxe.Log";
haxe_Log.formatOutput = function(v,infos) {
	var str = Std.string(v);
	if(infos == null) {
		return str;
	}
	var pstr = infos.fileName + ":" + infos.lineNumber;
	if(infos.customParams != null) {
		var _g = 0;
		var _g1 = infos.customParams;
		while(_g < _g1.length) {
			var v = _g1[_g];
			++_g;
			str += ", " + Std.string(v);
		}
	}
	return pstr + ": " + str;
};
haxe_Log.trace = function(v,infos) {
	var str = haxe_Log.formatOutput(v,infos);
	if(typeof(console) != "undefined" && console.log != null) {
		console.log(str);
	}
};
var haxe_NativeStackTrace = $hxClasses["haxe.NativeStackTrace"] = function() { };
haxe_NativeStackTrace.__name__ = "haxe.NativeStackTrace";
haxe_NativeStackTrace.lastError = null;
haxe_NativeStackTrace.wrapCallSite = null;
haxe_NativeStackTrace.saveStack = function(e) {
	haxe_NativeStackTrace.lastError = e;
};
haxe_NativeStackTrace.callStack = function() {
	var e = new Error("");
	var stack = haxe_NativeStackTrace.tryHaxeStack(e);
	if(typeof(stack) == "undefined") {
		try {
			throw e;
		} catch( _g ) {
		}
		stack = e.stack;
	}
	return haxe_NativeStackTrace.normalize(stack,2);
};
haxe_NativeStackTrace.exceptionStack = function() {
	return haxe_NativeStackTrace.normalize(haxe_NativeStackTrace.tryHaxeStack(haxe_NativeStackTrace.lastError));
};
haxe_NativeStackTrace.toHaxe = function(s,skip) {
	if(skip == null) {
		skip = 0;
	}
	if(s == null) {
		return [];
	} else if(typeof(s) == "string") {
		var stack = s.split("\n");
		if(stack[0] == "Error") {
			stack.shift();
		}
		var m = [];
		var _g = 0;
		var _g1 = stack.length;
		while(_g < _g1) {
			var i = _g++;
			if(skip > i) {
				continue;
			}
			var line = stack[i];
			var matched = line.match(/^    at ([A-Za-z0-9_. ]+) \(([^)]+):([0-9]+):([0-9]+)\)$/);
			if(matched != null) {
				var path = matched[1].split(".");
				if(path[0] == "$hxClasses") {
					path.shift();
				}
				var meth = path.pop();
				var file = matched[2];
				var line1 = Std.parseInt(matched[3]);
				var column = Std.parseInt(matched[4]);
				m.push(haxe_StackItem.FilePos(meth == "Anonymous function" ? haxe_StackItem.LocalFunction() : meth == "Global code" ? null : haxe_StackItem.Method(path.join("."),meth),file,line1,column));
			} else {
				m.push(haxe_StackItem.Module(StringTools.trim(line)));
			}
		}
		return m;
	} else if(skip > 0 && Array.isArray(s)) {
		return s.slice(skip);
	} else {
		return s;
	}
};
haxe_NativeStackTrace.tryHaxeStack = function(e) {
	if(e == null) {
		return [];
	}
	var oldValue = Error.prepareStackTrace;
	Error.prepareStackTrace = haxe_NativeStackTrace.prepareHxStackTrace;
	var stack = e.stack;
	Error.prepareStackTrace = oldValue;
	return stack;
};
haxe_NativeStackTrace.prepareHxStackTrace = function(e,callsites) {
	var stack = [];
	var _g = 0;
	while(_g < callsites.length) {
		var site = callsites[_g];
		++_g;
		if(haxe_NativeStackTrace.wrapCallSite != null) {
			site = haxe_NativeStackTrace.wrapCallSite(site);
		}
		var method = null;
		var fullName = site.getFunctionName();
		if(fullName != null) {
			var idx = fullName.lastIndexOf(".");
			if(idx >= 0) {
				var className = fullName.substring(0,idx);
				var methodName = fullName.substring(idx + 1);
				method = haxe_StackItem.Method(className,methodName);
			} else {
				method = haxe_StackItem.Method(null,fullName);
			}
		}
		var fileName = site.getFileName();
		var fileAddr = fileName == null ? -1 : fileName.indexOf("file:");
		if(haxe_NativeStackTrace.wrapCallSite != null && fileAddr > 0) {
			fileName = fileName.substring(fileAddr + 6);
		}
		stack.push(haxe_StackItem.FilePos(method,fileName,site.getLineNumber(),site.getColumnNumber()));
	}
	return stack;
};
haxe_NativeStackTrace.normalize = function(stack,skipItems) {
	if(skipItems == null) {
		skipItems = 0;
	}
	if(Array.isArray(stack) && skipItems > 0) {
		return stack.slice(skipItems);
	} else if(typeof(stack) == "string") {
		switch(stack.substring(0,6)) {
		case "Error\n":case "Error:":
			++skipItems;
			break;
		default:
		}
		return haxe_NativeStackTrace.skipLines(stack,skipItems);
	} else {
		return stack;
	}
};
haxe_NativeStackTrace.skipLines = function(stack,skip,pos) {
	if(pos == null) {
		pos = 0;
	}
	if(skip > 0) {
		pos = stack.indexOf("\n",pos);
		if(pos < 0) {
			return "";
		} else {
			return haxe_NativeStackTrace.skipLines(stack,--skip,pos + 1);
		}
	} else {
		return stack.substring(pos);
	}
};
var haxe_Rest = {};
haxe_Rest.__properties__ = {get_length:"get_length"};
haxe_Rest.get_length = function(this1) {
	return this1.length;
};
haxe_Rest.of = function(array) {
	var this1 = array;
	return this1;
};
haxe_Rest._new = function(array) {
	var this1 = array;
	return this1;
};
haxe_Rest.get = function(this1,index) {
	return this1[index];
};
haxe_Rest.toArray = function(this1) {
	return this1.slice();
};
haxe_Rest.iterator = function(this1) {
	return new haxe_iterators_RestIterator(this1);
};
haxe_Rest.keyValueIterator = function(this1) {
	return new haxe_iterators_RestKeyValueIterator(this1);
};
haxe_Rest.append = function(this1,item) {
	var result = this1.slice();
	result.push(item);
	var this1 = result;
	return this1;
};
haxe_Rest.prepend = function(this1,item) {
	var result = this1.slice();
	result.unshift(item);
	var this1 = result;
	return this1;
};
haxe_Rest.toString = function(this1) {
	return "[" + this1.toString() + "]";
};
var haxe_ValueException = $hxClasses["haxe.ValueException"] = function(value,previous,native) {
	haxe_Exception.call(this,String(value),previous,native);
	this.value = value;
	this.__skipStack++;
};
haxe_ValueException.__name__ = "haxe.ValueException";
haxe_ValueException.__super__ = haxe_Exception;
haxe_ValueException.prototype = $extend(haxe_Exception.prototype,{
	value: null
	,unwrap: function() {
		return this.value;
	}
	,__class__: haxe_ValueException
});
var haxe_ds_BalancedTree = $hxClasses["haxe.ds.BalancedTree"] = function() {
};
haxe_ds_BalancedTree.__name__ = "haxe.ds.BalancedTree";
haxe_ds_BalancedTree.__interfaces__ = [haxe_IMap];
haxe_ds_BalancedTree.iteratorLoop = function(node,acc) {
	if(node != null) {
		haxe_ds_BalancedTree.iteratorLoop(node.left,acc);
		acc.push(node.value);
		haxe_ds_BalancedTree.iteratorLoop(node.right,acc);
	}
};
haxe_ds_BalancedTree.prototype = {
	root: null
	,set: function(key,value) {
		this.root = this.setLoop(key,value,this.root);
	}
	,get: function(key) {
		var node = this.root;
		while(node != null) {
			var c = this.compare(key,node.key);
			if(c == 0) {
				return node.value;
			}
			if(c < 0) {
				node = node.left;
			} else {
				node = node.right;
			}
		}
		return null;
	}
	,remove: function(key) {
		try {
			this.root = this.removeLoop(key,this.root);
			return true;
		} catch( _g ) {
			haxe_NativeStackTrace.lastError = _g;
			if(typeof(haxe_Exception.caught(_g).unwrap()) == "string") {
				return false;
			} else {
				throw _g;
			}
		}
	}
	,exists: function(key) {
		var node = this.root;
		while(node != null) {
			var c = this.compare(key,node.key);
			if(c == 0) {
				return true;
			} else if(c < 0) {
				node = node.left;
			} else {
				node = node.right;
			}
		}
		return false;
	}
	,iterator: function() {
		var ret = [];
		haxe_ds_BalancedTree.iteratorLoop(this.root,ret);
		return new haxe_iterators_ArrayIterator(ret);
	}
	,keyValueIterator: function() {
		return new haxe_iterators_MapKeyValueIterator(this);
	}
	,keys: function() {
		var ret = [];
		this.keysLoop(this.root,ret);
		return new haxe_iterators_ArrayIterator(ret);
	}
	,copy: function() {
		var copied = new haxe_ds_BalancedTree();
		copied.root = this.root;
		return copied;
	}
	,setLoop: function(k,v,node) {
		if(node == null) {
			return new haxe_ds_TreeNode(null,k,v,null);
		}
		var c = this.compare(k,node.key);
		if(c == 0) {
			return new haxe_ds_TreeNode(node.left,k,v,node.right,node == null ? 0 : node._height);
		} else if(c < 0) {
			var nl = this.setLoop(k,v,node.left);
			return this.balance(nl,node.key,node.value,node.right);
		} else {
			var nr = this.setLoop(k,v,node.right);
			return this.balance(node.left,node.key,node.value,nr);
		}
	}
	,removeLoop: function(k,node) {
		if(node == null) {
			throw haxe_Exception.thrown("Not_found");
		}
		var c = this.compare(k,node.key);
		if(c == 0) {
			return this.merge(node.left,node.right);
		} else if(c < 0) {
			return this.balance(this.removeLoop(k,node.left),node.key,node.value,node.right);
		} else {
			return this.balance(node.left,node.key,node.value,this.removeLoop(k,node.right));
		}
	}
	,keysLoop: function(node,acc) {
		if(node != null) {
			this.keysLoop(node.left,acc);
			acc.push(node.key);
			this.keysLoop(node.right,acc);
		}
	}
	,merge: function(t1,t2) {
		if(t1 == null) {
			return t2;
		}
		if(t2 == null) {
			return t1;
		}
		var t = this.minBinding(t2);
		return this.balance(t1,t.key,t.value,this.removeMinBinding(t2));
	}
	,minBinding: function(t) {
		if(t == null) {
			throw haxe_Exception.thrown("Not_found");
		} else if(t.left == null) {
			return t;
		} else {
			return this.minBinding(t.left);
		}
	}
	,removeMinBinding: function(t) {
		if(t.left == null) {
			return t.right;
		} else {
			return this.balance(this.removeMinBinding(t.left),t.key,t.value,t.right);
		}
	}
	,balance: function(l,k,v,r) {
		var hl = l == null ? 0 : l._height;
		var hr = r == null ? 0 : r._height;
		if(hl > hr + 2) {
			var _this = l.left;
			var _this1 = l.right;
			if((_this == null ? 0 : _this._height) >= (_this1 == null ? 0 : _this1._height)) {
				return new haxe_ds_TreeNode(l.left,l.key,l.value,new haxe_ds_TreeNode(l.right,k,v,r));
			} else {
				return new haxe_ds_TreeNode(new haxe_ds_TreeNode(l.left,l.key,l.value,l.right.left),l.right.key,l.right.value,new haxe_ds_TreeNode(l.right.right,k,v,r));
			}
		} else if(hr > hl + 2) {
			var _this = r.right;
			var _this1 = r.left;
			if((_this == null ? 0 : _this._height) > (_this1 == null ? 0 : _this1._height)) {
				return new haxe_ds_TreeNode(new haxe_ds_TreeNode(l,k,v,r.left),r.key,r.value,r.right);
			} else {
				return new haxe_ds_TreeNode(new haxe_ds_TreeNode(l,k,v,r.left.left),r.left.key,r.left.value,new haxe_ds_TreeNode(r.left.right,r.key,r.value,r.right));
			}
		} else {
			return new haxe_ds_TreeNode(l,k,v,r,(hl > hr ? hl : hr) + 1);
		}
	}
	,compare: function(k1,k2) {
		return Reflect.compare(k1,k2);
	}
	,toString: function() {
		if(this.root == null) {
			return "{}";
		} else {
			return "{" + this.root.toString() + "}";
		}
	}
	,clear: function() {
		this.root = null;
	}
	,__class__: haxe_ds_BalancedTree
};
var haxe_ds_TreeNode = $hxClasses["haxe.ds.TreeNode"] = function(l,k,v,r,h) {
	if(h == null) {
		h = -1;
	}
	this.left = l;
	this.key = k;
	this.value = v;
	this.right = r;
	if(h == -1) {
		var tmp;
		var _this = this.left;
		var _this1 = this.right;
		if((_this == null ? 0 : _this._height) > (_this1 == null ? 0 : _this1._height)) {
			var _this = this.left;
			tmp = _this == null ? 0 : _this._height;
		} else {
			var _this = this.right;
			tmp = _this == null ? 0 : _this._height;
		}
		this._height = tmp + 1;
	} else {
		this._height = h;
	}
};
haxe_ds_TreeNode.__name__ = "haxe.ds.TreeNode";
haxe_ds_TreeNode.prototype = {
	left: null
	,right: null
	,key: null
	,value: null
	,_height: null
	,toString: function() {
		return (this.left == null ? "" : this.left.toString() + ", ") + ("" + Std.string(this.key) + "=" + Std.string(this.value)) + (this.right == null ? "" : ", " + this.right.toString());
	}
	,__class__: haxe_ds_TreeNode
};
var haxe_ds_EnumValueMap = $hxClasses["haxe.ds.EnumValueMap"] = function() {
	haxe_ds_BalancedTree.call(this);
};
haxe_ds_EnumValueMap.__name__ = "haxe.ds.EnumValueMap";
haxe_ds_EnumValueMap.__interfaces__ = [haxe_IMap];
haxe_ds_EnumValueMap.__super__ = haxe_ds_BalancedTree;
haxe_ds_EnumValueMap.prototype = $extend(haxe_ds_BalancedTree.prototype,{
	compare: function(k1,k2) {
		var d = k1._hx_index - k2._hx_index;
		if(d != 0) {
			return d;
		}
		var p1 = Type.enumParameters(k1);
		var p2 = Type.enumParameters(k2);
		if(p1.length == 0 && p2.length == 0) {
			return 0;
		}
		return this.compareArgs(p1,p2);
	}
	,compareArgs: function(a1,a2) {
		var ld = a1.length - a2.length;
		if(ld != 0) {
			return ld;
		}
		var _g = 0;
		var _g1 = a1.length;
		while(_g < _g1) {
			var i = _g++;
			var d = this.compareArg(a1[i],a2[i]);
			if(d != 0) {
				return d;
			}
		}
		return 0;
	}
	,compareArg: function(v1,v2) {
		if(Reflect.isEnumValue(v1) && Reflect.isEnumValue(v2)) {
			return this.compare(v1,v2);
		} else if(((v1) instanceof Array) && ((v2) instanceof Array)) {
			return this.compareArgs(v1,v2);
		} else {
			return Reflect.compare(v1,v2);
		}
	}
	,copy: function() {
		var copied = new haxe_ds_EnumValueMap();
		copied.root = this.root;
		return copied;
	}
	,__class__: haxe_ds_EnumValueMap
});
var haxe_ds_HashMap = {};
haxe_ds_HashMap._new = function() {
	var this1 = new haxe_ds__$HashMap_HashMapData();
	return this1;
};
haxe_ds_HashMap.set = function(this1,k,v) {
	var _this = this1.keys;
	var key = k.hashCode();
	_this.h[key] = k;
	var _this = this1.values;
	var key = k.hashCode();
	_this.h[key] = v;
};
haxe_ds_HashMap.get = function(this1,k) {
	var _this = this1.values;
	var key = k.hashCode();
	return _this.h[key];
};
haxe_ds_HashMap.exists = function(this1,k) {
	var _this = this1.values;
	var key = k.hashCode();
	return _this.h.hasOwnProperty(key);
};
haxe_ds_HashMap.remove = function(this1,k) {
	this1.values.remove(k.hashCode());
	return this1.keys.remove(k.hashCode());
};
haxe_ds_HashMap.keys = function(this1) {
	return this1.keys.iterator();
};
haxe_ds_HashMap.copy = function(this1) {
	var copied = new haxe_ds__$HashMap_HashMapData();
	copied.keys = this1.keys.copy();
	copied.values = this1.values.copy();
	return copied;
};
haxe_ds_HashMap.iterator = function(this1) {
	return this1.values.iterator();
};
haxe_ds_HashMap.keyValueIterator = function(this1) {
	return new haxe_iterators_HashMapKeyValueIterator(this1);
};
haxe_ds_HashMap.clear = function(this1) {
	this1.keys.h = { };
	this1.values.h = { };
};
var haxe_ds__$HashMap_HashMapData = $hxClasses["haxe.ds._HashMap.HashMapData"] = function() {
	this.keys = new haxe_ds_IntMap();
	this.values = new haxe_ds_IntMap();
};
haxe_ds__$HashMap_HashMapData.__name__ = "haxe.ds._HashMap.HashMapData";
haxe_ds__$HashMap_HashMapData.prototype = {
	keys: null
	,values: null
	,__class__: haxe_ds__$HashMap_HashMapData
};
var haxe_ds_IntMap = $hxClasses["haxe.ds.IntMap"] = function() {
	this.h = { };
};
haxe_ds_IntMap.__name__ = "haxe.ds.IntMap";
haxe_ds_IntMap.__interfaces__ = [haxe_IMap];
haxe_ds_IntMap.prototype = {
	h: null
	,set: function(key,value) {
		this.h[key] = value;
	}
	,get: function(key) {
		return this.h[key];
	}
	,exists: function(key) {
		return this.h.hasOwnProperty(key);
	}
	,remove: function(key) {
		if(!this.h.hasOwnProperty(key)) {
			return false;
		}
		delete(this.h[key]);
		return true;
	}
	,keys: function() {
		var a = [];
		for( var key in this.h ) if(this.h.hasOwnProperty(key)) a.push(+key);
		return new haxe_iterators_ArrayIterator(a);
	}
	,iterator: function() {
		return { ref : this.h, it : this.keys(), hasNext : function() {
			return this.it.hasNext();
		}, next : function() {
			var i = this.it.next();
			return this.ref[i];
		}};
	}
	,keyValueIterator: function() {
		return new haxe_iterators_MapKeyValueIterator(this);
	}
	,copy: function() {
		var copied = new haxe_ds_IntMap();
		var key = this.keys();
		while(key.hasNext()) {
			var key1 = key.next();
			copied.h[key1] = this.h[key1];
		}
		return copied;
	}
	,toString: function() {
		var s_b = "";
		s_b += "{";
		var it = this.keys();
		var i = it;
		while(i.hasNext()) {
			var i1 = i.next();
			s_b += i1 == null ? "null" : "" + i1;
			s_b += " => ";
			s_b += Std.string(Std.string(this.h[i1]));
			if(it.hasNext()) {
				s_b += ", ";
			}
		}
		s_b += "}";
		return s_b;
	}
	,clear: function() {
		this.h = { };
	}
	,__class__: haxe_ds_IntMap
};
var haxe_ds_ObjectMap = $hxClasses["haxe.ds.ObjectMap"] = function() {
	this.h = { __keys__ : { }};
};
haxe_ds_ObjectMap.__name__ = "haxe.ds.ObjectMap";
haxe_ds_ObjectMap.__interfaces__ = [haxe_IMap];
haxe_ds_ObjectMap.count = null;
haxe_ds_ObjectMap.assignId = function(obj) {
	return (obj.__id__ = $global.$haxeUID++);
};
haxe_ds_ObjectMap.getId = function(obj) {
	return obj.__id__;
};
haxe_ds_ObjectMap.prototype = {
	h: null
	,set: function(key,value) {
		var id = key.__id__;
		if(id == null) {
			id = (key.__id__ = $global.$haxeUID++);
		}
		this.h[id] = value;
		this.h.__keys__[id] = key;
	}
	,get: function(key) {
		return this.h[key.__id__];
	}
	,exists: function(key) {
		return this.h.__keys__[key.__id__] != null;
	}
	,remove: function(key) {
		var id = key.__id__;
		if(this.h.__keys__[id] == null) {
			return false;
		}
		delete(this.h[id]);
		delete(this.h.__keys__[id]);
		return true;
	}
	,keys: function() {
		var a = [];
		for( var key in this.h.__keys__ ) {
		if(this.h.hasOwnProperty(key)) {
			a.push(this.h.__keys__[key]);
		}
		}
		return new haxe_iterators_ArrayIterator(a);
	}
	,iterator: function() {
		return { ref : this.h, it : this.keys(), hasNext : function() {
			return this.it.hasNext();
		}, next : function() {
			var i = this.it.next();
			return this.ref[i.__id__];
		}};
	}
	,keyValueIterator: function() {
		return new haxe_iterators_MapKeyValueIterator(this);
	}
	,copy: function() {
		var copied = new haxe_ds_ObjectMap();
		var key = this.keys();
		while(key.hasNext()) {
			var key1 = key.next();
			copied.set(key1,this.h[key1.__id__]);
		}
		return copied;
	}
	,toString: function() {
		var s_b = "";
		s_b += "{";
		var it = this.keys();
		var i = it;
		while(i.hasNext()) {
			var i1 = i.next();
			s_b += Std.string(Std.string(i1));
			s_b += " => ";
			s_b += Std.string(Std.string(this.h[i1.__id__]));
			if(it.hasNext()) {
				s_b += ", ";
			}
		}
		s_b += "}";
		return s_b;
	}
	,clear: function() {
		this.h = { __keys__ : { }};
	}
	,__class__: haxe_ds_ObjectMap
};
var haxe_ds_ReadOnlyArray = {};
haxe_ds_ReadOnlyArray.__properties__ = {get_length:"get_length"};
haxe_ds_ReadOnlyArray.get_length = function(this1) {
	return this1.length;
};
haxe_ds_ReadOnlyArray.get = function(this1,i) {
	return this1[i];
};
haxe_ds_ReadOnlyArray.concat = function(this1,a) {
	return this1.concat(a);
};
var haxe_ds_StringMap = $hxClasses["haxe.ds.StringMap"] = function() {
	this.h = Object.create(null);
};
haxe_ds_StringMap.__name__ = "haxe.ds.StringMap";
haxe_ds_StringMap.__interfaces__ = [haxe_IMap];
haxe_ds_StringMap.createCopy = function(h) {
	var copy = new haxe_ds_StringMap();
	for (var key in h) copy.h[key] = h[key];
	return copy;
};
haxe_ds_StringMap.stringify = function(h) {
	var s = "{";
	var first = true;
	for (var key in h) {
		if (first) first = false; else s += ',';
		s += key + ' => ' + Std.string(h[key]);
	}
	return s + "}";
};
haxe_ds_StringMap.prototype = {
	h: null
	,exists: function(key) {
		return Object.prototype.hasOwnProperty.call(this.h,key);
	}
	,get: function(key) {
		return this.h[key];
	}
	,set: function(key,value) {
		this.h[key] = value;
	}
	,remove: function(key) {
		if(Object.prototype.hasOwnProperty.call(this.h,key)) {
			delete(this.h[key]);
			return true;
		} else {
			return false;
		}
	}
	,keys: function() {
		return new haxe_ds__$StringMap_StringMapKeyIterator(this.h);
	}
	,iterator: function() {
		return new haxe_ds__$StringMap_StringMapValueIterator(this.h);
	}
	,keyValueIterator: function() {
		return new haxe_ds__$StringMap_StringMapKeyValueIterator(this.h);
	}
	,copy: function() {
		return haxe_ds_StringMap.createCopy(this.h);
	}
	,clear: function() {
		this.h = Object.create(null);
	}
	,toString: function() {
		return haxe_ds_StringMap.stringify(this.h);
	}
	,__class__: haxe_ds_StringMap
};
var haxe_ds__$StringMap_StringMapKeyIterator = $hxClasses["haxe.ds._StringMap.StringMapKeyIterator"] = function(h) {
	this.h = h;
	this.keys = Object.keys(h);
	this.length = this.keys.length;
	this.current = 0;
};
haxe_ds__$StringMap_StringMapKeyIterator.__name__ = "haxe.ds._StringMap.StringMapKeyIterator";
haxe_ds__$StringMap_StringMapKeyIterator.prototype = {
	h: null
	,keys: null
	,length: null
	,current: null
	,hasNext: function() {
		return this.current < this.length;
	}
	,next: function() {
		return this.keys[this.current++];
	}
	,__class__: haxe_ds__$StringMap_StringMapKeyIterator
};
var haxe_ds__$StringMap_StringMapValueIterator = $hxClasses["haxe.ds._StringMap.StringMapValueIterator"] = function(h) {
	this.h = h;
	this.keys = Object.keys(h);
	this.length = this.keys.length;
	this.current = 0;
};
haxe_ds__$StringMap_StringMapValueIterator.__name__ = "haxe.ds._StringMap.StringMapValueIterator";
haxe_ds__$StringMap_StringMapValueIterator.prototype = {
	h: null
	,keys: null
	,length: null
	,current: null
	,hasNext: function() {
		return this.current < this.length;
	}
	,next: function() {
		return this.h[this.keys[this.current++]];
	}
	,__class__: haxe_ds__$StringMap_StringMapValueIterator
};
var haxe_ds__$StringMap_StringMapKeyValueIterator = $hxClasses["haxe.ds._StringMap.StringMapKeyValueIterator"] = function(h) {
	this.h = h;
	this.keys = Object.keys(h);
	this.length = this.keys.length;
	this.current = 0;
};
haxe_ds__$StringMap_StringMapKeyValueIterator.__name__ = "haxe.ds._StringMap.StringMapKeyValueIterator";
haxe_ds__$StringMap_StringMapKeyValueIterator.prototype = {
	h: null
	,keys: null
	,length: null
	,current: null
	,hasNext: function() {
		return this.current < this.length;
	}
	,next: function() {
		var key = this.keys[this.current++];
		return { key : key, value : this.h[key]};
	}
	,__class__: haxe_ds__$StringMap_StringMapKeyValueIterator
};
var haxe_ds_WeakMap = $hxClasses["haxe.ds.WeakMap"] = function() {
	throw new haxe_exceptions_NotImplementedException("Not implemented for this platform",null,{ fileName : "haxe/ds/WeakMap.hx", lineNumber : 39, className : "haxe.ds.WeakMap", methodName : "new"});
};
haxe_ds_WeakMap.__name__ = "haxe.ds.WeakMap";
haxe_ds_WeakMap.__interfaces__ = [haxe_IMap];
haxe_ds_WeakMap.prototype = {
	set: function(key,value) {
	}
	,get: function(key) {
		return null;
	}
	,exists: function(key) {
		return false;
	}
	,remove: function(key) {
		return false;
	}
	,keys: function() {
		return null;
	}
	,iterator: function() {
		return null;
	}
	,keyValueIterator: function() {
		return null;
	}
	,copy: function() {
		return null;
	}
	,toString: function() {
		return null;
	}
	,clear: function() {
	}
	,__class__: haxe_ds_WeakMap
};
var haxe_exceptions_PosException = $hxClasses["haxe.exceptions.PosException"] = function(message,previous,pos) {
	haxe_Exception.call(this,message,previous);
	if(pos == null) {
		this.posInfos = { fileName : "(unknown)", lineNumber : 0, className : "(unknown)", methodName : "(unknown)"};
	} else {
		this.posInfos = pos;
	}
	this.__skipStack++;
};
haxe_exceptions_PosException.__name__ = "haxe.exceptions.PosException";
haxe_exceptions_PosException.__super__ = haxe_Exception;
haxe_exceptions_PosException.prototype = $extend(haxe_Exception.prototype,{
	posInfos: null
	,toString: function() {
		return "" + haxe_Exception.prototype.toString.call(this) + " in " + this.posInfos.className + "." + this.posInfos.methodName + " at " + this.posInfos.fileName + ":" + this.posInfos.lineNumber;
	}
	,__class__: haxe_exceptions_PosException
});
var haxe_exceptions_NotImplementedException = $hxClasses["haxe.exceptions.NotImplementedException"] = function(message,previous,pos) {
	if(message == null) {
		message = "Not implemented";
	}
	haxe_exceptions_PosException.call(this,message,previous,pos);
	this.__skipStack++;
};
haxe_exceptions_NotImplementedException.__name__ = "haxe.exceptions.NotImplementedException";
haxe_exceptions_NotImplementedException.__super__ = haxe_exceptions_PosException;
haxe_exceptions_NotImplementedException.prototype = $extend(haxe_exceptions_PosException.prototype,{
	__class__: haxe_exceptions_NotImplementedException
});
var haxe_iterators_ArrayIterator = $hxClasses["haxe.iterators.ArrayIterator"] = function(array) {
	this.current = 0;
	this.array = array;
};
haxe_iterators_ArrayIterator.__name__ = "haxe.iterators.ArrayIterator";
haxe_iterators_ArrayIterator.prototype = {
	array: null
	,current: null
	,hasNext: function() {
		return this.current < this.array.length;
	}
	,next: function() {
		return this.array[this.current++];
	}
	,__class__: haxe_iterators_ArrayIterator
};
var haxe_iterators_ArrayKeyValueIterator = $hxClasses["haxe.iterators.ArrayKeyValueIterator"] = function(array) {
	this.current = 0;
	this.array = array;
};
haxe_iterators_ArrayKeyValueIterator.__name__ = "haxe.iterators.ArrayKeyValueIterator";
haxe_iterators_ArrayKeyValueIterator.prototype = {
	current: null
	,array: null
	,hasNext: function() {
		return this.current < this.array.length;
	}
	,next: function() {
		return { value : this.array[this.current], key : this.current++};
	}
	,__class__: haxe_iterators_ArrayKeyValueIterator
};
var haxe_iterators_DynamicAccessIterator = $hxClasses["haxe.iterators.DynamicAccessIterator"] = function(access) {
	this.access = access;
	this.keys = Reflect.fields(access);
	this.index = 0;
};
haxe_iterators_DynamicAccessIterator.__name__ = "haxe.iterators.DynamicAccessIterator";
haxe_iterators_DynamicAccessIterator.prototype = {
	access: null
	,keys: null
	,index: null
	,hasNext: function() {
		return this.index < this.keys.length;
	}
	,next: function() {
		return this.access[this.keys[this.index++]];
	}
	,__class__: haxe_iterators_DynamicAccessIterator
};
var haxe_iterators_DynamicAccessKeyValueIterator = $hxClasses["haxe.iterators.DynamicAccessKeyValueIterator"] = function(access) {
	this.access = access;
	this.keys = Reflect.fields(access);
	this.index = 0;
};
haxe_iterators_DynamicAccessKeyValueIterator.__name__ = "haxe.iterators.DynamicAccessKeyValueIterator";
haxe_iterators_DynamicAccessKeyValueIterator.prototype = {
	access: null
	,keys: null
	,index: null
	,hasNext: function() {
		return this.index < this.keys.length;
	}
	,next: function() {
		var key = this.keys[this.index++];
		return { value : this.access[key], key : key};
	}
	,__class__: haxe_iterators_DynamicAccessKeyValueIterator
};
var haxe_iterators_HashMapKeyValueIterator = $hxClasses["haxe.iterators.HashMapKeyValueIterator"] = function(map) {
	this.map = map;
	this.keys = map.keys.iterator();
};
haxe_iterators_HashMapKeyValueIterator.__name__ = "haxe.iterators.HashMapKeyValueIterator";
haxe_iterators_HashMapKeyValueIterator.prototype = {
	map: null
	,keys: null
	,hasNext: function() {
		return this.keys.hasNext();
	}
	,next: function() {
		var key = this.keys.next();
		var _this = this.map.values;
		var key1 = key.hashCode();
		return { value : _this.h[key1], key : key};
	}
	,__class__: haxe_iterators_HashMapKeyValueIterator
};
var haxe_iterators_MapKeyValueIterator = $hxClasses["haxe.iterators.MapKeyValueIterator"] = function(map) {
	this.map = map;
	this.keys = map.keys();
};
haxe_iterators_MapKeyValueIterator.__name__ = "haxe.iterators.MapKeyValueIterator";
haxe_iterators_MapKeyValueIterator.prototype = {
	map: null
	,keys: null
	,hasNext: function() {
		return this.keys.hasNext();
	}
	,next: function() {
		var key = this.keys.next();
		return { value : this.map.get(key), key : key};
	}
	,__class__: haxe_iterators_MapKeyValueIterator
};
var haxe_iterators_RestIterator = $hxClasses["haxe.iterators.RestIterator"] = function(args) {
	this.current = 0;
	this.args = args;
};
haxe_iterators_RestIterator.__name__ = "haxe.iterators.RestIterator";
haxe_iterators_RestIterator.prototype = {
	args: null
	,current: null
	,hasNext: function() {
		return this.current < this.args.length;
	}
	,next: function() {
		return this.args[this.current++];
	}
	,__class__: haxe_iterators_RestIterator
};
var haxe_iterators_RestKeyValueIterator = $hxClasses["haxe.iterators.RestKeyValueIterator"] = function(args) {
	this.current = 0;
	this.args = args;
};
haxe_iterators_RestKeyValueIterator.__name__ = "haxe.iterators.RestKeyValueIterator";
haxe_iterators_RestKeyValueIterator.prototype = {
	args: null
	,current: null
	,hasNext: function() {
		return this.current < this.args.length;
	}
	,next: function() {
		return { key : this.current, value : this.args[this.current++]};
	}
	,__class__: haxe_iterators_RestKeyValueIterator
};
var haxe_iterators_StringIterator = $hxClasses["haxe.iterators.StringIterator"] = function(s) {
	this.offset = 0;
	this.s = s;
};
haxe_iterators_StringIterator.__name__ = "haxe.iterators.StringIterator";
haxe_iterators_StringIterator.prototype = {
	offset: null
	,s: null
	,hasNext: function() {
		return this.offset < this.s.length;
	}
	,next: function() {
		return this.s.charCodeAt(this.offset++);
	}
	,__class__: haxe_iterators_StringIterator
};
var haxe_iterators_StringIteratorUnicode = $hxClasses["haxe.iterators.StringIteratorUnicode"] = function(s) {
	this.offset = 0;
	this.s = s;
};
haxe_iterators_StringIteratorUnicode.__name__ = "haxe.iterators.StringIteratorUnicode";
haxe_iterators_StringIteratorUnicode.unicodeIterator = function(s) {
	return new haxe_iterators_StringIteratorUnicode(s);
};
haxe_iterators_StringIteratorUnicode.prototype = {
	offset: null
	,s: null
	,hasNext: function() {
		return this.offset < this.s.length;
	}
	,next: function() {
		var s = this.s;
		var index = this.offset++;
		var c = s.charCodeAt(index);
		if(c >= 55296 && c <= 56319) {
			c = c - 55232 << 10 | s.charCodeAt(index + 1) & 1023;
		}
		var c1 = c;
		if(c1 >= 65536) {
			this.offset++;
		}
		return c1;
	}
	,__class__: haxe_iterators_StringIteratorUnicode
};
var haxe_iterators_StringKeyValueIterator = $hxClasses["haxe.iterators.StringKeyValueIterator"] = function(s) {
	this.offset = 0;
	this.s = s;
};
haxe_iterators_StringKeyValueIterator.__name__ = "haxe.iterators.StringKeyValueIterator";
haxe_iterators_StringKeyValueIterator.prototype = {
	offset: null
	,s: null
	,hasNext: function() {
		return this.offset < this.s.length;
	}
	,next: function() {
		return { key : this.offset, value : this.s.charCodeAt(this.offset++)};
	}
	,__class__: haxe_iterators_StringKeyValueIterator
};
var js_Boot = $hxClasses["js.Boot"] = function() { };
js_Boot.__name__ = "js.Boot";
js_Boot.isClass = function(o) {
	return o.__name__;
};
js_Boot.isInterface = function(o) {
	return o.__isInterface__;
};
js_Boot.isEnum = function(e) {
	return e.__ename__;
};
js_Boot.getClass = function(o) {
	if(o == null) {
		return null;
	} else if(((o) instanceof Array)) {
		return Array;
	} else {
		var cl = o.__class__;
		if(cl != null) {
			return cl;
		}
		var name = js_Boot.__nativeClassName(o);
		if(name != null) {
			return js_Boot.__resolveNativeClass(name);
		}
		return null;
	}
};
js_Boot.__string_rec = function(o,s) {
	if(o == null) {
		return "null";
	}
	if(s.length >= 5) {
		return "<...>";
	}
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) {
		t = "object";
	}
	switch(t) {
	case "function":
		return "<function>";
	case "object":
		if(o.__enum__) {
			var e = $hxEnums[o.__enum__];
			var con = e.__constructs__[o._hx_index];
			var n = con._hx_name;
			if(con.__params__) {
				s = s + "\t";
				return n + "(" + ((function($this) {
					var $r;
					var _g = [];
					{
						var _g1 = 0;
						var _g2 = con.__params__;
						while(true) {
							if(!(_g1 < _g2.length)) {
								break;
							}
							var p = _g2[_g1];
							_g1 = _g1 + 1;
							_g.push(js_Boot.__string_rec(o[p],s));
						}
					}
					$r = _g;
					return $r;
				}(this))).join(",") + ")";
			} else {
				return n;
			}
		}
		if(((o) instanceof Array)) {
			var str = "[";
			s += "\t";
			var _g = 0;
			var _g1 = o.length;
			while(_g < _g1) {
				var i = _g++;
				str += (i > 0 ? "," : "") + js_Boot.__string_rec(o[i],s);
			}
			str += "]";
			return str;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( _g ) {
			haxe_NativeStackTrace.lastError = _g;
			return "???";
		}
		if(tostr != null && tostr != Object.toString && typeof(tostr) == "function") {
			var s2 = o.toString();
			if(s2 != "[object Object]") {
				return s2;
			}
		}
		var str = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		var k = null;
		for( k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str.length != 2) {
			str += ", \n";
		}
		str += s + k + " : " + js_Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str += "\n" + s + "}";
		return str;
	case "string":
		return o;
	default:
		return String(o);
	}
};
js_Boot.__interfLoop = function(cc,cl) {
	if(cc == null) {
		return false;
	}
	if(cc == cl) {
		return true;
	}
	var intf = cc.__interfaces__;
	if(intf != null) {
		var _g = 0;
		var _g1 = intf.length;
		while(_g < _g1) {
			var i = _g++;
			var i1 = intf[i];
			if(i1 == cl || js_Boot.__interfLoop(i1,cl)) {
				return true;
			}
		}
	}
	return js_Boot.__interfLoop(cc.__super__,cl);
};
js_Boot.__instanceof = function(o,cl) {
	if(cl == null) {
		return false;
	}
	switch(cl) {
	case Array:
		return ((o) instanceof Array);
	case Bool:
		return typeof(o) == "boolean";
	case Dynamic:
		return o != null;
	case Float:
		return typeof(o) == "number";
	case Int:
		if(typeof(o) == "number") {
			return ((o | 0) === o);
		} else {
			return false;
		}
		break;
	case String:
		return typeof(o) == "string";
	default:
		if(o != null) {
			if(typeof(cl) == "function") {
				if(js_Boot.__downcastCheck(o,cl)) {
					return true;
				}
			} else if(typeof(cl) == "object" && js_Boot.__isNativeObj(cl)) {
				if(((o) instanceof cl)) {
					return true;
				}
			}
		} else {
			return false;
		}
		if(cl == Class ? o.__name__ != null : false) {
			return true;
		}
		if(cl == Enum ? o.__ename__ != null : false) {
			return true;
		}
		return o.__enum__ != null ? $hxEnums[o.__enum__] == cl : false;
	}
};
js_Boot.__downcastCheck = function(o,cl) {
	if(!((o) instanceof cl)) {
		if(cl.__isInterface__) {
			return js_Boot.__interfLoop(js_Boot.getClass(o),cl);
		} else {
			return false;
		}
	} else {
		return true;
	}
};
js_Boot.__implements = function(o,iface) {
	return js_Boot.__interfLoop(js_Boot.getClass(o),iface);
};
js_Boot.__cast = function(o,t) {
	if(o == null || js_Boot.__instanceof(o,t)) {
		return o;
	} else {
		throw haxe_Exception.thrown("Cannot cast " + Std.string(o) + " to " + Std.string(t));
	}
};
js_Boot.__toStr = null;
js_Boot.__nativeClassName = function(o) {
	var name = js_Boot.__toStr.call(o).slice(8,-1);
	if(name == "Object" || name == "Function" || name == "Math" || name == "JSON") {
		return null;
	}
	return name;
};
js_Boot.__isNativeObj = function(o) {
	return js_Boot.__nativeClassName(o) != null;
};
js_Boot.__resolveNativeClass = function(name) {
	return $global[name];
};
var js_Lib = $hxClasses["js.Lib"] = function() { };
js_Lib.__name__ = "js.Lib";
js_Lib.__properties__ = {get_undefined:"get_undefined"};
js_Lib.debug = function() {
	debugger;
};
js_Lib.alert = function(v) {
	alert(js_Boot.__string_rec(v,""));
};
js_Lib.eval = function(code) {
	return eval(code);
};
js_Lib.get_undefined = function() {
	return undefined;
};
js_Lib.rethrow = function() {
};
js_Lib.getOriginalException = function() {
	return null;
};
js_Lib.getNextHaxeUID = function() {
	return $global.$haxeUID++;
};
var js_lib_ObjectEntry = {};
js_lib_ObjectEntry.__properties__ = {get_value:"get_value",get_key:"get_key"};
js_lib_ObjectEntry.get_key = function(this1) {
	return this1[0];
};
js_lib_ObjectEntry.get_value = function(this1) {
	return this1[1];
};
if(typeof(performance) != "undefined" ? typeof(performance.now) == "function" : false) {
	HxOverrides.now = performance.now.bind(performance);
}
$hxClasses["Math"] = Math;
if( String.fromCodePoint == null ) String.fromCodePoint = function(c) { return c < 0x10000 ? String.fromCharCode(c) : String.fromCharCode((c>>10)+0xD7C0)+String.fromCharCode((c&0x3FF)+0xDC00); }
String.prototype.__class__ = $hxClasses["String"] = String;
String.__name__ = "String";
$hxClasses["Array"] = Array;
Array.__name__ = "Array";
Date.prototype.__class__ = $hxClasses["Date"] = Date;
Date.__name__ = "Date";
var Int = { };
var Dynamic = { };
var Float = Number;
var Bool = Boolean;
var Class = { };
var Enum = { };
haxe_ds_ObjectMap.count = 0;
js_Boot.__toStr = ({ }).toString;
EReg.escapeRe = new RegExp("[.*+?^${}()|[\\]\\\\]","g");
Mode.major_intervals = [2,2,1,2,2,2,1];
Mode.minor_intervals = [2,1,2,2,1,2,2];
Mode.harmonic_minor_intervals = [2,1,2,2,1,3,1];
Mode.melodic_minor_intervals = [2,1,2,2,2,2,1];
var Mode_MAJOR = $hx_exports["Mode"]["MAJOR"] = Mode.getMajorMode();
var Mode_MINOR = $hx_exports["Mode"]["MINOR"] = Mode.getMinorMode();
var Mode_HARMONIC_MINOR = $hx_exports["Mode"]["HARMONIC_MINOR"] = Mode.getHarmonicMinorMode();
var Mode_MELODIC_MINOR = $hx_exports["Mode"]["MELODIC_MINOR"] = Mode.getMelodicMinorMode();
haxe_SysTools.winMetaCharacters = [32,40,41,37,33,94,34,60,62,38,124,10,13,44,59];
StringTools.winMetaCharacters = haxe_SysTools.winMetaCharacters;
StringTools.MIN_SURROGATE_CODE_POINT = 65536;
var GoldenData = $hx_exports["GoldenData"];
var Mode = $hx_exports["Mode"];
var IChordProgression = $hx_exports["IChordProgression"];
var ChordProgression = $hx_exports["ChordProgression"];
var StutteredChordProgression = $hx_exports["StutteredChordProgression"];
var GoldenData = $hx_exports["GoldenData"];
var ISerializable = $hx_exports["ISerializable"];
var Mode = $hx_exports["Mode"];
var ExplicitRhythmGenerator = $hx_exports["ExplicitRhythmGenerator"];
var SimpleRhythmGenerator = $hx_exports["SimpleRhythmGenerator"];
var BjorklundRhythmGenerator = $hx_exports["BjorklundRhythmGenerator"];
var ParseFailedRhythmGenerator = $hx_exports["ParseFailedRhythmGenerator"];
var RhythmLanguage = $hx_exports["RhythmLanguage"];
var INote = $hx_exports["INote"];
var IDeserializationHelper = $hx_exports["IDeserializationHelper"];
var IInstrumentContext = $hx_exports["IInstrumentContext"];
var Note = $hx_exports["Note"];
var ScoreUtilities = $hx_exports["ScoreUtilities"];
var MenuHelper = $hx_exports["MenuHelper"];
var TimeManipulator = $hx_exports["TimeManipulator"];
var MidiInstrumentContext = $hx_exports["MidiInstrumentContext"];
var DeserializationHelper = $hx_exports["DeserializationHelper"];
var LineGenerator = $hx_exports["LineGenerator"];
