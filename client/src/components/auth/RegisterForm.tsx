"use client";

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Link,
  MenuItem,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['VIEWER', 'STAFF', 'MANAGER', 'ADMIN']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'VIEWER',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');

    try {
      await registerUser(data.name, data.email, data.password, data.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sign Up
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create your Invenio Master account
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
        <TextField
          {...register('name')}
          margin="normal"
          required
          fullWidth
          id="name"
          label="Full Name"
          name="name"
          autoComplete="name"
          autoFocus
          error={!!errors.name}
          helperText={errors.name?.message}
        />
        
        <TextField
          {...register('email')}
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        
        <TextField
          select
          margin="normal"
          required
          fullWidth
          id="role"
          label="Role"
          defaultValue="VIEWER"
          {...register('role')}
          error={!!errors.role}
          helperText={errors.role?.message}
        >
          <MenuItem value="VIEWER">Viewer</MenuItem>
          <MenuItem value="STAFF">Staff</MenuItem>
          <MenuItem value="MANAGER">Manager</MenuItem>
          <MenuItem value="ADMIN">Admin</MenuItem>
        </TextField>
        
        <TextField
          {...register('password')}
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="new-password"
          error={!!errors.password}
          helperText={errors.password?.message}
        />
        
        <TextField
          {...register('confirmPassword')}
          margin="normal"
          required
          fullWidth
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          id="confirmPassword"
          autoComplete="new-password"
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Sign Up'}
        </Button>
        
        {onSwitchToLogin && (
          <Box sx={{ textAlign: 'center' }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={onSwitchToLogin}
              sx={{ textDecoration: 'none' }}
            >
              Already have an account? Sign In
            </Link>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default RegisterForm;
