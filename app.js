/* ==========================================================================
   ApexTimeline Core JS Engine
   State Management, UI Renderers, local persistence, and Seed Data
   ========================================================================== */

import { scheduleCloudSave } from './cloud-sync.js';

// --- DEFAULT CATEGORIES CONFIGURATION ---
const DEFAULT_CATEGORIES = {
  academics: { name: 'Academics', color: '#6366f1' },
  sat: { name: 'SAT Prep', color: '#f59e0b' },
  drone: { name: 'STEM Project (Drone)', color: '#10b981' },
  research: { name: 'Research (Polygence)', color: '#06b6d4' },
  robotics: { name: 'Robotics Leadership', color: '#ef4444' },
  competitions: { name: 'STEM Competitions', color: '#8b5cf6' },
  'college-apps': { name: 'College Apps & Essays', color: '#ec4899' }
};

// Start and End range for the Master Timeline (June 2026 to January 2028)
const TIMELINE_START_YEAR = 2026;
const TIMELINE_START_MONTH = 5; // 0-indexed (June)
const TIMELINE_END_YEAR = 2028;
const TIMELINE_END_MONTH = 0; // 0-indexed (January)

// Global State
let state = {
  events: [],
  weeklyHours: {},       // Key: 'week-W-YYYY', Value: { category: hours }
  dailyReflections: {},  // Key: 'YYYY-MM-DD', Value: string
  activeLayer: 1,
  activeDate: '2026-06-22', // System default today (June 22, 2026)
  filterCategory: null,  // Selected category filter (null means all active)
  zoomLevel: 1.0,        // Timeline zoom level modifier
  theme: 'dark',         // 'dark' or 'light'
  categories: {},         // Dynamically customized categories map
  panelCollapsed: {
    sidebar: false,
    milestones: false,
    weeklyPanel: false
  }
};

