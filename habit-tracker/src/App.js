import habitsList from "./data/habits.json";
import Login from "./Login";
import Measurements from "./Measurements";
import "./styles.css";
import { db } from "./firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState, useRef } from "react";
import PhotoVault from "./PhotoVault";

// --- HELPERS MOVED TO TOP SCOPE ---
const getLocalDate = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

const getWeek = (dateStr) => {
  const base = new Date(dateStr);
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setDate(base.getDate() + diff);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return getLocalDate(d);
  });
};

const punishments = [
  "50 burpees",
  "100 jumping jacks",
  "Cook dinner 🍳",
  "No sugar for 2 days",
  "Do all chores 🧹",
  "3 min plank",
  "1 km walk"
];

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [popup, setPopup] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getLocalDate(new Date()));
  const [data, setData] = useState({});
  const [otherData, setOtherData] = useState({});
  const [note, setNote] = useState("");

  const dataRef = useRef(data);
  const dateRef = useRef(selectedDate);

  useEffect(() => {
    dataRef.current = data;
    dateRef.current = selectedDate;
  }, [data, selectedDate]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(savedUser);
  }, []);

  useEffect(() => {
    setData({});
    setOtherData({});
  }, [user]);

  const otherUser = user === "Radhika" ? "Hitendra" : "Radhika";

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "habits", user), (snap) => {
      setData(snap.exists() ? snap.data() : {});
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "habits", otherUser), (snap) => {
      setOtherData(snap.exists() ? snap.data() : {});
    });
    return () => unsub();
  }, [user, otherUser]);

  useEffect(() => {
    if (!user) return;
    setDoc(doc(db, "habits", user), data, { merge: true });
  }, [data, user]);

  const sendNudge = async () => {
    const nudgeRef = doc(db, "habits", otherUser);
    await setDoc(nudgeRef, {
      incomingNudge: `${user} is judging your progress... 😤`
    }, { merge: true });
    alert(`Nudge sent to ${otherUser}!`);
  };

  const clearNudge = () => {
    const myRef = doc(db, "habits", user);
    setDoc(myRef, { incomingNudge: null }, { merge: true });
  };

  const getStreakData = (habitName) => {
    let streak = 0;
    let current = new Date();
    for (let i = 0; i < 30; i++) {
      const date = getLocalDate(current);
      if (data[date]?.[habitName]) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else break;
    }
    let status = "cold";
    if (streak >= 3) status = "warm";
    if (streak >= 7) status = "hot";
    if (streak >= 14) status = "supernova";
    return { streak, status };
  };

  const getXP = (userData) => {
    let xp = 0;
    Object.values(userData || {}).forEach((day) => {
      Object.entries(day || {}).forEach(([k, v]) => {
        if (k !== "notes" && k !== "diet" && k !== "incomingNudge" && v === true) xp += 10;
      });
    });
    return xp;
  };

  const getLevel = (xp) => Math.floor(xp / 100) + 1;

  const getDayScore = (date) => {
    const day = data[date] || {};
    const done = habitsList.filter((h) => day[h.name]).length;
    return Math.round((done / habitsList.length) * 100);
  };

  const updateDiet = (date, field, value) => {
    const updated = { ...data };
    if (!updated[date]) updated[date] = {};
    if (!updated[date].diet) {
      updated[date].diet = { plan: "", completed: false, comments: "" };
    }
    updated[date].diet[field] = value;
    setData(updated);
  };

  const toggleHabit = (habit, date) => {
    const updated = { ...data };
    if (!updated[date]) updated[date] = {};
    updated[date][habit] = !updated[date]?.[habit];
    setData(updated);
  };

  const changeDate = (offset) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(getLocalDate(d));
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
  const formatFullDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

