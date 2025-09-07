import { log } from '../log.js'
import { handleApplyMicrotuning, handleAutoConnect, handleClearToken, handleClearTunings, handleConnectWithPAT, handleCreateNote, handleCreateNoteTrack, handleListNotes, handleListProjects, handleOpenProject, handleOpenSelectedProject, handleQueryDevices } from './audio-tool-connect.js';

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
        <button id="list-projects-btn">List My Projects</button>
        <div id="projects-list" style="display: none;">
          <h4>Select a Project:</h4>
          <select id="project-select" style="width: 100%; margin: 0.5em 0;">
            <option value="">Choose a project...</option>
          </select>
          <button id="open-selected-project-btn">Open Selected Project</button>
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
        <button id="create-note-track-btn">Create Note Track</button>
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
        <pre id="output"></pre>
      </div>
    </div>
  </div>
`

// Load saved values from localStorage
export const loadSavedValues = (): void => {
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

export const handleClearProject = (): void => {
  localStorage.removeItem(STORAGE_KEYS.PROJECT_URL);
  (document.getElementById('project-url') as HTMLInputElement).value = '';
  log('Stored project URL cleared');
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

// Create note track
document.getElementById('create-note-track-btn')!.addEventListener('click', async () => {
  await handleCreateNoteTrack();
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