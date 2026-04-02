import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import AssetForm from "../components/AssetForm.jsx";
import AssetTable from "../components/AssetTable.jsx";
import Pagination from "../components/Pagination.jsx";
import { getAssets, saveAssets, addAuditLog } from "../lib/storage.js";
import { generateId } from "../lib/id.js";
import { useAuth } from "../context/AuthContext.jsx";

const PROVIDERS = ["All", "AWS", "Azure", "GCP", "Oracle", "Other"];
const STATUSES = ["All", "Active", "Decommissioned"];

export default function Dashboard() {
  const { user } = useAuth();
  const [assets, setAssets] = useState(() => getAssets());
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tagsFilter, setTagsFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const userAssets = useMemo(
    () => assets.filter((asset) => asset.ownerEmail === user?.email),
    [assets, user]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const tagList = tagsFilter
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    return userAssets.filter((asset) => {
      const matchesQuery =
        !query ||
        asset.assetName.toLowerCase().includes(query) ||
        asset.ipAddress.includes(query) ||
        asset.cloudProvider.toLowerCase().includes(query) ||
        (asset.tags || []).some((tag) => tag.toLowerCase().includes(query));

      const matchesProvider =
        providerFilter === "All" || asset.cloudProvider === providerFilter;
      const matchesStatus = statusFilter === "All" || asset.status === statusFilter;
      const matchesTags =
        tagList.length === 0 ||
        tagList.every((tag) => (asset.tags || []).map((t) => t.toLowerCase()).includes(tag));

      return matchesQuery && matchesProvider && matchesStatus && matchesTags;
    });
  }, [userAssets, search, providerFilter, statusFilter, tagsFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageAssets = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const persistAssets = (nextAssets) => {
    setAssets(nextAssets);
    saveAssets(nextAssets);
  };

  const handleCreate = (payload) => {
    const newAsset = {
      id: generateId(),
      ownerEmail: user.email,
      createdAt: new Date().toISOString(),
      ...payload,
    };
    persistAssets([newAsset, ...assets]);
    addAuditLog({
      id: generateId(),
      action: "ASSET_CREATE",
      actor: user.email,
      timestamp: new Date().toISOString(),
      details: `${newAsset.assetName} (${newAsset.ipAddress})`,
    });
    setEditing(null);
  };

  const handleUpdate = (payload) => {
    const updated = assets.map((asset) =>
      asset.id === editing.id ? { ...asset, ...payload } : asset
    );
    persistAssets(updated);
    addAuditLog({
      id: generateId(),
      action: "ASSET_UPDATE",
      actor: user.email,
      timestamp: new Date().toISOString(),
      details: `${payload.assetName} (${payload.ipAddress})`,
    });
    setEditing(null);
  };

  const handleDelete = (assetId) => {
    const deleted = assets.find((asset) => asset.id === assetId);
    const updated = assets.filter((asset) => asset.id !== assetId);
    persistAssets(updated);
    if (deleted) {
      addAuditLog({
        id: generateId(),
        action: "ASSET_DELETE",
        actor: user.email,
        timestamp: new Date().toISOString(),
        details: `${deleted.assetName} (${deleted.ipAddress})`,
      });
    }
  };

  const handleExport = () => {
    const headers = [
      "assetName",
      "ipAddress",
      "cloudProvider",
      "status",
      "tags",
      "createdAt",
    ];
    const rows = filtered.map((asset) => [
      asset.assetName,
      asset.ipAddress,
      asset.cloudProvider,
      asset.status,
      (asset.tags || []).join(";"),
      asset.createdAt,
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "assets.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Asset Dashboard</h1>
          <p className="muted">Search, filter, and manage your cloud inventory.</p>
        </div>
        <div className="actions">
          <button className="secondary" onClick={handleExport}>
            <FontAwesomeIcon icon={faDownload} /> Export CSV
          </button>
        </div>
      </div>

      <div className="filters card">
        <label>
          Search
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, IP, tag" />
        </label>
        <label>
          Provider
          <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
            {PROVIDERS.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tags
          <input
            value={tagsFilter}
            onChange={(e) => setTagsFilter(e.target.value)}
            placeholder="prod, pci"
          />
        </label>
        <label>
          Page size
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {[5, 10, 20].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid">
        <AssetForm
          initialValues={editing}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={() => setEditing(null)}
        />
        <AssetTable assets={pageAssets} onEdit={setEditing} onDelete={handleDelete} />
      </div>

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
    </section>
  );
}
