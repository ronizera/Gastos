import {initializeApp} from "firebase/app";
import {getFirestore} from "firebase/firestore";
import {getAuth} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAhCXV6mPDaKQeTH7xkbCp_SvMOpv6t-Q0",
  authDomain: "gastos-fe760.firebaseapp.com",
  projectId: "gastos-fe760",
  storageBucket: "gastos-fe760.firebasestorage.app",
  messagingSenderId: "151254392855",
  appId: "1:151254392855:web:1e561646d274624e9ffc52",
  measurementId: "G-0LNKS3EBPF"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { db, auth };