import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, MenuItem, Paper,
  Stack, TextField, Typography
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import CreateTaskDialog from './CreateTaskDialog';
import CreateProjectDialog from './CreateProjectDialog';
import TaskDetailDialog from '../tasks/TaskDetailDialog';
import { listProjects, createProject } from '../../api/endpoints/projectApi';
import { listUsers } from '../../api/endpoints/userApi';
import { getKanbanTasks, createTask, updateKanbanColumn } from '../../api/endpoints/taskApi';
import { useAuth } from '../auth/useAuth';

const COLUMNS = ['Todo', 'InProgress', 'Review', 'Done'];

const priorityColor = {
  Low: 'default',
  Normal: 'primary',
  High: 'error'
};

export default function KanbanBoard() {
  const { user } = useAuth();
  const canManageOthers = user.role === 'Admin' || user.role === 'Manager';

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    async function bootstrap() {
      try {
        const [projectList, userList] = await Promise.all([listProjects(), listUsers()]);
        setProjects(projectList);
        setUsers(userList);
        if (projectList.length > 0) setSelectedProjectId(projectList[0].id);
      } catch {
        setError('Could not load projects.');
      } finally {
        setIsLoading(false);
      }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    getKanbanTasks(selectedProjectId).then(setTasks).catch(() => setError('Could not load tasks.'));
  }, [selectedProjectId]);

  const tasksByColumn = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((c) => [c, []]));
    tasks.forEach((t) => map[t.kanbanColumn]?.push(t));
    return map;
  }, [tasks]);

  function canDragTask(task) {
    return canManageOthers || task.assigneeId === user.id;
  }

  function handleDragStart(event) {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task && canDragTask(task)) {
      setActiveTask(task);
    }
  }

  function handleDragEnd(event) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const targetColumn = over.id;
    if (!COLUMNS.includes(targetColumn)) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.kanbanColumn === targetColumn) return;
    if (!canDragTask(task)) return;

    const newSortOrder = tasksByColumn[targetColumn].length;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, kanbanColumn: targetColumn, sortOrder: newSortOrder } : t))
    );

    updateKanbanColumn(taskId, targetColumn, newSortOrder).catch(() => {
      setError('Could not move the task. Reloading board.');
      getKanbanTasks(selectedProjectId).then(setTasks);
    });
  }

  async function handleCreateTask(form) {
    const newTask = await createTask({
      projectId: selectedProjectId,
      title: form.title,
      description: form.description || null,
      assigneeId: form.assigneeId,
      scheduledDate: form.scheduledDate,
      priority: form.priority
    });
    setTasks((prev) => [...prev, newTask]);
  }

  async function handleCreateProject(form) {
    const newProject = await createProject(form.projectCode, form.name, form.description);
    setProjects((prev) => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
  }

  const assignableUsers = canManageOthers ? users : users.filter((u) => u.id === user.id);

  if (isLoading) return null;

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h5" fontWeight={500}>
            Kanban board
          </Typography>
          <TextField
            select
            size="small"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.projectCode} — {p.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          {canManageOthers && (
            <Button variant="outlined" onClick={() => setIsProjectDialogOpen(true)}>
              New project
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setIsDialogOpen(true)}
            disabled={!selectedProjectId}
          >
            New task
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      {!selectedProjectId ? (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
          <Typography color="text.secondary">
            {canManageOthers
              ? 'No projects yet. Create the first one to start building your board.'
              : 'No projects yet. Ask an Admin or Manager to create one.'}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ overflow: 'hidden' }}>
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <Box sx={{ display: 'flex', gap: 2, pb: 2 }}>
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col}
                  column={col}
                  tasks={tasksByColumn[col]}
                  canDragTask={canDragTask}
                  onOpenDetail={setSelectedTaskId}
                />
              ))}
            </Box>
            <DragOverlay>
            {activeTask && (
              <Card variant="outlined" sx={{ width: 260, borderRadius: 2 }}>
                <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
                  <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                    {activeTask.title}
                  </Typography>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Chip
                      label={activeTask.priority}
                      size="small"
                      color={priorityColor[activeTask.priority] || 'default'}
                      variant={activeTask.priority === 'Normal' ? 'outlined' : 'filled'}
                    />
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {activeTask.scheduledDate}
                      </Typography>
                      <Avatar sx={{ width: 22, height: 22, fontSize: 11, bgcolor: 'primary.main' }}>
                        {activeTask.assigneeName?.[0]?.toUpperCase()}
                      </Avatar>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
        </Box>
      )}

      <CreateTaskDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreate={handleCreateTask}
        assignableUsers={assignableUsers}
        defaultAssigneeId={user.id}
      />
      <CreateProjectDialog
        open={isProjectDialogOpen}
        onClose={() => setIsProjectDialogOpen(false)}
        onCreate={handleCreateProject}
      />
      <TaskDetailDialog taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
    </Stack>
  );
}
