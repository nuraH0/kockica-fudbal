import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyB3X73GYitoryeu_bmtD7dGtButiDDC7uw",
    authDomain: "kockica-fudbal.firebaseapp.com",
    databaseURL: "https://kockica-fudbal-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "kockica-fudbal",
    storageBucket: "kockica-fudbal.firebasestorage.app",
    messagingSenderId: "1053620553524",
    appId: "1:1053620553524:web:9eeaf93980f0ab541a4761"
};

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

export { db };