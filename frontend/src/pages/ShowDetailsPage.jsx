import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Armchair, ArrowLeft, Ticket, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { showService } from '../services/showService';
import { bookingService } from '../services/bookingService';
import { useStudent } from '../context/StudentContext';
import AvailabilityBadge from '../components/AvailabilityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmModal from '../components/ConfirmModal';

export const ShowDetailsPage = ({ onToast }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentStudent } = useStudent();

  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchShowDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await showService.getShowById(id);
      setShow(data);
    } catch (err) {
      setError(err.message || 'Show not found.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShowDetails();
  }, [fetchShowDetails]);

  const handleOpenBooking = () => {
    if (!currentStudent) {
      onToast && onToast({
        type: 'warning',
        title: 'Select Student First',
        message: 'Please choose an active student profile from the top navbar before booking.',
      });
      return;
    }
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!show || !currentStudent) return;

    try {
      setBookingLoading(true);
      const res = await bookingService.bookTicket(currentStudent.id, show.id);

      setIsBookingModalOpen(false);
      onToast && onToast({
        type: 'success',
        title: 'Booking Confirmed!',
        message: `Ticket #${res.id} booked successfully!`,
      });

      // Refresh show details immediately to reflect decremented seats
      await fetchShowDetails();
    } catch (err) {
      onToast && onToast({
        type: 'error',
        title: 'Booking Failed',
        message: err.message || 'Could not complete reservation.',
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading show details..." />;
  }

  if (error || !show) {
    return (
      <div className="show-details-error">
        <ErrorMessage message={error || 'Show not found'} onRetry={fetchShowDetails} />
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/shows" className="btn btn-secondary">
            <ArrowLeft size={16} />
            <span>Back to All Shows</span>
          </Link>
        </div>
      </div>
    );
  }

  const isSoldOut = show.availableSeats <= 0;
  const percentBooked = show.totalSeats > 0
    ? Math.round(((show.totalSeats - show.availableSeats) / show.totalSeats) * 100)
    : 0;

  return (
    <div className="show-details-page">
      <div className="back-nav-row">
        <Link to="/shows" className="link-action">
          <ArrowLeft size={18} />
          <span>Back to All Shows</span>
        </Link>
      </div>

      <div className="show-details-card">
        {/* Banner Section */}
        <div className="show-details-header">
          <div className="header-meta-group">
            <AvailabilityBadge availableSeats={show.availableSeats} totalSeats={show.totalSeats} />
            <span className="show-id-tag">Screening #{show.id}</span>
          </div>

          <h1 className="show-details-title">{show.title}</h1>

          <div className="show-info-grid">
            <div className="info-cell">
              <Calendar size={20} className="info-icon" />
              <div>
                <span className="info-label">Screening Date</span>
                <span className="info-value">{show.showDate}</span>
              </div>
            </div>

            <div className="info-cell">
              <Clock size={20} className="info-icon" />
              <div>
                <span className="info-label">Start Time</span>
                <span className="info-value">{show.showTime}</span>
              </div>
            </div>

            <div className="info-cell">
              <Armchair size={20} className="info-icon" />
              <div>
                <span className="info-label">Seat Availability</span>
                <span className="info-value">
                  <strong className={isSoldOut ? 'text-error' : 'text-success'}>
                    {show.availableSeats}
                  </strong>{' '}
                  / {show.totalSeats} seats
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Auditorium Seat Meter */}
        <div className="auditorium-capacity-section">
          <div className="capacity-header-row">
            <span className="capacity-title">Auditorium Seating Status</span>
            <span className="capacity-percent">{percentBooked}% Capacity Booked</span>
          </div>
          <div className="capacity-bar-track">
            <div
              className={`capacity-bar-fill ${isSoldOut ? 'bg-danger' : 'bg-primary'}`}
              style={{ width: `${percentBooked}%` }}
            ></div>
          </div>
          <div className="capacity-legend">
            <span>{show.totalSeats - show.availableSeats} seats reserved</span>
            <span>{show.availableSeats} seats remaining</span>
          </div>
        </div>

        {/* Booking Action Box */}
        <div className="booking-cta-box">
          <div className="cta-info">
            <h4>Ready to Attend?</h4>
            <p>
              Tickets are free for all enrolled students. One ticket per student per screening.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-lg"
            disabled={isSoldOut}
            onClick={handleOpenBooking}
          >
            <Ticket size={20} />
            <span>{isSoldOut ? 'SOLD OUT' : 'Book Ticket Now'}</span>
          </button>
        </div>

        <div className="booking-guarantee-note">
          <ShieldCheck size={16} className="note-icon" />
          <span>TicketDesk guarantees real-time concurrency protection. No double bookings.</span>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      <ConfirmModal
        isOpen={isBookingModalOpen}
        title="Confirm Your Booking"
        onConfirm={handleConfirmBooking}
        onCancel={() => setIsBookingModalOpen(false)}
        confirmText="Confirm Booking"
        cancelText="Cancel"
        isLoading={bookingLoading}
      >
        <div className="booking-modal-summary">
          <h4 className="modal-show-title">{show.title}</h4>
          <div className="modal-meta-grid">
            <div className="modal-meta-cell">
              <span className="cell-label">Date:</span>
              <span className="cell-value">{show.showDate}</span>
            </div>
            <div className="modal-meta-cell">
              <span className="cell-label">Time:</span>
              <span className="cell-value">{show.showTime}</span>
            </div>
            <div className="modal-meta-cell">
              <span className="cell-label">Available Seats:</span>
              <span className="cell-value text-success font-bold">{show.availableSeats}</span>
            </div>
            <div className="modal-meta-cell">
              <span className="cell-label">Student:</span>
              <span className="cell-value font-bold">{currentStudent?.name}</span>
            </div>
          </div>
          <p className="modal-notice">
            Are you sure you want to book this ticket for {currentStudent?.name}?
          </p>
        </div>
      </ConfirmModal>
    </div>
  );
};

export default ShowDetailsPage;
