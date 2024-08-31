// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAZG5Ev48bgX4xxQMs59QE98rawlPO-n1o",
    authDomain: "ilkdenemem-c550b.firebaseapp.com",
    projectId: "ilkdenemem-c550b",
    storageBucket: "ilkdenemem-c550b.appspot.com",
    messagingSenderId: "407201213508",
    appId: "1:407201213508:web:eb3b7af3e0b13f9ff62011"
};

// Firebase'i başlatın
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
