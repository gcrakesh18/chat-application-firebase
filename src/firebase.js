import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import {
  doc,
  getFirestore,
  setDoc
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyDUsh7K3jAFJT5GGYuFTL5mse8N4vO7maw",
  authDomain: "fir-80ea9.firebaseapp.com",
  projectId: "fir-80ea9",
  storageBucket: "fir-80ea9.firebasestorage.app",
  messagingSenderId: "238061527389",
  appId: "1:238061527389:web:c370108ae446a7cd4a08b4",
  databaseURL: "https://fir-80ea9-default-rtdb.firebaseio.com",
  measurementId: "G-KWCVHNM18W"
};

// const firebaseConfig = {
//   apiKey: "AIzaSyC9FjoFmYOxmEVQHCxQjCiGr6hINVXW0Us",
//   authDomain: "cloud-72c2d.firebaseapp.com",
//   projectId: "cloud-72c2d",
//   storageBucket: "cloud-72c2d.firebasestorage.app",
//   messagingSenderId: "519997839096",
//   appId: "1:519997839096:web:139345e5d8fc732f3b4d0d",
//   measurementId: "G-FR1FKEJ8HV",
//   databaseURL: "https://cloud-72c2d-default-rtdb.firebaseio.com"
// };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

export const realtimeDB = getDatabase(app);
export const storage = getStorage(app);

// Save user after login
export const saveUserToDB = async (user) => {
  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photo: user.photoURL,
    },
    { merge: true }
  );
};

export const loginWithGoogle = () => signInWithPopup(auth, provider);