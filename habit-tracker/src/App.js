import React, { useEffect, useState } from "react";
import habitsList from "./data/habits.json";
import Login from "./Login";
import Measurements from "./Measurements";
import "./styles.css";
import { db } from "./firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

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

  /* LOAD USER */
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(savedUser);
  }, []);

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

  /* 🔥 FIX 2 — MERGE SAVE */
  useEffect(() => {
    if (!user) return;

    setDoc(doc(db, "habits", user), data, { merge: true });
  }, [data, user]);

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
      weekday: "short",
      day: "numeric",
      month: "short"
    });

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

  return (
    <div className="app">

      <Navbar />

      {/* ✅ DASHBOARD WITH HEADERS */}
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

      {/* Rest of your Habit + Measurement code unchanged */}

      {popup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>🏆 {popup.winner} Wins!</h2>
            <div className="wheel"></div>
            {!revealed ? (
              <p className="spinning">🎡 Spinning...</p>
            ) : (
              <h3>{popup.punishment}</h3>
            )}
            <button onClick={() => setPopup(null)}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;