// App.js - around line 173
const calculateScore = (userData, weekKey) => {
  const weekDates = getWeek(weekKey);
  let total = 0;

  // Using a standard for-loop avoids the 'unsafe references' warning
  for (let i = 0; i < weekDates.length; i++) {
    const dateStr = weekDates[i];
    const dayData = userData[dateStr] || {};
    
    // Calculate logic directly in the loop to avoid warnings
    const completedTasks = Object.values(dayData).filter(val => val === true).length;
    total += completedTasks;
  }
  
  return total;
};
  /* const calculateScore = (userData, weekKey) => {
    let weeklyTotal = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekKey);
      d.setDate(d.getDate() + i);
      const dayData = userData[getLocalDate(d)] || {};
      // Use Object.values to avoid the loop-func warning
      // eslint-disable-next-line no-loop-func
Object.values(dayData).forEach(val => { if (val === true) weeklyTotal++; });
      /*Object.values(dayData).forEach(val => { if (val === true) weeklyTotal++; });
    }
    return weeklyTotal;
  }; */

  const getWeeks = () => {
    let current = new Date("2026-04-13");
    const weeksList = [];
    for (let i = 0; i < 12; i++) {
      const start = new Date(current);
      const end = new Date(current);
      end.setDate(start.getDate() + 6);
      weeksList.push({
        sr: i + 1,
        key: start.toISOString().split("T")[0],
        label: `Week ${String(start.getDate()).padStart(2, "0")}/${start.getMonth() + 1} - ${String(end.getDate()).padStart(2, "0")}/${end.getMonth() + 1}`
      });
      current.setDate(current.getDate() + 7);
    }
    return weeksList;
  };

  const getWinner = (h, r) => h === r ? "Radhika" : h > r ? "Hitendra" : "Radhika";

  const getPunishment = (weekKey) => {
    const key = `punishment_${weekKey}`;
    const saved = localStorage.getItem(key);
    if (saved) return saved;
    const random = punishments[Math.floor(Math.random() * punishments.length)];
    localStorage.setItem(key, random);
    return random;
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const getMonthData = () => {
    const days = [];
    const today = new Date();
    const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), i);
      const key = getLocalDate(d);
      days.push({
        date: i,
        done: data[key] && habitsList.every(h => data[key]?.[h.name] === true)
      });
    }
    return days;
  };

  const getInsights = () => {
    let totalC = 0, completedC = 0;
    Object.values(data).forEach(day => {
      Object.entries(day || {}).forEach(([k, v]) => {
        if (k !== "notes" && k !== "diet" && k !== "incomingNudge") {
          totalC++;
          if (v === true) completedC++;
        }
      });
    });
    return { totalC, completedC, percent: totalC ? Math.round((completedC / totalC) * 100) : 0 };
  };

  const Navbar = () => (
    <div className="navbar">
      <button onClick={() => setPage("dashboard")}>Dashboard</button>
      <button onClick={() => setPage("habit")}>Habit Tracker</button>
      <button onClick={() => setPage("measurements")}>Measurements</button>
      <button onClick={() => setPage("diet")}>Diet</button>
      <button onClick={() => setPage("photos")}>Photos</button>
      <button onClick={logout}>Logout</button>
      
    </div>
  );

  if (!user) return <Login setUser={setUser} />;

  return (
    <div className="app">
      <Navbar />

      {page === "dashboard" && (
        <div className="measure-table-container">
          <div className="battle-header" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '30px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px' }}>
            <div className={`player-card ${getXP(data) >= getXP(otherData) ? 'winner-glow' : 'loser-ice'}`}>
              <h3>{user} (You)</h3>
              <p>⚡ {getXP(data)} XP | 🏆 Lvl {getLevel(getXP(data))}</p>
            </div>
            <div className="vs-circle" style={{ fontSize: '24px', fontWeight: 'bold', color: '#6366f1' }}>VS</div>
            <div className={`player-card ${getXP(otherData) > getXP(data) ? 'winner-glow' : 'loser-ice'}`}>
              <h3>{otherUser}</h3>
              <p>⚡ {getXP(otherData)} XP | 🏆 Lvl {getLevel(getXP(otherData))}</p>
              <button onClick={sendNudge} style={{ fontSize: '12px', marginTop: '5px' }}>🗯️ Nudge</button>
            </div>
          </div>

          {data.incomingNudge && (
            <div className="nudge-toast" onClick={clearNudge}>
              {data.incomingNudge} <span style={{fontSize:'10px', opacity: 0.7}}>(Click to dismiss)</span>
            </div>
          )}

          <h2>🏆 Weekly Competition</h2>
          <table className="measure-table">
            <thead>
              <tr><th>Sr</th><th>Week</th><th>Hitendra</th><th>Radhika</th><th>Winner</th><th>Punishment</th></tr>
            </thead>
            <tbody>
              {getWeeks().map((w) => {
                const hScore = calculateScore(otherData, w.key);
                const rScore = calculateScore(data, w.key);
                const winner = getWinner(hScore, rScore);
                return (
                  <tr key={w.key} className={winner === user ? "winner-row" : ""} onClick={() => {
                    setRevealed(false);
                    setPopup({ winner, punishment: getPunishment(w.key) });
                    setTimeout(() => setRevealed(true), 1500);
                  }}>
                    <td>{w.sr}</td><td>{w.label}</td><td>{hScore}</td><td>{rScore}</td><td>{winner}</td><td>🎡 Tap</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {page === "habit" && (
        <div className="dashboard">
          <div className="top">
            <h2>{user}</h2>
            <p className="today-score">🔥 Today Score: {getDayScore(selectedDate)}%</p>
            <div className="xp-box">
              <p>⚡ You: {getXP(data)} XP | 🏆 Lvl {getLevel(getXP(data))}</p>
              <p>⚡ {otherUser}: {getXP(otherData)} XP | 🏆 Lvl {getLevel(getXP(otherData))}</p>
            </div>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            <div className="date-nav">
              <button onClick={() => changeDate(-1)}>⬅️</button>
              <span>{formatFullDate(selectedDate)}</span>
              <button onClick={() => changeDate(1)}>➡️</button>
            </div>
          </div>

          <div className="main">
            <div className="left">
              <div className="habit-row">
                <span></span>
                <div className="week-boxes">
                  {getWeek(selectedDate).map((d, i) => (
                    <div key={i} className="date-label">{formatDate(d)}</div>
                  ))}
                </div>
              </div>

              {habitsList.map((habit, i) => {
                const { streak, status } = getStreakData(habit.name);
                return (
                  <div key={i} className="habit-row">
                    <span className={`streak-${status}`}>
                      {habit.name} {streak > 0 ? `${streak}🔥` : ""}
                    </span>
                    <div className="week-boxes">
                      {getWeek(selectedDate).map((d, j) => (
                        <div key={j} className="day-box" 
                          style={{ background: data[d]?.[habit.name] ? habit.color : "#e5e7eb" }}
                          onClick={() => toggleHabit(habit.name, d)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              <h3 style={{marginTop: '30px'}}>{otherUser}'s Progress</h3>
              {habitsList.map((habit, i) => (
                <div key={i} className="habit-row">
                  <span>{habit.name}</span>
                  <div className="week-boxes">
                    {getWeek(selectedDate).map((d, j) => (
                      <div key={j} className="day-box" 
                        style={{ background: otherData[d]?.[habit.name] ? habit.color : "#e5e7eb" }}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div className="note-box">
                <h3>💬 Daily Notes</h3>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write your note..." />
                <div className="meme-buttons">
                  {["💪", "😴", "🔥", "😤", "🥳"].map(m => (
                    <button key={m} onClick={() => setNote(note + ` ${m}`)}>{m}</button>
                  ))}
                </div>
                <div className="notes-list">
                  {(data[selectedDate]?.notes || []).map((n, i) => (
                    <div key={i} className="note-item">
                      <div className="note-text">{n.text}</div>
                      <div className="note-time">🕒 {n.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="calendar">
                {getMonthData().map((d) => (
                  <div key={d.date} className={`calendar-day ${d.done ? "done" : ""}`}>{d.date}</div>
                ))}
              </div>

              {/* Using getInsights here to fix the "unused-vars" error */}
              <div className="insights-box" style={{marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
                  <h4>📊 All-Time Insights</h4>
                  <p>Success Rate: {getInsights().percent}%</p>
                  <p>Habits Completed: {getInsights().completedC}</p>
              </div>
            </div>

            <div className="right">
              {habitsList.map((habit, i) => (
                <div key={i} className={`habit-card ${data[selectedDate]?.[habit.name] ? "active-card" : ""}`} style={{ borderLeft: `6px solid ${habit.color}` }}>
                  <h4>{habit.name}</h4>
                  {data[selectedDate]?.[habit.name] ? <p className="done">✓ Completed</p> : 
                    <button onClick={() => toggleHabit(habit.name, selectedDate)}>Mark Complete</button>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {page === "measurements" && <Measurements user={user} />}
      
      {page === "diet" && (
        <div className="diet-container">
          {getWeek(selectedDate).map((date, i) => {
            const diet = data[date]?.diet || {};
            return (
              <div className="diet-card" key={i}>
                <h3>📅 {formatDate(date)}</h3>
                {["breakfast", "lunch", "dinner"].map(meal => (
                  <div className="meal" key={meal}>
                    <label>{meal.charAt(0).toUpperCase() + meal.slice(1)}</label>
                    <textarea value={diet[meal] || ""} onChange={(e) => updateDiet(date, meal, e.target.value)} />
                  </div>
                ))}
                <div className="diet-footer">
                  <select value={diet.completed ? "yes" : "no"} onChange={(e) => updateDiet(date, "completed", e.target.value === "yes")}>
                    <option value="no">No</option><option value="yes">Yes</option>
                  </select>
                  <input placeholder="Notes..." value={diet.comments || ""} onChange={(e) => updateDiet(date, "comments", e.target.value)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

{page === "photos" && <PhotoVault user={user} otherUser={otherUser} />}
      {popup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>🏆 {popup.winner} Wins! 🎉</h2>
            <p className="popup-sub">Good Job!</p>
            {!revealed ? <p className="spinning">🎡 Spinning...</p> : (
              <>
                <h3 className="loser-text">😈 {popup.winner === "Hitendra" ? "Radhika" : "Hitendra"} do:</h3>
                <h2 className="punishment-text">{popup.punishment}</h2>
              </>
            )}
            <button onClick={() => setPopup(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;