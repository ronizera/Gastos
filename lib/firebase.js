// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAhCXV6mPDaKQeTH7xkbCp_SvMOpv6t-Q0",
  authDomain: "gastos-fe760.firebaseapp.com",
  projectId: "gastos-fe760",
  storageBucket: "gastos-fe760.appspot.com", 
  messagingSenderId: "151254392855",
  appId: "1:151254392855:web:1e561646d274624e9ffc52",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


export { db, auth };
