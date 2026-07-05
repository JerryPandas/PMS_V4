import { useState } from 'react';
import {
  Button, Checkbox, IconButton, MenuItem, Paper, Select, Stack, TextField, Typography
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { addProjectItem, updateProjectItem, deleteProjectItem } from '../../api/endpoints/projectApi';

const STATUSES = ['Todo', 'InProgress', 'Done'];
const statusLabel = { Todo: 'To do', InProgress: 'In progress', Done: 'Done' };

function SortableItem({ item, canManage, onStatusChange, onDelete, onTitleSave }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    visibility: isDragging ? 'hidden' : 'visible'
  };

  function handleStartEdit() {
    if (!canManage) return;
    setEditTitle(item.title);
    setIsEditing(true);
  }

  function handleSave() {
    if (editTitle.trim() && editTitle !== item.title) {
      onTitleSave(item, editTitle.trim());
    }
    setIsEditing(false);
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider', borderRadius: 1 }}
      >
        <Checkbox
          checked={item.status === 'Done'}
          onChange={(e) => canManage && onStatusChange(item, e.target.checked ? 'Done' : 'Todo')}
          disabled={!canManage}
          size="small"
        />
        {item.itemCode && (
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 70 }}>
            {item.itemCode}
          </Typography>
        )}
        {isEditing ? (
          <TextField
            size="small"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            autoFocus
            sx={{ flexGrow: 1 }}
          />
        ) : (
          <Typography
            variant="body2"
            onDoubleClick={handleStartEdit}
            sx={{
              flexGrow: 1,
              textDecoration: item.status === 'Done' ? 'line-through' : 'none',
              color: item.status === 'Done' ? 'text.secondary' : 'text.primary',
              cursor: canManage ? 'pointer' : 'default'
            }}
          >
            {item.title}
          </Typography>
        )}
        {canManage && (
          <>
            <Select
              size="small"
              value={item.status}
              onChange={(e) => onStatusChange(item, e.target.value)}
              sx={{ minWidth: 130 }}
            >
              {STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {statusLabel[s]}
                </MenuItem>
              ))}
            </Select>
            <IconButton size="small" onClick={() => onDelete(item)}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Stack>
    </div>
  );
}

export default function ProjectItemsPanel({ projectId, items, onItemsChange, canManage }) {
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleAdd() {
    if (!newTitle.trim()) return;
    setIsAdding(true);
    try {
      const item = await addProjectItem(projectId, newCode || null, newTitle.trim());
      onItemsChange([...items, item]);
      setNewTitle('');
      setNewCode('');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleStatusChange(item, status) {
    const updated = await updateProjectItem(item.id, item.title, status);
    onItemsChange(items.map((i) => (i.id === item.id ? updated : i)));
  }

  async function handleTitleSave(item, title) {
    const updated = await updateProjectItem(item.id, title, item.status);
    onItemsChange(items.map((i) => (i.id === item.id ? updated : i)));
  }

  async function handleDelete(item) {
    await deleteProjectItem(item.id);
    onItemsChange(items.filter((i) => i.id !== item.id));
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onItemsChange(reordered);
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
        Sub-items
      </Typography>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <Stack spacing={0}>
            {items.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                canManage={canManage}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onTitleSave={handleTitleSave}
              />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No sub-items yet.
        </Typography>
      )}

      {canManage && (
        <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
          <TextField
            size="small"
            label="Item code (optional)"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            sx={{ width: 160 }}
          />
          <TextField
            size="small"
            label="New sub-item title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            fullWidth
          />
          <Button
            variant="outlined"
            startIcon={<AddRoundedIcon />}
            onClick={handleAdd}
            disabled={!newTitle.trim() || isAdding}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add
          </Button>
        </Stack>
      )}
    </Paper>
  );
}