// --- REALISTIC DATA SEED FOR PRE-POPULATION ---
const SEED_DATA = {
  events: [
    // --- LAYER 1: MASTER PHASES ---
    {
      id: 'p-acad-1',
      title: 'AP Calculus BC & AP Physics C Prep Course',
      description: 'Strengthen fundamental math/physics limits & mechanics before school starts to guarantee A grades.',
      category: 'academics',
      type: 'phase',
      startDate: '2026-06-01',
      endDate: '2026-08-31',
      completed: false
    },
    {
      id: 'p-acad-2',
      title: 'Fall Semester GPA Maintenance (Target: 4.0 UW)',
      description: 'Score maximum on tests in AP Calc, AP Physics, AP Chemistry, AP US History.',
      category: 'academics',
      type: 'phase',
      startDate: '2026-09-01',
      endDate: '2027-01-20',
      completed: false
    },
    {
      id: 'p-sat-1',
      title: 'SAT Concepts Study & Prep Course',
      description: 'Daily practice on Khan Academy & Erica Meltzer Grammar guides. Goal: 1550+ SAT.',
      category: 'sat',
      type: 'phase',
      startDate: '2026-06-01',
      endDate: '2026-08-25',
      completed: false
    },
    {
      id: 'p-sat-2',
      title: 'SAT Mock Exams & Revision Intensive',
      description: 'Taking full weekly mock tests, reviewing error logs, adjusting speed.',
      category: 'sat',
      type: 'phase',
      startDate: '2026-09-01',
      endDate: '2026-10-05',
      completed: false
    },
    {
      id: 'p-drone-1',
      title: 'Drone Frame CAD Design & Aerodynamics Simulation',
      description: 'Model customized drone chassis in Fusion360. Conduct CFD stress simulation analysis for heavy loads.',
      category: 'drone',
      type: 'phase',
      startDate: '2026-06-01',
      endDate: '2026-09-15',
      completed: false
    },
    {
      id: 'p-drone-2',
      title: 'Electronics Selection & ESC Calibration',
      description: 'Procure brushless motors, LiPo batteries, carbon fiber plates. Connect components and calibrate ESC configurations.',
      category: 'drone',
      type: 'phase',
      startDate: '2026-09-16',
      endDate: '2027-01-15',
      completed: false
    },
    {
      id: 'p-drone-3',
      title: 'Autonomous Navigation Coding & GPS Field Runs',
      description: 'Write custom flight controller script (Betaflight/PX4 integration). Test waypoint loops in open fields.',
      category: 'drone',
      type: 'phase',
      startDate: '2027-01-16',
      endDate: '2027-06-30',
      completed: false
    },
    {
      id: 'p-res-1',
      title: 'Polygence Research: Topic Selection & Lit Review',
      description: 'Synthesize research ideas on autonomous micro-drones. Construct bibliography of 15 IEEE research articles.',
      category: 'research',
      type: 'phase',
      startDate: '2026-06-01',
      endDate: '2026-08-30',
      completed: false
    },
    {
      id: 'p-res-2',
      title: 'Polygence Research: Data Collection & Experimentation',
      description: 'Run simulation parameters, compare thrust curves, analyze flight control software drift measurements.',
      category: 'research',
      type: 'phase',
      startDate: '2026-09-01',
      endDate: '2026-12-20',
      completed: false
    },
    {
      id: 'p-res-3',
      title: 'Polygence Manuscript Writing & Revisions',
      description: 'Structure introduction, methodology, data tables, discussion. Refine with academic supervisor.',
      category: 'research',
      type: 'phase',
      startDate: '2027-01-01',
      endDate: '2027-04-30',
      completed: false
    },
    {
      id: 'p-rob-1',
      title: 'Founding Robotics Team & School Charter Approval',
      description: 'Secure teacher adviser support, draft bylaws, submit charter request to the student union board.',
      category: 'robotics',
      type: 'phase',
      startDate: '2026-06-01',
      endDate: '2026-08-31',
      completed: false
    },
    {
      id: 'p-rob-2',
      title: 'FRC/VEX Member Recruitment & CAD Training Workshops',
      description: 'Present at club fairs. Conduct weekly CAD and soldering training modules for 12 new members.',
      category: 'robotics',
      type: 'phase',
      startDate: '2026-09-01',
      endDate: '2026-12-15',
      completed: false
    },
    {
      id: 'p-comp-1',
      title: 'USACO Training Program (Bronze-to-Gold Prep)',
      description: 'Solve dynamic programming, BFS/DFS, and sorting/searching problems on USACO training platform.',
      category: 'competitions',
      type: 'phase',
      startDate: '2026-06-01',
      endDate: '2026-12-10',
      completed: false
    },
    {
      id: 'p-comp-2',
      title: 'ISEF Project Abstract Design & Plan Submission',
      description: 'Draft the experiment design, safety outlines, and bibliography to register for local regional science fair.',
      category: 'competitions',
      type: 'phase',
      startDate: '2026-06-15',
      endDate: '2026-09-30',
      completed: false
    },
    {
      id: 'p-coll-1',
      title: 'Target University Research & Admissions Profile Mapping',
      description: 'Develop custom spreadsheet tracking application deadlines, average GPA/SAT targets, and professor contact emails.',
      category: 'college-apps',
      type: 'phase',
      startDate: '2026-06-01',
      endDate: '2026-12-31',
      completed: false
    },
    {
      id: 'p-coll-2',
      title: 'Personal Statement Drafting & Iterative Reviews',
      description: 'Write Common App prompts drafts. Focus on the drone engineering breakthrough and overcoming flight failures.',
      category: 'college-apps',
      type: 'phase',
      startDate: '2027-06-01',
      endDate: '2027-09-30',
      completed: false
    },
    {
      id: 'p-coll-3',
      title: 'Supplemental Essays & Engineering Portfolio Compilation',
      description: 'Write "Why School / Why Major" essays for MIT, Stanford, Berkeley, Georgia Tech. Finalize code repositories.',
      category: 'college-apps',
      type: 'phase',
      startDate: '2027-08-01',
      endDate: '2027-11-15',
      completed: false
    },
    {
      id: 'p-coll-4',
      title: 'Early Action Submissions Deadline',
      description: 'Submit Early Action/Decision files to top-priority engineering school.',
      category: 'college-apps',
      type: 'phase',
      startDate: '2027-10-01',
      endDate: '2027-11-01',
      completed: false
    },
    {
      id: 'p-coll-5',
      title: 'Regular Decision Applications Finalization',
      description: 'Proofread all supplemental paragraphs. Submit applications, self-report scores, request high school counselor transcripts.',
      category: 'college-apps',
      type: 'phase',
      startDate: '2027-11-02',
      endDate: '2028-01-05',
      completed: false
    },

    // --- LAYER 2: MONTHLY MILESTONES (June 2026) ---
    {
      id: 'm-acad-1',
      title: 'Review Calculus limit theorems & derivatives packet',
      description: 'Work through AP Calculus BC review handbook problems.',
      category: 'academics',
      type: 'milestone',
      startDate: '2026-06-30',
      endDate: '2026-06-30',
      completed: false
    },
    {
      id: 'm-sat-1',
      title: 'Complete 3 full-length digital SAT diagnostic tests',
      description: 'Take tests under exact timing constraints on Bluebook app. Goal: Analyze score profile.',
      category: 'sat',
      type: 'milestone',
      startDate: '2026-06-28',
      endDate: '2026-06-28',
      completed: true
    },
    {
      id: 'm-drone-1',
      title: 'Finalize CAD arm-stress analysis and select motors',
      description: 'Determine thrust-to-weight ratio parameters. Finalize frame thickness at 3mm carbon fiber.',
      category: 'drone',
      type: 'milestone',
      startDate: '2026-06-29',
      endDate: '2026-06-29',
      completed: false
    },
    {
      id: 'm-res-1',
      title: 'Select specific research title & map mentor tasks',
      description: 'Approve curriculum syllabus outline with Polygence research supervisor.',
      category: 'research',
      type: 'milestone',
      startDate: '2026-06-25',
      endDate: '2026-06-25',
      completed: true
    },
    {
      id: 'm-rob-1',
      title: 'Submit official student club proposal to principal',
      description: 'Submit club handbook signature sheets and list of teacher advisers.',
      category: 'robotics',
      type: 'milestone',
      startDate: '2026-06-26',
      endDate: '2026-06-26',
      completed: false
    },
    {
      id: 'm-coll-1',
      title: 'Build college spreadsheet with 12 engineering schools',
      description: 'Outline application requirements, interview formats, deadlines, and key research labs.',
      category: 'college-apps',
      type: 'milestone',
      startDate: '2026-06-30',
      endDate: '2026-06-30',
      completed: false
    },

    // --- LAYER 3: WEEKLY PRIORITIES (Week 26: June 22 - June 28, 2026) ---
    {
      id: 'w-drone-1',
      title: 'Evaluate brushless motor thrust models (2207 vs 2306 KV values)',
      description: 'Analyze manufacturer curves for peak current draw and response times.',
      category: 'drone',
      type: 'priority',
      startDate: '2026-06-25',
      endDate: '2026-06-25',
      completed: false
    },
    {
      id: 'w-res-1',
      title: 'Read and annotate 3 literature review papers on autonomous PID control',
      description: 'Summarize core algorithms and control feedback mechanisms.',
      category: 'research',
      type: 'priority',
      startDate: '2026-06-26',
      endDate: '2026-06-26',
      completed: true
    },
    {
      id: 'w-sat-1',
      title: 'Practice 60 grammar questions on SAT punctuation rules',
      description: 'Study semicolons, clauses, commas, and logical linkers on Khan Academy.',
      category: 'sat',
      type: 'priority',
      startDate: '2026-06-27',
      endDate: '2026-06-27',
      completed: false
    },
    {
      id: 'w-acad-1',
      title: 'Solve limit continuity problems in Calc BC Chapter 1-2',
      description: 'Focus on squeeze theorem and delta-epsilon definition practice.',
      category: 'academics',
      type: 'priority',
      startDate: '2026-06-28',
      endDate: '2026-06-28',
      completed: false
    },

    // --- LAYER 4: DAILY TASKS (June 22, 2026) ---
    {
      id: 'd-task-1',
      title: 'Solve AP Calculus BC Limit Exercises',
      description: '10 problems focusing on infinite limits and horizontal asymptotes.',
      category: 'academics',
      type: 'task',
      startDate: '2026-06-22',
      endDate: '2026-06-22',
      startTime: '10:00',
      endTime: '11:30',
      priority: 'high',
      completed: true
    },
    {
      id: 'd-task-2',
      title: 'Digital SAT Math: System of Equations Practice',
      description: 'Complete 30 practice modules. Focus on linear systems and substitution shortcuts.',
      category: 'sat',
      type: 'task',
      startDate: '2026-06-22',
      endDate: '2026-06-22',
      startTime: '13:00',
      endTime: '14:00',
      priority: 'high',
      completed: true
    },
    {
      id: 'd-task-3',
      title: 'Drone Frame CAD Layout optimization',
      description: 'Review structural stress on arm joints in Fusion360 to prevent rotor vibrations.',
      category: 'drone',
      type: 'task',
      startDate: '2026-06-22',
      endDate: '2026-06-22',
      startTime: '15:00',
      endTime: '17:30',
      priority: 'high',
      completed: false
    },
    {
      id: 'd-task-4',
      title: 'Read autonomous drone literature reviews',
      description: 'Annotate two IEEE research papers regarding obstacle detection methods.',
      category: 'research',
      type: 'task',
      startDate: '2026-06-22',
      endDate: '2026-06-22',
      startTime: '19:00',
      endTime: '20:30',
      priority: 'medium',
      completed: true
    },
    {
      id: 'd-task-5',
      title: 'Email Robotics advisor teacher about room bookings',
      description: 'Draft the text detailing planned weekly schedules and target workbench requirements.',
      category: 'robotics',
      type: 'task',
      startDate: '2026-06-22',
      endDate: '2026-06-22',
      startTime: '21:00',
      endTime: '21:45',
      priority: 'low',
      completed: false
    }
  ],
  weeklyHours: {
    'week-26-2026': {
      academics: 10,
      sat: 8,
      drone: 12,
      research: 6,
      robotics: 4,
      competitions: 5,
      'college-apps': 3
    }
  },
  dailyReflections: {
    '2026-06-22': 'Optimized the structural design for the drone frame arms. Stress analysis confirms 3mm carbon fiber plate is required to prevent vibrations during peak load trials. Polygence literature review is going smoothly; annotated 2 papers on LiDAR-based obstacle detection methods. Need to focus more on AP Calc limits tomorrow.'
  }
};

// --- INITIALIZATION ---
export function init() {
  loadState();
  applyPanelCollapseState();
  renderSidebarLegend();
  updateProgressMetrics();
  switchLayer(state.activeLayer);
  setupEventListeners();
  populateCategorySelects();
}

export function refreshUI() {
  applyPanelCollapseState();
  applyTheme();
  renderSidebarLegend();
  updateProgressMetrics();
  switchLayer(state.activeLayer);
  populateCategorySelects();
}

export function applyRemoteState(remoteState) {
  state = {
    ...state,
    events: remoteState.events ?? state.events,
    weeklyHours: remoteState.weeklyHours ?? state.weeklyHours,
    dailyReflections: remoteState.dailyReflections ?? state.dailyReflections,
    categories: remoteState.categories ?? state.categories,
    activeLayer: remoteState.activeLayer ?? state.activeLayer,
    activeDate: remoteState.activeDate ?? state.activeDate,
    filterCategory: remoteState.filterCategory ?? null,
    zoomLevel: remoteState.zoomLevel ?? state.zoomLevel,
    theme: remoteState.theme ?? state.theme,
    panelCollapsed: remoteState.panelCollapsed ?? state.panelCollapsed
  };
  normalizeState();
  persistLocalState();
}

function normalizeState() {
  if (!state.activeDate) state.activeDate = '2026-06-22';
  if (!state.zoomLevel) state.zoomLevel = 1.0;
  if (!state.theme) state.theme = 'dark';
  if (!state.categories || Object.keys(state.categories).length === 0) {
    state.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  }
  if (!state.panelCollapsed) {
    state.panelCollapsed = { sidebar: false, milestones: false, weeklyPanel: false };
  }
  if (!state.events) state.events = [];
  if (!state.weeklyHours) state.weeklyHours = {};
  if (!state.dailyReflections) state.dailyReflections = {};
}

