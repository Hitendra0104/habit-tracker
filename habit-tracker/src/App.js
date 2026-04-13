import React, { useEffect, useState } from "react";
import Login from "./Login";
import "./styles.css";

/* 🎯 PUNISHMENTS */
const punishments = {
  easy: ["20 jumping jacks", "10 pushups", "5 min walk"],
  medium: ["50 burpees", "100 jumping jacks", "3 min plank"],
  hard: [
    "Cook dinner 🍳",
    "No sugar for 2 days",
    "Wake up at 5 AM ⏰",
    "Do all chores 🧹"
  ]
};

function App() {
  const [user, setUser] = useState(null);
  const [popup, setPopup] = useState(null);

  // LOAD USER
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(savedUser);
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  /* 📅 WEEK GENERATION */
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

  const getUserData = (name) => {
    const saved = localStorage.getItem(`habits_${name}`);
    return saved ? JSON.parse(saved) : {};
  };

  /* 📊 SCORE */
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

  /* 🏆 WINNER */
  const getWinner = (h, r) => {
    if (h === r) return "Radhika";
    return h > r ? "Hitendra" : "Radhika";
  };

  /* 🎯 DIFFICULTY */
  const getDifficulty = (diff) => {
    if (diff <= 5) return "easy";
    if (diff <= 15) return "medium";
    return "hard";
  };

  /* 🎡 PUNISHMENT */
  const getPunishment = (weekKey, loser, diff) => {
    const key = `punishment_${weekKey}`;
    const saved = localStorage.getItem(key);

    if (saved) return saved;

    const level = getDifficulty(diff);
    const list = punishments[level];

    const random =
      list[Math.floor(Math.random() * list.length)];

    const final = `${loser}: ${random}`;

    localStorage.setItem(key, final);
    return final;
  };

  /* NAVBAR */
  const Navbar = () => (
    <div className="navbar">
      <div className="nav-left">
        <button>Dashboard</button>
      </div>
      <div className="nav-mid1">
        <button>Habit Tracker</button>
      </div>
      <div className="nav-mid2">
        <button>Measurements</button>
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

      {/* DASHBOARD */}
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
              const hData = getUserData("Hitendra");
              const rData = getUserData("Radhika");

              const hScore = calculateScore(hData, w.key);
              const rScore = calculateScore(rData, w.key);

              const winner = getWinner(hScore, rScore);
              const loser =
                winner === "Hitendra" ? "Radhika" : "Hitendra";

              const diff = Math.abs(hScore - rScore);

              const punishment = getPunishment(
                w.key,
                loser,
                diff
              );

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

      {/* 🎡 POPUP */}
      {popup && (
        <div className="popup-overlay">
          <div className="popup">

            <h2>🏆 {popup.winner} Wins!</h2>

            <div className="wheel">🎡</div>

            <p className="loser">
              😈 {popup.loser} must:
            </p>

            <h3>{popup.punishment}</h3>

            <button onClick={() => setPopup(null)}>
              Close
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export default App;