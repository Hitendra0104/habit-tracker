import React, { useState, useEffect } from "react";

const fields = [
  "weight",
  "waist",
  "leftThigh",
  "rightThigh",
  "leftArm",
  "rightArm",
  "neck",
  "chest"
];

function getWeekRanges() {
  const weeks = [];
  let current = new Date("2026-04-13");

  for (let i = 0; i < 52; i++) {
    const start = new Date(current);
    const end = new Date(current);
    end.setDate(start.getDate() + 6);

    const format = (d) =>
      `${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`;

    weeks.push({
      sr: i + 1,
      key: start.toISOString().split("T")[0],
      label: `Week ${format(start)} - ${format(end)}`
    });

    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

function Measurements({ user }) {
  const weeks = getWeekRanges();
  const [data, setData] = useState({});
  const [targets, setTargets] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem(`measurements_${user}`);
    const savedTargets = localStorage.getItem(`targets_${user}`);

    if (saved) setData(JSON.parse(saved));
    if (savedTargets) setTargets(JSON.parse(savedTargets));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(
      `measurements_${user}`,
      JSON.stringify(data)
    );
  }, [data, user]);

  useEffect(() => {
    localStorage.setItem(
      `targets_${user}`,
      JSON.stringify(targets)
    );
  }, [targets, user]);

  const handleChange = (weekKey, field, value) => {
    const updated = { ...data };
    if (!updated[weekKey]) updated[weekKey] = {};
    updated[weekKey][field] = value;
    setData(updated);
  };

  const handleTargetChange = (field, value) => {
    setTargets({ ...targets, [field]: value });
  };

  return (
    <div className="measure-table-container">
      <h2>📏 {user} Measurements</h2>

      <div className="table-wrapper">
        <table className="measure-table">

          <thead>
            <tr>
              <th>Sr</th>
              <th>Week</th>
              <th>Weight</th>
              <th>Waist</th>
              <th>L Thigh</th>
              <th>R Thigh</th>
              <th>L Arm</th>
              <th>R Arm</th>
              <th>Neck</th>
              <th>Chest</th>
            </tr>
          </thead>

          <tbody>

            <tr className="target-row">
              <td>-</td>
              <td>Target</td>

              {fields.map((field, i) => (
                <td key={i}>
                  <input
                    value={targets[field] || ""}
                    onChange={(e) =>
                      handleTargetChange(field, e.target.value)
                    }
                  />
                </td>
              ))}
            </tr>

            {weeks.map((week, i) => (
              <tr key={i}>
                <td>{week.sr}</td>
                <td className="week-label">{week.label}</td>

                {fields.map((field, idx) => (
                  <td key={idx}>
                    <input
                      value={data[week.key]?.[field] || ""}
                      onChange={(e) =>
                        handleChange(
                          week.key,
                          field,
                          e.target.value
                        )
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}

          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Measurements;