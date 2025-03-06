// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDw7pbWV-PchJf8DWdYdCbTeKieQ_Z7HYY",
  authDomain: "city-country-river-76537.firebaseapp.com",
  projectId: "city-country-river-76537",
  storageBucket: "city-country-river-76537.firebasestorage.app",
  messagingSenderId: "649795621050",
  appId: "1:649795621050:web:798d0fa4b74ee9ef3f3283",
  measurementId: "G-JZJKB7W4Y5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Firebase's JavaScript SDK to read and write data from ChatGPT
const db = firebase.firestore();

// Save game state (example)
db.collection('gameState').doc('game1').set({
  score: 10,
  players: ['player1', 'player2']
});

// Fetch game state
db.collection('gameState').doc('game1').get().then(doc => {
  console.log(doc.data());
});