import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { studentService } from '../services/studentService';

const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
  const [students, setStudents] = useState([]);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getAllStudents();
      setStudents(data);

      // Restore saved student from localStorage or pick the first one
      const savedStudentId = localStorage.getItem('ticketdesk_student_id');
      if (savedStudentId && data.length > 0) {
        const found = data.find((s) => s.id === Number(savedStudentId));
        if (found) {
          setCurrentStudent(found);
        } else {
          setCurrentStudent(data[0]);
          localStorage.setItem('ticketdesk_student_id', data[0].id);
        }
      } else if (data.length > 0) {
        setCurrentStudent(data[0]);
        localStorage.setItem('ticketdesk_student_id', data[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const selectStudent = (studentId) => {
    const student = students.find((s) => s.id === Number(studentId));
    if (student) {
      setCurrentStudent(student);
      localStorage.setItem('ticketdesk_student_id', student.id);
    }
  };

  return (
    <StudentContext.Provider
      value={{
        students,
        currentStudent,
        selectStudent,
        refreshStudents: fetchStudents,
        loading,
        error,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};
