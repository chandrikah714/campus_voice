import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaPaperPlane } from "react-icons/fa";
import StatusStamp from "../Shared/StatusStamp";
import PriorityBadge from "../Shared/PriorityBadge";
import { docketNumber, formatTimestamp, timeAgo } from "../../utils/docket";
import { departmentColor } from "../../config/departmentColors";

export default function CardModal({ complaint, canResolve, updateStatus, addDiscussion, onClose }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [visible, setVisible] = useState(false);
  const scrollRef = useRef(null);
  const dept = departmentColor(complaint.department);
  const discussionCount = complaint.discussions?.length || 0;

  // Mount in "hidden" state, then flip a frame later so the transition
  // classes actually animate in rather than snapping straight to open.
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && handleClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to the newest message — the thread should feel live, like a
  // chat, not like a static log you have to scroll to find the bottom of.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [discussionCount]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 180); // let the fade/scale-out finish before unmounting
  };

  const handleSend = async () => {
    const text = message.trim();
    if (!text) return;
    setMessage(""); // optimistic clear — feels instant rather than waiting on the write
    setSending(true);
    await addDiscussion(complaint.id, text);
    setSending(false);
  };

  const isCompleted = complaint.status === "Completed";

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-200 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-paper-200 p-5">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-ink-300">{docketNumber(complaint.id)}</span>
              <StatusStamp status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${dept.bg} ${dept.text}`}>
                {complaint.department}
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-ink-900">{complaint.title}</h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="rounded-full p-2 text-ink-500 hover:bg-paper-100 hover:text-ink-900"
          >
            <FaTimes />
          </button>
        </div>

        {/* Scrollable body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5">
          {complaint.photo && (
            <img src={complaint.photo} alt="" className="mb-4 max-h-72 w-full rounded-lg object-cover" />
          )}

          <p className="mb-4 text-sm leading-relaxed text-ink-700">{complaint.description}</p>

          <dl className="mb-5 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-paper-50 p-3 text-xs sm:grid-cols-3">
            <Detail label="Location" value={complaint.location} />
            <Detail label="Filed by" value={`${complaint.userName} (${complaint.role})`} />
            <Detail label="Filed" value={formatTimestamp(complaint.timestamp)} />
          </dl>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-500" />
              </span>
              Live discussion ({discussionCount})
            </p>
            <div className="flex flex-col gap-2.5">
              {discussionCount ? (
                complaint.discussions.map((d, idx) => (
                  <div key={idx} className="rounded-lg bg-paper-50 p-3">
                    <div className="mb-0.5 flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-ink-900">{d.userName}</span>
                      <span className="font-mono text-[10px] text-ink-300" title={formatTimestamp(d.timestamp)}>
                        {timeAgo(d.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-ink-700">{d.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-ink-300">No comments yet — be the first to weigh in.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer: comment box + resolve action */}
        <div className="flex items-center gap-2 border-t border-paper-200 p-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Add a comment..."
            className="input flex-1 py-2 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            aria-label="Send comment"
            className="flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            <FaPaperPlane size={13} />
          </button>
          {canResolve && (
            <button
              onClick={() => updateStatus(complaint.id, isCompleted ? "Pending" : "Completed")}
              className="rounded-lg bg-marigold-500 px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-marigold-400"
            >
              Mark {isCompleted ? "pending" : "resolved"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-ink-300">{label}</dt>
      <dd className="font-medium text-ink-900">{value || "—"}</dd>
    </div>
  );
}
