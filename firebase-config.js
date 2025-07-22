// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// إعدادات Firebase الخاصة بك:
const firebaseConfig = {
  apiKey: "XXXXXXX",
  authDomain: "XXXXXXX.firebaseapp.com",
  projectId: "XXXXXXX",
  storageBucket: "XXXXXXX.appspot.com",
  messagingSenderId: "XXXXXXX",
  appId: "XXXXXXX"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
