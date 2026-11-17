import api from "./api.js";

const authorization = () => {
  const token = localStorage.getItem("sc-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function listOpportunities(params) {
  const { data } = await api.get("/opportunities", { params });
  return data;
}

export async function signUp(payload) {
  const { data } = await api.post("/auth/signup", payload);
  return data;
}

export async function signIn(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function recordAction(id, kind) {
  const { data } = await api.post(`/opportunities/${id}/actions`, { kind }, { headers: authorization() });
  return data;
}

export async function listMyActivity() {
  const { data } = await api.get("/me/activity", { headers: authorization() });
  return data;
}

export async function getMyDashboard() {
  const { data } = await api.get("/me/dashboard", { headers: authorization() });
  return data;
}

export async function getCurrentAccount() {
  const { data } = await api.get("/auth/me", { headers: authorization() });
  return data;
}

export async function listSavedOpportunities() {
  const { data } = await api.get("/me/saved", { headers: authorization() });
  return data;
}

export async function saveOpportunity(id) {
  await api.put(`/me/saved/${id}`, null, { headers: authorization() });
}

export async function unsaveOpportunity(id) {
  await api.delete(`/me/saved/${id}`, { headers: authorization() });
}

export async function listMyOpportunities() {
  const { data } = await api.get("/opportunities/mine", { headers: authorization() });
  return data;
}

export async function getCurriculum(id) {
  const { data } = await api.get(`/opportunities/${id}/curriculum`);
  return data;
}

export async function saveCurriculum(id, modules) {
  const { data } = await api.put(`/opportunities/${id}/curriculum`, { modules }, { headers: authorization() });
  return data;
}

export async function completeLesson(id) {
  const { data } = await api.post(`/training/lessons/${id}/complete`, null, { headers: authorization() });
  return data;
}

export async function updateTrainingProgress(id, progress) {
  const { data } = await api.patch(`/me/activity/${id}/progress`, { progress }, { headers: authorization() });
  return data;
}

export async function createOpportunity(payload) {
  const { data } = await api.post("/opportunities", payload, { headers: authorization() });
  return data;
}

export async function updateOpportunity(id, payload) {
  const { data } = await api.patch(`/opportunities/${id}`, payload, { headers: authorization() });
  return data;
}

export async function deleteOpportunity(id) {
  await api.delete(`/opportunities/${id}`, { headers: authorization() });
}

export async function getAdminDashboard() {
  const { data } = await api.get("/admin/dashboard", { headers: authorization() });
  return data;
}

export async function listAccounts() {
  const { data } = await api.get("/admin/users", { headers: authorization() });
  return data;
}

export async function updateAccountRole(id, role) {
  const { data } = await api.patch(`/admin/users/${id}/role`, { role }, { headers: authorization() });
  return data;
}

export async function listParticipations() {
  const { data } = await api.get("/participations", { headers: authorization() });
  return data;
}

export async function reviewParticipation(id, status) {
  const { data } = await api.patch(`/participations/${id}`, { status }, { headers: authorization() });
  return data;
}

export async function listSubmissions() {
  const { data } = await api.get("/submissions", { headers: authorization() });
  return data;
}

export async function reviewSubmission(id, status, feedback) {
  const { data } = await api.patch(`/submissions/${id}`, { status, feedback }, { headers: authorization() });
  return data;
}

export async function submitWork(payload) {
  const { data } = await api.post("/submissions", payload, { headers: authorization() });
  return data;
}

export async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/uploads", form, {
    headers: { ...authorization(), "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function listMessages(withUser) {
  const { data } = await api.get("/messages", { params: withUser ? { with_user: withUser } : undefined, headers: authorization() });
  return data;
}

export async function sendMessage(payload) {
  const { data } = await api.post("/messages", payload, { headers: authorization() });
  return data;
}

export async function listMembers() {
  const { data } = await api.get("/members", { headers: authorization() });
  return data;
}
