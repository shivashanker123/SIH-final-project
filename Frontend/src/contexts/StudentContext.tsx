import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface StudentContextType {
  studentId: string | null;
  setStudentId: (id: string | null) => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [studentId, setStudentIdState] = useState<string | null>(() => {
    // Initialize from localStorage if available AND token exists
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('student_token');
      const id = localStorage.getItem('studentId');
      // Only return studentId if token exists (authenticated)
      return token && id ? id : null;
    }
    return null;
  });

  // Sync with localStorage on mount and when localStorage changes
  useEffect(() => {
    const syncWithStorage = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('student_token');
        const storedId = localStorage.getItem('studentId');
        if (token && storedId && storedId !== studentId) {
          setStudentIdState(storedId);
        } else if (!token && studentId) {
          // Token was removed, clear state
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




