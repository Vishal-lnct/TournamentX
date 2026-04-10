import api, { tokenStorage } from "./client";

export async function signup(payload) {
  const response = await api.post("/api/auth/signup/", payload);
  return response.data;
}

export async function login(payload) {
  const response = await api.post("/api/auth/login/", payload);
  return response.data;
}

export async function logout(refreshToken) {
  try {
    await api.post("/api/auth/logout/", { refresh: refreshToken });
  } finally {
    tokenStorage.clear();
  }
}

export async function getProfile() {
  const response = await api.get("/api/auth/profile/");
  return response.data;
}

export async function getTournaments() {
  const response = await api.get("/api/tournaments/");
  return response.data;
}

export async function createTournament(formData) {
  const response = await api.post("/api/tournaments/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function updateTournament(id, formData) {
  const response = await api.patch(`/api/tournaments/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function deleteTournament(id) {
  await api.delete(`/api/tournaments/${id}/`);
}

export async function getMyTournaments() {
  const response = await api.get("/api/tournaments/mine/");
  return response.data;
}

export async function getTournamentRegistrations(tournamentId) {
  const response = await api.get(`/api/tournaments/${tournamentId}/registrations/`);
  return response.data;
}

export async function createRegistration(tournamentId, payload) {
  const response = await api.post(`/api/tournaments/${tournamentId}/registrations/`, payload);
  return response.data;
}

export async function getMyRegistrations() {
  const response = await api.get("/api/registrations/mine/");
  return response.data;
}

export async function reviewRegistration(registrationId, status) {
  const response = await api.patch(`/api/registrations/${registrationId}/review/`, { status });
  return response.data;
}
