const USERS_KEY = "cat_users";
const SESSION_KEY = "cat_session";
const ASSETS_KEY = "cat_assets";

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
