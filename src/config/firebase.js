import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHaULtXW1az8eupeMdRD-LANADz2mfaOg",
  authDomain: "shahidsairforshare.firebaseapp.com",
  projectId: "shahidsairforshare",
  storageBucket: "shahidsairforshare.firebasestorage.app",
  messagingSenderId: "534427618359",
  appId: "1:534427618359:web:4e4ad5548d0bbe951143b2",
  measurementId: "G-8L39G3FVZM",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, doc, updateDoc, arrayUnion, arrayRemove,getDoc  };
