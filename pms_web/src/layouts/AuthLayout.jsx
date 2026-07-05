import { Box, Paper, Stack, Typography } from '@mui/material';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 400,
          p: { xs: 3, sm: 5 },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3
        }}
      >
        <Stack spacing={1} alignItems="center" sx={{ mb: 4 }}>
          <AccountTreeRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={500}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {subtitle}
            </Typography>
          )}
        </Stack>
        {children}
      </Paper>
    </Box>
  );
}
