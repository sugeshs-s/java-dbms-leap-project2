import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Armchair, Ticket } from 'lucide-react';
import AvailabilityBadge from './AvailabilityBadge';

export const ShowCard = ({ show, onBookNow }) => {
  const { id, title, showDate, showTime, totalSeats, availableSeats } = show;

  // Format date: e.g. Oct 5, 2026
  const formatDate = (dStr) => {
    if (!dStr) return '';
    const d = new Date(dStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time: e.g. 6:00 PM
  const formatTime = (tStr) => {
    if (!tStr) return '';
    const parts = tStr.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  const isSoldOut = availableSeats <= 0;
  const bookedCount = totalSeats - availableSeats;
  const percentAvailable = totalSeats > 0 ? Math.round((availableSeats / totalSeats) * 100) : 0;

  // Color bar progress
  let progressColor = 'progress-high';
  if (percentAvailable <= 15 || isSoldOut) {
    progressColor = 'progress-low';
  } else if (percentAvailable <= 35) {
    progressColor = 'progress-medium';
  }

  return (
    <div className="show-card">
      <div className="show-card-banner">
        <div className="banner-icon-wrapper">
          <Ticket size={28} className="banner-icon" />
        </div>
        <div className="show-card-badge">
          <AvailabilityBadge availableSeats={availableSeats} totalSeats={totalSeats} />
        </div>
      </div>

      <div className="show-card-content">
        <h3 className="show-title" title={title}>
          {title}
        </h3>

        <div className="show-meta-row">
          <div className="show-meta-item">
            <Calendar size={16} className="meta-icon" />
            <span>{formatDate(showDate)}</span>
          </div>
          <div className="show-meta-item">
            <Clock size={16} className="meta-icon" />
            <span>{formatTime(showTime)}</span>
          </div>
        </div>

        <div className="seat-progress-section">
          <div className="seat-progress-labels">
            <span className="seat-progress-text">
              <Armchair size={15} className="inline-icon" />
              Available Seats:
            </span>
            <span className="seat-progress-count">
              <strong>{availableSeats}</strong> / {totalSeats}
            </span>
          </div>

          <div className="progress-bar-track">
            <div
              className={`progress-bar-fill ${progressColor}`}
              style={{ width: `${percentAvailable}%` }}
              role="progressbar"
              aria-valuenow={availableSeats}
              aria-valuemin="0"
              aria-valuemax={totalSeats}
            ></div>
          </div>
        </div>

        <div className="show-card-actions">
          <Link to={`/shows/${id}`} className="btn btn-secondary btn-sm flex-1">
            View Details
          </Link>
          <button
            type="button"
            className="btn btn-primary btn-sm flex-1"
            disabled={isSoldOut}
            onClick={() => onBookNow && onBookNow(show)}
          >
            {isSoldOut ? 'Sold Out' : 'Book Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShowCard;
