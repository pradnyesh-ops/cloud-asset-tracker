const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|[01]?\d?\d)(\.(25[0-5]|2[0-4]\d|[01]?\d?\d)){3}$/;

export const validateEmail = (value) => EMAIL_REGEX.test(String(value || "").trim());
export const validatePassword = (value) => PASSWORD_REGEX.test(String(value || ""));
export const validateIPv4 = (value) => IPV4_REGEX.test(String(value || "").trim());
