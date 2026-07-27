import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Chip, List, ListItemButton, ListItemText, Paper, Stack, Typography
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CreateProjectDialog from '../kanban/CreateProjectDialog';
import { listProjects, createProject } from '../../api/endpoints/projectApi';
import { useAuth } from '../auth/useAuth';

const statusColor = { Active: 'success', OnHold: 'warning', Completed: 'default' };

export default function ProjectsListPage() {
  const { user } = useAuth();
  const canManageOthers = user.role === 'Admin' || user.role === 'Manager';
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    listProjects().then(setProjects);
  }, []);

  async function handleCreate(form) {
    const project = await createProject(form.projectCode, form.name, form.description);
    setProjects((prev) => [project, ...prev]);
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={500}>
          Projects
        </Typography>
        {canManageOthers && (
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setIsDialogOpen(true)}>
            New project
          </Button>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3 }}>
        <List disablePadding>
          {projects.map((p) => (
            <ListItemButton
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      {p.projectCode}
                    </Typography>
                    <Typography variant="body2">{p.name}</Typography>
                  </Stack>
                }
                secondary={p.description}
              />
              <Chip label={p.status} size="small" color={statusColor[p.status] || 'default'} />
            </ListItemButton>
          ))}
          {projects.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 3 }}>
              No projects yet.
            </Typography>
          )}
        </List>
      </Paper>

      <CreateProjectDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} onCreate={handleCreate} />
    </Stack>
  );
}
