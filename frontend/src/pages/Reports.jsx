import React, { useMemo } from "react";
import { getAssets, getAuditLogs } from "../lib/storage.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Reports() {
  const { user } = useAuth();
  const assets = getAssets().filter((asset) => asset.ownerEmail === user?.email);
  const logs = getAuditLogs().filter((log) => log.actor === user?.email);

  const summary = useMemo(() => {
    const byProvider = assets.reduce((acc, asset) => {
      acc[asset.cloudProvider] = (acc[asset.cloudProvider] || 0) + 1;
      return acc;
    }, {});
    const byStatus = assets.reduce((acc, asset) => {
      acc[asset.status] = (acc[asset.status] || 0) + 1;
      return acc;
    }, {});
    return { byProvider, byStatus, total: assets.length };
  }, [assets]);

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Reports & Auditing</h1>
          <p className="muted">Basic inventory and activity reporting.</p>
        </div>
      </div>

      <div className="report-grid">
        <div className="card">
          <h3>Total assets</h3>
          <p className="report-value">{summary.total}</p>
        </div>
        <div className="card">
          <h3>By provider</h3>
          <ul className="report-list">
            {Object.entries(summary.byProvider).map(([provider, count]) => (
              <li key={provider}>
                <span>{provider}</span>
                <strong>{count}</strong>
              </li>
            ))}
            {Object.keys(summary.byProvider).length === 0 && <li>No data yet.</li>}
          </ul>
        </div>
        <div className="card">
          <h3>By status</h3>
          <ul className="report-list">
            {Object.entries(summary.byStatus).map(([status, count]) => (
              <li key={status}>
                <span>{status}</span>
                <strong>{count}</strong>
              </li>
            ))}
            {Object.keys(summary.byStatus).length === 0 && <li>No data yet.</li>}
          </ul>
        </div>
      </div>

      <div className="card audit-card">
        <h3>Recent activity</h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty">
                    No activity yet.
                  </td>
                </tr>
              ) : (
                logs.slice(0, 20).map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.action}</td>
                    <td>{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
