import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, Filter, Film } from 'lucide-react';
import { showService } from '../services/showService';
import { bookingService } from '../services/bookingService';
import { useStudent } from '../context/StudentContext';
import ShowCard from '../components/ShowCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

export const ShowsPage = ({ onToast }) => {
  const { currentStudent } = useStudent();

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTitle, setSearchTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Booking Modal State
  const [selectedShow, setSelectedShow] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchShows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await showService.getAllShows({
        title: searchTitle.trim() || undefined,
        date: selectedDate || undefined,
        available: availableOnly ? 'true' : undefined,
      });
      setShows(data);
    } catch (err) {
      setError(err.message || 'Unable to fetch shows.');
    } finally {
      setLoading(false);
    }
  }, [searchTitle, selectedDate, availableOnly]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShows();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchShows]);

  const handleOpenBooking = (show) => {
    if (!currentStudent) {
      onToast && onToast({
        type: 'warning',
        title: 'Select Student First',
        message: 'Please choose an active student profile from the top-right navbar.',
      });
      return;
    }
    setSelectedShow(show);
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedShow || !currentStudent) return;

    try {
      setBookingLoading(true);
      const res = await bookingService.bookTicket(currentStudent.id, selectedShow.id);

      setIsBookingModalOpen(false);
      onToast && onToast({
        type: 'success',
        title: 'Booking Confirmed!',
        message: `Ticket #${res.id} for "${selectedShow.title}" booked successfully!`,
      });

      // Refresh shows immediately so seat counts decrement on screen
      await fetchShows();
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

  return (
    <div className="shows-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Campus Shows &amp; Screenings</h1>
          <p className="page-subtitle">
            Browse upcoming movie screenings, check real-time availability, and reserve your ticket online.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-panel">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search by title (e.g. Avengers, Interstellar)..."
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
          />
        </div>

        <div className="filter-controls-group">
          <div className="date-filter-wrapper">
            <Calendar size={18} className="filter-icon" />
            <input
              type="date"
              className="form-input date-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              title="Filter by show date"
            />
          </div>

          <label className="checkbox-filter-label">
            <input
              type="checkbox"
              className="filter-checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
            />
            <span>Available Seats Only</span>
          </label>

          {(searchTitle || selectedDate || availableOnly) && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setSearchTitle('');
                setSelectedDate('');
                setAvailableOnly(false);
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Shows Grid or Loading/Error */}
      {loading ? (
        <LoadingSpinner message="Loading scheduled screenings..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchShows} />
      ) : shows.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No shows available"
          message="No scheduled screenings match your filter criteria. Try adjusting your search."
          actionText="Reset Filters"
          onAction={() => {
            setSearchTitle('');
            setSelectedDate('');
            setAvailableOnly(false);
          }}
        />
      ) : (
        <div className="shows-grid">
          {shows.map((show) => (
            <ShowCard key={show.id} show={show} onBookNow={handleOpenBooking} />
          ))}
        </div>
      )}

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
        {selectedShow && (
          <div className="booking-modal-summary">
            <h4 className="modal-show-title">{selectedShow.title}</h4>
            <div className="modal-meta-grid">
              <div className="modal-meta-cell">
                <span className="cell-label">Date:</span>
                <span className="cell-value">{selectedShow.showDate}</span>
              </div>
              <div className="modal-meta-cell">
                <span className="cell-label">Time:</span>
                <span className="cell-value">{selectedShow.showTime}</span>
              </div>
              <div className="modal-meta-cell">
                <span className="cell-label">Available Seats:</span>
                <span className="cell-value text-success font-bold">{selectedShow.availableSeats}</span>
              </div>
              <div className="modal-meta-cell">
                <span className="cell-label">Student:</span>
                <span className="cell-value font-bold">{currentStudent?.name}</span>
              </div>
            </div>
            <p className="modal-notice">
              Are you sure you want to reserve a seat for this screening?
            </p>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
};

export default ShowsPage;
