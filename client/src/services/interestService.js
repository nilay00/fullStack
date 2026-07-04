import api from "./api";

export async function sendInterest(toUserId, message = "") {
  const res = await api.post("/interests", { to: toUserId, message });
  return res.data;
}

export async function respondToInterest(interestId, status) {
  const res = await api.patch(`/interests/${interestId}`, { status });
  return res.data;
}

export async function getReceivedInterests() {
  const res = await api.get("/interests/received");
  return res.data;
}

export async function getSentInterests() {
  const res = await api.get("/interests/sent");
  return res.data;
}

export async function getInterestStatusWith(userId) {
  const res = await api.get(`/interests/status/${userId}`);
  return res.data;
}
