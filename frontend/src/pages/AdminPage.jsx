import React, { useState, useEffect, useCallback } from 'react';
import { Film, Users, Ticket, Armchair, Plus, Trash2, Edit3, RefreshCw } from 'lucide-react';
import { showService } from '../services/showService';
import { studentService } from '../services/studentService';
import { bookingService } from '../services/bookingService';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmModal from '../components/ConfirmModal';

export const AdminPage = ({ onToast }) => {
  const [shows, setShows] = useState([]);
  const [students, setStudents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active sub-tab in Admin
  const [activeTab, setActiveTab] = useState('shows');

  // New Show Form State
  const [isNewShowModalOpen, setIsNewShowModalOpen] = useState(false);
  const [newShowData, setNewShowData] = useState({
    title: '',
    showDate: '',
    showTime: '',
    totalSeats: 100,
  });
  const [createShowLoading, setCreateShowLoading] = useState(false);

  // Edit Show State
  const [editingShow, setEditingShow] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editShowLoading, setEditShowLoading] = useState(false);

  // Delete Show State
  const [deletingShow, setDeletingShow] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // New Student State
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    name: '',
    email: '',
    department: '',
  });
  const [createStudentLoading, setCreateStudentLoading] = useState(false);

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [showsData, studentsData, bookingsData] = await Promise.all([
        showService.getAllShows(),
        studentService.getAllStudents(),
        bookingService.getAllBookings(),
      ]);
      setShows(showsData);
      setStudents(studentsData);
      setBookings(bookingsData);
    } catch (err) {
      setError(err.message || 'Failed to load administrative data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Handle Create Show
  const handleCreateShowSubmit = async (e) => {
    e.preventDefault();
    if (!newShowData.title || !newShowData.showDate || !newShowData.showTime || !newShowData.totalSeats) {
      onToast && onToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please fill in all show details.',
      });
      return;
    }

    try {
      setCreateShowLoading(true);
      await showService.createShow({
        ...newShowData,
        totalSeats: Number(newShowData.totalSeats),
      });

      setIsNewShowModalOpen(false);
      setNewShowData({ title: '', showDate: '', showTime: '', totalSeats: 100 });
      onToast && onToast({
        type: 'success',
        title: 'Show Scheduled!',
        message: `Successfully created "${newShowData.title}".`,
      });
      await fetchAdminData();
    } catch (err) {
      onToast && onToast({
        type: 'error',
        title: 'Error Creating Show',
        message: err.message || 'Failed to create show.',
      });
    } finally {
      setCreateShowLoading(false);
    }
  };

  // Handle Edit Show
  const handleEditShowSubmit = async (e) => {
    e.preventDefault();
    if (!editingShow) return;

    try {
      setEditShowLoading(true);
      await showService.updateShow(editingShow.id, {
        title: editingShow.title,
        showDate: editingShow.showDate,
        showTime: editingShow.showTime,
        totalSeats: Number(editingShow.totalSeats),
      });

      setIsEditModalOpen(false);
      setEditingShow(null);
      onToast && onToast({
        type: 'success',
        title: 'Show Updated',
        message: `Screening #${editingShow.id} updated successfully.`,
      });
      await fetchAdminData();
    } catch (err) {
      onToast && onToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Unable to update show.',
      });
    } finally {
      setEditShowLoading(false);
    }
  };

  // Handle Delete Show
  const handleConfirmDelete = async () => {
    if (!deletingShow) return;

    try {
      setDeleteLoading(true);
      await showService.deleteShow(deletingShow.id);

      setIsDeleteModalOpen(false);
      setDeletingShow(null);
      onToast && onToast({
        type: 'success',
        title: 'Show Deleted',
        message: `Screening "${deletingShow.title}" removed.`,
      });
      await fetchAdminData();
    } catch (err) {
      onToast && onToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete show.',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle Create Student
  const handleCreateStudentSubmit = async (e) => {
    e.preventDefault();
    if (!newStudentData.name || !newStudentData.email) {
      onToast && onToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Name and email are required.',
      });
      return;
    }

    try {
      setCreateStudentLoading(true);
      await studentService.createStudent(newStudentData);

      setIsNewStudentModalOpen(false);
      setNewStudentData({ name: '', email: '', department: '' });
      onToast && onToast({
        type: 'success',
        title: 'Student Registered',
        message: `Registered student ${newStudentData.name}.`,
      });
      await fetchAdminData();
    } catch (err) {
      onToast && onToast({
        type: 'error',
        title: 'Registration Error',
        message: err.message || 'Failed to register student.',
      });
    } finally {
      setCreateStudentLoading(false);
    }
  };

  const totalAvailableSeats = shows.reduce((acc, s) => acc + (s.availableSeats || 0), 0);
  const confirmedBookingsCount = bookings.filter((b) => b.status === 'CONFIRMED').length;

  return (
    <div className="admin-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Admin Management Dashboard</h1>
          <p className="page-subtitle">Manage campus screenings, registered student profiles, and audit reservations.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchAdminData}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spinner-icon' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsNewShowModalOpen(true)}
          >
            <Plus size={16} />
            <span>New Show</span>
          </button>
        </div>
      </div>

      {/* Real-time Dashboard Metric Cards */}
      <div className="stats-grid">
        <StatCard icon={Film} title="Total Screenings" value={shows.length} colorClass="accent-blue" />
        <StatCard icon={Users} title="Total Students" value={students.length} colorClass="accent-purple" />
        <StatCard icon={Ticket} title="Active Bookings" value={confirmedBookingsCount} colorClass="accent-pink" />
        <StatCard icon={Armchair} title="Available Seats" value={totalAvailableSeats} colorClass="accent-green" />
      </div>

      {/* Sub Tabs */}
      <div className="admin-tabs-row">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'shows' ? 'active' : ''}`}
          onClick={() => setActiveTab('shows')}
        >
          Shows &amp; Screenings ({shows.length})
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Students ({students.length})
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          All Bookings ({bookings.length})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading management data..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchAdminData} />
      ) : (
        <>
          {/* TAB: SHOWS */}
          {activeTab === 'shows' && (
            <div className="table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Movie / Show Title</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Capacity</th>
                    <th>Available Seats</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shows.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                        No shows configured yet.
                      </td>
                    </tr>
                  ) : (
                    shows.map((s) => (
                      <tr key={s.id}>
                        <td><strong>#{s.id}</strong></td>
                        <td style={{ fontWeight: 600 }}>{s.title}</td>
                        <td>{s.showDate}</td>
                        <td>{s.showTime}</td>
                        <td>{s.totalSeats}</td>
                        <td>
                          <span className={`status-pill ${s.availableSeats > 0 ? 'status-confirmed' : 'status-cancelled'}`}>
                            {s.availableSeats}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ marginRight: '0.5rem' }}
                            onClick={() => {
                              setEditingShow(s);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit3 size={14} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              setDeletingShow(s);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: STUDENTS */}
          {activeTab === 'students' && (
            <div className="table-card">
              <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsNewStudentModalOpen(true)}
                >
                  <Plus size={14} />
                  <span>Register Student</span>
                </button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Student Name</th>
                    <th>Email Address</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                        No students registered yet.
                      </td>
                    </tr>
                  ) : (
                    students.map((st) => (
                      <tr key={st.id}>
                        <td><strong>#STU-{st.id}</strong></td>
                        <td style={{ fontWeight: 600 }}>{st.name}</td>
                        <td>{st.email}</td>
                        <td>{st.department || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ticket Ref</th>
                    <th>Student</th>
                    <th>Show</th>
                    <th>Booked Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                        No bookings made yet across the campus.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => (
                      <tr key={b.id}>
                        <td><code>#TK-{String(b.id).padStart(4, '0')}</code></td>
                        <td>{b.studentName || `Student #${b.studentId}`}</td>
                        <td>{b.showTitle || `Show #${b.showId}`}</td>
                        <td>{new Date(b.bookingDate).toLocaleString()}</td>
                        <td>
                          <span className={`status-pill ${b.status === 'CONFIRMED' ? 'status-confirmed' : 'status-cancelled'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal: Create Show */}
      <ConfirmModal
        isOpen={isNewShowModalOpen}
        title="Schedule New Show"
        onConfirm={handleCreateShowSubmit}
        onCancel={() => setIsNewShowModalOpen(false)}
        confirmText="Schedule Show"
        cancelText="Cancel"
        isLoading={createShowLoading}
      >
        <form onSubmit={handleCreateShowSubmit}>
          <div className="form-field">
            <label className="field-label">Show / Movie Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Oppenheimer"
              required
              value={newShowData.title}
              onChange={(e) => setNewShowData({ ...newShowData, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div className="form-field">
              <label className="field-label">Date</label>
              <input
                type="date"
                className="form-input"
                required
                value={newShowData.showDate}
                onChange={(e) => setNewShowData({ ...newShowData, showDate: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label className="field-label">Time</label>
              <input
                type="time"
                className="form-input"
                required
                value={newShowData.showTime}
                onChange={(e) => setNewShowData({ ...newShowData, showTime: e.target.value })}
              />
            </div>
          </div>

          <div className="form-field" style={{ marginTop: '1rem' }}>
            <label className="field-label">Total Seating Capacity</label>
            <input
              type="number"
              className="form-input"
              min="1"
              max="1000"
              required
              value={newShowData.totalSeats}
              onChange={(e) => setNewShowData({ ...newShowData, totalSeats: e.target.value })}
            />
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
              Available seats will initially be set equal to total seats.
            </small>
          </div>
        </form>
      </ConfirmModal>

      {/* Modal: Edit Show */}
      <ConfirmModal
        isOpen={isEditModalOpen}
        title="Edit Screening"
        onConfirm={handleEditShowSubmit}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingShow(null);
        }}
        confirmText="Save Changes"
        cancelText="Cancel"
        isLoading={editShowLoading}
      >
        {editingShow && (
          <form onSubmit={handleEditShowSubmit}>
            <div className="form-field">
              <label className="field-label">Title</label>
              <input
                type="text"
                className="form-input"
                required
                value={editingShow.title}
                onChange={(e) => setEditingShow({ ...editingShow, title: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-field">
                <label className="field-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={editingShow.showDate}
                  onChange={(e) => setEditingShow({ ...editingShow, showDate: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="field-label">Time</label>
                <input
                  type="time"
                  className="form-input"
                  required
                  value={editingShow.showTime}
                  onChange={(e) => setEditingShow({ ...editingShow, showTime: e.target.value })}
                />
              </div>
            </div>

            <div className="form-field" style={{ marginTop: '1rem' }}>
              <label className="field-label">Total Seats</label>
              <input
                type="number"
                className="form-input"
                min="1"
                required
                value={editingShow.totalSeats}
                onChange={(e) => setEditingShow({ ...editingShow, totalSeats: e.target.value })}
              />
            </div>
          </form>
        )}
      </ConfirmModal>

      {/* Modal: Delete Show Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Screening"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingShow(null);
        }}
        confirmText="Delete Show"
        confirmVariant="danger"
        isLoading={deleteLoading}
      >
        {deletingShow && (
          <p>
            Are you sure you want to permanently delete screening <strong>"{deletingShow.title}"</strong> (ID #{deletingShow.id})? All associated bookings will be removed.
          </p>
        )}
      </ConfirmModal>

      {/* Modal: Register Student */}
      <ConfirmModal
        isOpen={isNewStudentModalOpen}
        title="Register New Student"
        onConfirm={handleCreateStudentSubmit}
        onCancel={() => setIsNewStudentModalOpen(false)}
        confirmText="Register"
        cancelText="Cancel"
        isLoading={createStudentLoading}
      >
        <form onSubmit={handleCreateStudentSubmit}>
          <div className="form-field">
            <label className="field-label">Student Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Jackie"
              required
              value={newStudentData.name}
              onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })}
            />
          </div>

          <div className="form-field" style={{ marginTop: '1rem' }}>
            <label className="field-label">Email (Unique Campus Address)</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. jackie@campus.edu"
              required
              value={newStudentData.email}
              onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })}
            />
          </div>

          <div className="form-field" style={{ marginTop: '1rem' }}>
            <label className="field-label">Department / Major</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Computer Science"
              value={newStudentData.department}
              onChange={(e) => setNewStudentData({ ...newStudentData, department: e.target.value })}
            />
          </div>
        </form>
      </ConfirmModal>
    </div>
  );
};

export default AdminPage;
