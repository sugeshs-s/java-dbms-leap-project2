package com.ticketdesk.service.impl;

import com.ticketdesk.dto.BookingRequest;
import com.ticketdesk.dto.BookingResponse;
import com.ticketdesk.entity.Booking;
import com.ticketdesk.entity.BookingStatus;
import com.ticketdesk.entity.Show;
import com.ticketdesk.entity.Student;
import com.ticketdesk.exception.BookingException;
import com.ticketdesk.exception.DuplicateBookingException;
import com.ticketdesk.exception.NoSeatsAvailableException;
import com.ticketdesk.exception.ResourceNotFoundException;
import com.ticketdesk.repository.BookingRepository;
import com.ticketdesk.repository.ShowRepository;
import com.ticketdesk.repository.StudentRepository;
import com.ticketdesk.service.BookingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final StudentRepository studentRepository;
    private final ShowRepository showRepository;

    public BookingServiceImpl(BookingRepository bookingRepository,
                              StudentRepository studentRepository,
                              ShowRepository showRepository) {
        this.bookingRepository = bookingRepository;
        this.studentRepository = studentRepository;
        this.showRepository = showRepository;
    }

    @Override
    @Transactional
    public BookingResponse bookTicket(BookingRequest request) {
        // Rule 8: Student must exist
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + request.getStudentId()));

        // Rule 8 & 10: Show must exist; fetch with PESSIMISTIC_WRITE lock for concurrency protection
        Show show = showRepository.findByIdWithLock(request.getShowId())
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + request.getShowId()));

        // Rule 2: Prevent duplicate active booking for the same student and show
        boolean alreadyBooked = bookingRepository.existsByStudentIdAndShowIdAndStatus(
                student.getId(),
                show.getId(),
                BookingStatus.CONFIRMED
        );
        if (alreadyBooked) {
            throw new DuplicateBookingException("Student has already booked this show");
        }

        // Rule 1 & Rule 6: Seat availability check
        if (show.getAvailableSeats() <= 0) {
            throw new NoSeatsAvailableException("No seats available for this show");
        }

        // Rule 3: Decrement available seats by 1
        show.setAvailableSeats(show.getAvailableSeats() - 1);
        showRepository.save(show);

        // Create booking
        Booking booking = Booking.builder()
                .student(student)
                .show(show)
                .bookingDate(LocalDateTime.now())
                .status(BookingStatus.CONFIRMED)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        return mapToResponse(savedBooking, "Ticket booked successfully");
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(Long bookingId) {
        // Find booking
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        // Rule 5: Cannot cancel an already cancelled booking
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BookingException("Booking is already cancelled");
        }

        // Rule 10: Lock show row to safely restore seat
        Show show = showRepository.findByIdWithLock(booking.getShow().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + booking.getShow().getId()));

        // Rule 4 & Rule 7: Increase available seats by 1, but do not exceed totalSeats
        if (show.getAvailableSeats() < show.getTotalSeats()) {
            show.setAvailableSeats(show.getAvailableSeats() + 1);
            showRepository.save(show);
        }

        // Mark booking as CANCELLED
        booking.setStatus(BookingStatus.CANCELLED);
        Booking updatedBooking = bookingRepository.save(booking);

        return mapToResponse(updatedBooking, "Booking cancelled successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(b -> mapToResponse(b, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        return mapToResponse(booking, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByStudentId(Long studentId) {
        if (!studentRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student not found with id: " + studentId);
        }
        return bookingRepository.findByStudentId(studentId).stream()
                .map(b -> mapToResponse(b, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByShowId(Long showId) {
        if (!showRepository.existsById(showId)) {
            throw new ResourceNotFoundException("Show not found with id: " + showId);
        }
        return bookingRepository.findByShowId(showId).stream()
                .map(b -> mapToResponse(b, null))
                .collect(Collectors.toList());
    }

    private BookingResponse mapToResponse(Booking booking, String message) {
        return BookingResponse.builder()
                .id(booking.getId())
                .studentId(booking.getStudent().getId())
                .showId(booking.getShow().getId())
                .studentName(booking.getStudent().getName())
                .showTitle(booking.getShow().getTitle())
                .bookingDate(booking.getBookingDate())
                .status(booking.getStatus())
                .message(message)
                .build();
    }
}
