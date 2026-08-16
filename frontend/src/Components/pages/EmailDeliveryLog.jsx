import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { formatTimestamp } from "../../utils/docket";

// Reads emailLogs / systemAlerts written by the notifyComplaintCompletion
// Cloud Function (see functions/index.js). Nothing here sends email or
// talks to SMTP directly — it's a read-only window into what the server
// already recorded.
export default function EmailDeliveryLog() {
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logsQuery = query(collection(db, "emailLogs"), orderBy("timestamp", "desc"), limit(100));
    const unsubLogs = onSnapshot(
      logsQuery,
      (snap) => {
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load email logs:", err);
        setLoading(false);
      }
    );

    const alertsQuery = query(collection(db, "systemAlerts"), orderBy("timestamp", "desc"), limit(20));
    const unsubAlerts = onSnapshot(alertsQuery, (snap) => {
      setAlerts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubLogs();
      unsubAlerts();
    };
  }, []);

  const acknowledge = async (id) => {
    await updateDoc(doc(db, "systemAlerts", id), { acknowledged: true });
  };

  const failed = logs.filter((l) => l.status === "failed");
  const sent = logs.filter((l) => l.status === "sent");
  const failureRate = logs.length ? Math.round((failed.length / logs.length) * 100) : 0;

  if (loading) return <p className="font-mono text-sm text-ink-300">Loading...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-900">Email delivery</h2>
        <p className="text-sm text-ink-500">
          Last {logs.length} attempts · {sent.length} sent · {failed.length} failed · {failureRate}% failure rate
        </p>
      </div>

      {alerts.some((a) => !a.acknowledged) && (
        <div className="flex flex-col gap-2">
          {alerts.filter((a) => !a.acknowledged).map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg bg-coral-50 p-3">
              <div>
                <p className="text-sm font-semibold text-coral-700">Delivery failure threshold exceeded</p>
                <p className="text-sm text-coral-700">{a.message}</p>
                <p className="mt-0.5 font-mono text-xs text-coral-700/70">{formatTimestamp(a.timestamp)}</p>
              </div>
              <button
                onClick={() => acknowledge(a.id)}
                className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-coral-700 ring-1 ring-coral-200 hover:bg-coral-50"
              >
                Acknowledge
              </button>
            </div>
          ))}
        </div>
      )}

      {logs.length === 0 ? (
        <p className="text-sm text-ink-500">
          No email activity yet. This fills in once complaints start being marked resolved (which triggers the
          notifyComplaintCompletion function) — nothing to show if that function hasn't been deployed yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-paper-300">
          <table className="min-w-full text-sm">
            <thead className="bg-paper-100 text-left text-ink-500">
              <tr>
                <th className="px-4 py-2 font-medium">Recipient</th>
                <th className="px-4 py-2 font-medium">Subject</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Attempt</th>
                <th className="px-4 py-2 font-medium">Error</th>
                <th className="px-4 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-paper-200">
                  <td className="px-4 py-2 text-ink-900">{l.recipient}</td>
                  <td className="px-4 py-2 text-ink-500">{l.subject}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        l.status === "sent" ? "bg-teal-50 text-teal-700" : "bg-coral-50 text-coral-700"
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-ink-300">#{l.attemptNumber}</td>
                  <td className="px-4 py-2 text-xs text-coral-700">
                    {l.errorCode ? `${l.errorCode}: ${l.errorMessage}` : "—"}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-ink-300">{formatTimestamp(l.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