// Load state from local storage or set seed defaults
function loadState() {
  const saved = localStorage.getItem('apex_timeline_state');
  if (saved) {
    try {
      state = JSON.parse(saved);
      normalizeState();
    } catch (e) {
      console.error('Failed to parse saved state, resetting to defaults.', e);
      resetToDefaultState();
    }
  } else {
    resetToDefaultState();
  }
  applyTheme();
}

function persistLocalState() {
  const payload = { ...state, updatedAt: Date.now() };
  localStorage.setItem('apex_timeline_state', JSON.stringify(payload));
}

function resetToDefaultState() {
  state.events = JSON.parse(JSON.stringify(SEED_DATA.events));
  state.weeklyHours = JSON.parse(JSON.stringify(SEED_DATA.weeklyHours));
  state.dailyReflections = JSON.parse(JSON.stringify(SEED_DATA.dailyReflections));
  state.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  state.theme = 'dark';
  state.activeLayer = 1;
  state.activeDate = '2026-06-22';
  state.filterCategory = null;
  state.zoomLevel = 1.0;
  state.panelCollapsed = { sidebar: false, milestones: false, weeklyPanel: false };
  saveState();
  applyTheme();
}

function saveState() {
  persistLocalState();
  scheduleCloudSave({ ...state, updatedAt: Date.now() });
}

// Theme application utility
function applyTheme() {
  if (state.theme === 'light') {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
  } else {
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
  }
}

// Dynamic Contrast calculation for text labels on dynamic colored backgrounds
function getContrastColor(hexcolor) {
  if (!hexcolor || hexcolor[0] !== '#') return '#ffffff';
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 150) ? '#111827' : '#ffffff';
}

// --- SIDEBAR LEGEND & FILTERS ---
function renderSidebarLegend() {
  const container = document.getElementById('category-legend-list');
  container.innerHTML = '';
  
  Object.keys(state.categories).forEach(key => {
    const cat = state.categories[key];
    const item = document.createElement('div');
    item.className = 'legend-item';
    if (state.filterCategory && state.filterCategory !== key) {
      item.classList.add('inactive');
    }
    
    item.innerHTML = `
      <span class="legend-color" style="background-color: ${cat.color}; color: ${cat.color}; box-shadow: 0 0 8px ${cat.color};"></span>
      <span class="legend-name" title="${cat.name}">${cat.name}</span>
      <div class="legend-item-actions">
        <input type="color" class="legend-color-input" value="${cat.color}" title="Change color" data-key="${key}">
        <button type="button" class="legend-edit-btn" data-key="${key}" title="Rename category">
          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button type="button" class="legend-delete-btn" data-key="${key}" title="Delete category">
          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `;
    
    item.querySelector('.legend-name').addEventListener('click', () => {
      if (state.filterCategory === key) {
        state.filterCategory = null;
      } else {
        state.filterCategory = key;
      }
      saveState();
      renderSidebarLegend();
      renderActiveLayer();
    });

    item.querySelector('.legend-color-input').addEventListener('click', (ev) => ev.stopPropagation());
    item.querySelector('.legend-color-input').addEventListener('change', (ev) => {
      ev.stopPropagation();
      state.categories[key].color = ev.target.value;
      saveState();
      renderSidebarLegend();
      renderActiveLayer();
      populateCategorySelects();
    });

    item.querySelector('.legend-edit-btn').addEventListener('click', (ev) => {
      ev.stopPropagation();
      const newName = prompt('Rename category:', cat.name);
      if (newName && newName.trim()) {
        state.categories[key].name = newName.trim();
        saveState();
        renderSidebarLegend();
        renderActiveLayer();
        populateCategorySelects();
      }
    });

    item.querySelector('.legend-delete-btn').addEventListener('click', (ev) => {
      ev.stopPropagation();
      deleteCategory(key);
    });
    
    container.appendChild(item);
  });
}

function addCategory(name, color) {
  if (!name) {
    alert('Please enter a name for the new category.');
    return false;
  }
  const key = `cat-${Date.now()}`;
  state.categories[key] = { name, color };
  saveState();
  renderSidebarLegend();
  renderActiveLayer();
  populateCategorySelects();
  if (document.getElementById('settings-modal').classList.contains('active')) {
    renderCategoryManager();
  }
  return true;
}

function applyPanelCollapseState() {
  const { sidebar, milestones, weeklyPanel } = state.panelCollapsed;

  document.getElementById('app-sidebar').classList.toggle('collapsed', sidebar);
  document.getElementById('sidebar-expand-btn').classList.toggle('visible', sidebar);

  document.getElementById('month-split-container').classList.toggle('milestones-collapsed', milestones);
  document.getElementById('month-milestones-panel').classList.toggle('collapsed', milestones);
  document.getElementById('milestones-expand-btn').classList.toggle('visible', milestones);

  document.getElementById('week-split-container').classList.toggle('weekly-collapsed', weeklyPanel);
  document.getElementById('week-priorities-panel').classList.toggle('collapsed', weeklyPanel);
  document.getElementById('weekly-panel-expand-btn').classList.toggle('visible', weeklyPanel);
}

function togglePanelCollapse(panelKey) {
  state.panelCollapsed[panelKey] = !state.panelCollapsed[panelKey];
  saveState();
  applyPanelCollapseState();
}

// --- UPDATE PROGRESS WIDGETS ---
function updateProgressMetrics() {
  // 1. Milestone Success Rate (Layer 2 milestones in the system)
  const milestones = state.events.filter(e => e.type === 'milestone');
  const completedMilestones = milestones.filter(e => e.completed).length;
  const milestonePct = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;
  
  document.getElementById('milestone-progress-bar').style.width = `${milestonePct}%`;
  document.getElementById('milestone-progress-pct').textContent = `${milestonePct}%`;

  // 2. Daily Tasks completed this week (Calculated relative to activeDate week)
  const currentWeekInfo = getWeekRange(new Date(state.activeDate));
  const weekTasks = state.events.filter(e => {
    if (e.type !== 'task') return false;
    const taskDate = new Date(e.startDate);
    return taskDate >= currentWeekInfo.start && taskDate <= currentWeekInfo.end;
  });
  const completedTasks = weekTasks.filter(e => e.completed).length;
  const taskPct = weekTasks.length > 0 ? Math.round((completedTasks / weekTasks.length) * 100) : 0;
  
  document.getElementById('task-progress-bar').style.width = `${taskPct}%`;
  document.getElementById('task-progress-pct').textContent = `${taskPct}%`;

  // 3. Days left stats (Targeting early submission Nov 1, 2027)
  const appTarget = new Date('2027-11-01');
  const activeDateObj = new Date(state.activeDate);
  const diffTime = appTarget - activeDateObj;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  document.getElementById('stat-days-left').textContent = diffDays > 0 ? diffDays : 0;

  // 4. Count active core project phases
  const activePhases = state.events.filter(e => {
    if (e.type !== 'phase') return false;
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    return activeDateObj >= start && activeDateObj <= end;
  }).length;
  document.getElementById('stat-active-projects').textContent = activePhases;
}

// --- LAYER NAVIGATION TAB SWITCHING ---
function switchLayer(layerNumber) {
  state.activeLayer = layerNumber;
  saveState();
  
  // Highlight tab
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
    if (parseInt(tab.dataset.layer) === layerNumber) {
      tab.classList.add('active');
    }
  });

  // Highlight viewport container
  document.querySelectorAll('.layer-view').forEach(view => {
    view.classList.remove('active');
  });
  
  let targetViewId = 'layer-master';
  if (layerNumber === 2) targetViewId = 'layer-month';
  else if (layerNumber === 3) targetViewId = 'layer-week';
  else if (layerNumber === 4) targetViewId = 'layer-daily';
  
  document.getElementById(targetViewId).classList.add('active');
  
  renderActiveLayer();
}

function renderActiveLayer() {
  if (state.activeLayer === 1) renderMasterTimeline();
  else if (state.activeLayer === 2) renderMonthlyRoadmap();
  else if (state.activeLayer === 3) renderWeeklyDashboard();
  else if (state.activeLayer === 4) renderDailyExecution();
  
  updateProgressMetrics();
}

