import React, { useState, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StudentProvider } from './context/StudentContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ToastNotification from './components/ToastNotification';
import HomePage from './pages/HomePage';
import ShowsPage from './pages/ShowsPage';
import ShowDetailsPage from './pages/ShowDetailsPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminPage from './pages/AdminPage';

export const App = () => {
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const handleToast = useCallback((toastData) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(toastData);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  const handleCloseToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(null);
  }, []);

  return (
    <StudentProvider>
      <Router>
        <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: '1 0 auto' }}>
            <Routes>
              <Route path="/" element={<HomePage onToast={handleToast} />} />
              <Route path="/shows" element={<ShowsPage onToast={handleToast} />} />
              <Route path="/shows/:id" element={<ShowDetailsPage onToast={handleToast} />} />
              <Route path="/my-bookings" element={<MyBookingsPage onToast={handleToast} />} />
              <Route path="/admin" element={<AdminPage onToast={handleToast} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />

          {toast && (
            <div className="toast-fixed-wrapper">
              <ToastNotification toast={toast} onClose={handleCloseToast} />
            </div>
          )}
        </div>
      </Router>
    </StudentProvider>
  );
};

export default App;
