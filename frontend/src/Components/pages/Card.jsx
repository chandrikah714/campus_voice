import React, { useState } from "react";
import { FaRegCommentDots, FaMapMarkerAlt, FaClipboardList } from "react-icons/fa";
import PriorityBadge from "../Shared/PriorityBadge";
import { docketNumber } from "../../utils/docket";
import { departmentColor } from "../../config/departmentColors";
import CardModal from "./CardModal";

// Full-bleed photo card with a bottom gradient overlay — matches the
// travel-listing reference: image fills the card, dark-to-transparent
// gradient at the bottom carries white title/subtitle/stat-pill text, and
// a solid white pill button anchors the bottom. Complaints without a
// photo (common here — the photo field is optional on Report Issue) fall
// back to a department-colored gradient with a large ghost icon so the
// layout stays consistent either way.
//
// Bug fixed: this used to be a <button> wrapping the whole card, with
// VoteButton's own <button>s nested inside it — invalid HTML that React 19
// flags as a hydration error. It's a keyboard-accessible <div role="button">
// instead, so the inner buttons are legal children.
const Card = ({ complaint, currentUser, addDiscussion, updateStatus, updateVotes, isStaff }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const votes = complaint.votes || {};
  const userVote = currentUser?.id ? votes[currentUser.id] || 0 : 0;
  const upVotes = Object.values(votes).filter((v) => v === 1).length;
  const downVotes = Object.values(votes).filter((v) => v === -1).length;
  const isCompleted = complaint.status === "Completed";
  const canResolve = isStaff && currentUser?.department === complaint.department;
  const dept = departmentColor(complaint.department);

  const handleVote = (e, voteValue) => {
    e.stopPropagation();
    if (!currentUser?.id) return;
    const newVote = voteValue === userVote ? 0 : voteValue;
    updateVotes(complaint.id, { ...votes, [currentUser.id]: newVote });
  };

  const openModal = () => setModalOpen(true);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={openModal}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openModal())}
        className={`group relative flex aspect-[3/4] w-full cursor-pointer flex-col overflow-hidden rounded-3xl shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
          isCompleted ? "opacity-80" : ""
        }`}
      >
        {/* Background: photo or department-colored gradient fallback */}
        {complaint.photo ? (
          <img
            src={complaint.photo}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={`absolute inset-0 ${dept.gradient} flex items-center justify-center`}>
            <FaClipboardList className="h-20 w-20 text-white/15" />
          </div>
        )}

        {/* Bottom gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/95 via-ink-900/35 to-transparent" />

        {/* Top-right status */}
        <div className="relative z-10 flex justify-end p-4">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${
              isCompleted ? "bg-teal-500/90 text-white" : "bg-gold-400/95 text-ink-900"
            }`}
          >
            {isCompleted ? "Resolved" : "Pending"}
          </span>
        </div>

        {/* Bottom content */}
        <div className="relative z-10 mt-auto flex flex-col gap-2 p-4">
          <div className="flex flex-wrap gap-1.5">
            <Pill icon={<FaMapMarkerAlt size={10} />} label={complaint.department} />
            <Pill label={`${upVotes - downVotes >= 0 ? "+" : ""}${upVotes - downVotes} votes`} />
          </div>

          <h3 className="font-display text-lg font-bold leading-snug text-white">
            {complaint.title}
          </h3>
          <p className="line-clamp-2 text-sm text-white/80">{complaint.description}</p>

          <div className="mb-1 flex items-center justify-between text-xs text-white/70">
            <span className="font-mono">{docketNumber(complaint.id)}</span>
            <span className="flex items-center gap-1">
              <FaRegCommentDots /> {complaint.discussions?.length || 0}
            </span>
            <PriorityBadge priority={complaint.priority} />
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <VoteButton active={userVote === 1} onClick={(e) => handleVote(e, 1)} count={upVotes} kind="up" />
            <VoteButton active={userVote === -1} onClick={(e) => handleVote(e, -1)} count={downVotes} kind="down" />
            <button
              onClick={openModal}
              className="ml-auto flex-1 rounded-full bg-white py-2 text-center text-sm font-semibold text-ink-900 transition hover:bg-paper-100"
            >
              View details
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <CardModal
          complaint={complaint}
          canResolve={canResolve}
          updateStatus={updateStatus}
          addDiscussion={addDiscussion}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};

function Pill({ icon, label }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
      {icon}
      {label}
    </span>
  );
}

function VoteButton({ active, onClick, count, kind }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full px-2.5 py-2 text-xs font-medium backdrop-blur-sm transition ${
        active
          ? kind === "up"
            ? "bg-teal-600 text-white"
            : "bg-coral-600 text-white"
          : "bg-black/30 text-white hover:bg-black/45"
      }`}
    >
      {kind === "up" ? "▲" : "▼"} {count}
    </button>
  );
}

export default Card;
