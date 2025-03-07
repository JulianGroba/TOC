import * as Firestore from "firebase/firestore";
import { initializeApp } from "firebase/app"

const firebaseConfig = {
  apiKey: "AIzaSyDMUtVWvVd7WLY2ifZdNzKf9MTMkBnTmPM",
  authDomain: "jgvtoc.firebaseapp.com",
  projectId: "jgvtoc",
  storageBucket: "jgvtoc.firebasestorage.app",
  messagingSenderId: "428361781767",
  appId: "1:428361781767:web:92ec4ff9d547b82469d0a2"
};

const app = initializeApp(firebaseConfig);
export const firestoreDB = Firestore.getFirestore(app);

export function getCollection<T>(path: string) {
  return Firestore.collection(firestoreDB, path) as Firestore.CollectionReference<T>
}

export async function deleteDocument(path: string, id: string) {
  const doc = Firestore.doc(firestoreDB, `${path}/${id}`)
  await Firestore.deleteDoc(doc)
}

export async function updateDocument<T extends Record<string, any>>(path: string, id: string, data: T) {
  const doc = Firestore.doc(firestoreDB, `${path}/${id}`)
  await Firestore.updateDoc(doc, data)
}
