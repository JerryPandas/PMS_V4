import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar, Chip, List, ListItemButton, ListItemAvatar, ListItemText, Paper, Stack, Typography
} from '@mui/material';
import { listUsersForManagement } from '../../api/endpoints/userApi';

const roleColor = { Admin: 'error', Manager: 'primary', Member: 'default' };

export default function UsersListPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    listUsersForManagement().then(setUsers);
  }, []);

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={500}>
        Users
      </Typography>

      <Paper variant="outlined" sx={{ borderRadius: 3 }}>
        <List disablePadding>
          {users.map((u) => (
            <ListItemButton
              key={u.id}
              onClick={() => navigate(`/users/${u.id}`)}
              sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>{u.displayName[0]?.toUpperCase()}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontWeight={500}>
                      {u.displayName}
                    </Typography>
                    {!u.isActive && <Chip label="Inactive" size="small" variant="outlined" />}
                  </Stack>
                }
                secondary={`@${u.userName}${u.email ? ' · ' + u.email : ''}`}
              />
              <Chip label={u.role} size="small" color={roleColor[u.role] || 'default'} />
            </ListItemButton>
          ))}
          {users.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 3 }}>
              No users found.
            </Typography>
          )}
        </List>
      </Paper>
    </Stack>
  );
}
