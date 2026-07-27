import { BarChart } from '@mui/x-charts/BarChart';
import { Paper, Typography } from '@mui/material';

const priorityColor = { Low: '#adb5bd', Normal: '#4dabf7', High: '#ff6b6b' };

export default function PriorityChart({ data }) {
  const total = data?.reduce((sum, d) => sum + d.count, 0) ?? 0;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, flex: 1, minWidth: 340 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
        Priority breakdown
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Task count by priority level
      </Typography>
      {total > 0 ? (
        <BarChart
          height={300}
          margin={{ top: 20, right: 20, bottom: 70, left: 50 }}
          xAxis={[{ scaleType: 'band', data: data.map((d) => d.priority) }]}
          series={[
            {
              data: data.map((d) => d.count),
              label: 'Tasks',
              valueFormatter: (v) => `${v} tasks`
            }
          ]}
          colors={data.map((d) => priorityColor[d.priority])}
          slotProps={{
            legend: { hidden: true },
            bar: { rx: 4, ry: 4 }
          }}
          grid={{ vertical: false, horizontal: true }}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          No tasks yet for this project.
        </Typography>
      )}
    </Paper>
  );
}
