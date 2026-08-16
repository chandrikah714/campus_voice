import React from "react";
import { useCurrentUser } from "../../context/AuthContext";

const Profile = () => {
  const { user, loading } = useCurrentUser();

  if (loading) return <p className="font-mono text-sm text-ink-300">Loading profile...</p>;
  if (!user) return <p className="text-sm text-ink-500">Couldn't load your profile.</p>;

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-paper-300">
      <div className="mb-6 flex items-center gap-4">
        <img
          src={user.photo || "https://res.cloudinary.com/demo/image/upload/w_80,h_80,c_fill,g_face,r_max/sample.jpg"}
          alt=""
          className="h-16 w-16 rounded-full border-2 border-paper-300 object-cover"
        />
        <div>
          <h2 className="font-display text-xl font-bold text-ink-900">{user.name}</h2>
          <p className="font-mono text-xs uppercase tracking-wide text-marigold-700">{user.role}</p>
        </div>
      </div>

      <dl className="flex flex-col gap-3 text-sm">
        <Row label="Email" value={user.email} />
        <Row label="Department" value={user.department} />
        {user.regNumber && <Row label="Registration no." value={user.regNumber} />}
      </dl>
    </div>
  );
};

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-paper-200 pb-2">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-900">{value || "—"}</dd>
    </div>
  );
}

export default Profile;
