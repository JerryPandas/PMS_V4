import apiClient from '../apiClient';

export async function listFiles(projectId) {
  const { data } = await apiClient.get('/files', { params: { projectId } });
  return data;
}

export async function uploadFile(projectId, file, onProgress) {
  const formData = new FormData();
  formData.append('projectId', projectId);
  formData.append('file', file);

  // IMPORTANT: apiClient sets a default "Content-Type: application/json" header
  // on the instance. Axios will NOT override an already-present header, even
  // for FormData bodies, so we must explicitly clear it here (set to undefined)
  // to let the browser generate "multipart/form-data; boundary=----XYZ" itself.
  // The boundary token is required for the server to parse the multipart body —
  // without this, the backend receives an unparsable request and file uploads fail.
  const { data } = await apiClient.post('/files/upload', formData, {
    headers: { 'Content-Type': undefined },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100));
    }
  });
  return data;
}

export async function deleteFile(fileId) {
  await apiClient.delete(`/files/${fileId}`);
}
