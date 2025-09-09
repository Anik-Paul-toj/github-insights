import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDInuNrnqj28d3xaGsFXsJOrY1UEIZOSyM",
  authDomain: "github-insights-pi.vercel.app",   // 🔥 FIXED
  projectId: "github-insights-98e09",
  storageBucket: "github-insights-98e09.appspot.com", // typo fixed too
  messagingSenderId: "664798729407",
  appId: "1:664798729407:web:5ffc25a12b613c84cca20a",
  measurementId: "G-578PDPBTKW"
};

const app = initializeApp(firebaseConfig);
try {
  getAnalytics(app);
} catch {}

export { app };


