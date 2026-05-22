/**
 * ═══════════════════════════════════════════════════════════════
 * EduVerse — Tracks Data Configuration
 * ═══════════════════════════════════════════════════════════════
 */

export const TracksData = [
  {
    id: "data",
    title: "Data Analyst Track",
    description: "Kuasai skill Data Analyst dari nol. Mulai dari Excel, SQL, hingga Python untuk mengolah data bisnis.",
    icon: "📊",
    link: "lesson.html?track=data",
    cssClass: "neo-card-lemon",
    buttonText: "Lanjutkan Belajar 🚀",
    isNew: false
  },
  {
    id: "webdev",
    title: "Web Developer Track",
    description: "Belajar HTML, CSS, dan JavaScript secara interaktif dengan Live Preview Editor. Buat website pertamamu!",
    icon: "💻",
    link: "interactive.html",
    cssClass: "neo-card-sky",
    buttonText: "Mulai Belajar 🚀",
    isNew: true
  },
  {
    id: "python",
    title: "Python Backend Track",
    description: "Pelajari bahasa pemrograman Python untuk membuat sistem backend yang tangguh dan scalable.",
    icon: "🐍",
    link: "python.html?track=python",
    cssClass: "neo-card-mint",
    buttonText: "Lihat Track 👀",
    isNew: false
  },
  {
    id: "uiux",
    title: "UI/UX Designer Track",
    description: "Pelajari prinsip desain antarmuka, psikologi pengguna, dan alat desain seperti Figma.",
    icon: "🎨",
    link: "uiux.html?track=uiux",
    cssClass: "neo-card-pink",
    buttonText: "Lihat Track 👀",
    isNew: false
  }
];

export function renderTracksList(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let html = '';
  
  TracksData.forEach(track => {
    const badgeHtml = track.isNew ? '<span class="neo-badge neo-badge-orange" style="margin-left: 0.5rem;">Baru!</span>' : '';
    
    html += `
      <a href="${track.link}" class="neo-card-static ${track.cssClass}" style="display: block; margin-bottom: 1.5rem; cursor: pointer; text-decoration: none; transition: transform 0.2s ease, box-shadow 0.2s ease;">
        <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
          <div class="milestone-track-icon" style="background: var(--white); flex-shrink: 0;">${track.icon}</div>
          <div style="flex: 1; min-width: 250px;">
            <div style="font-family: var(--font-heading); font-weight: 900; font-size: 1.25rem; color: var(--text); margin-bottom: 0.25rem;">
              ${track.title} ${badgeHtml}
            </div>
            <div class="text-muted" style="font-size: 0.9rem; color: var(--text); line-height: 1.5;">
              ${track.description}
            </div>
          </div>
          <div style="margin-left: auto;">
            <span class="neo-btn neo-btn-primary neo-btn-sm" style="pointer-events: none;">${track.buttonText}</span>
          </div>
        </div>
      </a>
    `;
  });

  container.innerHTML = html;
}
