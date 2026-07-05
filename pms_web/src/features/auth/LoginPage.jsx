import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Alert, Button, Link, Stack, TextField } from '@mui/material';
import AuthLayout from '../../layouts/AuthLayout';
import { useAuth } from './useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(userName, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err.response?.status === 401
          ? 'Incorrect username or password.'
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Sign in to PMS" subtitle="Use your team account to continue">
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          autoFocus
          fullWidth
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          required
        />
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
        <Link component={RouterLink} to="/register" underline="hover" variant="body2" textAlign="center">
          Don't have an account? Create one
        </Link>
      </Stack>
    </AuthLayout>
  );
}
