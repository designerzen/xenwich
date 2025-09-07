
import { createAudiotoolClient } from "@audiotool/nexus"
import type { AudiotoolClient, SyncedDocument } from "@audiotool/nexus"
// Import GoldenPond JavaScript directly
import "../goldenpond/goldenpond.js"

// Declare global types for TypeScript
declare const globalThis: any;

// Utility function to convert GoldenPond notes to Nexus format
function convertGoldenPondNotesToNexus(goldenNotes: any[]): any[] {
  return goldenNotes.map((goldenNote: any) => {
    // Convert GoldenPond Note[chan: 0, note: 60, vel: 64, startTime: 0, length: 72] 
    // to Nexus note format
    return {
      pitch: goldenNote.note || goldenNote.pitch || 60, // MIDI note number
      positionTicks: Math.floor((goldenNote.startTime / 96 || 0) * QUARTER_NOTE), // Convert time to ticks
      durationTicks: Math.floor(((goldenNote.length / 96) || 9600) * QUARTER_NOTE), // Convert length to ticks  
      velocity: (goldenNote.vel || goldenNote.velocity || 64) / 127, // Convert MIDI velocity (0-127) to float (0-1)
      slide: false
    };
  });
}

// Initialize the app
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>Audiotool Nexus API Demo</h1>
    <div class="card">
      <div class="auth-section">
        <h3>Authentication</h3>
        <input type="text" id="pat-input" placeholder="Enter your PAT token (at_pat_...)" />
        <button id="connect-btn">Connect</button>
        <button id="clear-token-btn">Clear Stored Token</button>
        <button id="auto-connect-btn">Auto Connect & Open Project</button>
      </div>
      
      <div class="project-section" style="display: none;">
        <h3>Project Connection</h3>        
        <div id="projects-list" style="display: none;">
          <h4>Select a Project:</h4>
          <select id="project-select" style="width: 100%; margin: 0.5em 0;">
            <option value="">Choose a project...</option>
          </select>
          <button id="open-selected-project-btn">Open Selected Project</button>
          <button id="list-projects-btn">List My Projects</button>
        </div>
        <div style="margin-top: 1em;">
          <input type="text" id="project-url" placeholder="Or enter project URL manually" />
          <button id="open-project-btn">Open Project</button>
          <button id="clear-project-btn">Clear Stored URL</button>
        </div>
      </div>
      
      <div class="controls-section" style="display: none;">
        <h3>Audio Device Controls</h3>
        <button id="query-devices-btn">Query All Devices</button>
        <button id="create-synth-btn">Create GoldenPond Track</button>        
        <button id="list-notes-btn">List Notes in Project</button>
        <button id="create-note-btn">Create Note</button>
        <div style="margin-top: 1em;">
          <label for="pitch-offset" style="display: block; margin-bottom: 0.5em; font-size: 0.9em; color: #666;">
            Cents offset (100 cents = 1 semitone, 50 cents = quarter-tone):
          </label>
          <input type="number" id="pitch-offset" placeholder="Cents offset (e.g. 25)" step="0.1" min="-100" max="100" value="25" />
          <button id="adjust-pitch-btn">Apply Microtonal Tuning</button>
          <button id="clear-tunings-btn">Clear All Tunings</button>
        </div>
      </div>
      
      <div class="output-section">
        <h3>Output</h3>
        <div style="height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; background-color: #222; font-family: monospace; font-size: 12px; line-height: 1.4;">
          <pre id="output" style="margin: 0; white-space: pre-wrap; word-wrap: break-word;"></pre>
        </div>
      </div>
    </div>
  </div>
