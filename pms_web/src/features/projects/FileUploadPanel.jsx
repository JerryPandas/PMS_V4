import { useEffect, useRef, useState } from 'react';
import {
  Alert, Box, IconButton, LinearProgress, Link, List, ListItem, ListItemIcon,
  ListItemText, Paper, Stack, Typography
} from '@mui/material';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { listFiles, uploadFile, deleteFile } from '../../api/endpoints/fileApi';
import { useAuth } from '../auth/useAuth';

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUploadPanel({ projectId }) {
  const { user } = useAuth();
  const canManageOthers = user.role === 'Admin' || user.role === 'Manager';

  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    listFiles(projectId).then(setFiles);
  }, [projectId]);

  async function handleFiles(fileList) {
    setError('');
    const selected = Array.from(fileList);
    for (const file of selected) {
      if (file.size > MAX_SIZE_BYTES) {
        setError(`"${file.name}" exceeds the 10 MB limit.`);
        continue;
      }
      try {
        setUploadProgress(0);
        const uploaded = await uploadFile(projectId, file, setUploadProgress);
        setFiles((prev) => [uploaded, ...prev]);
      } catch (err) {
        setError(
          err.response?.status === 409
            ? `"${file.name}" was already uploaded to this project.`
            : `Could not upload "${file.name}".`
        );
      } finally {
        setUploadProgress(null);
      }
    }
  }

  async function handleDelete(file) {
    await deleteFile(file.id);
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
  }

  function canDelete(file) {
    return canManageOthers || file.uploadedByName === user.displayName;
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
        Project files
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        sx={{
          border: '2px dashed',
          borderColor: isDragOver ? 'primary.main' : 'divider',
          bgcolor: isDragOver ? '#e8f0fe' : 'transparent',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 120ms ease'
        }}
      >
        <UploadFileRoundedIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Drag and drop a file here, or click to browse — up to 10 MB
        </Typography>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </Box>

      {uploadProgress !== null && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 2 }} />}

      <List disablePadding sx={{ mt: 2 }}>
        {files.map((file) => (
          <ListItem
            key={file.id}
            sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 0 }}
            secondaryAction={
              canDelete(file) && (
                <IconButton edge="end" size="small" onClick={() => handleDelete(file)}>
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              )
            }
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <InsertDriveFileOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Link href={file.downloadUrl} target="_blank" rel="noopener" underline="hover" variant="body2">
                  {file.fileName}
                </Link>
              }
              secondary={`${formatSize(file.fileSize)} · uploaded by ${file.uploadedByName}`}
            />
          </ListItem>
        ))}
        {files.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No files uploaded yet.
          </Typography>
        )}
      </List>
    </Paper>
  );
}
