"use client";

import React, { useState, useEffect } from 'react';
import { Box, Container } from '@mui/material';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          Loading...
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </Box>
    </Container>
  );
};

export default AuthPage;