`

// Global variables
let client: AudiotoolClient | null = null;
let nexus: SyncedDocument | null = null;

// LocalStorage keys
const STORAGE_KEYS = {
  PAT_TOKEN: 'audiotool_nexus_pat_token',
  PROJECT_URL: 'audiotool_nexus_project_url'
} as const;

// Audio timing constants
const QUARTER_NOTE = 15360 / 4; // 3840 ticks = 1 quarter note

// Load saved values from localStorage
function loadSavedValues(): void {
  const savedToken = localStorage.getItem(STORAGE_KEYS.PAT_TOKEN);
  const savedProjectUrl = localStorage.getItem(STORAGE_KEYS.PROJECT_URL);

  if (savedToken) {
    (document.getElementById('pat-input') as HTMLInputElement).value = savedToken;
    log('Loaded saved PAT token from localStorage');
  }

  if (savedProjectUrl) {
    (document.getElementById('project-url') as HTMLInputElement).value = savedProjectUrl;
    log('Loaded saved project URL from localStorage');
  }
}

// Connect to nexus project and analyze
async function connectToNexusProject(projectUrl: string): Promise<void> {
  try {
    if (!client) {
      log('Please connect first');
      return;
    }
    log('Connecting to project ...');

    // Create synced document
    nexus = await client.createSyncedDocument({
      mode: "online",
      project: projectUrl,
    });

    log('Connected to project...');

    // Log initial entity counts
    const allEntities = nexus.queryEntities.get();
    log(`Total entities in project: ${allEntities.length}`);

    // Log entity type breakdown
    const entityTypes: Record<string, number> = {};
    allEntities.forEach(entity => {
      const type = entity.type;
      entityTypes[type] = (entityTypes[type] || 0) + 1;
    });

    log('Entity breakdown:');
    Object.entries(entityTypes).forEach(([type, count]) => {
      log(`  ${type}: ${count}`);
    });

    // Get note tracks and check for notes
    let noteTracks = nexus.queryEntities.ofTypes("noteTrack").get();
    log(`Found ${noteTracks.length} note tracks`);

    if (noteTracks.length > 0) {
      // Get all notes in the project
      const allNotes = nexus.queryEntities.ofTypes("note").get();
      log(`Found ${allNotes.length} total notes in project`);

      // Log details of each note
      allNotes.forEach((note, index) => {
        log(`Note ${index + 1}: Pitch=${note.fields.pitch.value}, Position=${note.fields.positionTicks.value}t, Duration=${note.fields.durationTicks.value}t, Velocity=${note.fields.velocity.value}`);
      });
    }

    nexus.events.onCreate("noteTrack", (track) => {
      log(`New note track created! Order: ${track.fields.orderAmongTracks.value}`);
    });

    // Start syncing
    await nexus.start();

    noteTracks = nexus.queryEntities.ofTypes("noteTrack").get();
    log(`Found ${noteTracks.length} note tracks`);

    if (noteTracks.length > 0) {
      // Get all notes in the project
      const allNotes = nexus.queryEntities.ofTypes("note").get();
      log(`Found ${allNotes.length} total notes in project`);

      // Log details of each note
      allNotes.forEach((note, index) => {
        log(`Note ${index + 1}: Pitch=${note.fields.pitch.value}, Position=${note.fields.positionTicks.value}t, Duration=${note.fields.durationTicks.value}t, Velocity=${note.fields.velocity.value}`);
      });
    }
    log('Project connected and syncing started!');
    (document.querySelector('.controls-section') as HTMLDivElement).style.display = 'block';

  } catch (error) {
    log('Error connecting to project: ' + (error as Error).message);
    throw error;
  }
}

// Utility function to log output
function log(message: string): void {
  const output = document.getElementById('output') as HTMLPreElement;
  const container = output.parentElement as HTMLDivElement;

  output.textContent += new Date().toLocaleTimeString() + ': ' + message + '\n';

  // Auto-scroll to bottom
  container.scrollTop = container.scrollHeight;
}

// Initialize client and set up authentication
async function initializeClient(patToken: string, show: boolean): Promise<void> {
  try {
    log('Creating Audiotool client...');
    const result = await createAudiotoolClient({
      pat: patToken,
    });
    client = result;
    console.log(result);
    log('Client created successfully!');
    if (show) {
      (document.querySelector('.project-section') as HTMLDivElement).style.display = 'block';
    }
  } catch (error) {
    log('Error creating client: ' + (error as Error).message);
  }
}

// Business logic functions
async function handleConnectWithPAT(patToken: string): Promise<void> {
  if (!patToken) {
    log('Please enter a PAT token');
    return;
  }

  try {
    log('Initializing client with PAT token...');
    await initializeClient(patToken, true);

    // Save token to localStorage
    localStorage.setItem(STORAGE_KEYS.PAT_TOKEN, patToken);
    log('PAT token saved to localStorage');

    log('Client initialized successfully!');
  } catch (error) {
    log('Error initializing client: ' + (error as Error).message);
  }
}

async function handleListProjects(): Promise<void> {
  if (!client) {
    log('Please connect first');
    return;
  }

  try {
    const projects = await client.api.projectService.listProjects({});

    // Check if the result is an error or a successful response
    if (projects instanceof Error) {
      log('Error listing projects: ' + projects.message);
      return;
    } else {
      // Cast to ListProjectsResponse and proceed
      const projectsResponse = projects;
      const projectsArray = (projectsResponse as any).projects || projectsResponse;
      log(`Found ${Array.isArray(projectsArray) ? projectsArray.length : 0} projects:`);
      console.log(projectsArray);
      if (Array.isArray(projectsArray)) {
        projectsArray.forEach((project: any) => {
          log(`  - ${project.fields?.name?.value || project.name}`);
        });
      } else {
        log('Projects response is not in expected format');
        console.log('Projects response:', projectsResponse);
      }
    }
  } catch (error) {
    log('Error listing projects and tunings: ' + (error as Error).message);
  }
}

async function handleOpenSelectedProject(selectedProject: string): Promise<void> {
  if (!selectedProject) {
    log('Please select a project');
    return;
  }

  const projectUrl = `https://beta.audiotool.com/studio?project=${selectedProject.split('/')[1]}`;
  (document.getElementById('project-url') as HTMLInputElement).value = projectUrl;

  // Trigger the existing open project logic
  document.getElementById('open-project-btn')!.click();
}

async function handleOpenProject(projectUrl: string): Promise<void> {
  if (!projectUrl) {
    log('Please enter a project URL');
    return;
  }

  if (!client) {
    log('Please connect first');
    return;
  }

  try {
    log('Connecting to project...');

    // Save project URL to localStorage immediately when attempting to connect
    localStorage.setItem(STORAGE_KEYS.PROJECT_URL, projectUrl);
    log('Project URL saved to localStorage');

    await connectToNexusProject(projectUrl);
  } catch (error) {
    log('Error connecting to project: ' + (error as Error).message);
  }
}

async function handleQueryDevices(): Promise<void> {
  if (!nexus) {
    log('Please connect to a project first');
    return;
  }

  try {
    // Find all note tracks
    const noteTracks = nexus.queryEntities.ofTypes("noteTrack").get();
    log(`Found ${noteTracks.length} note tracks`);

    log('Query completed!');
  } catch (error) {
    log('Error querying devices: ' + (error as Error).message);
  }
}

async function handleCreateSynth(): Promise<{ synth: any, placement: any, mixerChannel?: any, mixerPlacement?: any, audioConnection?: any } | void> {
  if (!nexus) {
    log('Please connect to a project first');
    return;
  }

  try {
    log('Creating Pulverisateur synth with mixer channel...');

    const result = await nexus.modify((t) => {
      // Create the Pulverisateur synth
      const synth = t.create("pulverisateur", {
        isActive: true,
        // Master settings
        masterGain: 0.8,
        playModeIndex: 2, // Polyphonic mode
        tune: 0.0,
        glideTimeMs: 50,
        filterEnvelopeAmount: 0.6,

        // Oscillator A - Sawtooth lead
        oscillatorA: {
          channel: { /* mix level properties */ },
          oscillator: {
            octave: 0,
            tune: 0.02, // Slight detune for thickness
            waveform: 0.8 // More sawtooth-like
          }
        },

        // Oscillator B - Sub bass
        oscillatorB: {
          channel: { /* mix level properties */ },
          oscillator: {
            octave: -1, // One octave lower
            tune: -0.01,
            waveform: 0.1 // More square-like for bass
          }
        },

        // Oscillator C - High harmonics
        oscillatorC: {
          channel: { /* mix level properties */ },
          oscillator: {
            octave: 1, // One octave higher
            tune: 0.05, // Wider detune for movement
            waveform: 0.6 // Mixed waveform
          }
        },

        // Filter - Low-pass with movement
        filter: {
          cutoffHz: 1200,
          resonance: 0.3,
          modeIndex: 1, // LP/LP mode
          keyboardTrackingAmount: 0.4,
          spacing: 0.2
        },

        // Amplitude Envelope - Punchy
        amplitudeEnvelope: {
          attackMs: 5,
          decayMs: 300,
          sustain: 0.7,
          releaseMs: 800,
          decayIsLooped: false
        },

        // Filter Envelope - Creates movement
        filterEnvelope: {
          attackMs: 10,
          decayMs: 600,
          sustain: 0.4,
          releaseMs: 1200,
          decayIsLooped: false
        },

        // LFO - Adds vibrato and filter modulation
        lfo: {
          waveform: 0.5, // Sine-triangle mix
          lfoRate: 0.2,
          syncToClock: false,
          trigger: false,
          factor: 0.4, // Moderate depth
          targetFilterCutoff: true,
          targetOscillatorAPitch: true,
          targetOscillatorBPitch: false, // Keep bass stable
          targetOscillatorCPitch: true,
          targetPulseWidth: false
        }
      });

      // Create desktop placement for the synth
      const placement = t.create("desktopPlacement", {
        entity: synth.location,
        x: 100 + Math.floor(Math.random() * 400), // Random position
        y: 100 + Math.floor(Math.random() * 300),
      });

      // Create mixer channel for the Synth
      const mixerChannel = t.create("mixerChannel", {});
      const out = t.entities.ofTypes("mixerOut").getOne();

      if (out) {
        t.create("mixerStripCable", {
          childStrip: mixerChannel.fields.stripOutput.location,
          parentStrip: out.location
        });
      };
      // Try to create audio connection from Synth to mixer channel
      const audioConnection = t.create("audioConnection", {
        fromSocket: synth.fields.audioOutput.location,
        toSocket: mixerChannel.fields.audioInput.location
      });

      return { synth, placement, mixerChannel, audioConnection };
    });

    log(`Created Pulverisateur synth with ID: ${result.synth.id}`);
    log(`Placed at position (${result.placement.fields.x.value}, ${result.placement.fields.y.value})`);
    if (result.mixerChannel) {
      log(`Created mixer channel with ID: ${result.mixerChannel.id}`);
      log(`Connected Synth to mixer channel via audio connection: ${result.audioConnection.id}`);
    }
    log('Synth synth with mixer channel ready for use!');

    return result;

  } catch (error) {
    log('Error creating Synth synth: ' + (error as Error).message);
  }
}

