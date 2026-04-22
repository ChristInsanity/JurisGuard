import { API_BASE, getAuthHeaders } from "./api";

export async function getCases() {
  const token = localStorage.getItem("token");

  const res = await fetch("http://127.0.0.1:8010/api/cases/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Unauthorized");
  }

  return res.json();
}