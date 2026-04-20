import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";

function MeasurementDashboard({ setPage }) {
  const [radhika, setRadhika] = useState({ current: {}, previous: {} });
  const [hitendra, setHitendra] = useState({ current: {}, previous: {} });

  const getLatestTwo = (weeksData) => {
    const sortedKeys = Object.keys(weeksData || {}).sort().reverse();
    return {
      current: sortedKeys[0] ? weeksData[sortedKeys[0]] : {},
      previous: sortedKeys[1] ? weeksData[sortedKeys[1]] : {}
    };
  };

  const calculateDiff = (current, previous) => {
    const curr = parseFloat(current);
    const prev = parseFloat(previous);
    if (isNaN(curr) || isNaN(prev)) return "-";
    const diff = (curr - prev).toFixed(1);
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  useEffect(() => {
    const unsubR = onSnapshot(doc(db, "measurements", "Radhika"), (docSnap) => {
      if (docSnap.exists()) {
        const result = getLatestTwo(docSnap.data().weeks);
        setRadhika(result);
      }
    });

    const unsubH = onSnapshot(doc(db, "measurements", "Hitendra"), (docSnap) => {
      if (docSnap.exists()) {
        const result = getLatestTwo(docSnap.data().weeks);
        setHitendra(result);
      }
    });

    return () => { 
      unsubR(); 
      unsubH(); 
    };
  }, []);

  const Row = ({ label, field }) => {
    const rDiff = calculateDiff(radhika.current[field], radhika.previous[field]);
    const hDiff = calculateDiff(hitendra.current[field], hitendra.previous[field]);

    return (
      <div className="compare-row">
        <div className="label-cell">{label}</div>
        <div className="value-cell">
          {radhika.current[field] || "-"}
          <span className={`diff ${parseFloat(rDiff) < 0 ? 'good' : ''}`}>
            ({rDiff})
          </span>
        </div>
        <div className="value-cell">
          {hitendra.current[field] || "-"}
          <span className={`diff ${parseFloat(hDiff) < 0 ? 'good' : ''}`}>
            ({hDiff})
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="compare-page">
      <button className="back-btn" onClick={() => setPage("dashboard")}>
        ⬅ Back to Dashboard
      </button>
      
      <div className="dashboard-card">
        <h2>📏 Weekly Progress</h2>
        <div className="compare-header">
          <div>Metric</div>
          <div>Radhika</div>
          <div>Hitendra</div>
        </div>
        
        <Row label="Weight (kg)" field="weight" />
        <Row label="Waist (in)" field="waist" />
        <Row label="Chest (in)" field="chest" />
        <Row label="Neck (in)" field="neck" />
      </div>
    </div>
  );
}

export default MeasurementDashboard;

/*export default MeasurementDashboard;/*import React, { useEffect, useState } from "react";

function MeasurementDashboard({ setPage }) {
  const [radhika, setRadhika] = useState({});
  const [hitendra, setHitendra] = useState({});

  const getLatest = (data) => {
    const dates = Object.keys(data || {}).sort().reverse();
    return dates.length ? data[dates[0]] : {};
  };

  const getPrevious = (data) => {
    const dates = Object.keys(data || {}).sort().reverse();
    return dates.length > 1 ? data[dates[1]] : {};
  };

  const calculateDiff = (current, previous) => {
    if (!current || !previous) return "-";

    const diff = current - previous;
    if (isNaN(diff)) return "-";

    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  useEffect(() => {
    const r = JSON.parse(
      localStorage.getItem("measurements_Radhika") || "{}"
    );
    const h = JSON.parse(
      localStorage.getItem("measurements_Hitendra") || "{}"
    );

    setRadhika({
      current: getLatest(r),
      previous: getPrevious(r)
    });

    setHitendra({
      current: getLatest(h),
      previous: getPrevious(h)
    });
  }, []);

  const Row = ({ label, rValue, hValue, rDiff, hDiff }) => (
    <div className="compare-row">
      <div>{label}</div>

      <div>
        {rValue || "-"}
        <span className="diff">{rDiff}</span>
      </div>

      <div>
        {hValue || "-"}
        <span className="diff">{hDiff}</span>
      </div>
    </div>
  );

  return (
    <div className="compare-page">

      {/* 🔙 BACK BUTTON */
     /* <button className="back-btn" onClick={() => setPage("dashboard")}>
        ⬅ Back
      </button>

      <h2>📏 Measurement Dashboard</h2>

      <div className="compare-header">
        <div></div>
        <div>Radhika</div>
        <div>Hitendra</div>
      </div>

      <Row
        label="Weight"
        rValue={radhika.current?.weight}
        hValue={hitendra.current?.weight}
        rDiff={calculateDiff(
          radhika.current?.weight,
          radhika.previous?.weight
        )}
        hDiff={calculateDiff(
          hitendra.current?.weight,
          hitendra.previous?.weight
        )}
      />

      <Row
        label="Waist"
        rValue={radhika.current?.waist}
        hValue={hitendra.current?.waist}
        rDiff={calculateDiff(
          radhika.current?.waist,
          radhika.previous?.waist
        )}
        hDiff={calculateDiff(
          hitendra.current?.waist,
          hitendra.previous?.waist
        )}
      />

      <Row
        label="Chest"
        rValue={radhika.current?.chest}
        hValue={hitendra.current?.chest}
        rDiff={calculateDiff(
          radhika.current?.chest,
          radhika.previous?.chest
        )}
        hDiff={calculateDiff(
          hitendra.current?.chest,
          hitendra.previous?.chest
        )}
      />

      <Row
        label="Arms"
        rValue={radhika.current?.arms}
        hValue={hitendra.current?.arms}
        rDiff={calculateDiff(
          radhika.current?.arms,
          radhika.previous?.arms
        )}
        hDiff={calculateDiff(
          hitendra.current?.arms,
          hitendra.previous?.arms
        )}
      />

    </div>
  );
}

export default MeasurementDashboard;*/