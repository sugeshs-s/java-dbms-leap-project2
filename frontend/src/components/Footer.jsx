import React from 'react';
import { Ticket, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="footer-root">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand-logo-badge small">
              <Ticket size={18} className="brand-logo-icon" />
            </div>
            <span className="brand-title">TicketDesk</span>
          </div>
          <p className="footer-tagline">
            "Your Campus. Your Shows. Your Seat." — Real-time auditorium reservation platform.
          </p>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            &copy; {new Date().getFullYear()} TicketDesk Campus Ticketing System. All rights reserved.
          </p>
          <div className="footer-links">
            <a href="http://localhost:8080/swagger-ui.html" target="_blank" rel="noreferrer" className="footer-link">
              Swagger API Docs
            </a>
            <span className="footer-sep">•</span>
            <span className="footer-text">Built with Spring Boot 3 &amp; React</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
