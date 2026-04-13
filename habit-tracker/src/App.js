import React, { useEffect, useState } from "react";
import Login from "./Login";
import "./styles.css";

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
  const [popup, setPopup] = useState(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(savedUser);
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const getUserData = (name) => {
    const saved = localStorage.getItem(`habits_${name}`);
    return saved ? JSON.parse(saved) : {};
  };

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

  const Navbar = () => (
    <div className="navbar">
      <div className="nav-left">
        <button>Dashboard</button>
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
              const hScore = calculateScore(
                getUserData("Hitendra"),
                w.key
              );
              const rScore = calculateScore(
                getUserData("Radhika"),
                w.key
              );

              const winner = getWinner(hScore, rScore);
              const punishment = getPunishment(w.key);

              return (
                <tr
                  key={w.key}
                  className={winner === user ? "winner-row" : ""}
                  onClick={() => {
                    setRevealed(false);
                    setPopup({ winner, punishment });

                    setTimeout(() => {
                      setRevealed(true);
                    }, 1500);
                  }}
                >
                  <td>{w.sr}</td>
                  <td>{w.label}</td>
                  <td>{hScore}</td>
                  <td>{rScore}</td>
                  <td>{winner}</td>
                  <td>🎡 Tap to Reveal</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* POPUP */}
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