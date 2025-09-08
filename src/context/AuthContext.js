import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { app } from "../firebase";
import {
  getAuth,
  onAuthStateChanged,
  updateProfile,
  GithubAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const auth = useMemo(() => getAuth(app), []);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, [auth]);

  const ensureDisplayName = async (u, githubUsername) => {
    const trimmed = (githubUsername || "").trim();
    if (!trimmed) throw new Error("GitHub username is required.");
    if (!u.displayName || u.displayName !== trimmed) {
      await updateProfile(u, { displayName: trimmed });
    }
  };

  const signUpWithEmail = async ({ email, password, githubUsername }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await ensureDisplayName(cred.user, githubUsername);
    return cred.user;
  };

  const loginWithEmail = async ({ email, password, githubUsername }) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await ensureDisplayName(cred.user, githubUsername);
    return cred.user;
  };

  const loginWithGithub = async () => {
    const provider = new GithubAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const usernameFromProvider = cred._tokenResponse?.screenName || cred?.additionalUserInfo?.username;
    if (usernameFromProvider) {
      await ensureDisplayName(cred.user, usernameFromProvider);
    }
    return cred.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = useMemo(() => ({
    user,
    loading,
    githubUsername: user?.displayName || null,
    signUpWithEmail,
    loginWithEmail,
    loginWithGithub,
    logout
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


