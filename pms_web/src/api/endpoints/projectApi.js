import apiClient from '../apiClient';

export async function listProjects() {
  const { data } = await apiClient.get('/projects');
  return data;
}

export async function getProject(id) {
  const { data } = await apiClient.get(`/projects/${id}`);
  return data;
}

export async function createProject(projectCode, name, description) {
  const { data } = await apiClient.post('/projects', { projectCode, name, description });
  return data;
}

export async function addProjectItem(projectId, itemCode, title) {
  const { data } = await apiClient.post(`/projects/${projectId}/items`, { itemCode, title });
  return data;
}

export async function updateProjectItem(itemId, title, status) {
  const { data } = await apiClient.patch(`/projects/items/${itemId}`, { title, status });
  return data;
}

export async function deleteProjectItem(itemId) {
  await apiClient.delete(`/projects/items/${itemId}`);
}
