import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDKNGLLL3Md--FWrboj2kdb2u51CVoZfLc",
  authDomain: "qui-a-dit-quoi.firebaseapp.com",
  databaseURL: "https://qui-a-dit-quoi-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "qui-a-dit-quoi",
  storageBucket: "qui-a-dit-quoi.firebasestorage.app",
  messagingSenderId: "906205311141",
  appId: "1:906205311141:web:fa2f0412241a75b1669d4c"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const storage = {
  getRoom: async (code) => {
    try {
      const snapshot = await get(ref(db, `rooms/${code}`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  },
  setRoom: async (code, data) => {
    try {
      await set(ref(db, `rooms/${code}`), data);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  subscribeRoom: (code, callback) => {
    const roomRef = ref(db, `rooms/${code}`);
    return onValue(roomRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });
  }
};
