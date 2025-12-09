import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface StudentContextType {
  studentId: string | null;
  setStudentId: (id: string | null) => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [studentId, setStudentIdState] = useState<string | null>(() => {
    // Initialize from localStorage - PRIORITIZE STUDENT over admin
    if (typeof window !== 'undefined') {
      const studentToken = localStorage.getItem('student_token');
      const adminToken = localStorage.getItem('admin_token');
      const storedStudentId = localStorage.getItem('studentId');
      const adminId = localStorage.getItem('admin_id');
      const adminCommunityMode = localStorage.getItem('admin_community_mode') === 'true';
      
      // CRITICAL: Student credentials ALWAYS take precedence
      if (studentToken && storedStudentId && !storedStudentId.startsWith('admin_')) {
        // If admin flags exist but student token is present, clear admin flags
        if (adminCommunityMode) {
          localStorage.removeItem('admin_community_mode');
        }
        return storedStudentId;
      }
      
      // Only use admin ID if no student token exists and admin community mode is active
      if (adminCommunityMode && adminToken && adminId && !studentToken) {
        return adminId;
      }
      
      return null;
    }
    return null;
  });

  // Sync with localStorage on mount - support both students and admins
  useEffect(() => {
    const syncWithStorage = () => {
      if (typeof window !== 'undefined') {
        const studentToken = localStorage.getItem('student_token');
        const adminToken = localStorage.getItem('admin_token');
        const storedStudentId = localStorage.getItem('studentId');
        const adminId = localStorage.getItem('admin_id');
        const adminCommunityMode = localStorage.getItem('admin_community_mode') === 'true';
        
        // CRITICAL: Student credentials ALWAYS take precedence
        if (studentToken && storedStudentId && !storedStudentId.startsWith('admin_')) {
          // If admin flags exist but student token is present, clear admin flags
          if (adminCommunityMode) {
            localStorage.removeItem('admin_community_mode');
          }
          // Sync student tokens - only for student IDs
          if (storedStudentId !== studentId) {
            setStudentIdState(storedStudentId);
          }
        } else if (adminCommunityMode && adminToken && adminId && !studentToken) {
          // Only use admin ID if no student token exists
          if (adminId !== studentId) {
            setStudentIdState(adminId);
          }
        } else if (storedStudentId && storedStudentId.startsWith('admin_') && adminToken && adminId && !studentToken) {
          // Fallback: if storedStudentId is admin ID and we have admin token, use it
          if (adminId !== studentId) {
            setStudentIdState(adminId);
          }
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




