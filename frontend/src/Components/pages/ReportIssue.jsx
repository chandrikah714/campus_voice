import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { useCurrentUser } from "../../context/AuthContext";
import { DEPARTMENTS } from "../../config/departments";
import { useNavigate } from "react-router-dom";
import LocationPicker from "../Map/LocationPicker";
import { uploadToCloudinary, validateImageFile } from "../../utils/imageUpload";

const PRIORITIES = ["Low", "Medium", "High"];

const ReportIssue = () => {
  const { user, authUser } = useCurrentUser();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [priority, setPriority] = useState("Low");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState(null); // [lat, lng] — feeds the map/heatmap views
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoChange = (file) => {
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setPhoto(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title || !description || !department || !location) {
      setError("Please fill in every field before submitting.");
      return;
    }
    if (!coords) {
      setError("Please pin the location on the map below.");
      return;
    }

    setLoading(true);
    try {
      let photoUrl = "";
      if (photo) {
        try {
          photoUrl = await uploadToCloudinary(photo);
        } catch (uploadErr) {
          console.warn("Photo upload skipped:", uploadErr.message);
        }
      }

      await addDoc(collection(db, "complaints"), {
        title,
        description,
        department,
        priority,
        location,
        latitude: coords[0],
        longitude: coords[1],
        photo: photoUrl,
        userId: authUser.uid,
        userName: user?.name || "Unknown",
        role: user?.role || "student",
        status: "Pending",
        votes: {},
        discussions: [],
        timestamp: serverTimestamp(),
      });

      navigate("/student/my-issues");
    } catch (err) {
      console.error("Error submitting complaint:", err);
      setError("Couldn't submit the report. Please try again.");
    }
    setLoading(false);
  };

  return (
    <form
      className="mx-auto flex max-w-lg flex-col gap-4 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-paper-300"
      onSubmit={handleSubmit}
    >
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-900">Report an issue</h2>
        <p className="text-sm text-ink-500">File a ticket and we'll route it to the right department.</p>
      </div>

      {error && (
        <p className="rounded-lg bg-coral-50 px-3 py-2 text-sm text-coral-700">{error}</p>
      )}

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input"
        required
      />

      <textarea
        placeholder="Describe the issue"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="input"
        rows={4}
        required
      />

      <select
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        className="input"
        required
      >
        <option value="">Select department</option>
        {DEPARTMENTS.map((dep) => (
          <option key={dep} value={dep}>{dep}</option>
        ))}
      </select>

      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="input"
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>{p} priority</option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Location (e.g. Hostel Block C, Room 214)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="input"
        required
      />

      <LocationPicker value={coords} onChange={setCoords} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-700">Photo (optional)</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handlePhotoChange(e.target.files[0])}
          className="input"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg bg-marigold-500 py-2.5 font-semibold text-ink-900 transition hover:bg-marigold-400 disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit report"}
      </button>
    </form>
  );
};

export default ReportIssue;
