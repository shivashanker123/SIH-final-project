import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface StudentContextType {
  studentId: string | null;
  setStudentId: (id: string | null) => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [studentId, setStudentIdState] = useState<string | null>(() => {
    // Initialize from localStorage if available AND token exists
    // Check both student and admin tokens
    if (typeof window !== 'undefined') {
      const studentToken = localStorage.getItem('student_token');
      const adminToken = localStorage.getItem('admin_token');
      const studentId = localStorage.getItem('studentId');
      const adminId = localStorage.getItem('admin_id');
      
      // Return studentId if student token exists, or adminId if admin token exists
      if (studentToken && studentId) {
        return studentId;
      } else if (adminToken && adminId) {
        return adminId;
      }
      return null;
    }
    return null;
  });

  // Sync with localStorage on mount and when localStorage changes
  useEffect(() => {
    const syncWithStorage = () => {
      if (typeof window !== 'undefined') {
        const studentToken = localStorage.getItem('student_token');
        const adminToken = localStorage.getItem('admin_token');
        const storedStudentId = localStorage.getItem('studentId');
        const storedAdminId = localStorage.getItem('admin_id');
        
        // Check student token first, then admin token
        if (studentToken && storedStudentId && storedStudentId !== studentId) {
          setStudentIdState(storedStudentId);
        } else if (adminToken && storedAdminId && storedAdminId !== studentId) {
          setStudentIdState(storedAdminId);
        } else if (!studentToken && !adminToken && studentId) {
          // Both tokens removed, clear state
          setStudentIdState(null);
        }
      }
    };

    syncWithStorage();
    
    // Listen for storage changes (e.g., from another tab)
    window.addEventListener('storage', syncWithStorage);
    return () => window.removeEventListener('storage', syncWithStorage);
  }, [studentId]);

  const setStudentId = (id: string | null) => {
    setStudentIdState(id);
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('studentId', id);
      } else {
        // Clear all auth data on logout
        localStorage.removeItem('studentId');
        localStorage.removeItem('student_token');
        localStorage.removeItem('student_email');
      }
    }
  };

  return (
    <StudentContext.Provider value={{ studentId, setStudentId }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};




