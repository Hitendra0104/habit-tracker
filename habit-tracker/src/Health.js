import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const getLocalDate = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

const getLast30Days = () => {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return getLocalDate(d);
  });
};

const getLast7Days = () => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return getLocalDate(d);
  });
};

export default function Health({ user, otherUser }) {
  const [tab, setTab] = useState("weight");
  const [myData, setMyData] = useState({});
  const [theirData, setTheirData] = useState({});
  const [goals, setGoals] = useState({ weight: 70, water: 3, steps: 8000 });
  const [showGoals, setShowGoals] = useState(false);
  const [tempGoals, setTempGoals] = useState({ ...goals });
  const today = getLocalDate(new Date());

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "health", user), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setMyData(d.logs || {});
        if (d.goals) setGoals(d.goals);
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!otherUser) return;
    const unsub = onSnapshot(doc(db, "health", otherUser), (snap) => {
      setTheirData(snap.exists() ? snap.data().logs || {} : {});
    });
    return () => unsub();
  }, [otherUser]);

  const save = (updatedLogs, updatedGoals) => {
    setDoc(doc(db, "health", user), {
      logs: updatedLogs ?? myData,
      goals: updatedGoals ?? goals,
    }, { merge: true });
  };

  const updateLog = (field, value) => {
    const updated = {
      ...myData,
      [today]: { ...(myData[today] || {}), [field]: value },
    };
    setMyData(updated);
    save(updated, null);
  };

  const saveGoals = () => {
    setGoals(tempGoals);
    save(null, tempGoals);
    setShowGoals(false);
  };

  const todayWeight = myData[today]?.weight || "";
  const todayWater  = myData[today]?.water  || 0;
  const todaySteps  = myData[today]?.steps  || 0;

  const last30 = getLast30Days();
  const myWeights    = last30.map((d) => ({ date: d, val: myData[d]?.weight   || null }));
  const theirWeights = last30.map((d) => ({ date: d, val: theirData[d]?.weight || null }));

  const last7 = getLast7Days();
  const myWeekSteps    = last7.reduce((a, d) => a + (myData[d]?.steps    || 0), 0);
  const theirWeekSteps = last7.reduce((a, d) => a + (theirData[d]?.steps || 0), 0);

  const GLASS_ML     = 250;
  const totalGlasses = Math.ceil((goals.water * 1000) / GLASS_ML);
  const filledGlasses = Math.round((todayWater * 1000) / GLASS_ML);

  return (
    <div className="health-page">
      {/* ── TABS ── */}
      <div className="health-tabs">
        {[["weight", "⚖️ Weight"], ["water", "💧 Water"], ["steps", "👟 Steps"]].map(([key, label]) => (
          <button key={key} className={`htab-btn ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Goals button */}
      <div style={{ textAlign: "right", marginBottom: "16px" }}>
        <button className="h-goals-btn" onClick={() => { setTempGoals({ ...goals }); setShowGoals(true); }}>
          🎯 Set Goals
        </button>
      </div>

      {/* Goals Modal */}
      {showGoals && (
        <div className="goals-overlay" onClick={() => setShowGoals(false)}>
          <div className="goals-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🎯 My Health Goals</h3>
            {[
              { key: "weight", label: "Target Weight (kg)" },
              { key: "water",  label: "Daily Water (litres)" },
              { key: "steps",  label: "Daily Steps" },
            ].map(({ key, label }) => (
              <div key={key} className="goal-field">
                <label>{label}</label>
                <input
                  type="number"
                  value={tempGoals[key]}
                  onChange={(e) => setTempGoals({ ...tempGoals, [key]: parseFloat(e.target.value) || 0 })}
                  className="goal-input"
                />
              </div>
            ))}
            <div className="goal-actions">
              <button className="goal-save-btn" onClick={saveGoals}>Save Goals</button>
              <button className="goal-cancel-btn" onClick={() => setShowGoals(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          WEIGHT TAB
      ════════════════════════════════════ */}
      {tab === "weight" && (
        <div className="weight-tab">
          <div className="weight-log-card">
            <h3>⚖️ Today's Weight</h3>
            <div className="weight-input-row">
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 72.5"
                value={todayWeight}
                onChange={(e) => updateLog("weight", parseFloat(e.target.value) || "")}
                className="weight-input"
              />
              <span className="weight-unit">kg</span>
            </div>
            {goals.weight && todayWeight && (
              <div className={`weight-diff ${todayWeight <= goals.weight ? "on-track" : "over-goal"}`}>
                {todayWeight <= goals.weight
                  ? `✅ ${(goals.weight - todayWeight).toFixed(1)}kg below target!`
                  : `💪 ${(todayWeight - goals.weight).toFixed(1)}kg to go`}
              </div>
            )}
          </div>

          <div className="weight-chart-card">
            <h3>📈 30-Day Progress</h3>
            <WeightChart
              myData={myWeights}
              theirData={theirWeights}
              myName={user}
              theirName={otherUser}
              targetWeight={goals.weight}
            />
            <div className="chart-legend">
              <span><span className="legend-dot" style={{ background: "#6366f1" }} /> {user}</span>
              <span><span className="legend-dot" style={{ background: "#f97316" }} /> {otherUser}</span>
              <span><span className="legend-dot" style={{ background: "#22c55e" }} /> Target</span>
            </div>
          </div>

          <div className="weight-history">
            <h3>📋 Recent</h3>
            {[...last7].reverse().map((d) => {
              const w = myData[d]?.weight;
              return w ? (
                <div key={d} className="weight-history-row">
                  <span className="wh-date">
                    {new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                  <span className="wh-val">{w} kg</span>
                  <span className={`wh-diff ${w <= goals.weight ? "green" : "orange"}`}>
                    {w <= goals.weight ? "✓" : `+${(w - goals.weight).toFixed(1)}`}
                  </span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          WATER TAB
      ════════════════════════════════════ */}
      {tab === "water" && (
        <div className="water-tab">
          <div className="water-hero">
            <div className="water-bottle">
              <div className="bottle-body">
                <div
                  className="bottle-fill"
                  style={{ height: `${Math.min(100, (todayWater / goals.water) * 100)}%` }}
                />
                <div className="bottle-text">
                  <span className="water-amount">{todayWater.toFixed(1)}L</span>
                  <span className="water-goal-text">/ {goals.water}L</span>
                </div>
              </div>
            </div>
            <div className="water-info">
              <div className="water-pct">{Math.round((todayWater / goals.water) * 100)}%</div>
              <div className="water-remaining">
                {todayWater >= goals.water
                  ? "🎉 Goal reached!"
                  : `${(goals.water - todayWater).toFixed(1)}L to go`}
              </div>
            </div>
          </div>

          <div className="glass-grid">
            {Array.from({ length: totalGlasses }).map((_, i) => (
              <button
                key={i}
                className={`glass-btn ${i < filledGlasses ? "filled" : ""}`}
                onClick={() => {
                  const newGlasses = i < filledGlasses ? i : i + 1;
                  updateLog("water", Math.round((newGlasses * GLASS_ML / 1000) * 10) / 10);
                }}
              >
                💧
              </button>
            ))}
          </div>
          <p className="glass-hint">Each 💧 = {GLASS_ML}ml · Tap to toggle</p>

          <div className="water-quick">
            {[0.25, 0.5, 1].map((amt) => (
              <button key={amt} className="water-quick-btn"
                onClick={() => updateLog("water", Math.round((todayWater + amt) * 10) / 10)}>
                +{amt}L
              </button>
            ))}
            <button className="water-quick-btn danger"
              onClick={() => updateLog("water", Math.max(0, Math.round((todayWater - 0.25) * 10) / 10))}>
              −0.25L
            </button>
          </div>

          <div className="their-water-card">
            <h3>💧 {otherUser}'s Hydration Today</h3>
            <div className="their-water-bar-wrap">
              <div className="their-water-bar">
                <div className="their-water-fill"
                  style={{ width: `${Math.min(100, ((theirData[today]?.water || 0) / goals.water) * 100)}%` }} />
              </div>
              <span className="their-water-val">{theirData[today]?.water || 0}L</span>
            </div>
          </div>

          <div className="water-history">
            <h3>📅 This Week</h3>
            {getLast7Days().map((d) => {
              const w = myData[d]?.water || 0;
              const pct = Math.min(100, (w / goals.water) * 100);
              return (
                <div key={d} className="water-week-row">
                  <span className="ww-date">
                    {new Date(d).toLocaleDateString("en-IN", { weekday: "short" })}
                  </span>
                  <div className="ww-bar-track">
                    <div className="ww-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="ww-val">{w}L</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          STEPS TAB
      ════════════════════════════════════ */}
      {tab === "steps" && (
        <div className="steps-tab">
          <div className="steps-hero-card">
            <h3>👟 Today's Steps</h3>
            <input
              type="number"
              placeholder="e.g. 7500"
              value={todaySteps || ""}
              onChange={(e) => updateLog("steps", parseInt(e.target.value) || 0)}
              className="steps-input"
            />
            <div className="steps-progress-wrap">
              <div className="steps-progress-track">
                <div className="steps-progress-fill"
                  style={{ width: `${Math.min(100, (todaySteps / goals.steps) * 100)}%` }} />
              </div>
              <span className="steps-pct">{Math.round((todaySteps / goals.steps) * 100)}%</span>
            </div>
            <div className="steps-remaining">
              {todaySteps >= goals.steps
                ? `🔥 Goal crushed! +${(todaySteps - goals.steps).toLocaleString()} extra steps`
                : `${(goals.steps - todaySteps).toLocaleString()} steps to goal`}
            </div>
            <div className="steps-quick">
              {[500, 1000, 2000, 5000].map((s) => (
                <button key={s} className="steps-quick-btn"
                  onClick={() => updateLog("steps", todaySteps + s)}>
                  +{s.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="steps-leaderboard">
            <h3>🏆 Weekly Leaderboard</h3>
            {[
              { name: user,      steps: myWeekSteps,    color: "#6366f1", winner: myWeekSteps >= theirWeekSteps },
              { name: otherUser, steps: theirWeekSteps, color: "#f97316", winner: theirWeekSteps > myWeekSteps  },
            ].map((p) => (
              <div key={p.name} className={`leaderboard-card ${p.winner ? "winner" : ""}`}>
                <div className="lb-rank">{p.winner ? "🥇" : "🥈"}</div>
                <div className="lb-name">{p.name}</div>
                <div className="lb-steps">{p.steps.toLocaleString()}</div>
                <div className="lb-bar-wrap">
                  <div className="lb-bar" style={{
                    width: `${Math.min(100, (p.steps / Math.max(myWeekSteps, theirWeekSteps, 1)) * 100)}%`,
                    background: p.color,
                  }} />
                </div>
              </div>
            ))}
            <div className="lb-winner-msg">
              {myWeekSteps === theirWeekSteps
                ? "🤝 Perfectly tied this week!"
                : myWeekSteps > theirWeekSteps
                ? `🔥 ${user} leads by ${(myWeekSteps - theirWeekSteps).toLocaleString()} steps!`
                : `😤 ${otherUser} is ahead by ${(theirWeekSteps - myWeekSteps).toLocaleString()} steps!`}
            </div>
          </div>

          <div className="steps-history">
            <h3>📅 This Week</h3>
            {getLast7Days().map((d) => {
              const myS    = myData[d]?.steps    || 0;
              const theirS = theirData[d]?.steps || 0;
              const maxS   = Math.max(myS, theirS, goals.steps, 1);
              return (
                <div key={d} className="steps-week-row">
                  <span className="sw-date">
                    {new Date(d).toLocaleDateString("en-IN", { weekday: "short" })}
                  </span>
                  <div className="sw-bars">
                    <div className="sw-bar-track">
                      <div className="sw-bar-fill mine" style={{ width: `${(myS / maxS) * 100}%` }} />
                    </div>
                    <div className="sw-bar-track">
                      <div className="sw-bar-fill theirs" style={{ width: `${(theirS / maxS) * 100}%` }} />
                    </div>
                  </div>
                  <div className="sw-vals">
                    <span style={{ color: "#818cf8" }}>{myS.toLocaleString()}</span>
                    <span style={{ color: "#fb923c" }}>{theirS.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
            <div className="sw-legend">
              <span><span className="legend-dot" style={{ background: "#6366f1" }} /> {user}</span>
              <span><span className="legend-dot" style={{ background: "#f97316" }} /> {otherUser}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WEIGHT CHART ────────────────────────────────────────────────────────────
function WeightChart({ myData, theirData, myName, theirName, targetWeight }) {
  const allVals = [
    ...myData.map((d) => d.val).filter(Boolean),
    ...theirData.map((d) => d.val).filter(Boolean),
    targetWeight,
  ];
  if (allVals.length < 2) return (
    <div className="chart-empty">Log your weight for a few days to see the chart 📈</div>
  );

  const minVal = Math.min(...allVals) - 2;
  const maxVal = Math.max(...allVals) + 2;
  const range  = maxVal - minVal;
  const W = 320, H = 160, PAD = 20;

  const toX = (i) => PAD + (i / (myData.length - 1)) * (W - PAD * 2);
  const toY = (v) => H - PAD - ((v - minVal) / range) * (H - PAD * 2);

  const buildPath = (points) => {
    const valid = points
      .map((p, i) => p.val ? { x: toX(i), y: toY(p.val) } : null)
      .filter(Boolean);
    if (valid.length < 2) return "";
    return valid.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  };

  const targetY = toY(targetWeight);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="weight-svg">
      {/* Target line */}
      <line x1={PAD} y1={targetY} x2={W - PAD} y2={targetY}
        stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
      <text x={W - PAD - 2} y={targetY - 4} fill="#22c55e" fontSize="9" textAnchor="end">
        {targetWeight}kg
      </text>
      {/* Their line */}
      <path d={buildPath(theirData)} fill="none" stroke="#f97316"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      {/* My line */}
      <path d={buildPath(myData)} fill="none" stroke="#6366f1"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {myData.map((p, i) => p.val && (
        <circle key={i} cx={toX(i)} cy={toY(p.val)} r="3" fill="#6366f1" />
      ))}
      {theirData.map((p, i) => p.val && (
        <circle key={i} cx={toX(i)} cy={toY(p.val)} r="3" fill="#f97316" opacity="0.7" />
      ))}
      {/* Y axis labels */}
      {[minVal + 1, (minVal + maxVal) / 2, maxVal - 1].map((v, i) => (
        <text key={i} x={PAD - 4} y={toY(v) + 4} fill="#64748b" fontSize="8" textAnchor="end">
          {Math.round(v)}
        </text>
      ))}
    </svg>
  );
}