// --- GENERAL UTILITY FUNCTIONS ---
function formatDateLocal(date) {
  // Returns string formatted YYYY-MM-DD in local time
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekRange(date) {
  // Get Monday to Sunday range for a date
  const day = date.getDay();
  const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(date.setDate(diffToMonday));
  monday.setHours(0,0,0,0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23,59,59,999);
  
  return { start: monday, end: sunday };
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
  return weekNo;
}

// Map month index (from June 2026)
function getMonthIndex(year, month) {
  return (year - TIMELINE_START_YEAR) * 12 + (month - TIMELINE_START_MONTH);
}

// --- POPULATE FORMS ---
function populateCategorySelects() {
  const select = document.getElementById('event-category');
  select.innerHTML = '';
  Object.keys(state.categories).forEach(key => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = state.categories[key].name;
    select.appendChild(opt);
  });
}


// ==========================================================================
// RENDER LAYER 1: MASTER TIMELINE (GANTT VIEW)
// ==========================================================================
function renderMasterTimeline() {
  const root = document.getElementById('timeline-chart-root');
  root.innerHTML = '';

  // Calculate month columns
  const monthColumns = [];
  let currYear = TIMELINE_START_YEAR;
  let currMonth = TIMELINE_START_MONTH;
  
  while (currYear < TIMELINE_END_YEAR || (currYear === TIMELINE_END_YEAR && currMonth <= TIMELINE_END_MONTH)) {
    monthColumns.push({ year: currYear, month: currMonth });
    currMonth++;
    if (currMonth > 11) {
      currMonth = 0;
      currYear++;
    }
  }

  const totalCols = monthColumns.length;
  const colWidth = 140 * state.zoomLevel;
  root.style.gridTemplateColumns = `180px repeat(${totalCols}, minmax(${colWidth}px, 1fr))`;

  // Draw timeline headers
  const spacerHeader = document.createElement('div');
  spacerHeader.className = 'timeline-header-cell';
  spacerHeader.style.position = 'sticky';
  spacerHeader.style.left = '0';
  spacerHeader.style.zIndex = '4';
  spacerHeader.style.borderRight = '1px solid var(--panel-border)';
  spacerHeader.innerHTML = 'Activities Portfolio';
  root.appendChild(spacerHeader);

  const activeDateObj = new Date(state.activeDate);
  const activeYear = activeDateObj.getFullYear();
  const activeMonth = activeDateObj.getMonth();

  monthColumns.forEach((col, index) => {
    const header = document.createElement('div');
    header.className = 'timeline-header-cell';
    const dateText = new Date(col.year, col.month, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    header.innerHTML = dateText;
    
    if (col.year === activeYear && col.month === activeMonth) {
      header.classList.add('today-cell');
      header.innerHTML += ' <span style="font-size: 8px; color: var(--accent-primary); display:block;">(Active)</span>';
    }
    
    root.appendChild(header);
  });

  // Filters setup: identify what elements to show
  const filteredEvents = state.events.filter(e => {
    if (e.type !== 'phase') return false;
    if (state.filterCategory && e.category !== state.filterCategory) return false;
    return true;
  });

  // For each category, draw a Track lane row
  Object.keys(state.categories).forEach(catKey => {
    const categoryInfo = state.categories[catKey];
    
    // Create Row layout
    const labelCell = document.createElement('div');
    labelCell.className = 'timeline-track-label';
    labelCell.innerHTML = `
      <span class="legend-color" style="background-color: ${categoryInfo.color}; box-shadow: 0 0 6px ${categoryInfo.color};"></span>
      <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${categoryInfo.name}</span>
    `;
    root.appendChild(labelCell);
    
    // Grid backgrounds cells
    for (let i = 0; i < totalCols; i++) {
      const cell = document.createElement('div');
      cell.className = 'timeline-grid-cell';
      
      const col = monthColumns[i];
      if (col.year === activeYear && col.month === activeMonth) {
        cell.classList.add('today-col');
      }
      
      cell.addEventListener('click', (ev) => {
        if (ev.target === cell) {
          const clickedDate = new Date(col.year, col.month, 1);
          const endDate = new Date(col.year, col.month + 1, 0); // End of this month
          openAddModal('phase', catKey, formatDateLocal(clickedDate), formatDateLocal(endDate));
        }
      });
      
      root.appendChild(cell);
    }
    
    // Fetch phases for this category
    const catPhases = filteredEvents.filter(e => e.category === catKey);
    
    // To handle overlapping phases elegantly in the track, calculate stacking lanes
    const phasesWithColumns = catPhases.map(p => {
      const pStart = new Date(p.startDate);
      const pEnd = new Date(p.endDate);
      
      let startIdx = getMonthIndex(pStart.getFullYear(), pStart.getMonth());
      let endIdx = getMonthIndex(pEnd.getFullYear(), pEnd.getMonth());
      
      if (startIdx < 0) startIdx = 0;
      if (endIdx >= totalCols) endIdx = totalCols - 1;
      if (startIdx >= totalCols) startIdx = totalCols - 1;
      if (endIdx < 0) endIdx = 0;
      
      return {
        event: p,
        startCol: startIdx + 2, 
        endCol: endIdx + 3,    
        duration: endIdx - startIdx + 1
      };
    });

    phasesWithColumns.sort((a,b) => a.startCol - b.startCol || b.duration - a.duration);
    
    const lanes = []; 
    phasesWithColumns.forEach(p => {
      let laneIndex = 0;
      while (laneIndex < lanes.length && lanes[laneIndex] > p.startCol) {
        laneIndex++;
      }
      lanes[laneIndex] = p.endCol;
      p.lane = laneIndex;
    });

    const maxLanes = Math.max(1, lanes.length);
    labelCell.style.gridRowEnd = `span ${maxLanes}`;
    
    // Render Bars
    phasesWithColumns.forEach(p => {
      const bar = document.createElement('div');
      bar.className = 'timeline-item-bar';
      bar.dataset.cat = p.event.category;
      bar.dataset.eventId = p.event.id;
      bar.style.gridColumn = `${p.startCol} / ${p.endCol}`;
      bar.style.gridRowStart = `span 1`;
      bar.style.alignSelf = 'center';
      
      // Dynamic color styles
      bar.style.backgroundColor = categoryInfo.color;
      bar.style.color = getContrastColor(categoryInfo.color);
      bar.style.borderLeft = `3px solid ${getContrastColor(categoryInfo.color)}`;
      
      bar.innerHTML = p.event.title;
      bar.title = `${p.event.title}\n(${p.event.startDate} to ${p.event.endDate})\n\n${p.event.description}`;
      
      bar.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openEditModal(p.event);
      });
      
      root.appendChild(bar);
    });
  });

  drawTimelineTodayLine(monthColumns, totalCols);
}

function drawTimelineTodayLine(monthColumns, totalCols) {
  const root = document.getElementById('timeline-chart-root');
  const today = new Date(state.activeDate);
  const tYear = today.getFullYear();
  const tMonth = today.getMonth();
  
  let colIndex = -1;
  for (let i = 0; i < monthColumns.length; i++) {
    if (monthColumns[i].year === tYear && monthColumns[i].month === tMonth) {
      colIndex = i;
      break;
    }
  }
  
  if (colIndex !== -1) {
    const activeCell = root.querySelector('.today-col');
    if (activeCell) {
      const line = document.createElement('div');
      line.className = 'timeline-today-line';
      
      const totalDays = new Date(tYear, tMonth + 1, 0).getDate();
      const currentDay = today.getDate();
      const pct = (currentDay / totalDays) * 100;
      
      const colWidth = 140 * state.zoomLevel;
      const leftPos = 180 + colIndex * colWidth + (pct / 100) * colWidth;
      
      line.style.left = `${leftPos}px`;
      root.appendChild(line);
    }
  }
}


