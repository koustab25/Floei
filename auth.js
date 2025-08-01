// File: auth.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCzPA0bXs_wKb9KEyxDc9XOK20n-l8AM9k",
  authDomain: "floei-e1f67.firebaseapp.com",
  projectId: "floei-e1f67",
  storageBucket: "floei-e1f67.firebasestorage.app",
  messagingSenderId: "113008872286",
  appId: "1:113008872286:web:ea7fa89275acc22ae25dcf",
  measurementId: "G-H0XHRBD1XT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    const currentPage = window.location.pathname.split('/').pop();
    if (user) {
      if (currentPage === 'login.html' || currentPage === 'signup.html') {
        window.location.href = 'index.html';
      }
    } else {
      if (
        currentPage !== 'login.html' &&
        currentPage !== 'signup.html' &&
        currentPage !== 'forgot-password.html'
      ) {
        window.location.href = 'login.html';
      }
    }
  });
}

async function signUp(email, password) {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function logIn(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function saveUserDetails(uid, data) {
  try {
    await setDoc(doc(db, "users", uid), data);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function getUserDetails(uid) {
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

export {
  app,
  auth,
  db,
  checkAuthState,
  signUp,
  logIn,
  resetPassword,
  saveUserDetails,
  getUserDetails
};
