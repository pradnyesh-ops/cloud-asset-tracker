import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { validateEmail } from "../lib/validators.js";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [message, setMessage] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setMessage("Name is required.");
      return;
    }
    if (!validateEmail(form.email)) {
      setMessage("Enter a valid email address.");
      return;
    }
    updateProfile({ name: form.name.trim(), email: form.email.toLowerCase() });
    setMessage("Profile updated.");
  };

  return (
    <section className="card profile-card">
      <h1>Profile</h1>
      <p className="muted">Update your user details.</p>
      {message && <div className="alert">{message}</div>}
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Email
          <input name="email" value={form.email} onChange={handleChange} required />
        </label>
        <button className="primary" type="submit">
          Save profile
        </button>
      </form>
    </section>
  );
}