// @ts-ignore: Function will be used later
async function randomPatch(synth: any): Promise<void> {
  try {
    if (!nexus) {
      log('Please connect to a project first');
      return;
    }
    await nexus.modify((t) => {
      const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;
      const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

      // Master settings
      t.update(synth.fields.masterGain, randomFloat(0.5, 1.0));
      t.update(synth.fields.playModeIndex, randomInt(1, 2)); // 1=Mono, 2=Polyphonic
      t.update(synth.fields.tune, randomFloat(-1.0, 1.0));
      t.update(synth.fields.glideTimeMs, randomFloat(0, 200));
      t.update(synth.fields.filterEnvelopeAmount, randomFloat(0.0, 1.0));

      // Oscillator A
      t.update(synth.fields.oscillatorA.fields.oscillator.fields.octave, randomInt(-2, 2));
      t.update(synth.fields.oscillatorA.fields.oscillator.fields.tune, randomFloat(-0.1, 0.1));
      t.update(synth.fields.oscillatorA.fields.oscillator.fields.waveform, randomFloat(0.0, 1.0));

      // Oscillator B
      t.update(synth.fields.oscillatorB.fields.oscillator.fields.octave, randomInt(-2, 2));
      t.update(synth.fields.oscillatorB.fields.oscillator.fields.tune, randomFloat(-0.1, 0.1));
      t.update(synth.fields.oscillatorB.fields.oscillator.fields.waveform, randomFloat(0.0, 1.0));

      // Oscillator C
      t.update(synth.fields.oscillatorC.fields.oscillator.fields.octave, randomInt(-2, 2));
      t.update(synth.fields.oscillatorC.fields.oscillator.fields.tune, randomFloat(-0.1, 0.1));
      t.update(synth.fields.oscillatorC.fields.oscillator.fields.waveform, randomFloat(0.0, 1.0));

      // Filter
      t.update(synth.fields.filter.fields.cutoffHz, randomFloat(200, 8000));
      t.update(synth.fields.filter.fields.resonance, randomFloat(0.0, 0.8));
      t.update(synth.fields.filter.fields.modeIndex, randomInt(1, 2)); // Various filter modes
      t.update(synth.fields.filter.fields.keyboardTrackingAmount, randomFloat(0.0, 1.0));
      t.update(synth.fields.filter.fields.spacing, randomFloat(0.0, 0.5));

      // Amplitude Envelope
      t.update(synth.fields.amplitudeEnvelope.fields.attackMs, randomFloat(1, 100));
      t.update(synth.fields.amplitudeEnvelope.fields.decayMs, randomFloat(50, 1000));
      t.update(synth.fields.amplitudeEnvelope.fields.sustain, randomFloat(0.1, 1.0));
      t.update(synth.fields.amplitudeEnvelope.fields.releaseMs, randomFloat(100, 2000));

      // Filter Envelope
      t.update(synth.fields.filterEnvelope.fields.attackMs, randomFloat(1, 200));
      t.update(synth.fields.filterEnvelope.fields.decayMs, randomFloat(100, 1500));
      t.update(synth.fields.filterEnvelope.fields.sustain, randomFloat(0.0, 1.0));
      t.update(synth.fields.filterEnvelope.fields.releaseMs, randomFloat(200, 3000));

      // LFO
      t.update(synth.fields.lfo.fields.waveform, randomFloat(0.0, 1.0));
      t.update(synth.fields.lfo.fields.lfoRate, randomFloat(0.1, 1.0));
      t.update(synth.fields.lfo.fields.syncToClock, Math.random() > 0.5);
      t.update(synth.fields.lfo.fields.trigger, Math.random() > 0.7);
      t.update(synth.fields.lfo.fields.factor, randomFloat(0.1, 0.8));

      // LFO Targets (randomize which targets are active)
      t.update(synth.fields.lfo.fields.targetFilterCutoff, Math.random() > 0.3);
      t.update(synth.fields.lfo.fields.targetOscillatorAPitch, Math.random() > 0.5);
      t.update(synth.fields.lfo.fields.targetOscillatorBPitch, Math.random() > 0.6);
      t.update(synth.fields.lfo.fields.targetOscillatorCPitch, Math.random() > 0.4);
      t.update(synth.fields.lfo.fields.targetPulseWidth, Math.random() > 0.7);

      log('Synth parameters randomized successfully!');
    });
  } catch (error) {
    log('Error creating Synth synth: ' + (error as Error).message);
  }
}

