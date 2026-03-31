import api from "./client";

export async function login(username, password) {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);

  const { data } = await api.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function register(username, password) {
  const { data } = await api.post("/auth/register", { username, password });
  return data;
}

export async function me() {
  const { data } = await api.get("/auth/me");
  return data;
}