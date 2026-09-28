import api from './api';

export const bookingService = {
  // GET /api/bookings
  getAllBookings: async () => {
    const res = await api.get('/bookings');
    return res.data;
  },

  // GET /api/bookings/{id}
  getBookingById: async (id) => {
    const res = await api.get(`/bookings/${id}`);
    return res.data;
  },

  // POST /api/bookings
  bookTicket: async (studentId, showId) => {
    const res = await api.post('/bookings', {
      studentId: Number(studentId),
      showId: Number(showId),
    });
    return res.data;
  },

  // DELETE /api/bookings/{id}
  cancelBooking: async (id) => {
    const res = await api.delete(`/bookings/${id}`);
    return res.data;
  },

  // GET /api/students/{studentId}/bookings
  getBookingsByStudentId: async (studentId) => {
    const res = await api.get(`/students/${studentId}/bookings`);
    return res.data;
  },

  // GET /api/shows/{showId}/bookings
  getBookingsByShowId: async (showId) => {
    const res = await api.get(`/shows/${showId}/bookings`);
    return res.data;
  },
};
