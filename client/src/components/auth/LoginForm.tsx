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
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      await login(data.email, data.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sign In
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back to Invenio Master
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
        <TextField
          {...register('email')}
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        
        <TextField
          {...register('password')}
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          error={!!errors.password}
          helperText={errors.password?.message}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
        </Button>
        
        {onSwitchToRegister && (
          <Box sx={{ textAlign: 'center' }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={onSwitchToRegister}
              sx={{ textDecoration: 'none' }}
            >
              Don't have an account? Sign Up
            </Link>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default LoginForm;
