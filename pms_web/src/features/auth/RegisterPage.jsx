import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Alert, Button, Link, Stack, TextField } from '@mui/material';
import AuthLayout from '../../layouts/AuthLayout';
import { useAuth } from './useAuth';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ userName: '', displayName: '', password: '', email: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register(form.userName, form.displayName, form.password, form.email || undefined);
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err.response?.status === 409
          ? 'That username is already taken.'
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="New accounts start with Member access">
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Username" value={form.userName} onChange={update('userName')} required fullWidth autoFocus />
        <TextField label="Display name" value={form.displayName} onChange={update('displayName')} required fullWidth />
        <TextField label="Email (optional)" type="email" value={form.email} onChange={update('email')} fullWidth />
        <TextField label="Password" type="password" value={form.password} onChange={update('password')} required fullWidth />
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
        <Link component={RouterLink} to="/login" underline="hover" variant="body2" textAlign="center">
          Already have an account? Sign in
        </Link>
      </Stack>
    </AuthLayout>
  );
}
