import React, { useEffect, useState } from "react";
import habitsList from "./data/habits.json";
import Login from "./Login";
import Measurements from "./Measurements";
import "./styles.css";

/* 🎯 PUNISHMENTS */
const punishments = {
  easy: ["20 jumping jacks", "10 pushups", "5 min walk"],
  medium: ["50 burpees", "100 jumping jacks", "3 min plank"],
  hard: ["Cook dinner 🍳", "No sugar for 2 days", "Wake up at 5 AM ⏰", "Do all chores 🧹"]
};

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState({});
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(savedUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`habits_${user}`);
    setData(saved ? JSON.parse(saved) : {});
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`habits_${user}`, JSON.stringify(data));
    }
  }, [data, user]);

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  /* 📅 WEEK */
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

  const formatDate = (d) => {
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const formatFullDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });

  const otherUser = user === "Radhika" ? "Hitendra" : "Radhika";

  const getOtherData = () => {
    const saved = localStorage.getItem(`habits_${otherUser}`);
    return saved ? JSON.parse(saved) : {};
  };

  /* 📊 DASHBOARD */
  const getWeeks = () => {
    let current = new Date("2026-04-13");
    const weeks = [];

    for (let i = 0; i < 12; i++) {
      const start = new Date(current);
      const end = new Date(current);
      end.setDate(start.getDate() + 6);

      const format = (d) =>
        `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

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

  const getWinner = (h, r) => (h === r ? "Radhika" : h > r ? "Hitendra" : "Radhika");

  const getDifficulty = (diff) => {
    if (diff <= 5) return "easy";
    if (diff <= 15) return "medium";
    return "hard";
  };

  const getPunishment = (weekKey, loser, diff) => {
    const key = `punishment_${weekKey}`;
    const saved = localStorage.getItem(key);
    if (saved) return saved;

    const level = getDifficulty(diff);
    const list = punishments[level];
    const random = list[Math.floor(Math.random() * list.length)];

    const final = `${loser}: ${random}`;
    localStorage.setItem(key, final);

    return final;
  };

  /* NAVBAR */
  const Navbar = () => (
    <div className="navbar">
      <div className="nav-left"><button onClick={() => setPage("dashboard")}>Dashboard</button></div>
      <div className="nav-mid1"><button onClick={() => setPage("habit")}>Habit Tracker</button></div>
      <div className="nav-mid2"><button onClick={() => setPage("measurements")}>Measurements</button></div>
      <div className="nav-right"><button onClick={logout}>Logout</button></div>
    </div>
  );

  if (!user) return <Login setUser={setUser} />;

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
                const hScore = calculateScore(getOtherData(), w.key);
                const rScore = calculateScore(data, w.key);

                const winner = getWinner(hScore, rScore);
                const loser = winner === "Hitendra" ? "Radhika" : "Hitendra";
                const diff = Math.abs(hScore - rScore);

                const punishment = getPunishment(w.key, loser, diff);

                return (
                  <tr
                    key={w.key}
                    className={winner === user ? "winner-row" : ""}
                    onClick={() =>
                      setPopup({ winner, loser, punishment })
                    }
                  >
                    <td>{w.sr}</td>
                    <td>{w.label}</td>
                    <td>{hScore}</td>
                    <td>{rScore}</td>
                    <td>{winner}</td>
                    <td>{punishment}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* POPUP */}
      {popup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>🏆 {popup.winner} Wins!</h2>
            <div className="wheel">🎡</div>
            <p className="loser">😈 {popup.loser} must:</p>
            <h3>{popup.punishment}</h3>
            <button onClick={() => setPopup(null)}>Close</button>
          </div>
        </div>
      )}

      {/* HABIT TRACKER + MEASUREMENTS remain SAME as your last working version */}

    </div>
  );
}

export default App;