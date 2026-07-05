import { useEffect, useState } from 'react';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import ProgressChart from '../charts/ProgressChart';
import WorkloadChart from '../charts/WorkloadChart';
import PriorityChart from '../charts/PriorityChart';
import WeeklyTrendChart from '../charts/WeeklyTrendChart';
import { listProjects } from '../../api/endpoints/projectApi';
import { getProjectProgress, getWorkload, getPriorityBreakdown } from '../../api/endpoints/chartApi';

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [progress, setProgress] = useState(null);
  const [priorityData, setPriorityData] = useState(null);
  const [workload, setWorkload] = useState(null);

  useEffect(() => {
    listProjects().then((list) => {
      setProjects(list);
      if (list.length > 0) setSelectedProjectId(list[0].id);
    });
    getWorkload().then(setWorkload);
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    getProjectProgress(selectedProjectId).then(setProgress);
    getPriorityBreakdown(selectedProjectId).then(setPriorityData);
  }, [selectedProjectId]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <Typography variant="h5" fontWeight={500}>
          Dashboard
        </Typography>
        {projects.length > 0 && (
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
        )}
      </Stack>

      {projects.length === 0 ? (
        <Typography color="text.secondary">
          No projects yet — create one from the Projects page to see charts here.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <ProgressChart data={progress} />
          <PriorityChart data={priorityData} />
        </Box>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <WeeklyTrendChart />
        <WorkloadChart rows={workload} />
      </Box>
    </Stack>
  );
}
