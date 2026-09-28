import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Armchair, Ticket, ArrowRight, Sparkles } from 'lucide-react';
import { showService } from '../services/showService';
import { bookingService } from '../services/bookingService';
import { useStudent } from '../context/StudentContext';
import ShowCard from '../components/ShowCard';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmModal from '../components/ConfirmModal';

export const HomePage = ({ onToast }) => {
  const navigate = useNavigate();
  const { currentStudent } = useStudent();

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Statistics
  const [stats, setStats] = useState({
    totalShows: 0,
    availableSeats: 0,
    myBookings: 0,
  });

  // Booking Modal State
  const [selectedShow, setSelectedShow] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all shows
      const showsData = await showService.getAllShows();
      setShows(showsData);

      // Calculate total available seats across all shows
      const totalAvailable = showsData.reduce((acc, s) => acc + (s.availableSeats || 0), 0);

      // Load bookings for current student if available
      let myBookingsCount = 0;
      if (currentStudent) {
        try {
          const studentBookings = await bookingService.getBookingsByStudentId(currentStudent.id);
          myBookingsCount = studentBookings.filter((b) => b.status === 'CONFIRMED').length;
        } catch {
          // If student has no bookings yet, keep 0
        }
      }

      setStats({
        totalShows: showsData.length,
        availableSeats: totalAvailable,
        myBookings: myBookingsCount,
      });
    } catch (err) {
      setError(err.message || 'Failed to load campus shows.');
    } finally {
      setLoading(false);
    }
  }, [currentStudent]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open booking confirmation modal
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

  // Confirm booking API execution
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

      // Refresh data to reflect immediate seat count decrement
      await loadData();
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
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-banner">
        <div className="hero-container">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Auditorium Ticketing Live</span>
          </div>

          <h1 className="hero-heading">
            Your Campus. Your Shows. <span className="highlight-text">Your Seat.</span>
          </h1>

          <p className="hero-description">
            Discover upcoming campus screenings, check seat availability, and book your ticket instantly with guaranteed zero-overbooking.
          </p>

          <div className="hero-cta-group">
            <Link to="/shows" className="btn btn-primary btn-lg">
              <span>Explore Shows</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/my-bookings" className="btn btn-secondary btn-lg">
              <span>My Bookings</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Real-time Statistics Section */}
      <section className="stats-section">
        <div className="section-container">
          <div className="stats-grid">
            <StatCard
              icon={Film}
              title="Total Shows"
              value={stats.totalShows}
              colorClass="accent-blue"
            />
            <StatCard
              icon={Armchair}
              title="Available Seats"
              value={stats.availableSeats}
              colorClass="accent-green"
            />
            <StatCard
              icon={Ticket}
              title="My Bookings"
              value={stats.myBookings}
              colorClass="accent-purple"
            />
          </div>
        </div>
      </section>

      {/* Upcoming Shows Preview */}
      <section className="upcoming-shows-section">
        <div className="section-container">
          <div className="section-header-row">
            <div>
              <h2 className="section-heading">Upcoming Shows</h2>
              <p className="section-subheading">Catch the latest movies and cultural screenings at the auditorium</p>
            </div>
            <Link to="/shows" className="link-action">
              <span>View All Shows</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading upcoming shows..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={loadData} />
          ) : shows.length === 0 ? (
            <div className="empty-state-box">
              <Film size={40} className="empty-icon text-muted" />
              <h3>No shows available</h3>
              <p>There are no scheduled screenings right now. Check back soon!</p>
            </div>
          ) : (
            <div className="shows-grid">
              {shows.slice(0, 3).map((show) => (
                <ShowCard key={show.id} show={show} onBookNow={handleOpenBooking} />
              ))}
            </div>
          )}
        </div>
      </section>

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
              Are you sure you want to reserve an auditorium seat for this screening?
            </p>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
};

export default HomePage;
