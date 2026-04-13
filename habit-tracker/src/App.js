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