function handleClearToken(): void {
  localStorage.removeItem(STORAGE_KEYS.PAT_TOKEN);
  (document.getElementById('pat-input') as HTMLInputElement).value = '';
  log('Stored PAT token cleared');
}

async function handleAutoConnect(): Promise<void> {
  const savedToken = localStorage.getItem(STORAGE_KEYS.PAT_TOKEN);
  const savedProjectUrl = localStorage.getItem(STORAGE_KEYS.PROJECT_URL);

  if (!savedToken) {
    log('No stored PAT token found. Please enter a token and connect first.');
    return;
  }

  if (!savedProjectUrl) {
    log('No stored project URL found. Please enter a project URL and connect first.');
    return;
  }

  log('Starting auto-connect with stored values...');

  try {
    // Initialize client if needed
    if (!client) {
      try {
        log('Creating Audiotool client with stored PAT...');
        await initializeClient(savedToken, false);

        log('Client initialized successfully!');
      } catch (error) {
        log('Error initializing client: ' + (error as Error).message);
      }
    }

    log('Client ready for project connection!');

    // Connect to project
    log('Connecting to stored project...');

    await connectToNexusProject(savedProjectUrl);

    log('Auto-connect completed successfully!');

  } catch (error) {
    log('Error during auto-connect: ' + (error as Error).message);
  }
}