// ==========================================================================
// RENDER LAYER 2: MONTHLY ROADMAP (CALENDAR GRID)
// ==========================================================================
function renderMonthlyRoadmap() {
  const activeDateObj = new Date(state.activeDate);
  const year = activeDateObj.getFullYear();
  const month = activeDateObj.getMonth();

  const monthName = activeDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  document.getElementById('calendar-month-title').textContent = monthName;

  const gridRoot = document.getElementById('calendar-days-root');
  gridRoot.innerHTML = '';

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayVal = prevMonthTotalDays - i;
    const dateObj = new Date(year, month - 1, dayVal);
    createDayCell(gridRoot, dayVal, dateObj, true);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateObj = new Date(year, month, day);
    const isToday = formatDateLocal(dateObj) === formatDateLocal(new Date('2026-06-22')); 
    createDayCell(gridRoot, day, dateObj, false, isToday);
  }

  const cellsFilled = firstDayIndex + totalDays;
  const remainingCells = cellsFilled % 7 === 0 ? 0 : 7 - (cellsFilled % 7);
  for (let day = 1; day <= remainingCells; day++) {
    const dateObj = new Date(year, month + 1, day);
    createDayCell(gridRoot, day, dateObj, true);
  }

  renderMonthlyMilestones(year, month);
}

function createDayCell(container, dayNumber, dateObj, isOtherMonth, isToday = false) {
  const cell = document.createElement('div');
  cell.className = 'calendar-day-cell';
  if (isOtherMonth) cell.classList.add('other-month');
  if (isToday) cell.classList.add('today');
  
  const dateStr = formatDateLocal(dateObj);
  if (dateStr === state.activeDate && !isOtherMonth) {
    cell.style.borderColor = 'var(--accent-primary)';
    cell.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.2)';
  }

  cell.innerHTML = `<span class="day-num">${dayNumber}</span>`;
  
  const list = document.createElement('div');
  list.className = 'day-items-list';
  cell.appendChild(list);

  const dayEvents = state.events.filter(e => {
    if (state.filterCategory && e.category !== state.filterCategory) return false;
    
    const start = new Date(e.startDate);
    start.setHours(0,0,0,0);
    
    const end = e.endDate ? new Date(e.endDate) : new Date(e.startDate);
    end.setHours(23,59,59,999);
    
    return dateObj >= start && dateObj <= end;
  });

  dayEvents.slice(0, 5).forEach(e => {
    const cat = state.categories[e.category] || { name: 'Unknown', color: '#3b82f6' };
    const dot = document.createElement('div');
    dot.className = 'day-event-dot-item';
    dot.style.backgroundColor = cat.color;
    dot.style.color = getContrastColor(cat.color);
    dot.innerHTML = `<span class="day-event-cat">${cat.name}</span><span class="day-event-title">${e.title}</span>`;
    dot.title = `${cat.name}: ${e.title}${e.description ? '\n' + e.description : ''}`;
    dot.addEventListener('click', (ev) => {
      ev.stopPropagation();
      openEditModal(e);
    });
    list.appendChild(dot);
  });

  if (dayEvents.length > 5) {
    const more = document.createElement('div');
    more.className = 'day-event-dot-item';
    more.style.background = 'rgba(255, 255, 255, 0.1)';
    more.style.color = 'var(--text-primary)';
    more.style.textAlign = 'center';
    more.textContent = `+${dayEvents.length - 5} more`;
    list.appendChild(more);
  }

  cell.addEventListener('click', () => {
    state.activeDate = dateStr;
    saveState();
    document.querySelectorAll('.calendar-day-cell').forEach(c => c.style.borderColor = '');
    cell.style.borderColor = 'var(--accent-primary)';
    updateProgressMetrics();
  });
  
  cell.addEventListener('dblclick', () => {
    openAddModal('task', null, dateStr, dateStr);
  });

  container.appendChild(cell);
}

function renderMonthlyMilestones(year, month) {
  const list = document.getElementById('monthly-milestones-list');
  list.innerHTML = '';

  const activeDateObj = new Date(state.activeDate);
  const targetYear = activeDateObj.getFullYear();
  const targetMonth = activeDateObj.getMonth();

  const milestones = state.events.filter(e => {
    if (e.type !== 'milestone') return false;
    if (state.filterCategory && e.category !== state.filterCategory) return false;
    
    const d = new Date(e.startDate);
    return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
  });

  if (milestones.length === 0) {
    list.innerHTML = `<p style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-top: 1rem;">No milestones set for this month.</p>`;
    return;
  }

  milestones.forEach(m => {
    const cat = state.categories[m.category] || { name: 'Unknown', color: '#3b82f6' };
    const item = document.createElement('div');
    item.className = 'checklist-item';
    
    item.innerHTML = `
      <div class="checklist-checkbox-wrapper">
        <input type="checkbox" class="checklist-checkbox" id="m-chk-${m.id}" ${m.completed ? 'checked' : ''}>
      </div>
      <div class="checklist-label-container" id="m-label-${m.id}">
        <span class="checklist-title">${m.title}</span>
        <div class="checklist-meta">
          <span class="tag-badge" style="background-color: ${cat.color}20; color: ${cat.color}; border: 1px solid ${cat.color}40;">${cat.name}</span>
          <span>Due: ${new Date(m.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    `;

    const checkbox = item.querySelector('.checklist-checkbox');
    checkbox.addEventListener('change', () => {
      m.completed = checkbox.checked;
      saveState();
      updateProgressMetrics();
    });

    item.querySelector('.checklist-label-container').addEventListener('click', (ev) => {
      if (ev.target.className !== 'checklist-checkbox') {
        openEditModal(m);
      }
    });

    list.appendChild(item);
  });
}


// ==========================================================================
// RENDER LAYER 3: WEEKLY DASHBOARD
// ==========================================================================
function renderWeeklyDashboard() {
  const activeDateObj = new Date(state.activeDate);
  const weekInfo = getWeekRange(activeDateObj);
  const weekNum = getWeekNumber(activeDateObj);
  
  const rangeStr = `${weekInfo.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekInfo.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${weekInfo.end.getFullYear()}`;
  document.getElementById('weekly-dashboard-title').textContent = `Week ${weekNum} (${rangeStr})`;

  const columnsRoot = document.getElementById('week-columns-root');
  columnsRoot.innerHTML = '';

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekInfo.start);
    dayDate.setDate(weekInfo.start.getDate() + i);
    const dateStr = formatDateLocal(dayDate);
    const isToday = dateStr === formatDateLocal(new Date('2026-06-22'));
    const isCurrentActive = dateStr === state.activeDate;
    
    const col = document.createElement('div');
    col.className = 'week-day-column';
    if (isToday) col.classList.add('today');
    if (isCurrentActive) {
      col.style.borderColor = 'var(--accent-primary)';
      col.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.15)';
    }

    col.innerHTML = `
      <div class="column-header">
        <h4>${dayNames[i]}</h4>
        <span>${dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
      <div class="column-events-list" id="col-list-${dateStr}">
        <!-- Day specific column cards -->
      </div>
    `;

    col.addEventListener('click', () => {
      state.activeDate = dateStr;
      saveState();
      document.querySelectorAll('.week-day-column').forEach(c => c.style.borderColor = '');
      col.style.borderColor = 'var(--accent-primary)';
      updateProgressMetrics();
    });

    columnsRoot.appendChild(col);

    const colList = col.querySelector('.column-events-list');
    
    const dayEvents = state.events.filter(e => {
      if (state.filterCategory && e.category !== state.filterCategory) return false;
      
      const start = new Date(e.startDate);
      start.setHours(0,0,0,0);
      
      const end = e.endDate ? new Date(e.endDate) : new Date(e.startDate);
      end.setHours(23,59,59,999);
      
      return dayDate >= start && dayDate <= end;
    });

    if (dayEvents.length === 0) {
      colList.innerHTML = `<span style="font-size: 0.65rem; color: var(--text-muted); text-align: center; margin-top: 2rem; display: block; width: 100%;">No events</span>`;
    } else {
      dayEvents.forEach(e => {
        const cat = state.categories[e.category] || { color: '#3b82f6' };
        const card = document.createElement('div');
        card.className = 'column-event-card';
        card.style.borderLeft = `3px solid ${cat.color}`;
        card.title = `${e.title}\n${e.description}`;
        
        let metaTime = '';
        if (e.startTime) {
          metaTime = `${e.startTime} - ${e.endTime || ''}`;
        } else if (e.type === 'phase') {
          metaTime = 'Phase';
        } else if (e.type === 'milestone') {
          metaTime = 'Milestone';
        } else {
          metaTime = 'Event';
        }

        card.innerHTML = `
          <h5>${e.title}</h5>
          <span class="column-event-meta">${metaTime}</span>
          <span class="column-event-cat" style="color: ${cat.color};">${(state.categories[e.category] || {}).name || 'Event'}</span>
          ${e.description ? `<p class="column-event-desc">${e.description}</p>` : ''}
        `;

        card.addEventListener('click', (ev) => {
          ev.stopPropagation();
          openEditModal(e);
        });

        colList.appendChild(card);
      });
    }
  }

  renderWeeklyPriorities(weekInfo);
  renderWeeklyHoursAllocation(weekNum, weekInfo.start.getFullYear());
}

