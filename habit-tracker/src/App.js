
import habitsList from "./data/habits.json";
import Login from "./Login";
import Measurements from "./Measurements";
import "./styles.css";
import { db } from "./firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState, useRef } from "react";

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
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [data, setData] = useState({});
  const [otherData, setOtherData] = useState({});
  const [note, setNote] = useState("");
  /* LOAD USER */
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(savedUser);
  }, []);
  const dataRef = useRef(data);
const dateRef = useRef(selectedDate);
useEffect(() => {
  dataRef.current = data;
  dateRef.current = selectedDate;
}, [data, selectedDate]);

  /* 🔥 FIX 1 — RESET STATE */
  useEffect(() => {
    setData({});
    setOtherData({});
  }, [user]);

  const otherUser = user === "Radhika" ? "Hitendra" : "Radhika";

  /* CURRENT USER SYNC */
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, "habits", user), (snap) => {
      setData(snap.exists() ? snap.data() : {});
    });

    return () => unsub();
  }, [user]);

  /* OTHER USER SYNC */
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, "habits", otherUser), (snap) => {
      setOtherData(snap.exists() ? snap.data() : {});
    });

    return () => unsub();
  }, [user, otherUser]);

  useEffect(() => {
    setNote("");
  }, [selectedDate, data]);

  /* 🔥 FIX 2 — MERGE SAVE */
  useEffect(() => {
    if (!user) return;

    setDoc(doc(db, "habits", user), data, { merge: true });
  }, [data, user]);
    

useEffect(() => {
  if (!note.trim()) return;

  const timeout = setTimeout(() => {
    const updated = { ...dataRef.current };
    const selected = dateRef.current;

    if (!updated[selected]) updated[selected] = {};

    const now = new Date();
    const timestamp = now.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });

    if (!updated[selected].notes) {
      updated[selected].notes = [];
    }

    updated[selected].notes.push({
      text: note,
      time: timestamp
    });

    setData(updated);
    setNote("");
  }, 1000);

  return () => clearTimeout(timeout);
}, [note]);

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };
  
  
    

  /* WEEK */
  const getWeek = (dateStr) => {
    const base = new Date(dateStr);
    const day = base.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    const monday = new Date(base);
    monday.setDate(base.getDate() + diff);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  };

  const thisWeek = getWeek(selectedDate);

  const toggleHabit = (habit, date) => {
    const updated = { ...data };
    if (!updated[date]) updated[date] = {};
    updated[date][habit] = !updated[date]?.[habit];
    setData(updated);
  };

  const changeDate = (offset) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split("T")[0]);
  };
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit"
    });

  const formatFullDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    
    /*-dELETEING NOW AS NEW DATE IS ADDEDconst getMonthData = () => {
      const days = [];
      const today = new Date();
    
      const year = today.getFullYear();
      const month = today.getMonth(); // 0-indexed
    
      // total days in month
      const totalDays = new Date(year, month + 1, 0).getDate();
    
      for (let i = 1; i <= totalDays; i++) {
        const d = new Date(year, month, i);
        const key = d.toISOString().split("T")[0];
    
        days.push({
          date: i,
          done: !!data[key]
        });
      }
    
      return days;
    };*/

  /* DASHBOARD */
  const getWeeks = () => {
    let current = new Date("2026-04-13");
    const weeks = [];

    for (let i = 0; i < 12; i++) {
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
  };

  const weeks = getWeeks();

  const calculateScore = (userData, weekKey) => {
    let total = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekKey);
      d.setDate(d.getDate() + i);
      const date = d.toISOString().split("T")[0];

      const day = userData[date] || {};

      for (const key in day) {
        if (day[key]) total++;
      }
    }

    return total;
  };

  const getWinner = (h, r) =>
    h === r ? "Radhika" : h > r ? "Hitendra" : "Radhika";

  const getPunishment = (weekKey) => {
    const key = `punishment_${weekKey}`;
    const saved = localStorage.getItem(key);
    if (saved) return saved;

    const random =
      punishments[Math.floor(Math.random() * punishments.length)];

    localStorage.setItem(key, random);
    return random;
  };

  const Navbar = () => (
    <div className="navbar">
      <div className="nav-left">
        <button onClick={() => setPage("dashboard")}>Dashboard</button>
      </div>
      <div className="nav-mid1">
        <button onClick={() => setPage("habit")}>Habit Tracker</button>
      </div>
      <div className="nav-mid2">
        <button onClick={() => setPage("measurements")}>Measurements</button>
      </div>
      <div className="nav-right">
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );

  if (!user) return <Login setUser={setUser} />;

  // 🔥 STREAK
const calculateStreak = (habit) => {
  let streak = 0;
  let current = new Date();

  while (true) {
    const date = current.toISOString().split("T")[0];
    if (data[date]?.[habit]) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else break;
  }
  return streak;
};

// 📅 CALENDAR
const getMonthData = () => {
  const days = [];
  const today = new Date();

  const year = today.getFullYear();
  const month = today.getMonth();

  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i);
    const key = d.toISOString().split("T")[0];

    days.push({
      date: i,
      done:
        data[key] &&
        habitsList.every(
          (habit) => data[key]?.[habit.name] === true
        )
    });
  }

  return days;
};

// 📊 INSIGHTS
const getInsights = () => {
  let total = 0;
  let completed = 0;

  Object.values(data).forEach((day) => {
    Object.entries(day || {}).forEach(([k, v]) => {
      if (k !== "note") {
        total++;
        if (v) completed++;
      }
    });
  });

  return {
    total,
    completed,
    percent: total ? Math.round((completed / total) * 100) : 0
  };
};

  // ✅ FIX UNUSED VARIABLES (no logic change)
