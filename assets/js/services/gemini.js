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

const GEMINI_API_KEY_BASE64 = "QUl6YVN5RDJvLVZkdGtVUmVCS1BheGJYakgwM2JRLVZ5YzJTZHVn";
const GEMINI_API_KEY = atob(GEMINI_API_KEY_BASE64);

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
          maxOutputTokens: 2048,
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

/**
 * Generate realistic mock job listings for a career track
 * @param {string} careerTitle - The career track title
 * @param {Array<string>} skills - Required skills for the career
 * @returns {string} AI-generated job listings
 */
export async function generateJobListings(careerTitle, skills) {
  const skillText = skills.join(", ");

  const prompt = `Kamu adalah recruiter berpengalaman di Indonesia.
Buatkan 3 lowongan kerja simulasi yang realistis untuk posisi "${careerTitle}" di Indonesia.

Untuk setiap lowongan, berikan:
1. Nama Perusahaan (buat yang realistis, bisa startup atau korporat Indonesia)
2. Posisi / Job Title
3. Lokasi (kota di Indonesia)
4. Estimasi Gaji per bulan (dalam Rupiah, berikan range)
5. Requirements (3-5 poin, termasuk skill: ${skillText})
6. Deskripsi singkat (2-3 kalimat)

Gunakan bahasa Indonesia yang profesional.
Tambahkan emoji yang relevan.
Pisahkan setiap lowongan dengan garis pemisah.
Jangan gunakan format markdown header (#), gunakan teks biasa saja.`;

  return await callGemini(prompt);
}

/**
 * Chat with a specific AI persona
 * @param {string} message - The user's message
 * @param {string} persona - 'mentor', 'coding', or 'job'
 * @param {Array} chatHistory - Array of {role: 'user'|'ai', text: string}
 * @returns {string} AI-generated response
 */
export async function chatWithPersona(message, persona, chatHistory = []) {
  const systemInstructions = {
    mentor: "System: You are an EduVerse Mentor. Analyze the user's study pattern based on their input. Identify strengths/weaknesses and provide highly encouraging, profiling feedback in Indonesian. Be warm, supportive, and use emojis. Always respond in Indonesian.",
    coding: "System: You are an expert coding assistant. Provide clean code snippets and explain them simply to a high school student. Use Indonesian for explanations but keep code in English. Use code blocks with proper formatting.",
    job: "System: You are an EduVerse Job Agent. Profile the user based on their skills and match them with realistic career opportunities or simulated job openings in Indonesia. Provide salary estimates in Rupiah. Always respond in Indonesian."
  };

  const systemPrompt = systemInstructions[persona] || systemInstructions.mentor;

  // Build conversation context (last 6 messages max for token efficiency)
  const recentHistory = chatHistory.slice(-6);
  let conversationContext = "";
  
  if (recentHistory.length > 1) {
    conversationContext = "\n\nKonteks percakapan sebelumnya:\n";
    recentHistory.slice(0, -1).forEach(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      conversationContext += `${role}: ${msg.text}\n`;
    });
  }

  const fullPrompt = `${systemPrompt}${conversationContext}\n\nUser: ${message}`;

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
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 4096,
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
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Tidak ada respons dari Gemini. Coba lagi nanti.");
    }

    return text.trim();
  } catch (error) {
    if (error.message.includes("Gemini API")) {
      throw error;
    }
    console.error("Chat API call failed:", error);
    throw new Error(
      "Gagal menghubungi Gemini AI. Periksa koneksi internet dan API key Anda.",
    );
  }
}