function handleClearProject(): void {
  localStorage.removeItem(STORAGE_KEYS.PROJECT_URL);
  (document.getElementById('project-url') as HTMLInputElement).value = '';
  log('Stored project URL cleared');
}

async function handleListNotes(): Promise<void> {
  if (!nexus) {
    log('Please connect to a project first');
    return;
  }

  try {
    // Find all note tracks
    const noteTracks = nexus.queryEntities.ofTypes("noteTrack").get();
    log(`Found ${noteTracks.length} note tracks`);

    // Find all note regions
    const noteRegions = nexus.queryEntities.ofTypes("noteRegion").get();
    log(`Found ${noteRegions.length} note regions`);

    // Find all note collections
    const noteCollections = nexus.queryEntities.ofTypes("noteCollection").get();
    log(`Found ${noteCollections.length} note collections`);

    // Find all individual notes
    const notes = nexus.queryEntities.ofTypes("note").get();
    log(`Found ${notes.length} individual notes`);

    // Log details of each note
    notes.forEach((note, index) => {
      log(`Note ${index + 1}: Pitch=${note.fields.pitch.value} (MIDI), Position=${note.fields.positionTicks.value} ticks, Duration=${note.fields.durationTicks.value} ticks, Velocity=${note.fields.velocity.value}`);
    });

  } catch (error) {
    log('Error listing notes: ' + (error as Error).message);
  }
}

async function handleCreateNote(): Promise<void> {
  if (!nexus) {
    log('Please connect to a project first');
    return;
  }

  try {
    // Find an existing note collection to add the note to
    const noteCollections = nexus.queryEntities.ofTypes("noteCollection").get();

    if (noteCollections.length === 0) {
      log('No note collections found. Create a note track first!');
      return;
    }

    const noteCollection = noteCollections[0];

    const note = await nexus.modify((t) => {
      return t.create("note", {
        noteCollection: noteCollection.location,
        pitch: 60 + Math.floor(Math.random() * 24), // C4 to B5
        positionTicks: Math.floor(Math.random() * 15360 * 4), // Random position in 4 bars
        durationTicks: 960, // Quarter note
        velocity: 0.7,
        slide: false
      });
    });

    log(`Created note with ID: ${note.id}, Pitch: ${note.fields.pitch.value}, Position: ${note.fields.positionTicks.value} ticks`);

  } catch (error) {
    log('Error creating note: ' + (error as Error).message);
  }
}

async function handleApplyMicrotuning(centsOffset: number): Promise<void> {
  if (!nexus) {
    log('Please connect to a project first');
    return;
  }

  if (isNaN(centsOffset)) {
    log('Please enter a valid cents offset (e.g. 25)');
    return;
  }

  try {
    log(`Creating microtonal tuning with alternating ${centsOffset} cents offset...`);

    // Create an array of 12 cent values for each semitone (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
    const centsArray: number[] = [];
    for (let i = 0; i < 12; i++) {
      // Alternate: even semitones get positive offset, odd semitones get negative offset
      const adjustment = (i % 2 === 0) ? centsOffset : -centsOffset;
      centsArray.push(adjustment);
    }

    log(`Tuning pattern: [${centsArray.join(', ')}] cents`);

    const microTuning = await nexus.modify((t) => {
      return t.create("microTuningOctave", {
        cents: centsArray as number[] & { length: 12 }
      });
    });
    // set tuning on a synth

    log(`Created MicroTuningOctave with ID: ${microTuning.id}`);
    log('Microtonal tuning applied! This affects all notes played by instruments that support microtuning.');
    log('Note: The tuning affects the global project tuning, not individual notes.');

  } catch (error) {
    log('Error creating microtonal tuning: ' + (error as Error).message);
  }
}