function renderWeeklyPriorities(weekInfo) {
  const list = document.getElementById('weekly-priorities-list');
  list.innerHTML = '';

  const priorities = state.events.filter(e => {
    if (e.type !== 'priority') return false;
    if (state.filterCategory && e.category !== state.filterCategory) return false;
    
    const d = new Date(e.startDate);
    return d >= weekInfo.start && d <= weekInfo.end;
  });

  if (priorities.length === 0) {
    list.innerHTML = `<p style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-top: 1rem;">No weekly priorities.</p>`;
    return;
  }

  priorities.forEach(p => {
    const cat = state.categories[p.category] || { name: 'Unknown', color: '#3b82f6' };
    const item = document.createElement('div');
    item.className = 'checklist-item';
    
    item.innerHTML = `
      <div class="checklist-checkbox-wrapper">
        <input type="checkbox" class="checklist-checkbox" id="w-chk-${p.id}" ${p.completed ? 'checked' : ''}>
      </div>
      <div class="checklist-label-container" id="w-label-${p.id}">
        <span class="checklist-title">${p.title}</span>
        <div class="checklist-meta">
          <span class="tag-badge" style="background-color: ${cat.color}20; color: ${cat.color}; border: 1px solid ${cat.color}40;">${cat.name}</span>
        </div>
      </div>
    `;

    const checkbox = item.querySelector('.checklist-checkbox');
    checkbox.addEventListener('change', () => {
      p.completed = checkbox.checked;
      saveState();
      updateProgressMetrics();
    });

    item.querySelector('.checklist-label-container').addEventListener('click', (ev) => {
      if (ev.target.className !== 'checklist-checkbox') {
        openEditModal(p);
      }
    });

    list.appendChild(item);
  });
}

function renderWeeklyHoursAllocation(weekNum, year) {
  const container = document.getElementById('weekly-time-tracker-root');
  container.innerHTML = '';

  const weekKey = `week-${weekNum}-${year}`;
  
  if (!state.weeklyHours[weekKey]) {
    state.weeklyHours[weekKey] = {};
    Object.keys(state.categories).forEach(k => {
      state.weeklyHours[weekKey][k] = 5; // Default 5 hours target
    });
    saveState();
  }

  const hoursAlloc = state.weeklyHours[weekKey];

  Object.keys(state.categories).forEach(catKey => {
    const categoryInfo = state.categories[catKey];
    const hrs = hoursAlloc[catKey] || 0;

    const item = document.createElement('div');
    item.className = 'time-tracker-item';
    item.innerHTML = `
      <div class="time-tracker-info">
        <h4 style="display:flex; align-items:center;"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${categoryInfo.color}; margin-right:6px; box-shadow: 0 0 4px ${categoryInfo.color};"></span>${categoryInfo.name}</h4>
        <span>Target Hours</span>
      </div>
      <div class="time-tracker-controls">
        <button class="time-tracker-btn" data-action="dec" data-cat="${catKey}">-</button>
        <span class="time-hours-val">${hrs}h</span>
        <button class="time-tracker-btn" data-action="inc" data-cat="${catKey}">+</button>
      </div>
    `;

    item.querySelectorAll('.time-tracker-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'inc') {
          hoursAlloc[catKey] = hrs + 1;
        } else if (action === 'dec' && hrs > 0) {
          hoursAlloc[catKey] = hrs - 1;
        }
        saveState();
        renderWeeklyHoursAllocation(weekNum, year);
      });
    });

    container.appendChild(item);
  });
}


// ==========================================================================
// RENDER LAYER 4: DAILY EXECUTION
// ==========================================================================
function renderDailyExecution() {
  const activeDateObj = new Date(state.activeDate);
  const formattedDate = activeDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  document.getElementById('daily-execution-title').textContent = formattedDate;

  const slotsContainer = document.getElementById('daily-time-slots-root');
  slotsContainer.innerHTML = '';

  const dateStr = formatDateLocal(activeDateObj);

  const dayTimeblocks = state.events.filter(e => {
    if (e.type !== 'task' && !e.startTime) return false;
    if (state.filterCategory && e.category !== state.filterCategory) return false;
    return e.startDate === dateStr;
  });

  for (let hour = 6; hour <= 23; hour++) {
    const row = document.createElement('div');
    row.className = 'time-slot-row';

    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    const timeLabelText = `${displayHour}:00 ${ampm}`;

    const label = document.createElement('div');
    label.className = 'time-slot-label';
    label.textContent = timeLabelText;
    row.appendChild(label);

    const cell = document.createElement('div');
    cell.className = 'time-slot-cell';
    cell.dataset.hour = String(hour).padStart(2, '0');
    
    const startHourStr = String(hour).padStart(2, '0');
    const matchingTasks = dayTimeblocks.filter(t => t.startTime && t.startTime.startsWith(startHourStr));

    matchingTasks.forEach(task => {
      const cat = state.categories[task.category] || { name: 'Unknown', color: '#3b82f6' };
      const block = document.createElement('div');
      block.className = 'time-slot-block';
      block.dataset.eventId = task.id;
      
      block.style.backgroundColor = cat.color;
      block.style.color = getContrastColor(cat.color);
      block.style.borderLeft = `3px solid ${getContrastColor(cat.color)}`;
      
      block.innerHTML = `
        <h4 style="color: inherit;">${task.title}</h4>
        <span style="color: inherit; opacity: 0.85;">${task.startTime} - ${task.endTime || ''}</span>
      `;
      
      block.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openEditModal(task);
      });

      cell.appendChild(block);
    });

    cell.addEventListener('click', (ev) => {
      if (ev.target === cell) {
        const selectedHour = `${cell.dataset.hour}:00`;
        const endHour = `${parseInt(cell.dataset.hour) + 1}:00`;
        openAddModal('task', null, dateStr, dateStr, selectedHour, endHour);
      }
    });

    row.appendChild(cell);
    slotsContainer.appendChild(row);
  }

  renderDailyFocusTasks(dateStr);

  const reflectionText = state.dailyReflections[dateStr] || '';
  document.getElementById('daily-reflection-input').value = reflectionText;
}

