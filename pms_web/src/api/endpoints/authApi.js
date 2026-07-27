import authAxios from '../authAxios';

export async function loginRequest(userName, password) {
  const { data } = await authAxios.post('/auth/login', { userName, password });
  return data; // AuthResponse shape from backend
}

export async function registerRequest(userName, displayName, password, email) {
  const { data } = await authAxios.post('/auth/register', {
    userName,
    displayName,
    password,
    email
  });
  return data;
}

export async function refreshRequest(refreshToken) {
  const { data } = await authAxios.post('/auth/refresh', { refreshToken });
  return data;
}

export async function logoutRequest(refreshToken) {
  await authAxios.post('/auth/logout', { refreshToken });
}
