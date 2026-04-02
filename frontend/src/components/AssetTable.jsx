import React from "react";

export default function AssetTable({ assets, onEdit, onDelete }) {
  return (
    <div className="card">
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>IPv4</th>
              <th>Provider</th>
              <th>Status</th>
              <th>Tags</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty">
                  No assets found.
                </td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id}>
                  <td>{asset.assetName}</td>
                  <td>{asset.ipAddress}</td>
                  <td>{asset.cloudProvider}</td>
                  <td>
                    <span className={`badge ${asset.status === "Active" ? "success" : "warning"}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td>{asset.tags?.length ? asset.tags.join(", ") : "-"}</td>
                  <td>{new Date(asset.createdAt).toLocaleString()}</td>
                  <td>
                    <button className="link-button" onClick={() => onEdit(asset)}>
                      Edit
                    </button>
                    <button className="link-button danger" onClick={() => onDelete(asset.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
