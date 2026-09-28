import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, AlertCircle, RefreshCw, Film } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { useStudent } from '../context/StudentContext';
import BookingCard from '../components/BookingCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

export const MyBookingsPage = ({ onToast }) => {
  const { currentStudent } = useStudent();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancellation Modal State
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!currentStudent) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await bookingService.getBookingsByStudentId(currentStudent.id);
      setBookings(data);
    } catch (err) {
      setError(err.message || 'Unable to load reservations.');
    } finally {
      setLoading(false);
    }
  }, [currentStudent]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleOpenCancelModal = (booking) => {
    setSelectedBookingForCancel(booking);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBookingForCancel) return;

    try {
      setCancelLoading(true);
      const res = await bookingService.cancelBooking(selectedBookingForCancel.id);

      setIsCancelModalOpen(false);
      onToast && onToast({
        type: 'success',
        title: 'Booking Cancelled',
        message: res.message || 'Booking cancelled successfully. Your seat has been restored to the show.',
      });

      // Refresh booking list immediately
      await fetchBookings();
    } catch (err) {
      onToast && onToast({
        type: 'error',
        title: 'Cancellation Failed',
        message: err.message || 'Unable to cancel booking.',
      });
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="my-bookings-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">My Tickets &amp; Bookings</h1>
          <p className="page-subtitle">
            {currentStudent ? (
              <>Showing reservations for <strong>{currentStudent.name}</strong> ({currentStudent.email})</>
            ) : (
              <>Please select a student from the top navbar to view reservations.</>
            )}
          </p>
        </div>

        {currentStudent && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchBookings}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spinner-icon' : ''} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {!currentStudent ? (
        <EmptyState
          icon={Ticket}
          title="No Student Selected"
          message="Please select an enrolled student profile from the top-right navbar dropdown."
        />
      ) : loading ? (
        <LoadingSpinner message="Loading your reservations..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchBookings} />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No bookings yet"
          message="You have not booked any auditorium screenings yet. Check out upcoming shows!"
          actionText="Explore Shows"
          onAction={() => window.location.assign('/shows')}
        />
      ) : (
        <div className="bookings-grid">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={handleOpenCancelModal}
            />
          ))}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      <ConfirmModal
        isOpen={isCancelModalOpen}
        title="Cancel Booking"
        onConfirm={handleConfirmCancel}
        onCancel={() => setIsCancelModalOpen(false)}
        confirmText="Cancel Ticket"
        cancelText="Keep Booking"
        confirmVariant="danger"
        isLoading={cancelLoading}
      >
        {selectedBookingForCancel && (
          <div className="cancel-modal-content">
            <p className="modal-warning-text">
              Are you sure you want to cancel your reservation for:
            </p>
            <div className="cancel-summary-box">
              <h4 className="cancel-show-name">{selectedBookingForCancel.showTitle}</h4>
              <p className="cancel-ticket-ref">Ticket Reference: #TK-{String(selectedBookingForCancel.id).padStart(4, '0')}</p>
            </div>
            <p className="cancel-note">
              Once cancelled, this ticket will become invalid and 1 seat will be restored back to the auditorium availability pool.
            </p>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
};

export default MyBookingsPage;
