import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getUsers,
  saveUsers,
  getSession,
  saveSession,
  clearSession,
  addAuditLog,
} from "../lib/storage.js";
import { generateId } from "../lib/id.js";
import { validateEmail, validatePassword } from "../lib/validators.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getSession());
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      saveSession(user);
    } else {
      clearSession();
    }
  }, [user]);

  const register = (payload) => {
    const { email, password, confirmPassword, name } = payload;
    setError(null);

    if (!name?.trim()) {
      setError("Name is required.");
      return false;
    }
    if (!validateEmail(email)) {
      setError("Enter a valid email address.");
      return false;
    }
    if (!validatePassword(password)) {
      setError("Password must be 8+ chars with upper, lower, number, and symbol.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    const users = getUsers();
    if (users.find((existing) => existing.email === email.toLowerCase())) {
      setError("Email already exists. Please log in.");
      return false;
    }

    const newUser = {
      id: generateId(),
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveUsers(users);
    setUser({ id: newUser.id, email: newUser.email, name: newUser.name });
    addAuditLog({
      id: generateId(),
      action: "REGISTER",
      actor: newUser.email,
      timestamp: new Date().toISOString(),
      details: "User registration",
    });
    return true;
  };

  const login = (email, password) => {
    setError(null);
    if (!validateEmail(email)) {
      setError("Enter a valid email address.");
      return false;
    }
    const users = getUsers();
    const existing = users.find(
      (u) => u.email === email.toLowerCase() && u.password === password
    );
    if (!existing) {
      setError("Invalid credentials.");
      return false;
    }
    setUser({ id: existing.id, email: existing.email, name: existing.name });
    addAuditLog({
      id: generateId(),
      action: "LOGIN",
      actor: existing.email,
      timestamp: new Date().toISOString(),
      details: "User login",
    });
    return true;
  };

  const logout = () => {
    if (user?.email) {
      addAuditLog({
        id: generateId(),
        action: "LOGOUT",
        actor: user.email,
        timestamp: new Date().toISOString(),
        details: "User logout",
      });
    }
    setUser(null);
  };

  const updateProfile = (updates) => {
    const users = getUsers();
    const index = users.findIndex((u) => u.id === user?.id);
    if (index === -1) {
      return false;
    }
    const updated = { ...users[index], ...updates };
    users[index] = updated;
    saveUsers(users);
    setUser({ id: updated.id, email: updated.email, name: updated.name });
    addAuditLog({
      id: generateId(),
      action: "PROFILE_UPDATE",
      actor: updated.email,
      timestamp: new Date().toISOString(),
      details: "Profile updated",
    });
    return true;
  };

  const value = useMemo(
    () => ({ user, error, setError, register, login, logout, updateProfile }),
    [user, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
