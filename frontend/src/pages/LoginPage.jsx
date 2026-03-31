import { useState } from "react";
import { login } from "../api/auth";
import { useAuth } from "../hooks/useAuth";

export const LoginPage = ({ onSwitch, onSuccess }) => {
  const { setUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login(username, password);
      localStorage.setItem("token", res.access_token);
      const meRes = await (
        await fetch("http://localhost:8000/auth/me", {
          headers: { Authorization: `Bearer ${res.access_token}` },
        })
      ).json();
      setUser(meRes);
      onSuccess();
    } catch (err) {
      setError("Неверный логин или пароль");
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#e5e7eb",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 360,
          padding: 32,
          borderRadius: 16,
          background: "rgba(15,23,42,0.95)",
          border: "1px solid rgba(148,163,184,0.3)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22 }}>Вход</h2>
        <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>
          Введите логин и пароль, чтобы продолжить.
        </p>
        <div>
          <label style={{ fontSize: 13, color: "#9ca3af" }}>Логин</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              marginTop: 4,
              width: "100%",
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.4)",
              background: "#020617",
              color: "#e5e7eb",
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 13, color: "#9ca3af" }}>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              marginTop: 4,
              width: "100%",
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.4)",
              background: "#020617",
              color: "#e5e7eb",
            }}
          />
        </div>
        {error && <div style={{ fontSize: 12, color: "#f97373" }}>{error}</div>}
        <button
          type="submit"
          style={{
            marginTop: 8,
            padding: "10px 0",
            borderRadius: 999,
            border: "none",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#020617",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Войти
        </button>
        <button
          type="button"
          onClick={onSwitch}
          style={{
            marginTop: 4,
            padding: "8px 0",
            borderRadius: 999,
            border: "none",
            background: "transparent",
            color: "#93c5fd",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Нет аккаунта? Зарегистрироваться
        </button>
      </form>
    </div>
  );
};