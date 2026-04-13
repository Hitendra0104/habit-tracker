import React from "react";

function Login({ setUser }) {
  const login = (name) => {
    localStorage.setItem("user", name);
    setUser(name);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🏆 Couple Fitness</h1>
        <p style={styles.subtitle}>Choose your profile</p>

        <div style={styles.buttonGroup}>
          <button
            style={{ ...styles.button, ...styles.radhika }}
            onClick={() => login("Radhika")}
          >
            👩 Radhika
          </button>

          <button
            style={{ ...styles.button, ...styles.hitendra }}
            onClick={() => login("Hitendra")}
          >
            👨 Hitendra
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,rgb(205, 149, 231), #2563eb)",
  },

  card: {
    background: "#ffffff",
    padding: "40px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    width: "320px",
  },

  title: {
    margin: 0,
    fontSize: "24px",
  },

  subtitle: {
    color: "gray",
    marginBottom: "25px",
  },

  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  button: {
    padding: "14px",
    fontSize: "16px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    color: "white",
    fontWeight: "bold",
    transition: "all 0.3s ease",
  },

  radhika: {
    background: "linear-gradient(135deg, #ec4899, #f43f5e)",
  },

  hitendra: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  },
};

export default Login;