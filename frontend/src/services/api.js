const API = "http://127.0.0.1:8000/api";

export async function getClients() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/clients`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch clients");

  return res.json();
}