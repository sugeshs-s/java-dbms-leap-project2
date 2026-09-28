import api from './api';

export const showService = {
  // GET /api/shows with optional filters: date, title, available
  getAllShows: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.title) params.append('title', filters.title);
    if (filters.date) params.append('date', filters.date);
    if (filters.available !== undefined && filters.available !== '') {
      params.append('available', filters.available);
    }
    const query = params.toString();
    const res = await api.get(`/shows${query ? `?${query}` : ''}`);
    return res.data;
  },

  // GET /api/shows/{id}
  getShowById: async (id) => {
    const res = await api.get(`/shows/${id}`);
    return res.data;
  },

  // POST /api/shows
  createShow: async (showData) => {
    const res = await api.post('/shows', showData);
    return res.data;
  },

  // PUT /api/shows/{id}
  updateShow: async (id, showData) => {
    const res = await api.put(`/shows/${id}`, showData);
    return res.data;
  },

  // DELETE /api/shows/{id}
  deleteShow: async (id) => {
    const res = await api.delete(`/shows/${id}`);
    return res.data;
  },
};
