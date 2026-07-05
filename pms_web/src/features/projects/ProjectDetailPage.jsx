import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Chip, Paper, Stack, Typography } from '@mui/material';
import { getProject } from '../../api/endpoints/projectApi';
import ProjectItemsPanel from './ProjectItemsPanel';
import FileUploadPanel from './FileUploadPanel';
import { useAuth } from '../auth/useAuth';

const statusColor = { Active: 'success', OnHold: 'warning', Completed: 'default' };

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canManage = user.role === 'Admin' || user.role === 'Manager';

  const [project, setProject] = useState(null);

  useEffect(() => {
    getProject(id).then(setProject);
  }, [id]);

  if (!project) return null;

  return (
    <Stack spacing={3} sx={{ maxWidth: 860 }}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h5" fontWeight={600} color="primary.main">
            {project.projectCode}
          </Typography>
          <Chip label={project.status} size="small" color={statusColor[project.status] || 'default'} />
        </Stack>
        <Typography variant="h6" fontWeight={400} sx={{ mb: 1 }}>
          {project.name}
        </Typography>
        {project.description && (
          <Typography variant="body2" color="text.secondary">
            {project.description}
          </Typography>
        )}
      </Paper>

      <ProjectItemsPanel
        projectId={project.id}
        items={project.items}
        onItemsChange={(items) => setProject((p) => ({ ...p, items }))}
        canManage={canManage}
      />

      <FileUploadPanel projectId={project.id} />
    </Stack>
  );
}
