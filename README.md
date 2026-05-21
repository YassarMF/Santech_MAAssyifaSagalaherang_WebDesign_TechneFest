# 🚀 EduVerse — Gamified Learning Platform

A neobrutalism-styled gamified learning SPA for aspiring Data Analysts. Built with vanilla JS, Firebase Firestore, and Google Gemini AI.

![EduVerse](https://img.shields.io/badge/EduVerse-Gamified%20Learning-7C3AED?style=for-the-badge)

## ✨ Features

- **🎮 Gamified Learning Path** — 8 interactive modules with theory + quiz
- **📊 Data Analyst Track** — From Excel basics to Machine Learning
- **🏆 Global Leaderboard** — Top 10 users ranked by XP
- **🤖 AI-Powered Analysis** — Gemini AI for weakness analysis & career prediction
- **🔥 Streak System** — Daily login streaks to keep you motivated
- **⚡ XP & Leveling** — Earn 50 XP per completed module

## 🛠️ Tech Stack

- **Frontend:** HTML5, Vanilla CSS (Neobrutalism), Vanilla JS (ES6+ Modules)
- **Backend:** Firebase Firestore v9 (CDN)
- **AI:** Google Gemini API (REST)
- **Icons:** Font Awesome 6
- **Fonts:** Nunito + Inter (Google Fonts)

## 📁 Project Structure

```
EduVerse/
├── index.html          ← Auth & Onboarding
├── dashboard.html      ← Learning Path & Milestone Map
├── leaderboard.html    ← Global Leaderboard (Top 10)
├── career.html         ← AI Career & Analysis Center
├── css/
│   └── main.css        ← Neobrutalism Design System
└── js/
    ├── firebase-config.js  ← Firebase init + Firestore CRUD
    ├── app.js              ← Core logic, modules, UI helpers
    └── gemini.js           ← Gemini API integration
```

## 🚀 Getting Started

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Add a Web App and copy your config
4. Enable **Firestore Database**
5. Open `js/firebase-config.js` and paste your credentials:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. Set Firestore rules for development:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 2. Gemini API Setup

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Open `js/gemini.js` and paste your key:

```javascript
const GEMINI_API_KEY = "your-gemini-api-key";
```

### 3. Run Locally

Since this uses ES Modules, you need a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using VS Code
# Install "Live Server" extension and click "Go Live"
```

Then open `http://localhost:8000` in your browser.

## 📋 Firestore Collection Structure

```
users/
├── {documentId}
│   ├── username: string (lowercase)
│   ├── displayName: string
│   ├── school: string
│   ├── xp: number
│   ├── streak: number
│   ├── lastLogin: string (ISO format)
│   ├── completedModules: string[]
│   └── weaknesses: string[]
```

## 🎨 Design System

**Style:** Neobrutalism (inspired by CodeDex.io & Duolingo)

- Thick black borders (3px solid)
- Hard offset shadows (4px 4px 0px)
- Rounded corners (12-16px)
- Soft pastel backgrounds
- Bold typography (Nunito headings)
- Playful emoji iconography

## 📝 License

MIT License — Feel free to use, modify, and share!
