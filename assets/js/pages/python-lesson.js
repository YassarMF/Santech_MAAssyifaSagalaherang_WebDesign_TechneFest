import { AppState, ModuleData, PythonData, UiUxData, UI } from '../core/app.js';

// Auth check
if (!AppState.requireAuth()) {
  // will redirect to index.html
}

let currentUser = AppState.getUser();
let activeModuleIndex = 0;

// Hardcoded for Python Track
const urlParams = new URLSearchParams(window.location.search);
const trackParam = 'python';
let currentModuleData = PythonData;

// ── Initialize ───────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Show user streak
  const streakEl = document.getElementById('user-streak');
  if (streakEl && currentUser) {
    streakEl.textContent = `🔥 ${currentUser.streak || 1}`;
  }

  // Parse initial module
  const modParam = urlParams.get('mod');
  if (modParam !== null && !isNaN(parseInt(modParam))) {
    activeModuleIndex = parseInt(modParam);
  }

  // Update Topbar track title based on track
  const sidebarHeaderTitle = document.querySelector('.interactive-sidebar-header h2');
  const sidebarCount = document.getElementById('sidebar-module-count');
  
  if (sidebarHeaderTitle) {
    sidebarHeaderTitle.textContent = trackParam === 'data' ? 'Data Analyst Track' : 
                                     trackParam === 'python' ? 'Python Backend Track' :
                                     trackParam === 'uiux' ? 'UI/UX Designer Track' : 'EduVerse Track';
  }
  
  if (sidebarCount) {
    sidebarCount.textContent = `${currentModuleData.length} Modul Inti`;
  }

  // Buttons
  const btnNext = document.getElementById('btn-next-module');

  // We will re-wire the button dynamically inside loadModule
  btnNext.onclick = goToNextModule;

  // Load UI
  renderSidebar();
  loadModule(activeModuleIndex);
});

// ── Functions ────────────────────────────────────────────────────

