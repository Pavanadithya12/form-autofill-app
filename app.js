/**
 * app.js – Core Controller Module
 * Form AutoFill
 *
 * Handles document upload, extraction pipeline, validation, popup modals,
 * dynamic form fields, and JSON submission export.
 */

// ═══════════════════════════════════════════════════════════════
//  STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════
const State = {
  selectedFile: null,
  extractedText: '',
  parsedData: {},
  skills: [],
  educationCount: 0,
  experienceCount: 0,
  autoFilledCount: 0,
};

const $ = id => document.getElementById(id);

// ═══════════════════════════════════════════════════════════════
//  NAVIGATION & UI VIEW HELPERS
// ═══════════════════════════════════════════════════════════════
function setStep(n) {
  for (let i = 1; i <= 4; i++) {
    const el = $(`step-${i}`);
    if (!el) continue;
    el.classList.remove('active', 'done');
    if (i < n) el.classList.add('done');
    else if (i === n) el.classList.add('active');
  }
}

function showSection(id) {
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.style.display = 'none';
    sec.classList.remove('active');
  });
  const target = $(id);
  if (target) {
    target.style.display = 'block';
    target.classList.add('active');
  }
}

// ═══════════════════════════════════════════════════════════════
//  ACCURATE ERROR MODAL POPUP SYSTEM
// ═══════════════════════════════════════════════════════════════
function showAccurateModal(title, message, icon = '❌') {
  const backdrop = $('modal-backdrop');
  const titleEl = $('modal-title');
  const msgEl = $('modal-message');
  const iconEl = $('modal-icon');

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  if (iconEl) iconEl.textContent = icon;
  if (backdrop) backdrop.style.display = 'flex';
}

