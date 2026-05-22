import { AppState, UI } from '../core/app.js';
import { HtmlModuleData } from '../data/html-data.js';

// Auth check
if (!AppState.requireAuth()) {
  // will redirect to index.html
}

let currentUser = AppState.getUser();
let activeModuleIndex = 0;
let editor;

// ── Initialize ───────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Parse initial module
  const urlParams = new URLSearchParams(window.location.search);
  const modParam = urlParams.get('mod');
  if (modParam !== null && !isNaN(parseInt(modParam))) {
    activeModuleIndex = parseInt(modParam);
  }

  // Show user streak
  const streakEl = document.getElementById('user-streak');
  if (streakEl && currentUser) {
    streakEl.textContent = `🔥 ${currentUser.streak || 1}`;
  }

  // Initialize CodeMirror
  const textarea = document.getElementById('code-editor');
  editor = CodeMirror.fromTextArea(textarea, {
    mode: 'htmlmixed',
    theme: 'monokai',
    lineNumbers: true,
    lineWrapping: true,
    tabSize: 2,
    autoCloseTags: true
  });

  // Event listener for editor changes
  editor.on('change', () => {
    updatePreview();
    saveCodeToCache();
  });

  // Buttons
  document.getElementById('btn-reset').addEventListener('click', resetCode);
  document.getElementById('btn-complete').addEventListener('click', completeModule);

  // Load UI
  renderSidebar();
  loadModule(activeModuleIndex);
});

// ── Functions ────────────────────────────────────────────────────

function renderSidebar() {
  const container = document.getElementById('module-list');
  const completed = currentUser.completedModules || [];
  
  let html = '';
  HtmlModuleData.forEach((mod, index) => {
    const isCompleted = completed.includes(mod.id);
    const isActive = index === activeModuleIndex;
    // Unlock if first module or previous module is completed
    const isUnlocked = index === 0 || completed.includes(HtmlModuleData[index - 1].id);
    
    let stateClass = '';
    let icon = mod.icon;
    
    if (isActive) stateClass = 'active';
    else if (!isUnlocked) {
      stateClass = 'locked';
      icon = '🔒';
    }

    // Adding style inline for locked state if needed
    const opacity = !isUnlocked ? 'opacity: 0.6; cursor: not-allowed;' : '';

    html += `
      <div class="module-list-item ${stateClass}" style="${opacity}" data-index="${index}" id="nav-mod-${index}">
        <span style="font-size: 1.25rem; width: 30px; text-align: center;">${isCompleted ? '✅' : icon}</span>
        <span>${mod.title}</span>
      </div>
    `;
  });
  
  container.innerHTML = html;

  // Add click events
  container.querySelectorAll('.module-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.index);
      const isUnlocked = idx === 0 || (currentUser.completedModules || []).includes(HtmlModuleData[idx - 1].id);
      
      if (isUnlocked) {
        // Close dropdown if mobile
        document.querySelector('.interactive-sidebar').classList.remove('show-dropdown');
        
        // Update URL without refreshing
        const currentTrack = new URLSearchParams(window.location.search).get('track') || 'web';
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?track=' + currentTrack + '&mod=' + idx;
        window.history.pushState({ path: newUrl }, '', newUrl);
        loadModule(idx);
      } else {
        UI.showToast('Selesaikan modul sebelumnya terlebih dahulu! 🔒', 'info');
      }
    });
  });
}

function loadModule(index) {
  activeModuleIndex = index;
  const mod = HtmlModuleData[index];
  if (!mod) return;

  // Update UI Elements
  document.getElementById('topbar-title').innerHTML = `${mod.icon} ${mod.title}`;
  document.getElementById('theory-content').innerHTML = mod.theory;
  
  // Re-render sidebar to update active state
  renderSidebar();

  // Load code from cache or initial
  const cacheKey = `eduverse_code_${mod.id}`;
  const cachedCode = localStorage.getItem(cacheKey);
  
  if (cachedCode) {
    editor.setValue(cachedCode);
  } else {
    editor.setValue(mod.initialCode);
  }

  // Check completion
  const isCompleted = (currentUser.completedModules || []).includes(mod.id);
  const btnComplete = document.getElementById('btn-complete');
  
  if (isCompleted) {
    btnComplete.classList.remove('hidden');
    btnComplete.innerHTML = 'Lanjut ke Modul Berikutnya →';
    btnComplete.classList.replace('neo-btn-success', 'neo-btn-primary');
  } else {
    btnComplete.classList.remove('hidden');
    btnComplete.innerHTML = '<i class="fa-solid fa-check"></i> Selesai & Lanjut';
    btnComplete.classList.replace('neo-btn-primary', 'neo-btn-success');
  }
}

function updatePreview() {
  const code = editor.getValue();
  const iframe = document.getElementById('live-preview');
  
  // Update iframe safely
  iframe.srcdoc = code;
}

function saveCodeToCache() {
  const mod = HtmlModuleData[activeModuleIndex];
  if (mod) {
    const code = editor.getValue();
    localStorage.setItem(`eduverse_code_${mod.id}`, code);
  }
}

function resetCode() {
  const mod = HtmlModuleData[activeModuleIndex];
  if (mod) {
    if (confirm('Yakin ingin mereset kode ke kondisi awal? Pekerjaanmu di modul ini akan hilang.')) {
      editor.setValue(mod.initialCode);
      localStorage.removeItem(`eduverse_code_${mod.id}`);
      UI.showToast('Kode berhasil direset.', 'info');
    }
  }
}

async function completeModule() {
  const mod = HtmlModuleData[activeModuleIndex];
  if (!mod) return;

  const btn = document.getElementById('btn-complete');
  btn.disabled = true;
  btn.innerHTML = 'Menyimpan...';

  const completed = currentUser.completedModules || [];
  const isAlreadyCompleted = completed.includes(mod.id);

  if (!isAlreadyCompleted) {
    // Validate if user actually typed something
    const currentCode = editor.getValue().trim();
    const initialCode = mod.initialCode ? mod.initialCode.trim() : '';
    
    if (currentCode === initialCode || currentCode === "") {
      UI.showToast('Kode belum dimodifikasi. Selesaikan instruksi terlebih dahulu!', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Selesai & Lanjut';
      return;
    }

    // Add XP and sync
    await AppState.addXP(100); // 100 XP for interactive modules
    await AppState.completeModule(mod.id);
    
    // Show effects
    UI.showToast(`+100 XP! Modul "${mod.title}" Selesai! 🎉`, 'xp');
    
    // Refresh user cache locally just to be safe
    currentUser = AppState.getUser();
  }

  // Go to next module
  const nextIndex = activeModuleIndex + 1;
  if (nextIndex < HtmlModuleData.length) {
    const currentTrack = new URLSearchParams(window.location.search).get('track') || 'web';
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?track=' + currentTrack + '&mod=' + nextIndex;
    window.history.pushState({ path: newUrl }, '', newUrl);
    loadModule(nextIndex);
  } else {
    UI.showToast('Selamat! Kamu telah menyelesaikan semua modul Web Dev! 🏆', 'success', 5000);
    loadModule(activeModuleIndex); // Just reload current to update UI
  }
  
  btn.disabled = false;
}
