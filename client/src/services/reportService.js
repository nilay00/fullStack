import api from "./api";

export async function submitReport(data) {
  const res = await api.post("/reports", data);
  return res.data;
}