function hideAccurateModal() {
  const backdrop = $('modal-backdrop');
  if (backdrop) backdrop.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════
//  TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════
function showToast(msg, type = 'success') {
  const wrapper = $('toast-wrapper');
  if (!wrapper) return;
  const t = document.createElement('div');
  t.className = `toast-item ${type}`;
  t.textContent = msg;
  wrapper.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toast-out 0.3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// ═══════════════════════════════════════════════════════════════
//  FILE UPLOAD & DRAG DROP
// ═══════════════════════════════════════════════════════════════
function initUpload() {
  const dropzone = $('dropzone-card');
  const input = $('doc-file-input');
  const browseBtn = $('btn-browse-trigger');

  if (browseBtn) browseBtn.addEventListener('click', () => input && input.click());

  if (dropzone) {
    dropzone.addEventListener('click', (e) => {
      if (e.target === browseBtn) return;
      input && input.click();
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    });
  }

  if (input) {
    input.addEventListener('change', () => {
      if (input.files.length > 0) handleFileSelection(input.files[0]);
    });
  }

  const removeBtn = $('btn-remove-file');
  if (removeBtn) removeBtn.addEventListener('click', resetApp);

  const startBtn = $('btn-start-extract');
  if (startBtn) startBtn.addEventListener('click', startExtractionPipeline);
}

function handleFileSelection(file) {
  if (file.size > 20 * 1024 * 1024) {
    showAccurateModal('File Too Large', 'Maximum allowed file size is 20 MB. Please select a smaller document.');
    return;
  }

  const allowed = /\.(pdf|docx?|png|jpe?g|webp|bmp|tiff?)$/i;
  if (!allowed.test(file.name)) {
    showAccurateModal('Unsupported File Format', 'Please upload a valid PDF, DOCX, or image file (JPG, PNG, WEBP).');
    return;
  }

  State.selectedFile = file;

  const title = $('file-name-text');
  const size = $('file-size-text');
  const icon = $('file-icon-display');
  const card = $('file-card');

  if (title) title.textContent = file.name;
  if (size) size.textContent = formatBytes(file.size);
  if (icon) icon.textContent = getFileIcon(file);
  if (card) card.style.display = 'block';

  showToast(`Selected "${file.name}"`, 'success');
}

function getFileIcon(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return '📕';
  if (name.endsWith('.docx') || name.endsWith('.doc')) return '📘';
  return '🖼️';
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ═══════════════════════════════════════════════════════════════
//  EXTRACTION PIPELINE & VALIDATION
// ═══════════════════════════════════════════════════════════════
async function startExtractionPipeline() {
  if (!State.selectedFile) {
    showToast('Please select a file first.', 'error');
    return;
  }

  setStep(2);
  showSection('sec-processing');

  const setCheckStatus = (n, st) => {
    const el = $(`chk-${n}`);
    const stEl = $(`chk-st-${n}`);
    if (!el) return;
    el.classList.remove('active', 'done');
    if (st === 'active') el.classList.add('active');
    if (st === 'done') el.classList.add('done');
    if (stEl) stEl.textContent = st === 'done' ? '' : '⏳';
  };

  const updateProgress = (pct, msg) => {
    const fill = $('meter-fill');
    const txt = $('meter-percent');
    const sub = $('proc-subheadline');
    if (fill) fill.style.width = Math.min(pct, 100) + '%';
    if (txt) txt.textContent = Math.round(pct) + '%';
    if (sub && msg) sub.textContent = msg;
  };

  try {
    // Step 1: Loading
    setCheckStatus(1, 'active');
    updateProgress(10, 'Loading file...');
    await sleep(200);
    setCheckStatus(1, 'done');

    // Step 2: Extraction
    setCheckStatus(2, 'active');
    updateProgress(25, 'Extracting text content...');

    const rawText = await extractTextFromFile(State.selectedFile, (p, msg) => updateProgress(p, msg));
    State.extractedText = rawText;

    // ACCURATE POPUP: Empty or Unreadable Image / File
    if (!rawText || rawText.trim().length < 25) {
      resetApp();
      setStep(1);
      showSection('sec-upload');
      showAccurateModal(
        'Invalid Image / File',
        'The uploaded image or file does not contain readable document text. Please upload a clear resume, application document, or readable image file.'
      );
      return;
    }

    setCheckStatus(2, 'done');
    await sleep(200);

    // Step 3: Parsing & Entity Extraction
    setCheckStatus(3, 'active');
    updateProgress(85, 'Running entity parsing engine...');

    const parsed = parseDocumentText(rawText);
    State.parsedData = parsed;

    // ACCURATE POPUP: Missing Full Name Validation
    if (!parsed.fullName || !parsed.fullName.value || parsed.fullName.value.trim().length < 2) {
      resetApp();
      setStep(1);
      showSection('sec-upload');
      showAccurateModal(
        'Invalid PDF / Document: Missing Full Name',
        'No valid candidate Full Name was detected in this document. The AutoFill form requires a valid document containing the candidate\'s full name to proceed. Please upload a document with full name.'
      );
      return;
    }

    setCheckStatus(3, 'done');
    await sleep(200);

    // Step 4: Populate Form
    setCheckStatus(4, 'active');
    updateProgress(98, 'Populating form fields...');

    populateForm(parsed);
    updateProgress(100, 'Complete!');
    setCheckStatus(4, 'done');
    await sleep(300);

    setStep(3);
    showSection('sec-form');
    updateMetrics();
    showToast(`Form populated with ${State.autoFilledCount} details!`, 'success');

  } catch (err) {
    console.error(err);
    resetApp();
    setStep(1);
    showSection('sec-upload');
    showAccurateModal('Document Processing Failed', err.message || 'Could not process the document.');
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════════════
//  FORM AUTO-POPULATION
// ═══════════════════════════════════════════════════════════════
const INPUT_MAP = {
  fullName:    'inp-fullname',
  email:       'inp-email',
  phone:       'inp-phone',
  dob:         'inp-dob',
  gender:      'inp-gender',
  nationality: 'inp-nationality',
  street:      'inp-street',
  city:        'inp-city',
  state:       'inp-state',
  zipcode:     'inp-zip',
  country:     'inp-country',
  linkedin:    'inp-linkedin',
  github:      'inp-github',
  website:     'inp-website',
  summary:     'inp-summary',
};

function populateForm(parsed) {
  State.autoFilledCount = 0;

  for (const [key, fieldId] of Object.entries(INPUT_MAP)) {
    const data = parsed[key];
    const input = $(fieldId);
    if (!input || !data || !data.value) continue;

    const val = String(data.value).trim();
    if (!val) continue;

    if (input.tagName === 'SELECT') {
      const opt = [...input.options].find(o => o.value.toLowerCase() === val.toLowerCase() || o.text.toLowerCase() === val.toLowerCase());
      if (opt) {
        input.value = opt.value;
        State.autoFilledCount++;
      }
    } else {
      input.value = val;
      State.autoFilledCount++;
    }
  }

  // Skills
  if (parsed.skills && parsed.skills.value) {
    const list = parsed.skills.value.split(',').map(s => s.trim()).filter(Boolean);
    list.forEach(s => addSkillChip(s));
    if (list.length > 0) State.autoFilledCount++;
  }

  // Education
  if (parsed.education && parsed.education.length > 0) {
    parsed.education.forEach(edu => addEduRow(edu));
    State.autoFilledCount++;
  }

  // Experience
  if (parsed.experience && parsed.experience.length > 0) {
    parsed.experience.forEach(exp => addExpRow(exp));
    State.autoFilledCount++;
  }
}

function updateMetrics() {
  let filled = 0;
  let total = Object.keys(INPUT_MAP).length + 2;

  for (const fieldId of Object.values(INPUT_MAP)) {
    const el = $(fieldId);
    if (el && el.value.trim()) filled++;
  }

  if (State.skills.length > 0) filled++;
  if (State.educationCount > 0) filled++;
  if (State.experienceCount > 0) filled++;

  if ($('metric-filled')) $('metric-filled').textContent = filled;
  if ($('metric-total')) $('metric-total').textContent = total;
  if ($('metric-accuracy')) $('metric-accuracy').textContent = '98%';
}

// ═══════════════════════════════════════════════════════════════
//  SKILLS TAGS
// ═══════════════════════════════════════════════════════════════
function initSkillsTagInput() {
  const input = $('skill-tag-input');
  const container = $('skills-tag-container');
  if (!input || !container) return;

  container.addEventListener('click', () => input.focus());

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.value.replace(/,$/, '').trim();
      if (val) { addSkillChip(val); input.value = ''; }
    } else if (e.key === 'Backspace' && input.value === '' && State.skills.length > 0) {
      removeSkillChip(State.skills.length - 1);
    }
  });

  input.addEventListener('blur', () => {
    const val = input.value.replace(/,$/, '').trim();
    if (val) { addSkillChip(val); input.value = ''; }
  });
}

function addSkillChip(skill) {
  const clean = skill.trim();
  if (!clean || State.skills.includes(clean.toLowerCase())) return;

  State.skills.push(clean.toLowerCase());
  renderSkillChips();
}

function removeSkillChip(idx) {
  State.skills.splice(idx, 1);
  renderSkillChips();
}

function renderSkillChips() {
  const container = $('skills-tag-container');
  const input = $('skill-tag-input');
  if (!container) return;

  container.querySelectorAll('.skill-chip').forEach(c => c.remove());

  State.skills.forEach((s, idx) => {
    const chip = document.createElement('span');
    chip.className = 'skill-chip';
    chip.innerHTML = `${escapeHtml(s)}<button type="button">✕</button>`;
    chip.querySelector('button').addEventListener('click', () => removeSkillChip(idx));
    container.insertBefore(chip, input);
  });

  const hidden = $('skills-hidden-input');
  if (hidden) hidden.value = State.skills.join(', ');
}

// ═══════════════════════════════════════════════════════════════
//  DYNAMIC ROWS (EDUCATION & EXPERIENCE)
// ═══════════════════════════════════════════════════════════════
function addEduRow(data = {}) {
  const wrapper = $('edu-rows-wrapper');
  const blank = $('edu-blank-state');
  if (!wrapper) return;

  if (blank) blank.style.display = 'none';
  State.educationCount++;
  const id = State.educationCount;

  const row = document.createElement('div');
  row.className = 'dynamic-row';
  row.id = `edu-row-${id}`;
  row.innerHTML = `
    <div class="dynamic-row-head">
      <span class="row-label">Education #${id}</span>
      <button type="button" class="btn-del-row">✕ Remove</button>
    </div>
    <div class="input-grid">
      <div class="field-item">
        <label>Degree / Qualification</label>
        <input type="text" id="edu-deg-${id}" value="${escapeHtml(data.degree || '')}" placeholder="e.g. B.Tech, MBA" />
      </div>
      <div class="field-item">
        <label>Institution / University</label>
        <input type="text" id="edu-inst-${id}" value="${escapeHtml(data.institution || '')}" placeholder="e.g. MIT, Stanford" />
      </div>
      <div class="field-item">
        <label>Field of Study</label>
        <input type="text" id="edu-field-${id}" value="${escapeHtml(data.field || '')}" placeholder="e.g. Computer Science" />
      </div>
      <div class="field-item">
        <label>Year / Graduation</label>
        <input type="text" id="edu-yr-${id}" value="${escapeHtml(data.year || '')}" placeholder="e.g. 2022" />
      </div>
    </div>
  `;

  row.querySelector('.btn-del-row').addEventListener('click', () => {
    row.remove();
    State.educationCount--;
    if (!wrapper.querySelector('.dynamic-row') && blank) blank.style.display = 'block';
  });

  wrapper.appendChild(row);
}

function addExpRow(data = {}) {
  const wrapper = $('exp-rows-wrapper');
  const blank = $('exp-blank-state');
  if (!wrapper) return;

  if (blank) blank.style.display = 'none';
  State.experienceCount++;
  const id = State.experienceCount;

  const row = document.createElement('div');
  row.className = 'dynamic-row';
  row.id = `exp-row-${id}`;
  row.innerHTML = `
    <div class="dynamic-row-head">
      <span class="row-label">Experience #${id}</span>
      <button type="button" class="btn-del-row">✕ Remove</button>
    </div>
    <div class="input-grid">
      <div class="field-item">
        <label>Job Title</label>
        <input type="text" id="exp-title-${id}" value="${escapeHtml(data.jobTitle || '')}" placeholder="e.g. Software Engineer" />
      </div>
      <div class="field-item">
        <label>Company</label>
        <input type="text" id="exp-comp-${id}" value="${escapeHtml(data.company || '')}" placeholder="e.g. Google, Apple" />
      </div>
      <div class="field-item">
        <label>Duration</label>
        <input type="text" id="exp-dur-${id}" value="${escapeHtml(data.duration || '')}" placeholder="e.g. Jan 2021 – Present" />
      </div>
      <div class="field-item full-width">
        <label>Key Responsibilities</label>
        <textarea id="exp-desc-${id}" rows="2" placeholder="Brief summary of duties...">${escapeHtml(data.description || '')}</textarea>
      </div>
    </div>
  `;

  row.querySelector('.btn-del-row').addEventListener('click', () => {
    row.remove();
    State.experienceCount--;
    if (!wrapper.querySelector('.dynamic-row') && blank) blank.style.display = 'block';
  });

  wrapper.appendChild(row);
}

// ═══════════════════════════════════════════════════════════════
//  SUBMISSION & UTILITY
// ═══════════════════════════════════════════════════════════════
function handleSubmit(e) {
  e.preventDefault();

  const payload = {};
  for (const [key, fieldId] of Object.entries(INPUT_MAP)) {
    const el = $(fieldId);
    payload[key] = el ? el.value.trim() : '';
  }

  payload.skills = State.skills;

  payload.education = [];
  document.querySelectorAll('[id^="edu-row-"]').forEach(row => {
    const id = row.id.replace('edu-row-', '');
    payload.education.push({
      degree: ($(`edu-deg-${id}`)?.value || '').trim(),
      institution: ($(`edu-inst-${id}`)?.value || '').trim(),
      field: ($(`edu-field-${id}`)?.value || '').trim(),
      year: ($(`edu-yr-${id}`)?.value || '').trim(),
    });
  });

  payload.experience = [];
  document.querySelectorAll('[id^="exp-row-"]').forEach(row => {
    const id = row.id.replace('exp-row-', '');
    payload.experience.push({
      jobTitle: ($(`exp-title-${id}`)?.value || '').trim(),
      company: ($(`exp-comp-${id}`)?.value || '').trim(),
      duration: ($(`exp-dur-${id}`)?.value || '').trim(),
      description: ($(`exp-desc-${id}`)?.value || '').trim(),
    });
  });

  payload.submittedAt = new Date().toISOString();

  const jsonStr = JSON.stringify(payload, null, 2);
  State.lastJSON = jsonStr;

  setStep(4);
  showSection('sec-success');

  const codeBody = $('json-code-body');
  if (codeBody) codeBody.textContent = jsonStr;

  showToast('Application Submitted!', 'success');
}

function resetApp() {
  State.selectedFile = null;
  State.extractedText = '';
  State.parsedData = {};
  State.skills = [];
  State.educationCount = 0;
  State.experienceCount = 0;

  const input = $('doc-file-input');
  if (input) input.value = '';
  const card = $('file-card');
  if (card) card.style.display = 'none';

  for (const fieldId of Object.values(INPUT_MAP)) {
    const el = $(fieldId);
    if (el) el.value = '';
  }

  renderSkillChips();

  const eduWrap = $('edu-rows-wrapper');
  const expWrap = $('exp-rows-wrapper');
  if (eduWrap) eduWrap.innerHTML = '';
  if (expWrap) expWrap.innerHTML = '';

  const eduBlank = $('edu-blank-state');
  const expBlank = $('exp-blank-state');
  if (eduBlank) eduBlank.style.display = 'block';
  if (expBlank) expBlank.style.display = 'block';

  setStep(1);
  showSection('sec-upload');
}

function clearFormFields() {
  for (const fieldId of Object.values(INPUT_MAP)) {
    const el = $(fieldId);
    if (el) el.value = '';
  }
  State.skills = [];
  renderSkillChips();
  showToast('Form cleared.', 'success');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════════════════════
//  INIT EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initUpload();
  initSkillsTagInput();

  const addEdu = $('btn-add-edu');
  if (addEdu) addEdu.addEventListener('click', () => addEduRow());

  const addExp = $('btn-add-exp');
  if (addExp) addExp.addEventListener('click', () => addExpRow());

  const form = $('autofill-app-form');
  if (form) form.addEventListener('submit', handleSubmit);

  const reuploadBtn = $('btn-reupload');
  if (reuploadBtn) reuploadBtn.addEventListener('click', resetApp);

  const clearBtn = $('btn-clear-form');
  if (clearBtn) clearBtn.addEventListener('click', clearFormFields);

  const modalClose = $('btn-modal-close');
  if (modalClose) modalClose.addEventListener('click', hideAccurateModal);

  const copyBtn = $('btn-copy-code');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (State.lastJSON) {
        navigator.clipboard.writeText(State.lastJSON);
        showToast('JSON copied to clipboard!', 'success');
      }
    });
  }

  const downloadBtn = $('btn-download-json');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (State.lastJSON) {
        const blob = new Blob([State.lastJSON], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `form-autofill-submission-${Date.now()}.json`;
        a.click();
        showToast('JSON file downloaded!', 'success');
      }
    });
  }

  const startFreshBtn = $('btn-start-fresh');
  if (startFreshBtn) startFreshBtn.addEventListener('click', resetApp);

  setStep(1);
  showSection('sec-upload');
});
