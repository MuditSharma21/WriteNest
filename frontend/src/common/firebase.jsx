import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCF8FjfVf-En9gt97e29C-21drBqD44cDY",
  authDomain: "blog-react-f7b47.firebaseapp.com",
  projectId: "blog-react-f7b47",
  storageBucket: "blog-react-f7b47.firebasestorage.app",
  messagingSenderId: "1026045465773",
  appId: "1:1026045465773:web:1baca531b8115b47162224"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const provider = new GoogleAuthProvider();

const auth = getAuth();

export const authWithGoogle = async () => {
  let user = null;

  await signInWithPopup(auth, provider)
    .then((result) => (user = result.user))
    .catch((err) => console.log(err));

  return user;
};
