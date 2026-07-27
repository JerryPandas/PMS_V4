import apiClient from '../apiClient';

export async function listUsers() {
  const { data } = await apiClient.get('/users');
  return data;
}

export async function listUsersForManagement() {
  const { data } = await apiClient.get('/users/management');
  return data;
}

export async function getUser(id) {
  const { data } = await apiClient.get(`/users/${id}`);
  return data;
}

export async function updateUser(id, payload) {
  // payload: { displayName?, email?, avatarUrl?, role?, isActive? }
  const { data } = await apiClient.patch(`/users/${id}`, payload);
  return data;
}

export async function changePassword(id, currentPassword, newPassword) {
  await apiClient.patch(`/users/${id}/password`, { currentPassword, newPassword });
}