console.log(
  habitsList,
  Measurements,
  thisWeek,
  toggleHabit,
  changeDate,
  formatDate,
  formatFullDate
);
return (
  <div className="app">

    <Navbar />

    {/* DASHBOARD */}
    {page === "dashboard" && (
      <div className="measure-table-container">
        <h2>🏆 Weekly Competition</h2>

        <table className="measure-table">
          <thead>
            <tr>
              <th>Sr</th>
              <th>Week</th>
              <th>Hitendra</th>
              <th>Radhika</th>
              <th>Winner</th>
              <th>Punishment</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => {
              const hScore = calculateScore(otherData, w.key);
              const rScore = calculateScore(data, w.key);

              const winner = getWinner(hScore, rScore);
              const punishment = getPunishment(w.key);

              return (
                <tr
                  key={w.key}
                  className={winner === user ? "winner-row" : ""}
                  onClick={() => {
                    setRevealed(false);
                    setPopup({ winner, punishment });
                    setTimeout(() => setRevealed(true), 1500);
                  }}
                >
                  <td>{w.sr}</td>
                  <td>{w.label}</td>
                  <td>{hScore}</td>
                  <td>{rScore}</td>
                  <td>{winner}</td>
                  <td>🎡 Tap</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}

    {/* HABIT TRACKER */}
    {page === "habit" && (
      <div className="dashboard">

        <div className="top">
          <h2>{user}</h2>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          <div className="date-nav">
            <button onClick={() => changeDate(-1)}>⬅️</button>
            <span>{formatFullDate(selectedDate)}</span>
            <button onClick={() => changeDate(1)}>➡️</button>
          </div>
        </div>

        <div className="main">

          {/* LEFT SIDE */}
          <div className="left">

            <div className="habit-row">
              <span></span>
              <div className="week-boxes">
                {thisWeek.map((d, i) => (
                  <div key={i} className="date-label">
                    {formatDate(d)}
                  </div>
                ))}
              </div>
            </div>

            {habitsList.map((habit, i) => (
              <div key={i} className="habit-row">
       <span>
  {habit.name} {calculateStreak(habit.name) > 0 ? "🔥" : ""}
</span>

                <div className="week-boxes">
                  {thisWeek.map((d, j) => (
                    <div
                      key={j}
                      className="day-box"
                      style={{
                        background:
                          data[d]?.[habit.name]
                            ? habit.color
                            : "#e5e7eb"
                      }}
                      onClick={() => toggleHabit(habit.name, d)}
                    />
                  ))}
                </div>
              </div>
            ))}

            <h3>{otherUser}</h3>

            {habitsList.map((habit, i) => (
              <div key={i} className="habit-row">
                <span>{habit.name}</span>

                <div className="week-boxes">
                  {thisWeek.map((d, j) => (
                    <div
                      key={j}
                      className="day-box"
                      style={{
                        background:
                          otherData[d]?.[habit.name]
                            ? habit.color
                            : "#e5e7eb"
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
           <div className="note-box">
  <h3>💬 Daily Notes</h3>

  <textarea
    value={note}
    onChange={(e) => setNote(e.target.value)}
    placeholder="Write your note..."
  />

  {/* 😄 MEME BUTTONS */}
  <div className="meme-buttons">
    <button onClick={() => setNote(note + " 💪")}>💪</button>
    <button onClick={() => setNote(note + " 😴")}>😴</button>
    <button onClick={() => setNote(note + " 🔥")}>🔥</button>
    <button onClick={() => setNote(note + " 😤")}>😤</button>
    <button onClick={() => setNote(note + " 🥳")}>🥳</button>
  </div>

  {/* 📜 NOTES HISTORY */}
  <div className="notes-list">
    {(data[selectedDate]?.notes || []).map((n, i) => (
      <div key={i} className="note-item">
        <div className="note-text">{n.text}</div>
        <div className="note-time">🕒 {n.time}</div>
      </div>
    ))}
  </div>
</div>
<h3 className="calendar-title">
  {new Date().toLocaleString("default", {
    month: "long",
    year: "numeric"
  })}
</h3>
<div className="calendar">
  {getMonthData().map((d) => (
    <div
      key={d.date}
      className={`calendar-day ${d.done ? "done" : ""}`}
    >
      {d.date}
    </div>
  ))}
</div>
{(() => {
  const insights = getInsights();

  return (
    <div className="insights">
      <h3>📊 Insights</h3>
      <p>Total habits: {insights.total}</p>
      <p>Completed: {insights.completed}</p>
      <p>Success rate: {insights.percent}%</p>
    </div>
  );
})()}

          </div>

          {/* RIGHT SIDE */}
          <div className="right">
            {habitsList.map((habit, i) => {
              const completed = data[selectedDate]?.[habit.name];

              return (
                <div
                  key={i}
                  className={`habit-card ${
                    completed ? "active-card" : ""
                  }`}
                >
                  <h4>{habit.name}</h4>

                  {completed ? (
                    <p className="done">✓ Completed</p>
                  ) : (
                    <button
                      onClick={() =>
                        toggleHabit(habit.name, selectedDate)
                      }
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    )}
   

    {/* MEASUREMENTS */}
    {page === "measurements" && (
      <Measurements user={user} />
    )}

    {/* POPUP */}
    {popup && (
      <div className="popup-overlay">
      <div className="popup">
    
        <h2>🏆 {popup.winner} Wins! 🎉</h2>
    
        <p className="popup-sub">Good Job!</p>
    
        <div className="wheel"></div>
    
        {!revealed ? (
          <p className="spinning">🎡 Spinning...</p>
        ) : (
          <>
            <h3 className="loser-text">
              😈 {popup.winner === "Hitendra" ? "Radhika" : "Hitendra"} do:
            </h3>
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