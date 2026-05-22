/**
 * ═══════════════════════════════════════════════════════════════
 * EduVerse — Firebase Configuration & Firestore Helpers
 * ═══════════════════════════════════════════════════════════════
 *
 * INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project (or use existing)
 * 3. Add a Web App and copy your config below
 * 4. Enable Firestore Database in your Firebase project
 * 5. Set Firestore rules to allow read/write (for development)
 */

// ── Firebase v9 CDN Imports ────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ╔═══════════════════════════════════════════════════════════╗
// ║        🔧 FIREBASE CONFIGURATION — PASTE YOURS HERE      ║
// ╚═══════════════════════════════════════════════════════════╝

const firebaseConfig = {
  apiKey: "AIzaSyCk3f1zEfHYAyaL5WUuxfh9T1CO37Vrd-Q",
  authDomain: "eduverse-abdb3.firebaseapp.com",
  projectId: "eduverse-abdb3",
  storageBucket: "eduverse-abdb3.firebasestorage.app",
  messagingSenderId: "484645620969",
  appId: "1:484645620969:web:665daa7736a536ee0e7478",
  measurementId: "G-5M37HBWT79",
};

// ── Initialize Firebase ────────────────────────────────────────

let app = null;
let db = null;
let firebaseReady = false;

try {
  // Check if config is filled
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn(
      "⚠️ EduVerse: Firebase config is empty! Please fill in your credentials in js/firebase-config.js",
    );
  } else {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    firebaseReady = true;
    console.log("✅ EduVerse: Firebase connected successfully!");
  }
} catch (error) {
  console.error("❌ EduVerse: Firebase initialization failed:", error);
}

// ═══════════════════════════════════════════════════════════════
// FIRESTORE HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if Firebase is ready to use
 */
export function isFirebaseReady() {
  return firebaseReady;
}

/**
 * Get user document by username
 * @param {string} username
 * @returns {Object|null} { id, ...data } or null
 */
export async function getUserByUsername(username) {
  if (!firebaseReady) return null;

  try {
    const q = query(
      collection(db, "users"),
      where("username", "==", username.trim().toLowerCase()),
      limit(1),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

/**
 * Create a new user document
 * @param {string} username
 * @param {string} school
 * @returns {Object} { id, ...data }
 */
export async function createUser(username, school) {
  if (!firebaseReady) throw new Error("Firebase not ready");

  try {
    const userData = {
      username: username.trim().toLowerCase(),
      displayName: username.trim(),
      school: school.trim(),
      xp: 0,
      streak: 1,
      lastLogin: new Date().toISOString(),
      completedModules: [],
      weaknesses: [],
    };

    const docRef = await addDoc(collection(db, "users"), userData);
    console.log("✅ New user created:", docRef.id);
    return { id: docRef.id, ...userData };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

/**
 * Get a single user document by Firestore doc ID
 * @param {string} docId
 * @returns {Object|null}
 */
export async function getUserDoc(docId) {
  if (!firebaseReady) return null;

  try {
    const docRef = doc(db, "users", docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("Error fetching user doc:", error);
    throw error;
  }
}

/**
 * Update user XP
 * @param {string} docId
 * @param {number} newXP
 */
export async function updateUserXP(docId, newXP) {
  if (!firebaseReady) return;

  try {
    const docRef = doc(db, "users", docId);
    await updateDoc(docRef, { xp: newXP });
  } catch (error) {
    console.error("Error updating XP:", error);
    throw error;
  }
}

/**
 * Add a completed module to user's completedModules array
 * @param {string} docId
 * @param {string} moduleId
 */
export async function addCompletedModule(docId, moduleId) {
  if (!firebaseReady) return;

  try {
    const docRef = doc(db, "users", docId);
    await updateDoc(docRef, {
      completedModules: arrayUnion(moduleId),
    });
  } catch (error) {
    console.error("Error adding completed module:", error);
    throw error;
  }
}

/**
 * Add a weakness topic to user's weaknesses array
 * @param {string} docId
 * @param {string} topic
 */
export async function addWeakness(docId, topic) {
  if (!firebaseReady) return;

  try {
    const docRef = doc(db, "users", docId);
    await updateDoc(docRef, {
      weaknesses: arrayUnion(topic),
    });
  } catch (error) {
    console.error("Error adding weakness:", error);
    throw error;
  }
}

/**
 * Update streak and lastLogin
 * @param {string} docId
 * @param {number} newStreak
 */
export async function updateStreak(docId, newStreak) {
  if (!firebaseReady) return;

  try {
    const docRef = doc(db, "users", docId);
    await updateDoc(docRef, {
      streak: newStreak,
      lastLogin: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating streak:", error);
    throw error;
  }
}

/**
 * Get top 10 users by XP (leaderboard)
 * @returns {Array} Array of user objects
 */
export async function getLeaderboard() {
  if (!firebaseReady) return [];

  try {
    const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(10));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    throw error;
  }
}

/**
 * Update a user document with arbitrary fields
 * @param {string} docId
 * @param {Object} updates
 */
export async function updateUser(docId, updates) {
  if (!firebaseReady) return;

  try {
    const docRef = doc(db, "users", docId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}
