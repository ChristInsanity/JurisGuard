const API = "http://127.0.0.1:8000/api";

export async function getCases() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/cases`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch cases");

  return res.json();
}