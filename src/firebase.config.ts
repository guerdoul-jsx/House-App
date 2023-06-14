// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqyXDxaJz_SjbHoyp3Nwu5I_91LEwqI_0",
  authDomain: "house-app-marketplace.firebaseapp.com",
  projectId: "house-app-marketplace",
  storageBucket: "house-app-marketplace.appspot.com",
  messagingSenderId: "1096581317121",
  appId: "1:1096581317121:web:6d86d36efb2db1a57b3600",
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

export const db = getFirestore();
