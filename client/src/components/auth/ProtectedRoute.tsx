"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRoles, router]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body1">Loading...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Typography variant="h6" color="error">
          Access Denied: Insufficient permissions
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
