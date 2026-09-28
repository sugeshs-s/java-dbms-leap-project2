import React from 'react';
import { Calendar, Clock, Ticket, AlertCircle } from 'lucide-react';

export const BookingCard = ({ booking, onCancel }) => {
  const { id, showTitle, bookingDate, status, studentName } = booking;
  const isConfirmed = status === 'CONFIRMED';

  const formatDateTime = (dtStr) => {
    if (!dtStr) return '-';
    const d = new Date(dtStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className={`booking-card ${!isConfirmed ? 'booking-cancelled' : ''}`}>
      <div className="booking-card-header">
        <div className="booking-ticket-ref">
          <Ticket size={18} className="ticket-icon" />
          <span className="ticket-number">#TK-{String(id).padStart(4, '0')}</span>
        </div>
        <span className={`status-pill ${isConfirmed ? 'status-confirmed' : 'status-cancelled'}`}>
          <span className={`status-dot ${isConfirmed ? 'dot-green' : 'dot-gray'}`}></span>
          {status}
        </span>
      </div>

      <div className="booking-card-body">
        <h4 className="booking-show-title">{showTitle || 'Campus Screening'}</h4>
        {studentName && (
          <p className="booking-student-name">
            Booked for: <strong>{studentName}</strong>
          </p>
        )}

        <div className="booking-meta-row">
          <div className="booking-meta-item">
            <Clock size={15} className="meta-icon" />
            <span>Booked on: {formatDateTime(bookingDate)}</span>
          </div>
        </div>
      </div>

      <div className="booking-card-footer">
        {isConfirmed ? (
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => onCancel && onCancel(booking)}
          >
            Cancel Booking
          </button>
        ) : (
          <span className="cancelled-note">
            <AlertCircle size={14} className="inline-icon" />
            Seat restored to show
          </span>
        )}
      </div>
    </div>
  );
};

export default BookingCard;
