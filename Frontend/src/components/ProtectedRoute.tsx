import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStudent } from '@/contexts/StudentContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { studentId } = useStudent();
  
  // Check both context state and localStorage for authentication
  const token = localStorage.getItem('student_token');
  const storedStudentId = localStorage.getItem('studentId');
  
  // User is authenticated if we have both token and studentId (from context or localStorage)
  const isAuthenticated = token && (studentId || storedStudentId);

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/student-login" replace />;
  }

  return <>{children}</>;
};

