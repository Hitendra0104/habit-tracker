import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

function PhotoVault({ user, otherUser }) {
  const [myPhotos, setMyPhotos] = useState({});
  const [otherPhotos, setOtherPhotos] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "photos", user), (snap) => {
      if (snap.exists()) setMyPhotos(snap.data());
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "photos", otherUser), (snap) => {
      if (snap.exists()) setOtherPhotos(snap.data());
    });
    return () => unsub();
  }, [otherUser]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    const updated = { ...myPhotos };

    for (const file of files) {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
      });
      const key = `${new Date().toISOString().split("T")[0]}_${Date.now()}`;
      updated[key] = base64;
    }

    await setDoc(doc(db, "photos", user), updated);
    setMyPhotos(updated);
    setUploading(false);
  };

  const handleDelete = async (key) => {
    if (!window.confirm("Delete this photo?")) return;
    const updated = { ...myPhotos };
    delete updated[key];
    await setDoc(doc(db, "photos", user), updated);
    setMyPhotos(updated);
  };

  const renderGrid = (photos, isMe) => (
    Object.entries(photos)
      .sort().reverse()
      .map(([key, url]) => (
        <div key={key} style={{
          background: "rgba(255,255,255,0.05)",
          borderRadius: "12px",
          padding: "8px",
          position: "relative"
        }}>
          <img src={url} alt="Progress" style={{
            width: "100%",
            borderRadius: "8px",
            aspectRatio: "1/1",
            objectFit: "cover"
          }} />
          <p style={{ fontSize: "11px", textAlign: "center", margin: "4px 0", color: "#94a3b8" }}>
            {key.split("_")[0]}
          </p>
          {isMe && (
            <button onClick={() => handleDelete(key)} style={{
              position: "absolute", top: "10px", right: "10px",
              background: "rgba(239,68,68,0.8)", border: "none",
              borderRadius: "6px", padding: "2px 6px", cursor: "pointer",
              fontSize: "12px"
            }}>🗑️</button>
          )}
        </div>
      ))
  );

  return (
    <div style={{ padding: "20px", paddingBottom: "100px" }}>
      <h2 style={{ textAlign: "center", color: "#6366f1" }}>📸 Memory Vault</h2>

      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <label style={{
          background: "linear-gradient(135deg, #6366f1, #a855f7)",
          padding: "12px 24px", borderRadius: "30px",
          cursor: "pointer", display: "inline-block", fontWeight: "bold"
        }}>
          {uploading ? "⏳ Uploading..." : "➕ Add Photos"}
          <input type="file" accept="image/*" onChange={handleUpload} multiple hidden disabled={uploading} />
        </label>
        <p style={{ fontSize: "11px", opacity: 0.6, marginTop: "8px" }}>
          Keep photos small for best performance
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <h3 style={{ textAlign: "center", borderBottom: "2px solid #6366f1", paddingBottom: "8px" }}>
            {user} (You)
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "15px" }}>
            {renderGrid(myPhotos, true)}
          </div>
        </div>

        <div>
          <h3 style={{ textAlign: "center", borderBottom: "2px solid #ef4444", paddingBottom: "8px" }}>
            {otherUser}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "15px" }}>
            {renderGrid(otherPhotos, false)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhotoVault;