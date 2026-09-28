import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Ticket, Film, Calendar, Shield, Menu, X, User } from 'lucide-react';
import { useStudent } from '../context/StudentContext';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { students, currentStudent, selectStudent } = useStudent();

  return (
    <header className="navbar-root">
      <div className="navbar-container">
        {/* Brand */}
        <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          <div className="brand-logo-badge">
            <Ticket size={22} className="brand-logo-icon" />
          </div>
          <div className="brand-text-group">
            <span className="brand-title">TicketDesk</span>
            <span className="brand-subtitle">Campus Cinema</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="navbar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            <Film size={16} />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/shows"
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            <Calendar size={16} />
            <span>Shows</span>
          </NavLink>

          <NavLink
            to="/my-bookings"
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            <Ticket size={16} />
            <span>My Bookings</span>
          </NavLink>

          <NavLink
            to="/admin"
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            <Shield size={16} />
            <span>Admin</span>
          </NavLink>
        </nav>

        {/* Right Section: Student Selector */}
        <div className="navbar-right">
          <div className="student-selector-box">
            <User size={16} className="student-icon" />
            <span className="student-label">Student:</span>
            <select
              className="student-select"
              value={currentStudent ? currentStudent.id : ''}
              onChange={(e) => selectStudent(e.target.value)}
              aria-label="Select student profile"
            >
              {students.length === 0 && <option value="">No Students</option>}
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.department || s.email})
                </option>
              ))}
            </select>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu-drawer">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'mobile-nav-active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Film size={18} />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/shows"
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'mobile-nav-active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Calendar size={18} />
            <span>Shows</span>
          </NavLink>

          <NavLink
            to="/my-bookings"
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'mobile-nav-active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Ticket size={18} />
            <span>My Bookings</span>
          </NavLink>

          <NavLink
            to="/admin"
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'mobile-nav-active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Shield size={18} />
            <span>Admin Dashboard</span>
          </NavLink>

          <div className="mobile-student-select-row">
            <span className="student-label">Active Student:</span>
            <select
              className="student-select full-width"
              value={currentStudent ? currentStudent.id : ''}
              onChange={(e) => {
                selectStudent(e.target.value);
                setMobileMenuOpen(false);
              }}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.department || s.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
