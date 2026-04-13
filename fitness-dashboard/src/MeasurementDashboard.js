import React, { useEffect, useState } from "react";

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

      {/* 🔙 BACK BUTTON */}
      <button className="back-btn" onClick={() => setPage("dashboard")}>
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

export default MeasurementDashboard;