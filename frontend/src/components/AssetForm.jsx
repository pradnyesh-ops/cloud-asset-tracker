import React, { useMemo, useState } from "react";
import { validateIPv4 } from "../lib/validators.js";

const PROVIDERS = ["AWS", "Azure", "GCP", "Oracle", "Other"];
const STATUSES = ["Active", "Decommissioned"];

export default function AssetForm({ initialValues, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => ({
    assetName: initialValues?.assetName || "",
    ipAddress: initialValues?.ipAddress || "",
    cloudProvider: initialValues?.cloudProvider || "AWS",
    status: initialValues?.status || "Active",
    tags: initialValues?.tags?.join(", ") || "",
  }));
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const tagList = useMemo(
    () =>
      form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [form.tags]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setError(null);

    if (!form.assetName.trim()) {
      setError("Asset name is required.");
      return;
    }
    if (!validateIPv4(form.ipAddress)) {
      setError("Enter a valid IPv4 address.");
      return;
    }
    if (!form.cloudProvider) {
      setError("Cloud provider is required.");
      return;
    }
    if (!form.status) {
      setError("Status is required.");
      return;
    }

    onSubmit({
      assetName: form.assetName.trim(),
      ipAddress: form.ipAddress.trim(),
      cloudProvider: form.cloudProvider,
      status: form.status,
      tags: tagList,
    });
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3>{initialValues ? "Update" : "Create"} Asset</h3>
      {error && <div className="alert error">{error}</div>}
      <div className="form-grid">
        <label>
          Asset name
          <input
            name="assetName"
            value={form.assetName}
            onChange={handleChange}
            placeholder="Payments DB"
            required
          />
        </label>
        <label>
          IPv4 address
          <input
            name="ipAddress"
            value={form.ipAddress}
            onChange={handleChange}
            placeholder="10.1.20.30"
            required
          />
        </label>
        <label>
          Provider
          <select name="cloudProvider" value={form.cloudProvider} onChange={handleChange}>
            {PROVIDERS.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="full">
          Tags (comma separated)
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="prod, pci, critical"
          />
        </label>
      </div>
      <div className="form-actions">
        <button className="primary" type="submit">
          {initialValues ? "Save changes" : "Create asset"}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
