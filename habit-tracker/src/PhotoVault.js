import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

const PhotoVault = ({ user, otherUser }) => {
  const [allPhotos, setAllPhotos] = useState({ [user]: {}, [otherUser]: {} });
  const [uploading, setUploading] = useState(false);

  // Sync both users' photos
  useEffect(() => {
    const unsubMe = onSnapshot(doc(db, "photos", user), (snap) => {
      if (snap.exists()) setAllPhotos(prev => ({ ...prev, [user]: snap.data() }));
    });
    const unsubOther = onSnapshot(doc(db, "photos", otherUser), (snap) => {
      if (snap.exists()) setAllPhotos(prev => ({ ...prev, [otherUser]: snap.data() }));
    });
    return () => { unsubMe(); unsubOther(); };
  }, [user, otherUser]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    
    // We create a copy of current photos to add new ones
    const updatedPhotos = { ...allPhotos[user] };

    for (const file of files) {
      const reader = new FileReader();
      
      // We wrap the reader in a promise so we can upload multiple properly
      const base64 = await new Promise((resolve) => {
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
      });

      // To allow multiple photos on the same date, we add a timestamp
      const timestamp = new Date().getTime();
      const dateKey = `${new Date().toISOString().split('T')[0]}_${timestamp}`;
      updatedPhotos[dateKey] = base64;
    }

    await setDoc(doc(db, "photos", user), updatedPhotos);
    setUploading(false);
  };

  // Helper to flatten photos for the grid
  const renderPhotoGrid = (owner) => {
    return Object.entries(allPhotos[owner] || {})
      .sort().reverse()
      .map(([key, url]) => (
        <div key={key} className="photo-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '12px' }}>
          <img src={url} alt="Progress" style={{ width: '100%', borderRadius: '8px', aspectRatio: '1/1', objectFit: 'cover' }} />
          <p style={{ fontSize: '10px', textAlign: 'center', margin: '5px 0' }}>{key.split('_')[0]}</p>
        </div>
      ));
  };

  return (
    <div className="photo-vault-container" style={{ padding: '20px', paddingBottom: '100px' }}>
      <h2 style={{ textAlign: 'center', color: '#6366f1' }}>🔥 Battle Gallery</h2>
      
      <div className="upload-box" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <label className="custom-file-upload" style={{
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          padding: '12px 24px',
          borderRadius: '30px',
          cursor: 'pointer',
          display: 'inline-block',
          fontWeight: 'bold'
        }}>
          {uploading ? "⌛ Uploading Multiple..." : "➕ Add Daily Progress Photos"}
          <input type="file" accept="image/*" onChange={handleUpload} multiple hidden />
        </label>
        <p style={{fontSize: '11px', opacity: 0.6, marginTop: '10px'}}>You can select multiple photos at once</p>
      </div>

      <div className="battle-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="column">
          <h3 style={{ textAlign: 'center', fontSize: '16px', borderBottom: '2px solid #6366f1' }}>{user} (You)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginTop: '15px' }}>
            {renderPhotoGrid(user)}
          </div>
        </div>

        <div className="column">
          <h3 style={{ textAlign: 'center', fontSize: '16px', borderBottom: '2px solid #ef4444' }}>{otherUser}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginTop: '15px' }}>
            {renderPhotoGrid(otherUser)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoVault;