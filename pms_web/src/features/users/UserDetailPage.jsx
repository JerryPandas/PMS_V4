import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert, Button, Chip, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField, Typography
} from '@mui/material';
import { getUser, updateUser, changePassword } from '../../api/endpoints/userApi';
import { useAuth } from '../auth/useAuth';

const ROLES = ['Admin', 'Manager', 'Member'];
const roleColor = { Admin: 'error', Manager: 'primary', Member: 'default' };

export default function UserDetailPage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const canManageOthers = currentUser.role === 'Admin' || currentUser.role === 'Manager';
  const isSelf = id === currentUser.id;

  const [profile, setProfile] = useState(null);
  const [notFoundOrForbidden, setNotFoundOrForbidden] = useState(false);

  const [profileForm, setProfileForm] = useState({ displayName: '', email: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const [roleForm, setRoleForm] = useState({ role: 'Member', isActive: true });
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleMessage, setRoleMessage] = useState('');

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    getUser(id)
      .then((data) => {
        setProfile(data);
        setProfileForm({ displayName: data.displayName, email: data.email || '' });
        setRoleForm({ role: data.role, isActive: data.isActive });
      })
      .catch(() => setNotFoundOrForbidden(true));
  }, [id]);

  const canEditProfile = isSelf || canManageOthers;

  async function handleSaveProfile() {
    setProfileSaving(true);
    setProfileMessage('');
    try {
      const updated = await updateUser(id, {
        displayName: profileForm.displayName,
        email: profileForm.email || null
      });
      setProfile(updated);
      setProfileMessage('Profile updated.');
    } catch {
      setProfileMessage('Could not update profile.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSaveRole() {
    setRoleSaving(true);
    setRoleMessage('');
    try {
      const updated = await updateUser(id, { role: roleForm.role, isActive: roleForm.isActive });
      setProfile(updated);
      setRoleMessage('Role & status updated.');
    } catch {
      setRoleMessage('Could not update role/status.');
    } finally {
      setRoleSaving(false);
    }
  }

  async function handleChangePassword() {
    setPwError('');
    setPwMessage('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(id, isSelf ? pwForm.currentPassword : undefined, pwForm.newPassword);
      setPwMessage('Password updated.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Could not update password.');
    } finally {
      setPwSaving(false);
    }
  }

  if (notFoundOrForbidden) {
    return (
      <Alert severity="error">You don't have permission to view this profile, or it doesn't exist.</Alert>
    );
  }
  if (!profile) return null;

  return (
    <Stack spacing={3} sx={{ maxWidth: 640 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Typography variant="h5" fontWeight={500}>
          {profile.displayName}
        </Typography>
        <Chip label={profile.role} size="small" color={roleColor[profile.role]} />
        {!profile.isActive && <Chip label="Inactive" size="small" variant="outlined" />}
      </Stack>
      <Typography variant="body2" color="text.secondary">
        @{profile.userName} · joined {new Date(profile.createdAt).toLocaleDateString()}
      </Typography>

      {/* Profile fields — self or Admin/Manager */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
          Profile
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Display name"
            value={profileForm.displayName}
            onChange={(e) => setProfileForm((f) => ({ ...f, displayName: e.target.value }))}
            disabled={!canEditProfile}
            fullWidth
          />
          <TextField
            label="Email"
            value={profileForm.email}
            onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
            disabled={!canEditProfile}
            fullWidth
          />
          {profileMessage && <Alert severity={profileMessage.startsWith('Could') ? 'error' : 'success'}>{profileMessage}</Alert>}
          {canEditProfile && (
            <Button variant="contained" onClick={handleSaveProfile} disabled={profileSaving} sx={{ alignSelf: 'flex-start' }}>
              {profileSaving ? 'Saving…' : 'Save profile'}
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Role & status — Admin/Manager only, per the role matrix */}
      {canManageOthers && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
            Role &amp; status
          </Typography>
          <Stack spacing={2}>
            <TextField
              select
              label="Role"
              value={roleForm.role}
              onChange={(e) => setRoleForm((f) => ({ ...f, role: e.target.value }))}
              fullWidth
            >
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={roleForm.isActive}
                  onChange={(e) => setRoleForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
              }
              label={roleForm.isActive ? 'Active' : 'Inactive (cannot log in)'}
            />
            {roleMessage && <Alert severity={roleMessage.startsWith('Could') ? 'error' : 'success'}>{roleMessage}</Alert>}
            <Button variant="contained" onClick={handleSaveRole} disabled={roleSaving} sx={{ alignSelf: 'flex-start' }}>
              {roleSaving ? 'Saving…' : 'Save role & status'}
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Password — self must confirm current password; Admin/Manager can reset others' directly */}
      {(isSelf || canManageOthers) && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
            {isSelf ? 'Change password' : 'Reset password'}
          </Typography>
          <Stack spacing={2}>
            {isSelf && (
              <TextField
                label="Current password"
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                fullWidth
              />
            )}
            <TextField
              label="New password"
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Confirm new password"
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              fullWidth
            />
            {pwError && <Alert severity="error">{pwError}</Alert>}
            {pwMessage && <Alert severity="success">{pwMessage}</Alert>}
            <Button
              variant="contained"
              onClick={handleChangePassword}
              disabled={pwSaving || !pwForm.newPassword}
              sx={{ alignSelf: 'flex-start' }}
            >
              {pwSaving ? 'Saving…' : isSelf ? 'Change password' : 'Reset password'}
            </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
