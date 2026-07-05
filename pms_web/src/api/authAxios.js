import axios from 'axios';

// Used only for /api/auth/* calls that must NOT carry an access token
// and must NOT trigger the refresh interceptor (avoids infinite loops).
const authAxios = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

export default authAxios;
