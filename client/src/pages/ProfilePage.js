import React, { useState } from 'react';
import {
  Container, Box, Typography, Button,
  TextField, Alert, Avatar, IconButton, Tooltip
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useAuth } from '../context/AuthContext';
import { updateProfileUser } from '../services/api';
import AppShell from '../components/AppShell';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.photoUrl || '');
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [darkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const form = new FormData();
      form.append('name', name);
      if (selectedFile) form.append('photo', selectedFile);
      else form.append('photoUrl', photoUrl || '');

      const { data } = await updateProfileUser(form);
      updateUser(data);
      setMessage('Profile updated successfully.');
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setPhotoUrl(user?.photoUrl || '');
    setPreviewUrl(user?.photoUrl || '');
    setSelectedFile(null);
    setIsEditing(false);
    setMessage('');
    setError('');
  };

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Profile</Typography>

        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box
          component="form"
          onSubmit={handleSave}
          sx={{
            p: 3,
            border: '1px solid',
            borderColor: darkMode ? '#333' : '#e0e0e0',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
        >
          {/* Avatar with camera button */}
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={previewUrl || undefined}
              sx={{ width: 120, height: 120, bgcolor: 'primary.main', fontSize: 40, fontWeight: 'bold' }}
            >
              {!previewUrl && (user?.name?.charAt(0)?.toUpperCase() || '?')}
            </Avatar>
            {isEditing && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  id="photo-upload"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <label htmlFor="photo-upload">
                  <Tooltip title="Change photo" arrow>
                    <IconButton
                      component="span"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'primary.main',
                        color: '#fff',
                        width: 32,
                        height: 32,
                        '&:hover': { bgcolor: 'primary.dark' }
                      }}
                    >
                      <PhotoCameraIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </label>
              </>
            )}
          </Box>

          {/* Name and email display */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 'bold' }}
            >
              {user?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
          </Box>

          {/* Edit fields */}
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing}
            />
            <TextField
              label="Profile Picture URL (optional)"
              fullWidth
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              disabled={!isEditing}
              helperText={isEditing ? "Or use the camera button above to upload a file" : ""}
            />
          </Box>

          {/* Buttons */}
          {isEditing ? (
            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
              <Button variant="outlined" fullWidth onClick={handleCancel}>Cancel</Button>
              <Button type="submit" variant="contained" fullWidth>Save Changes</Button>
            </Box>
          ) : (
            <Button variant="contained" fullWidth onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </Box>
      </Container>
    </AppShell>
  );
};

export default ProfilePage;