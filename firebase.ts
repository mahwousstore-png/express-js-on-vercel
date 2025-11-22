// 1. استيراد الدوال الأساسية
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";       // <--- لخدمة تسجيل الدخول
import { getFirestore } from "firebase/firestore"; // <--- لخدمة قاعدة البيانات

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDlOGbLpbR8CNNxCk9MCVWgkRhM2pCSKLw",
  authDomain: "mahwous-accounting-system.firebaseapp.com",
  projectId: "mahwous-accounting-system",
  storageBucket: "mahwous-accounting-system.firebasestorage.app",
  messagingSenderId: "2400436714",
  appId: "1:2400436714:web:3d154a316ca5f0cc507293",
  measurementId: "G-944VBCSR8Z"
};

// 2. تهيئة Firebase
const app = initializeApp(firebaseConfig);

// 3. تهيئة وتصدير الخدمات التي نحتاجها في التطبيق
const analytics = getAnalytics(app); 

// تصدير (Export) خدمات المصادقة وقاعدة البيانات
export const auth = getAuth(app);
export const db = getFirestore(app);