async function handleClearTunings(): Promise<void> {
  if (!nexus) {
    log('Please connect to a project first');
    return;
  }

  try {
    const tunings = nexus.queryEntities.ofTypes("microTuningOctave").get();

    if (tunings.length === 0) {
      log('No microtonal tunings found to clear');
      return;
    }

    log(`Removing ${tunings.length} microtonal tunings...`);

    await nexus.modify((t) => {
      tunings.forEach(tuning => {
        t.delete(tuning);
        log(`Removed tuning ID: ${tuning.id}`);
      });
    });

    log('All microtonal tunings cleared!');

  } catch (error) {
    log('Error clearing tunings: ' + (error as Error).message);
  }
}

async function handleTestGoldenPond(): Promise<any[]> {
  try {
    log('Testing GoldenPond music theory library...');

    // Test basic functionality by checking global exports
    if (typeof globalThis.LineGenerator !== 'undefined') {
      log('✓ LineGenerator class available');
    } else {
      log('✗ LineGenerator class not found');
    }

    if (typeof globalThis.ChordProgression !== 'undefined') {
      log('✓ ChordProgression class available');
    } else {
      log('✗ ChordProgression class not found');
    }

    if (typeof globalThis.GoldenData !== 'undefined') {
      log('✓ GoldenData class available');
    } else {
      log('✗ GoldenData class not found');
    }

    // Create and configure GoldenData using global classes directly
    try {
      log('Creating GoldenData instance with musical configuration...');

      const goldenData = new globalThis.GoldenData();

      // Set root note (C = 0, C# = 1, D = 2, etc.)
      goldenData.root = 60; // C
      log('✓ Set root to C (60)');

      // Set mode (0 = Major, 1 = Minor, etc. - depends on GoldenPond's mode enum)
      goldenData.mode = 0; // Major mode
      log('✓ Set mode to Major (0)');

      // Set chord sequence  
      goldenData.chordSequence = "71,74,75,71,<1,7(5/2),72,75,71";
      log('✓ Set chord sequence"');

      // Set BPM (beats per minute)
      goldenData.bpm = 120;
      log('✓ Set BPM to 120');

      // Set duration
      goldenData.dur = 4;
      log('✓ Set duration to 4');

      log('GoldenData configuration:');
      log(`  Root: ${goldenData.root} (C)`);
      log(`  Mode: ${goldenData.mode} (Major)`);
      log(`  Chord Sequence: ${goldenData.chordSeq}`);
      log(`  BPM: ${goldenData.bpm}`);
      log(`  Duration: ${goldenData.dur} bars`);

      // Add a line using MidiInstrumentContext
      goldenData.addLine("3/8 > 2", new globalThis.MidiInstrumentContext(0, 64, 0.75, 0));
      log('✓ Added musical line to GoldenData');

      // Generate notes
      const chords = goldenData.makeLineGenerator(0).generateNotes(0);
      log(`XXX Generated chords: ${chords}`);


      // Convert GoldenPond notes to Nexus format
      if (chords && chords.length > 0) {
        log('Converting GoldenPond notes to Nexus format...');
        log(chords.length);
        const nexusNotes = convertGoldenPondNotesToNexus(chords);

        log(`Converted ${nexusNotes.length} notes to Nexus format:`);
        nexusNotes.forEach((note: any, index: number) => {
          log(`  Note ${index + 1}: Pitch=${note.pitch}, Position=${note.positionTicks}t, Duration=${note.durationTicks}t, Velocity=${note.velocity}`);
        });

        return nexusNotes;
      }

    } catch (error) {
      log('✗ Error creating/configuring GoldenData: ' + (error as Error).message);
    }

    log('GoldenPond test completed!');
    return [];
  } catch (error) {
    log('Error testing GoldenPond: ' + (error as Error).message);
    return [];
  }
}

