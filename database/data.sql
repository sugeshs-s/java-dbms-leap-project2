-- ===================================================================
-- TicketDesk Sample Seed Data
-- ===================================================================

USE ticketdesk;

-- Clear previous records if any
DELETE FROM bookings;
DELETE FROM shows;
DELETE FROM students;

-- Reset Auto-Increment
ALTER TABLE bookings AUTO_INCREMENT = 1;
ALTER TABLE shows AUTO_INCREMENT = 1;
ALTER TABLE students AUTO_INCREMENT = 1;

-- ===================================================================
-- Insert Sample Students
-- ===================================================================
INSERT INTO students (name, email, department, created_at) VALUES
('Jackie', 'jackie@campus.edu', 'Computer Science', NOW()),
('Arun', 'arun@campus.edu', 'Mechanical Engineering', NOW()),
('Priya', 'priya@campus.edu', 'Electrical Engineering', NOW());

-- ===================================================================
-- Insert Sample Shows
-- ===================================================================
INSERT INTO shows (title, show_date, show_time, total_seats, available_seats, created_at) VALUES
('Avengers: Endgame', '2026-10-05', '18:00:00', 100, 100, NOW()),
('Interstellar', '2026-10-06', '19:30:00', 80, 80, NOW()),
('Inception', '2026-10-07', '17:00:00', 60, 60, NOW());
