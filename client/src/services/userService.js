import api from "./api";

export async function browseProfiles(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.append(key, value);
  });
  const res = await api.get(`/users/browse?${params.toString()}`);
  return res.data;
}

export async function getProfileById(id) {
  const res = await api.get(`/users/${id}`);
  return res.data;
}

export async function updateMyProfile(data) {
  const res = await api.put("/users/me", data);
  return res.data;
}

export async function toggleSaveProfile(id) {
  const res = await api.post(`/users/save/${id}`);
  return res.data;
}

export async function getSavedProfiles() {
  const res = await api.get("/users/saved");
  return res.data;
}

export async function updatePrivacySettings(data) {
  const res = await api.put("/users/me/privacy", data);
  return res.data;
}

export async function deleteGalleryPhoto(photoId) {
  const res = await api.delete(`/users/me/gallery/${photoId}`);
  return res.data;
}

export async function toggleBlockUser(id) {
  const res = await api.post(`/users/block/${id}`);
  return res.data;
}
