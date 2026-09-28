import api from './api';

export const studentService = {
  // GET /api/students
  getAllStudents: async () => {
    const res = await api.get('/students');
    return res.data;
  },

  // GET /api/students/{id}
  getStudentById: async (id) => {
    const res = await api.get(`/students/${id}`);
    return res.data;
  },

  // POST /api/students
  createStudent: async (studentData) => {
    const res = await api.post('/students', studentData);
    return res.data;
  },

  // PUT /api/students/{id}
  updateStudent: async (id, studentData) => {
    const res = await api.put(`/students/${id}`, studentData);
    return res.data;
  },

  // DELETE /api/students/{id}
  deleteStudent: async (id) => {
    const res = await api.delete(`/students/${id}`);
    return res.data;
  },
};