function renderDailyFocusTasks(dateStr) {
  const container = document.getElementById('daily-tasks-root');
  container.innerHTML = '';

  const tasks = state.events.filter(e => {
    if (e.type !== 'task') return false;
    if (state.filterCategory && e.category !== state.filterCategory) return false;
    return e.startDate === dateStr;
  });

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  tasks.sort((a, b) => priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium']);

  if (tasks.length === 0) {
    container.innerHTML = `<p style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-top: 1rem;">No tasks set for this day.</p>`;
    return;
  }

  tasks.forEach(t => {
    const cat = state.categories[t.category] || { name: 'Unknown', color: '#3b82f6' };
    const item = document.createElement('div');
    item.className = 'checklist-item';
    
    const priBadgeClass = `priority-${t.priority || 'medium'}`;
    const priLabel = (t.priority || 'medium').toUpperCase();

    item.innerHTML = `
      <div class="checklist-checkbox-wrapper">
        <input type="checkbox" class="checklist-checkbox" id="d-chk-${t.id}" ${t.completed ? 'checked' : ''}>
      </div>
      <div class="checklist-label-container" id="d-label-${t.id}">
        <span class="checklist-title">${t.title}</span>
        <div class="checklist-meta">
          <span class="tag-badge" style="background-color: ${cat.color}20; color: ${cat.color}; border: 1px solid ${cat.color}40;">${cat.name}</span>
          <span class="tag-badge ${priBadgeClass}">${priLabel}</span>
          ${t.startTime ? `<span>${t.startTime} - ${t.endTime || ''}</span>` : ''}
        </div>
      </div>
    `;

    const checkbox = item.querySelector('.checklist-checkbox');
    checkbox.addEventListener('change', () => {
      t.completed = checkbox.checked;
      saveState();
      updateProgressMetrics();
    });

    item.querySelector('.checklist-label-container').addEventListener('click', (ev) => {
      if (ev.target.className !== 'checklist-checkbox') {
        openEditModal(t);
      }
    });

    container.appendChild(item);
  });
}


// ==========================================================================
// CATEGORY EDITOR PANEL
// ==========================================================================
function renderCategoryManager() {
  const container = document.getElementById('category-manager-list');
  container.innerHTML = '';
  
  Object.keys(state.categories).forEach(key => {
    const cat = state.categories[key];
    const row = document.createElement('div');
    row.className = 'category-manager-item';
    
    row.innerHTML = `
      <input type="text" value="${cat.name}" class="cat-rename-input" data-key="${key}">
      <input type="color" value="${cat.color}" class="cat-color-input" data-key="${key}" title="Edit color swatch">
      <button type="button" class="btn-trash" data-key="${key}" title="Delete Category">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
      </button>
    `;
    
    // Rename key bindings
    const nameInput = row.querySelector('.cat-rename-input');
    nameInput.addEventListener('change', (ev) => {
      const val = ev.target.value.trim();
      if (val) {
        state.categories[key].name = val;
        saveState();
        renderSidebarLegend();
        renderActiveLayer();
        populateCategorySelects();
      }
    });
    
    // Recolor color swatch bindings
    const colorInput = row.querySelector('.cat-color-input');
    colorInput.addEventListener('change', (ev) => {
      state.categories[key].color = ev.target.value;
      saveState();
      renderSidebarLegend();
      renderActiveLayer();
    });
    
    // Trash deletions bindings
    const deleteBtn = row.querySelector('.btn-trash');
    deleteBtn.addEventListener('click', () => {
      deleteCategory(key);
    });
    
    container.appendChild(row);
  });
}

function deleteCategory(key) {
  const keys = Object.keys(state.categories);
  if (keys.length <= 1) {
    alert('Failed to delete: You must have at least one category in your portfolio timeline.');
    return;
  }
  
  const fallbackKey = keys.find(k => k !== key);
  
  if (confirm(`Are you sure you want to delete the category "${state.categories[key].name}"? Events in this category will be reassigned to "${state.categories[fallbackKey].name}".`)) {
    
    state.events.forEach(e => {
      if (e.category === key) {
        e.category = fallbackKey;
      }
    });
    
    delete state.categories[key];
    
    if (state.filterCategory === key) {
      state.filterCategory = null;
    }
    
    saveState();
    renderCategoryManager();
    renderSidebarLegend();
    renderActiveLayer();
    populateCategorySelects();
  }
}


// ==========================================================================
// ACTIONS & EVENT LISTENERS
// ==========================================================================
function setupEventListeners() {
  // Theme toggle button
  document.getElementById('theme-toggle-btn').addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    saveState();
    applyTheme();
  });

  // Category Add inline form (settings modal)
  document.getElementById('new-cat-add-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('new-cat-name');
    const colorInput = document.getElementById('new-cat-color');
    if (addCategory(nameInput.value.trim(), colorInput.value)) {
      nameInput.value = '';
    }
  });

  // Category Add from sidebar
  document.getElementById('sidebar-new-cat-add-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('sidebar-new-cat-name');
    const colorInput = document.getElementById('sidebar-new-cat-color');
    if (addCategory(nameInput.value.trim(), colorInput.value)) {
      nameInput.value = '';
    }
  });

  // Panel collapse toggles
  document.getElementById('sidebar-collapse-btn').addEventListener('click', () => togglePanelCollapse('sidebar'));
  document.getElementById('sidebar-expand-btn').addEventListener('click', () => togglePanelCollapse('sidebar'));
  document.getElementById('milestones-collapse-btn').addEventListener('click', () => togglePanelCollapse('milestones'));
  document.getElementById('milestones-expand-btn').addEventListener('click', () => togglePanelCollapse('milestones'));
  document.getElementById('weekly-panel-collapse-btn').addEventListener('click', () => togglePanelCollapse('weeklyPanel'));
  document.getElementById('weekly-panel-expand-btn').addEventListener('click', () => togglePanelCollapse('weeklyPanel'));

  // Navigation tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const layerNum = parseInt(tab.dataset.layer);
      switchLayer(layerNum);
    });
  });

  // Zoom controls for Layer 1
  document.getElementById('timeline-zoom-in').addEventListener('click', () => {
    if (state.zoomLevel < 1.8) {
      state.zoomLevel += 0.15;
      saveState();
      renderMasterTimeline();
    }
  });
  
  document.getElementById('timeline-zoom-out').addEventListener('click', () => {
    if (state.zoomLevel > 0.6) {
      state.zoomLevel -= 0.15;
      saveState();
      renderMasterTimeline();
    }
  });

  // Calendar month navigator controls
  document.getElementById('calendar-prev-month').addEventListener('click', () => {
    adjustMonth(-1);
  });
  document.getElementById('calendar-next-month').addEventListener('click', () => {
    adjustMonth(1);
  });
  document.getElementById('calendar-today').addEventListener('click', () => {
    state.activeDate = '2026-06-22';
    saveState();
    renderActiveLayer();
  });

  // Week navigator controls
  document.getElementById('week-prev').addEventListener('click', () => {
    adjustWeek(-1);
  });
  document.getElementById('week-next').addEventListener('click', () => {
    adjustWeek(1);
  });
  document.getElementById('week-today').addEventListener('click', () => {
    state.activeDate = '2026-06-22';
    saveState();
    renderActiveLayer();
  });

  // Day navigator controls
  document.getElementById('day-prev').addEventListener('click', () => {
    adjustDay(-1);
  });
  document.getElementById('day-next').addEventListener('click', () => {
    adjustDay(1);
  });
  document.getElementById('day-today').addEventListener('click', () => {
    state.activeDate = '2026-06-22';
    saveState();
    renderActiveLayer();
  });

  // Create Button actions in milestones/priorities columns
  document.getElementById('add-monthly-milestone-btn').addEventListener('click', () => {
    openAddModal('milestone');
  });
  document.getElementById('add-weekly-priority-btn').addEventListener('click', () => {
    openAddModal('priority');
  });
  document.getElementById('add-daily-task-btn').addEventListener('click', () => {
    openAddModal('task');
  });

  // Quick Add Button
  document.getElementById('quick-add-btn').addEventListener('click', () => {
    openAddModal();
  });

  // Settings modals trigger
  document.getElementById('settings-btn').addEventListener('click', () => {
    document.getElementById('settings-modal').classList.add('active');
    renderCategoryManager();
  });
  document.getElementById('settings-close-btn').addEventListener('click', () => {
    document.getElementById('settings-modal').classList.remove('active');
  });

  // Modal Cancel / Close actions
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  
  // Layer Type select change: updates form visibilities
  document.getElementById('event-type').addEventListener('change', (ev) => {
    adjustFormFieldsForType(ev.target.value);
  });

  // Event Edit/Add form submit handler
  document.getElementById('event-form').addEventListener('submit', handleFormSubmit);
  
  // Delete Event handler
  document.getElementById('event-delete-btn').addEventListener('click', handleDeleteEvent);

  // Reflections logs save
  document.getElementById('save-reflection-btn').addEventListener('click', () => {
    const text = document.getElementById('daily-reflection-input').value;
    state.dailyReflections[state.activeDate] = text;
    saveState();
    
    // Save button feedback microanimation
    const saveBtn = document.getElementById('save-reflection-btn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saved! ✓';
    saveBtn.style.background = '#10b981';
    
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.background = '';
    }, 1500);
  });

  // Export data handler
  document.getElementById('export-data-btn').addEventListener('click', exportDataBackup);

  // Import data handler
  document.getElementById('import-file-input').addEventListener('change', importDataBackup);

  // Factory Reset handler
  document.getElementById('reset-data-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all customized timelines back to factory defaults? Your changes will be deleted.')) {
      resetToDefaultState();
      refreshUI();
      document.getElementById('settings-modal').classList.remove('active');
    }
  });

  // Keyboard accessibility
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.getElementById('settings-modal').classList.remove('active');
    }
  });
}