// Connect with PAT token
document.getElementById('connect-btn')!.addEventListener('click', async () => {
  const patToken = (document.getElementById('pat-input') as HTMLInputElement).value.trim();
  await handleConnectWithPAT(patToken);
});

// List microtonal tunings
document.getElementById('list-projects-btn')!.addEventListener('click', async () => {
  await handleListProjects();
});

// Open selected project
document.getElementById('open-selected-project-btn')!.addEventListener('click', async () => {
  const selectedProject = (document.getElementById('project-select') as HTMLSelectElement).value;
  await handleOpenSelectedProject(selectedProject);
});

// Open project and start syncing
document.getElementById('open-project-btn')!.addEventListener('click', async () => {
  const projectUrl = (document.getElementById('project-url') as HTMLInputElement).value.trim();
  await handleOpenProject(projectUrl);
});

// Query all devices
document.getElementById('query-devices-btn')!.addEventListener('click', async () => {
  await handleQueryDevices();
});

// Create Synth synth
document.getElementById('create-synth-btn')!.addEventListener('click', async () => {
  const result = await handleCreateSynth();
  if (result) {
    // randomPatch(result.synth);
    const { synth, placement } = result;
    log(`Event listener: Got Synth synth ${synth.id} at position (${placement.fields.x.value}, ${placement.fields.y.value})`);

    // Create a note track using this Synth synth as the player
    try {
      // Generate notes outside of the transaction first
      const notes = await handleTestGoldenPond();

      const trackResult = await nexus!.modify((t) => {
        // Create a note track for the Synth synth
        const noteTrack = t.create("noteTrack", {
          orderAmongTracks: 0,
          player: synth.location,
        });

        // Create a note collection for the track
        const noteCollection = t.create("noteCollection", {});

        // Add a note region with the note collection
        const noteRegion = t.create("noteRegion", {
          track: noteTrack.location,
          noteCollection: noteCollection.location,
          region: {
            positionTicks: 0,
            durationTicks: QUARTER_NOTE * 256, // 4 qtr 1/4 notes
            loopDurationTicks: QUARTER_NOTE * 256,
            loopOffsetTicks: 0,
          },
        });

        const notesList = notes.map(note => {
          return t.create("note", {
            noteCollection: noteCollection.location,
            pitch: note.pitch, // C4
            positionTicks: note.positionTicks,
            durationTicks: note.durationTicks,
            velocity: note.velocity,
            slide: false
          });
        });
        return { noteTrack, noteCollection, noteRegion, notesList };
      });

      log(`Created note track ${trackResult.noteTrack.id} for Synth synth`);
      log(`Created note collection ${trackResult.noteCollection.id} and region ${trackResult.noteRegion.id}`);
      log(`Added notes from GoldenPond generation`);
    } catch (error) {
      log('Error creating note track for Synth: ' + (error as Error).message);
    }
  }
});

// Clear stored token
document.getElementById('clear-token-btn')!.addEventListener('click', () => {
  handleClearToken();
});

// Auto connect and open project using stored values
document.getElementById('auto-connect-btn')!.addEventListener('click', async () => {
  await handleAutoConnect();
});

// Clear stored project URL
document.getElementById('clear-project-btn')!.addEventListener('click', () => {
  handleClearProject();
});

// List notes in project
document.getElementById('list-notes-btn')!.addEventListener('click', async () => {
  await handleListNotes();
});

// Create a new note
document.getElementById('create-note-btn')!.addEventListener('click', async () => {
  await handleCreateNote();
});

// Apply microtonal tuning using MicroTuningOctave
document.getElementById('adjust-pitch-btn')!.addEventListener('click', async () => {
  const centsOffset = parseFloat((document.getElementById('pitch-offset') as HTMLInputElement).value);
  await handleApplyMicrotuning(centsOffset);
});

// Clear all microtonal tunings
document.getElementById('clear-tunings-btn')!.addEventListener('click', async () => {
  await handleClearTunings();
});

// Initial log
log('Audiotool Nexus API Demo initialized');
log('Please enter your PAT token to get started');
log('Get your token from: https://rpc.audiotool.com/dev');

// Load saved values when the app starts
loadSavedValues();