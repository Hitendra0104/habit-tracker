import React, { useEffect, useState } from "react";
import habitsList from "./data/habits.json";
import Login from "./Login";
import Measurements from "./Measurements";
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
  const [page, setPage] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [data, setData] = useState({});

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

  // WEEK (MONDAY START)
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
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
  };

  const formatFullDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });

  // OTHER USER
  const otherUser =
    user === "Radhika" ? "Hitendra" : "Radhika";

  const getOtherData = () => {
    const saved = localStorage.getItem(`habits_${otherUser}`);
    return saved ? JSON.parse(saved) : {};
  };

  // DASHBOARD DATA
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

  // NAVBAR
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
                const hScore = calculateScore(
                  getOtherData(),
                  w.key
                );
                const rScore = calculateScore(data, w.key);

                return (
                  <tr key={w.key}>
                    <td>{w.sr}</td>
                    <td>{w.label}</td>
                    <td>{hScore}</td>
                    <td>{rScore}</td>
                    <td>{getWinner(hScore, rScore)}</td>
                    <td>{getPunishment(w.key)}</td>
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

            <div className="date-nav">
              <button onClick={() => changeDate(-1)}>⬅️</button>
              <span>{formatFullDate(selectedDate)}</span>
              <button onClick={() => changeDate(1)}>➡️</button>
            </div>
          </div>

          <div className="main">

            {/* LEFT */}
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
                  <span>{habit.name}</span>

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

              {/* OTHER USER */}
              <div className="other-section">
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
                              getOtherData()[d]?.[habit.name]
                                ? habit.color
                                : "#e5e7eb"
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* RIGHT (RESTORED) */}
            <div className="right">
              {habitsList.map((habit, i) => {
                const completed =
                  data[selectedDate]?.[habit.name];

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

    </div>
  );
}

export default App;