// Navigation Adjusters
function adjustMonth(delta) {
  const d = new Date(state.activeDate);
  d.setMonth(d.getMonth() + delta);
  
  if (d.getFullYear() < TIMELINE_START_YEAR || (d.getFullYear() === TIMELINE_START_YEAR && d.getMonth() < TIMELINE_START_MONTH)) {
    return;
  }
  if (d.getFullYear() > TIMELINE_END_YEAR || (d.getFullYear() === TIMELINE_END_YEAR && d.getMonth() > TIMELINE_END_MONTH)) {
    return;
  }

  state.activeDate = formatDateLocal(d);
  saveState();
  renderActiveLayer();
}

function adjustWeek(delta) {
  const d = new Date(state.activeDate);
  d.setDate(d.getDate() + delta * 7);
  state.activeDate = formatDateLocal(d);
  saveState();
  renderActiveLayer();
}

function adjustDay(delta) {
  const d = new Date(state.activeDate);
  d.setDate(d.getDate() + delta);
  state.activeDate = formatDateLocal(d);
  saveState();
  renderActiveLayer();
}


// ==========================================================================
// MODAL DIALOG CONTROLLERS (CRUD FORM)
// ==========================================================================
function openAddModal(defaultType = null, defaultCat = null, customStart = null, customEnd = null, customTimeStart = null, customTimeEnd = null) {
  const modal = document.getElementById('edit-modal');
  document.getElementById('modal-title').textContent = 'Create Activity Item';
  document.getElementById('event-form').reset();
  document.getElementById('event-id').value = '';
  document.getElementById('event-delete-btn').style.display = 'none';

  const categorySelect = document.getElementById('event-category');
  if (defaultCat) categorySelect.value = defaultCat;

  const typeSelect = document.getElementById('event-type');
  const activeLayerType = defaultType || (state.activeLayer === 1 ? 'phase' : state.activeLayer === 2 ? 'milestone' : state.activeLayer === 3 ? 'priority' : 'task');
  typeSelect.value = activeLayerType;

  const baseDate = customStart || state.activeDate;
  const baseEndDate = customEnd || baseDate;
  
  document.getElementById('event-start-date').value = baseDate;
  document.getElementById('event-end-date').value = baseEndDate;

  if (customTimeStart) {
    document.getElementById('event-start-time').value = customTimeStart;
    document.getElementById('event-end-time').value = customTimeEnd || '';
  }

  adjustFormFieldsForType(activeLayerType);
  modal.classList.add('active');
}

function openEditModal(eventObj) {
  const modal = document.getElementById('edit-modal');
  document.getElementById('modal-title').textContent = 'Edit Activity Details';
  document.getElementById('event-id').value = eventObj.id;
  document.getElementById('event-title').value = eventObj.title;
  document.getElementById('event-category').value = eventObj.category;
  
  const typeSelect = document.getElementById('event-type');
  typeSelect.value = eventObj.type;
  
  document.getElementById('event-start-date').value = eventObj.startDate;
  document.getElementById('event-end-date').value = eventObj.endDate || eventObj.startDate;
  
  document.getElementById('event-start-time').value = eventObj.startTime || '';
  document.getElementById('event-end-time').value = eventObj.endTime || '';
  document.getElementById('event-priority').value = eventObj.priority || 'medium';
  document.getElementById('event-desc').value = eventObj.description || '';
  
  document.getElementById('event-delete-btn').style.display = 'inline-block';
  
  adjustFormFieldsForType(eventObj.type);
  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('edit-modal').classList.remove('active');
}

function adjustFormFieldsForType(type) {
  const endDateGroup = document.getElementById('end-date-group');
  const timeRangeContainer = document.getElementById('time-range-container');
  const priorityTierGroup = document.getElementById('priority-tier-group');
  
  if (type === 'phase') {
    endDateGroup.style.display = 'block';
    timeRangeContainer.style.display = 'none';
    priorityTierGroup.style.display = 'none';
    
    document.getElementById('event-start-date').required = true;
    document.getElementById('event-end-date').required = true;
  } else if (type === 'milestone' || type === 'priority') {
    endDateGroup.style.display = 'none';
    timeRangeContainer.style.display = 'none';
    priorityTierGroup.style.display = 'none';
    
    document.getElementById('event-start-date').required = true;
    document.getElementById('event-end-date').required = false;
  } else if (type === 'task') {
    endDateGroup.style.display = 'none';
    timeRangeContainer.style.display = 'flex';
    priorityTierGroup.style.display = 'block';
    
    document.getElementById('event-start-date').required = true;
    document.getElementById('event-end-date').required = false;
  }
}

// CREATE & UPDATE
function handleFormSubmit(ev) {
  ev.preventDefault();
  
  const eventId = document.getElementById('event-id').value;
  const title = document.getElementById('event-title').value.trim();
  const category = document.getElementById('event-category').value;
  const type = document.getElementById('event-type').value;
  const startDate = document.getElementById('event-start-date').value;
  
  let endDate = document.getElementById('event-end-date').value || startDate;
  if (type !== 'phase') endDate = startDate; 

  const startTime = document.getElementById('event-start-time').value;
  const endTime = document.getElementById('event-end-time').value;
  const priority = document.getElementById('event-priority').value;
  const description = document.getElementById('event-desc').value.trim();

  if (eventId) {
    const index = state.events.findIndex(e => e.id === eventId);
    if (index !== -1) {
      state.events[index] = {
        ...state.events[index],
        title,
        category,
        type,
        startDate,
        endDate,
        startTime: type === 'task' ? startTime : undefined,
        endTime: type === 'task' ? endTime : undefined,
        priority: type === 'task' ? priority : undefined,
        description
      };
    }
  } else {
    const newEvent = {
      id: `custom-evt-${Date.now()}`,
      title,
      category,
      type,
      startDate,
      endDate,
      startTime: type === 'task' ? startTime : undefined,
      endTime: type === 'task' ? endTime : undefined,
      priority: type === 'task' ? priority : undefined,
      completed: false,
      description
    };
    state.events.push(newEvent);
  }

  saveState();
  closeModal();
  renderActiveLayer();
}

// DELETE
function handleDeleteEvent() {
  const eventId = document.getElementById('event-id').value;
  if (!eventId) return;

  if (confirm('Are you sure you want to delete this activity event from the timeline?')) {
    state.events = state.events.filter(e => e.id !== eventId);
    saveState();
    closeModal();
    renderActiveLayer();
  }
}


// ==========================================================================
// IMPORT & EXPORT UTILITIES (JSON RESTORE BACKUP)
// ==========================================================================
function exportDataBackup() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  
  const timeStamp = new Date().toISOString().slice(0,10);
  downloadAnchor.setAttribute("download", `ApexTimeline_Backup_${timeStamp}.json`);
  
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importDataBackup(ev) {
  const fileReader = new FileReader();
  const file = ev.target.files[0];
  if (!file) return;

  fileReader.onload = function(event) {
    try {
      const parsedData = JSON.parse(event.target.result);
      if (parsedData.events && Array.isArray(parsedData.events)) {
        state = {
          ...state,
          ...parsedData
        };
        if (!state.panelCollapsed) {
          state.panelCollapsed = { sidebar: false, milestones: false, weeklyPanel: false };
        }
        saveState();
        refreshUI();
        alert('Data restore backup loaded successfully!');
        document.getElementById('settings-modal').classList.remove('active');
      } else {
        alert('Failed to import: Invalid timeline schema backup file.');
      }
    } catch (e) {
      alert('Failed to parse file. Make sure it is a valid JSON backup file.');
    }
  };
  fileReader.readAsText(file);
}

