import apiClient from '../apiClient';

export async function getTaskDetail(taskId) {
  const { data } = await apiClient.get(`/tasks/${taskId}`);
  return data;
}

export async function getKanbanTasks(projectId) {
  const { data } = await apiClient.get('/tasks/kanban', { params: { projectId } });
  return data;
}

export async function createTask(payload) {
  // payload: { projectId, projectItemId, title, description, assigneeId, scheduledDate, priority }
  const { data } = await apiClient.post('/tasks', payload);
  return data;
}

export async function updateKanbanColumn(taskId, kanbanColumn, sortOrder) {
  await apiClient.patch(`/tasks/${taskId}/kanban-column`, { kanbanColumn, sortOrder });
}

export async function getWeeklyBoard(weekStart) {
  const { data } = await apiClient.get('/tasks/weekly', { params: weekStart ? { weekStart } : {} });
  return data;
}

export async function dragTask(taskId, { newScheduledDate, newAssigneeId }) {
  const { data } = await apiClient.patch(`/tasks/${taskId}/drag`, {
    newScheduledDate: newScheduledDate ?? null,
    newAssigneeId: newAssigneeId ?? null
  });
  return data;
}
