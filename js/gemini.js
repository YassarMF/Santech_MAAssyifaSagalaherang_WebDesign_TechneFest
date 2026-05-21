/**
 * ═══════════════════════════════════════════════════════════════
 * EduVerse — Gemini AI API Integration
 * ═══════════════════════════════════════════════════════════════
 *
 * INSTRUCTIONS:
 * 1. Go to https://aistudio.google.com/app/apikey
 * 2. Create a new API key
 * 3. Paste it below
 */

// ╔═══════════════════════════════════════════════════════════╗
// ║       🔑 GEMINI API KEY — PASTE YOURS HERE                ║
// ╚═══════════════════════════════════════════════════════════╝

const GEMINI_API_KEY = "AIzaSyDsgEd4GmbS-j4tleTrRxYHNDOZtj2Q6E0";

// ── Gemini API Config ──────────────────────────────────────────
const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Check if the Gemini API key is configured
 * @returns {boolean}
 */
export function isGeminiReady() {
  return (
    GEMINI_API_KEY &&
    GEMINI_API_KEY !== "YOUR_GEMINI_KEY" &&
    GEMINI_API_KEY.trim() !== ""
  );
}

/**
 * Send a prompt to Gemini and get the response text
 * @param {string} prompt
 * @returns {string} The generated text response
 */
async function callGemini(prompt) {
  if (!isGeminiReady()) {
    throw new Error(
      "Gemini API key belum dikonfigurasi. Silakan isi API key di js/gemini.js",
    );
  }

  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
          topP: 0.9,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
      throw new Error(`Gemini API Error: ${errorMsg}`);
    }

    const data = await response.json();

    // Extract text from response
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Tidak ada respons dari Gemini. Coba lagi nanti.");
    }

    return text.trim();
  } catch (error) {
    if (error.message.includes("Gemini API")) {
      throw error;
    }
    console.error("Gemini API call failed:", error);
    throw new Error(
      "Gagal menghubungi Gemini AI. Periksa koneksi internet dan API key Anda.",
    );
  }
}

/**
 * Analyze student weaknesses and provide motivational learning advice
 * @param {Array<string>} weaknesses - Array of weak topic names
 * @returns {string} AI-generated learning advice
 */
export async function analyzeWeaknesses(weaknesses) {
  if (!weaknesses || weaknesses.length === 0) {
    return "Belum ada data kelemahan. Selesaikan beberapa quiz terlebih dahulu! 💪";
  }

  // Remove duplicates
  const uniqueWeaknesses = [...new Set(weaknesses)];
  const weaknessText = uniqueWeaknesses.join(", ");

  const prompt = `Kamu adalah mentor belajar yang ramah dan memotivasi untuk siswa Indonesia.
Siswa ini sering salah di materi: ${weaknessText}.

Berikan saran belajar singkat (2-3 kalimat) yang memotivasi dan spesifik untuk setiap kelemahan.
Gunakan bahasa Indonesia yang kasual dan menyemangati.
Tambahkan emoji yang relevan.
Jangan gunakan format markdown, langsung tulis teksnya saja.`;

  return await callGemini(prompt);
}

/**
 * Predict future career paths based on completed modules
 * @param {Array<string>} completedModules - Array of completed module IDs
 * @param {Object} moduleMap - Map of module ID to title
 * @returns {string} AI-generated career predictions
 */
export async function predictCareer(completedModules, moduleMap = {}) {
  if (!completedModules || completedModules.length === 0) {
    return "Belum ada modul yang diselesaikan. Mulai belajar untuk melihat potensi karirmu! 🚀";
  }

  // Convert IDs to readable names
  const moduleNames = completedModules
    .map((id) => moduleMap[id] || id)
    .join(", ");

  const prompt = `Kamu adalah konsultan karir yang antusias untuk anak muda Indonesia.
Siswa ini telah menyelesaikan modul-modul berikut: ${moduleNames}.

Sebutkan 2 posisi pekerjaan masa depan yang cocok berdasarkan skill yang dipelajari.
Untuk setiap posisi, berikan:
1. Nama posisi
2. Deskripsi singkat (1 kalimat)
3. Estimasi gaji per bulan di Indonesia (dalam Rupiah)
4. Satu tips untuk mencapai posisi tersebut

Gunakan bahasa Indonesia yang kasual dan menyemangati.
Tambahkan emoji yang relevan.
Jangan gunakan format markdown, langsung tulis teksnya saja.`;

  return await callGemini(prompt);
}
