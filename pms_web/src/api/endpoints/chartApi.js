import apiClient from '../apiClient';

export async function getProjectProgress(projectId) {
  const { data } = await apiClient.get('/charts/progress', { params: { projectId } });
  return data;
}

export async function getWorkload() {
  const { data } = await apiClient.get('/charts/workload');
  return data;
}

export async function getPriorityBreakdown(projectId) {
  const { data } = await apiClient.get('/charts/priority-breakdown', { params: { projectId } });
  return data;
}
