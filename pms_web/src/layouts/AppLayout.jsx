import { AppBar, Avatar, Box, ButtonBase, Stack, Toolbar, Typography, Button } from '@mui/material';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';

const navLinkStyle = ({ isActive }) => ({
  color: isActive ? '#1a73e8' : '#3c4043',
  fontWeight: isActive ? 500 : 400,
  textDecoration: 'none',
  fontSize: 14
});

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const canManageOthers = user?.role === 'Admin' || user?.role === 'Manager';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            PMS
          </Typography>
          <Stack direction="row" spacing={2.5} sx={{ flexGrow: 1 }}>
            <NavLink to="/" style={navLinkStyle} end>
              Dashboard
            </NavLink>
            <NavLink to="/kanban" style={navLinkStyle}>
              Kanban
            </NavLink>
            <NavLink to="/weekly" style={navLinkStyle}>
              Weekly board
            </NavLink>
            <NavLink to="/projects" style={navLinkStyle}>
              Projects
            </NavLink>
            {canManageOthers && (
              <NavLink to="/users" style={navLinkStyle}>
                Users
              </NavLink>
            )}
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ButtonBase
              onClick={() => navigate(`/users/${user.id}`)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, borderRadius: 2, px: 1, py: 0.5 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                {user?.displayName?.[0]?.toUpperCase()}
              </Avatar>
              <Typography variant="body2">{user?.displayName}</Typography>
            </ButtonBase>
            <Button size="small" onClick={logout}>
              Sign out
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
