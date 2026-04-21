import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

// ─── PRE-BUILT PLANS ───────────────────────────────────────────────────────
const PLANS = {
  "Push Day 💪": [
    { name: "Bench Press", sets: 4, reps: 10, unit: "kg" },
    { name: "Overhead Press", sets: 3, reps: 12, unit: "kg" },
    { name: "Incline Dumbbell Press", sets: 3, reps: 12, unit: "kg" },
    { name: "Lateral Raises", sets: 3, reps: 15, unit: "kg" },
    { name: "Tricep Pushdown", sets: 3, reps: 15, unit: "kg" },
  ],
  "Pull Day 🏋️": [
    { name: "Deadlift", sets: 4, reps: 6, unit: "kg" },
    { name: "Pull-ups", sets: 3, reps: 8, unit: "reps" },
    { name: "Barbell Row", sets: 3, reps: 10, unit: "kg" },
    { name: "Face Pulls", sets: 3, reps: 15, unit: "kg" },
    { name: "Bicep Curls", sets: 3, reps: 12, unit: "kg" },
  ],
  "Leg Day 🦵": [
    { name: "Squats", sets: 4, reps: 8, unit: "kg" },
    { name: "Romanian Deadlift", sets: 3, reps: 10, unit: "kg" },
    { name: "Leg Press", sets: 3, reps: 12, unit: "kg" },
    { name: "Lunges", sets: 3, reps: 12, unit: "kg" },
    { name: "Calf Raises", sets: 4, reps: 20, unit: "kg" },
  ],
  "Cardio 🏃": [
    { name: "Treadmill Run", sets: 1, reps: 30, unit: "min" },
    { name: "Jump Rope", sets: 3, reps: 5, unit: "min" },
    { name: "Cycling", sets: 1, reps: 20, unit: "min" },
    { name: "Burpees", sets: 3, reps: 15, unit: "reps" },
  ],
  "Full Body 🔥": [
    { name: "Squats", sets: 3, reps: 10, unit: "kg" },
    { name: "Push-ups", sets: 3, reps: 15, unit: "reps" },
    { name: "Dumbbell Row", sets: 3, reps: 10, unit: "kg" },
    { name: "Shoulder Press", sets: 3, reps: 10, unit: "kg" },
    { name: "Plank", sets: 3, reps: 60, unit: "sec" },
  ],
  "Rest Day 😴": [],
};

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const getLocalDate = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

const getTodayKey = () => getLocalDate(new Date());

const getWeekDates = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return getLocalDate(d);
  });
};

// ─── COMPONENT ─────────────────────────────────────────────────────────────
export default function Workout({ user, otherUser }) {
  const [tab, setTab] = useState("schedule"); // schedule | log | compete
  const [myData, setMyData] = useState({});
  const [theirData, setTheirData] = useState({});
  const [selectedDay, setSelectedDay] = useState(0); // 0=Mon … 6=Sun
  const [logDate, setLogDate] = useState(getTodayKey());
  const [customExercise, setCustomExercise] = useState({ name: "", sets: "", reps: "", weight: "", unit: "kg" });
  const [showPlanPicker, setShowPlanPicker] = useState(false);

  const weekDates = getWeekDates();
  const todayIdx = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; })();

  // ── Firebase sync ──
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "workouts", user), (snap) => {
      setMyData(snap.exists() ? snap.data() : {});
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!otherUser) return;
    const unsub = onSnapshot(doc(db, "workouts", otherUser), (snap) => {
      setTheirData(snap.exists() ? snap.data() : {});
    });
    return () => unsub();
  }, [otherUser]);

  const save = (updated) => {
    setMyData(updated);
    setDoc(doc(db, "workouts", user), updated, { merge: true });
  };

  // ── Schedule helpers ──
  const getSchedulePlan = (dayIdx) => myData?.schedule?.[dayIdx] ?? "Rest Day 😴";

  const setSchedulePlan = (dayIdx, plan) => {
    const updated = { ...myData, schedule: { ...(myData.schedule || {}), [dayIdx]: plan } };
    save(updated);
  };

  // ── Log helpers ──
  const getLogForDate = (date) => myData?.logs?.[date] || { exercises: [], done: false };

  const loadPlanIntoLog = (planName) => {
    const exercises = (PLANS[planName] || []).map((e) => ({
      ...e,
      weight: "",
      completed: false,
      actualSets: Array(e.sets).fill({ reps: "", weight: "" }),
    }));
    const updated = {
      ...myData,
      logs: {
        ...(myData.logs || {}),
        [logDate]: { exercises, done: false, planName },
      },
    };
    save(updated);
    setShowPlanPicker(false);
  };

  const toggleExerciseDone = (exIdx) => {
    const log = getLogForDate(logDate);
    const exercises = [...(log.exercises || [])];
    exercises[exIdx] = { ...exercises[exIdx], completed: !exercises[exIdx].completed };
    const updated = { ...myData, logs: { ...(myData.logs || {}), [logDate]: { ...log, exercises } } };
    save(updated);
  };

  const updateSet = (exIdx, setIdx, field, value) => {
    const log = getLogForDate(logDate);
    const exercises = [...(log.exercises || [])];
    const actualSets = [...(exercises[exIdx].actualSets || [])];
    actualSets[setIdx] = { ...actualSets[setIdx], [field]: value };
    exercises[exIdx] = { ...exercises[exIdx], actualSets };
    const updated = { ...myData, logs: { ...(myData.logs || {}), [logDate]: { ...log, exercises } } };
    save(updated);
  };

  const addCustomExercise = () => {
    if (!customExercise.name) return;
    const log = getLogForDate(logDate);
    const newEx = {
      name: customExercise.name,
      sets: parseInt(customExercise.sets) || 3,
      reps: parseInt(customExercise.reps) || 10,
      unit: customExercise.unit,
      completed: false,
      actualSets: Array(parseInt(customExercise.sets) || 3).fill({ reps: "", weight: "" }),
    };
    const exercises = [...(log.exercises || []), newEx];
    const updated = { ...myData, logs: { ...(myData.logs || {}), [logDate]: { ...log, exercises } } };
    save(updated);
    setCustomExercise({ name: "", sets: "", reps: "", weight: "", unit: "kg" });
  };

  const deleteExercise = (exIdx) => {
    const log = getLogForDate(logDate);
    const exercises = (log.exercises || []).filter((_, i) => i !== exIdx);
    const updated = { ...myData, logs: { ...(myData.logs || {}), [logDate]: { ...log, exercises } } };
    save(updated);
  };

  const markDayDone = () => {
    const log = getLogForDate(logDate);
    const updated = { ...myData, logs: { ...(myData.logs || {}), [logDate]: { ...log, done: !log.done } } };
    save(updated);
  };

  // ── Competition helpers ──
  const getWorkoutCount = (userData) => {
    const logs = userData?.logs || {};
    return Object.values(logs).filter((l) => l.done).length;
  };

  const getVolume = (userData) => {
    const logs = userData?.logs || {};
    let total = 0;
    Object.values(logs).forEach((log) => {
      (log.exercises || []).forEach((ex) => {
        (ex.actualSets || []).forEach((s) => {
          const w = parseFloat(s.weight) || 0;
          const r = parseFloat(s.reps) || 0;
          total += w * r;
        });
      });
    });
    return Math.round(total);
  };

  const getWeeklyWorkouts = (userData) => {
    const logs = userData?.logs || {};
    return weekDates.filter((d) => logs[d]?.done).length;
  };

  const myCount = getWorkoutCount(myData);
  const theirCount = getWorkoutCount(theirData);
  const myVol = getVolume(myData);
  const theirVol = getVolume(theirData);
  const myWeek = getWeeklyWorkouts(myData);
  const theirWeek = getWeeklyWorkouts(theirData);

  const log = getLogForDate(logDate);

  return (
    <div className="workout-page">
      {/* ── TAB BAR ── */}
      <div className="workout-tabs">
        {[["schedule", "📅 Schedule"], ["log", "📝 Log"], ["compete", "⚔️ VS"]].map(([key, label]) => (
          <button
            key={key}
            className={`workout-tab-btn ${tab === key ? "active" : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════
          TAB 1: WEEKLY SCHEDULE
      ════════════════════════════════════ */}
      {tab === "schedule" && (
        <div className="workout-schedule">
          <h2>📅 Weekly Plan</h2>
          <p className="workout-sub">Assign a workout to each day</p>

          <div className="schedule-grid">
            {WEEK_DAYS.map((day, idx) => {
              const plan = getSchedulePlan(idx);
              const isToday = idx === todayIdx;
              const dateStr = weekDates[idx];
              const isDone = myData?.logs?.[dateStr]?.done;
              return (
                <div key={idx} className={`schedule-card ${isToday ? "today-card" : ""} ${isDone ? "done-card" : ""}`}>
                  <div className="schedule-day-label">
                    <span className="day-short">{day}</span>
                    {isToday && <span className="today-badge">TODAY</span>}
                    {isDone && <span className="done-badge">✓ Done</span>}
                  </div>
                  <div className="schedule-plan-name">{plan}</div>
                  <select
                    value={plan}
                    onChange={(e) => setSchedulePlan(idx, e.target.value)}
                    className="schedule-select"
                  >
                    {Object.keys(PLANS).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {plan !== "Rest Day 😴" && (
                    <div className="schedule-exercises">
                      {PLANS[plan].slice(0, 3).map((e, i) => (
                        <span key={i} className="exercise-chip">{e.name}</span>
                      ))}
                      {PLANS[plan].length > 3 && (
                        <span className="exercise-chip muted">+{PLANS[plan].length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Their schedule preview */}
          <div className="their-schedule">
            <h3>👀 {otherUser}'s Plan This Week</h3>
            <div className="their-schedule-row">
              {WEEK_DAYS.map((day, idx) => {
                const plan = theirData?.schedule?.[idx] ?? "Rest Day 😴";
                const isDone = theirData?.logs?.[weekDates[idx]]?.done;
                return (
                  <div key={idx} className={`their-day-chip ${isDone ? "their-done" : ""}`}>
                    <div className="their-day">{day}</div>
                    <div className="their-plan">{plan.split(" ")[0]}</div>
                    {isDone && <div className="their-check">✓</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          TAB 2: WORKOUT LOG
      ════════════════════════════════════ */}
      {tab === "log" && (
        <div className="workout-log">
          <div className="log-header">
            <h2>📝 Workout Log</h2>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="log-date-input"
            />
          </div>

          {/* Suggested plan for this day */}
          {(() => {
            const d = new Date(logDate);
            const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
            const suggested = getSchedulePlan(dayIdx);
            return suggested !== "Rest Day 😴" ? (
              <div className="suggested-banner">
                <span>💡 Suggested: <strong>{suggested}</strong></span>
                <button className="load-plan-btn" onClick={() => loadPlanIntoLog(suggested)}>
                  Load Plan
                </button>
              </div>
            ) : null;
          })()}

          {/* Plan picker */}
          <div className="plan-picker-row">
            <button className="outline-btn" onClick={() => setShowPlanPicker(!showPlanPicker)}>
              📋 Load a Plan
            </button>
            <button
              className={`done-btn ${log.done ? "done-active" : ""}`}
              onClick={markDayDone}
            >
              {log.done ? "✅ Completed!" : "Mark as Done"}
            </button>
          </div>

          {showPlanPicker && (
            <div className="plan-picker">
              {Object.keys(PLANS).filter(p => p !== "Rest Day 😴").map((p) => (
                <button key={p} className="plan-option" onClick={() => loadPlanIntoLog(p)}>
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Exercise list */}
          <div className="exercise-list">
            {(log.exercises || []).length === 0 && (
              <div className="empty-log">
                <p>No exercises yet. Load a plan or add custom below 👇</p>
              </div>
            )}
            {(log.exercises || []).map((ex, exIdx) => (
              <div key={exIdx} className={`exercise-card ${ex.completed ? "ex-done" : ""}`}>
                <div className="ex-header">
                  <div className="ex-info">
                    <span className="ex-name">{ex.name}</span>
                    <span className="ex-meta">{ex.sets} sets × {ex.reps} {ex.unit}</span>
                  </div>
                  <div className="ex-actions">
                    <button className={`ex-check-btn ${ex.completed ? "checked" : ""}`} onClick={() => toggleExerciseDone(exIdx)}>
                      {ex.completed ? "✓" : "○"}
                    </button>
                    <button className="ex-delete-btn" onClick={() => deleteExercise(exIdx)}>🗑</button>
                  </div>
                </div>

                {/* Sets tracking */}
                <div className="sets-grid">
                  <div className="sets-header-row">
                    <span>Set</span><span>Reps</span><span>Weight (kg)</span>
                  </div>
                  {Array.from({ length: ex.sets }).map((_, setIdx) => {
                    const s = (ex.actualSets || [])[setIdx] || {};
                    return (
                      <div key={setIdx} className="set-row">
                        <span className="set-num">{setIdx + 1}</span>
                        <input
                          type="number"
                          placeholder={String(ex.reps)}
                          value={s.reps || ""}
                          onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                          className="set-input"
                        />
                        <input
                          type="number"
                          placeholder="0"
                          value={s.weight || ""}
                          onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                          className="set-input"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Add custom exercise */}
          <div className="custom-exercise-form">
            <h3>➕ Add Exercise</h3>
            <div className="custom-form-grid">
              <input
                placeholder="Exercise name"
                value={customExercise.name}
                onChange={(e) => setCustomExercise({ ...customExercise, name: e.target.value })}
                className="custom-input"
              />
              <input
                type="number"
                placeholder="Sets"
                value={customExercise.sets}
                onChange={(e) => setCustomExercise({ ...customExercise, sets: e.target.value })}
                className="custom-input small"
              />
              <input
                type="number"
                placeholder="Reps"
                value={customExercise.reps}
                onChange={(e) => setCustomExercise({ ...customExercise, reps: e.target.value })}
                className="custom-input small"
              />
              <select
                value={customExercise.unit}
                onChange={(e) => setCustomExercise({ ...customExercise, unit: e.target.value })}
                className="custom-input small"
              >
                <option value="kg">kg</option>
                <option value="reps">reps</option>
                <option value="min">min</option>
                <option value="sec">sec</option>
              </select>
            </div>
            <button className="add-ex-btn" onClick={addCustomExercise}>Add Exercise</button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          TAB 3: COMPETITION
      ════════════════════════════════════ */}
      {tab === "compete" && (
        <div className="workout-compete">
          <h2>⚔️ Battle Stats</h2>

          {/* This week */}
          <div className="compete-section">
            <h3>📅 This Week</h3>
            <div className="compete-bar-group">
              <CompeteBar label="Workouts Done" myVal={myWeek} theirVal={theirWeek} myName={user} theirName={otherUser} max={7} suffix="days" />
            </div>
          </div>

          {/* All time */}
          <div className="compete-section">
            <h3>🏆 All Time</h3>
            <div className="compete-bar-group">
              <CompeteBar label="Total Workouts" myVal={myCount} theirVal={theirCount} myName={user} theirName={otherUser} max={Math.max(myCount, theirCount, 1)} suffix="" />
              <CompeteBar label="Total Volume" myVal={myVol} theirVal={theirVol} myName={user} theirName={otherUser} max={Math.max(myVol, theirVol, 1)} suffix="kg" />
            </div>
          </div>

          {/* Weekly breakdown */}
          <div className="compete-section">
            <h3>📊 This Week Day by Day</h3>
            <div className="weekly-breakdown">
              {WEEK_DAYS.map((day, idx) => {
                const myDone = myData?.logs?.[weekDates[idx]]?.done;
                const theirDone = theirData?.logs?.[weekDates[idx]]?.done;
                return (
                  <div key={idx} className="breakdown-col">
                    <div className={`breakdown-dot their ${theirDone ? "filled" : ""}`} title={otherUser} />
                    <div className="breakdown-day">{day}</div>
                    <div className={`breakdown-dot mine ${myDone ? "filled" : ""}`} title={user} />
                  </div>
                );
              })}
            </div>
            <div className="breakdown-legend">
              <span><span className="legend-dot their-color" /> {otherUser}</span>
              <span><span className="legend-dot my-color" /> {user}</span>
            </div>
          </div>

          {/* Winner card */}
          <div className={`winner-card ${myWeek >= theirWeek ? "my-win" : "their-win"}`}>
            {myWeek === theirWeek ? (
              <><h3>🤝 Tied This Week!</h3><p>Both at {myWeek} workouts — push harder!</p></>
            ) : myWeek > theirWeek ? (
              <><h3>🔥 {user} is Winning!</h3><p>+{myWeek - theirWeek} workout{myWeek - theirWeek > 1 ? "s" : ""} ahead this week</p></>
            ) : (
              <><h3>😤 {otherUser} is Ahead!</h3><p>{user}, you're {theirWeek - myWeek} workout{theirWeek - myWeek > 1 ? "s" : ""} behind — get moving!</p></>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COMPETE BAR COMPONENT ─────────────────────────────────────────────────
function CompeteBar({ label, myVal, theirVal, myName, theirName, max, suffix }) {
  const myPct = max > 0 ? Math.round((myVal / max) * 100) : 0;
  const theirPct = max > 0 ? Math.round((theirVal / max) * 100) : 0;
  return (
    <div className="compete-bar-item">
      <div className="compete-bar-label">{label}</div>
      <div className="compete-bar-row">
        <span className="compete-name">{myName}</span>
        <div className="compete-bar-track">
          <div className="compete-bar-fill my-fill" style={{ width: `${myPct}%` }} />
        </div>
        <span className="compete-val">{myVal}{suffix ? ` ${suffix}` : ""}</span>
      </div>
      <div className="compete-bar-row">
        <span className="compete-name">{theirName}</span>
        <div className="compete-bar-track">
          <div className="compete-bar-fill their-fill" style={{ width: `${theirPct}%` }} />
        </div>
        <span className="compete-val">{theirVal}{suffix ? ` ${suffix}` : ""}</span>
      </div>
    </div>
  );
}