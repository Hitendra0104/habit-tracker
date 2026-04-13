{/* HABIT TRACKER */}
{page === "habit" && (
  <div className="dashboard">

    {/* TOP BAR */}
    <div className="top">
      <h2>{user}</h2>

      {/* 📅 DATE PICKER ADDED */}
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

      {/* LEFT SECTION */}
      <div className="left">

        {/* DATE HEADER */}
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
                  onClick={() =>
                    toggleHabit(habit.name, d)
                  }
                />
              ))}
            </div>
          </div>
        ))}

        {/* OTHER USER */}
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

      {/* 👉 RIGHT SECTION (RESTORED) */}
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