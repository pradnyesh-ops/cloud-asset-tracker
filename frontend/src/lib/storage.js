const USERS_KEY = "cat_users";
const SESSION_KEY = "cat_session";
const ASSETS_KEY = "cat_assets";
const AUDIT_KEY = "cat_audit";

export const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
export const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

export const getSession = () => {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
};
export const saveSession = (user) => localStorage.setItem(SESSION_KEY, JSON.stringify(user));
export const clearSession = () => localStorage.removeItem(SESSION_KEY);

export const getAssets = () => JSON.parse(localStorage.getItem(ASSETS_KEY) || "[]");
export const saveAssets = (assets) => localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));

export const getAuditLogs = () => JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]");
export const saveAuditLogs = (logs) => localStorage.setItem(AUDIT_KEY, JSON.stringify(logs));

export const addAuditLog = (entry) => {
  const logs = getAuditLogs();
  logs.unshift(entry);
  saveAuditLogs(logs.slice(0, 200));
};