function renderSidebar() {
  const container = document.getElementById('module-list');
  const completed = currentUser.completedModules || [];
  
  let html = '';
  currentModuleData.forEach((mod, index) => {
    const isCompleted = completed.includes(mod.id);
    const isActive = index === activeModuleIndex;
    // Unlock if first module or previous module is completed
    const isUnlocked = index === 0 || completed.includes(currentModuleData[index - 1].id);
    
    let stateClass = '';
    let icon = mod.icon;
    
    if (isActive) stateClass = 'active';
    else if (!isUnlocked) {
      stateClass = 'locked';
      icon = '🔒';
    }

    const opacity = !isUnlocked ? 'opacity: 0.6; cursor: not-allowed;' : '';

    html += `
      <div class="module-list-item ${stateClass}" style="${opacity}" data-index="${index}">
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
      const isUnlocked = idx === 0 || (currentUser.completedModules || []).includes(currentModuleData[idx - 1].id);
      
      if (isUnlocked) {
        // Close dropdown if mobile
        document.querySelector('.interactive-sidebar').classList.remove('show-dropdown');
        
        // Update URL without refreshing
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?track=' + trackParam + '&mod=' + idx;
        window.history.pushState({ path: newUrl }, '', newUrl);
        loadModule(idx);
      } else {
        UI.showToast('Selesaikan modul sebelumnya terlebih dahulu! 🔒', 'info');
      }
    });
  });
}

function loadModule(index) {
  // Safely fallback if out of bounds
  if (index < 0 || index >= currentModuleData.length) index = 0;
  
  activeModuleIndex = index;
  const mod = currentModuleData[index];
  if (!mod) return;

  // Update Topbar
  document.getElementById('topbar-title').innerHTML = `${mod.icon} ${mod.title}`;
  
  // Update Content
  document.getElementById('theory-content').innerHTML = mod.theory;
  
  // Reset views to Theory step
  document.getElementById('step-theory').classList.remove('hidden');
  document.getElementById('step-theory').style.display = 'block';
  document.getElementById('quiz-section').classList.add('hidden');
  document.getElementById('quiz-section').style.display = 'none';
  
  // Re-render sidebar to update active state
  renderSidebar();

  // Check completion
  const isCompleted = (currentUser.completedModules || []).includes(mod.id);
  const btnNext = document.getElementById('btn-next-module');
  
  // Reset quiz section
  renderQuiz(mod, isCompleted);
  
  if (isCompleted) {
    btnNext.classList.remove('hidden');
    
    // Auto show quiz if completed so they can see answers
    document.getElementById('quiz-section').classList.remove('hidden');
    document.getElementById('quiz-section').style.display = 'block';

    // If it's the last module
    if (index === currentModuleData.length - 1) {
      btnNext.innerHTML = '<i class="fa-solid fa-trophy"></i> Kembali ke Dashboard';
      btnNext.onclick = () => window.location.href = 'dashboard.html';
    } else {
      btnNext.innerHTML = 'Lanjut ke Modul Berikutnya <i class="fa-solid fa-arrow-right"></i>';
      btnNext.onclick = goToNextModule;
    }
  } else {
    // Theory mode: button points to Quiz
    btnNext.classList.remove('hidden');
    btnNext.innerHTML = 'Lanjut ke Kuis 🎯';
    btnNext.onclick = () => {
      document.getElementById('step-theory').classList.add('hidden');
      document.getElementById('step-theory').style.display = 'none';
      
      document.getElementById('quiz-section').classList.remove('hidden');
      document.getElementById('quiz-section').style.display = 'block';
      
      btnNext.classList.add('hidden'); // hide until answered
    };
  }
  
  // Scroll to top
  document.querySelector('.interactive-main').scrollTo(0, 0);
}

function renderQuiz(mod, isCompleted) {
  const q = mod.quiz;
  document.getElementById('quiz-question').textContent = q.question;
  
  const optionsContainer = document.getElementById('quiz-options');
  let optionsHtml = '';
  
  q.options.forEach((opt, idx) => {
    // If already completed, just highlight correct answer and disable all
    let classes = 'quiz-option';
    let disabled = '';
    
    if (isCompleted) {
      disabled = 'disabled';
      if (idx === q.correctIndex) {
        classes += ' correct';
      }
    }
    
    optionsHtml += `<button class="${classes}" data-index="${idx}" ${disabled}>${opt}</button>`;
  });
  
  optionsContainer.innerHTML = optionsHtml;
  
  const feedback = document.getElementById('quiz-feedback');
  if (isCompleted) {
    feedback.textContent = 'Jawaban Benar! Modul Selesai ✅';
    feedback.className = '';
    feedback.style.color = 'var(--success)';
  } else {
    feedback.className = 'hidden';
    
    // Attach event listeners for active quiz
    optionsContainer.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => handleQuizAnswer(btn, mod));
    });
  }
}

async function handleQuizAnswer(btn, mod) {
  const selectedIndex = parseInt(btn.dataset.index);
  const q = mod.quiz;
  const feedback = document.getElementById('quiz-feedback');
  
  // Disable all options during processing
  const optionsContainer = document.getElementById('quiz-options');
  optionsContainer.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);
  
  const btnNext = document.getElementById('btn-next-module');
  
  if (selectedIndex === q.correctIndex) {
    btn.classList.add('correct');
    
    feedback.innerHTML = '🎉 Jawaban Benar! +100 XP';
    feedback.className = '';
    feedback.style.color = 'var(--success)';
    
    // Process completion
    await AppState.addXP(100);
    await AppState.completeModule(mod.id);
    currentUser = AppState.getUser(); // refresh local cache
    
    UI.showToast(`+100 XP! Modul Selesai! 🎉`, 'xp');
    
    // Show Next button
    btnNext.classList.remove('hidden');
    
    if (activeModuleIndex === currentModuleData.length - 1) {
      btnNext.innerHTML = '<i class="fa-solid fa-trophy"></i> Kembali ke Dashboard';
      btnNext.onclick = () => window.location.href = 'dashboard.html';
      UI.showToast('Selamat! Kamu telah menyelesaikan semua modul! 🏆', 'success', 5000);
    } else {
      btnNext.innerHTML = 'Lanjut ke Modul Berikutnya <i class="fa-solid fa-arrow-right"></i>';
      btnNext.onclick = goToNextModule;
    }
    
    // Refresh sidebar to unlock next
    renderSidebar();
    
  } else {
    btn.classList.add('wrong');
    
    // Show correct answer by highlighting it
    const correctBtn = optionsContainer.querySelector(`[data-index="${q.correctIndex}"]`);
    if (correctBtn) correctBtn.classList.add('correct');
    
    const clueText = q.clue || "Ayo pelajari lagi materinya untuk pemahaman yang lebih baik!";
    feedback.innerHTML = `💡 <strong>Kurang Tepat.</strong><br><span style="font-size:0.95rem; font-weight:normal;">${clueText}</span>`;
    feedback.className = '';
    feedback.style.color = 'var(--danger)';
    
    // Record weakness
    await AppState.recordWeakness(q.topic);
    
    // Show Try Again button
    btnNext.classList.remove('hidden');
    btnNext.innerHTML = 'Coba Lagi 🔄';
    btnNext.onclick = () => {
      // Reset quiz for another try
      renderQuiz(mod, false);
      btnNext.classList.add('hidden');
    };
  }
}

function goToNextModule() {
  const nextIndex = activeModuleIndex + 1;
  if (nextIndex < currentModuleData.length) {
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?track=' + trackParam + '&mod=' + nextIndex;
    window.history.pushState({ path: newUrl }, '', newUrl);
    loadModule(nextIndex);
  }
}
