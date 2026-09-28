package com.ticketdesk.service;

import com.ticketdesk.dto.BookingRequest;
import com.ticketdesk.dto.BookingResponse;
import com.ticketdesk.dto.ShowRequest;
import com.ticketdesk.dto.StudentRequest;
import com.ticketdesk.entity.BookingStatus;
import com.ticketdesk.entity.Show;
import com.ticketdesk.exception.BookingException;
import com.ticketdesk.exception.DuplicateBookingException;
import com.ticketdesk.exception.NoSeatsAvailableException;
import com.ticketdesk.repository.BookingRepository;
import com.ticketdesk.repository.ShowRepository;
import com.ticketdesk.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
class BookingIntegrationTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private StudentService studentService;

    @Autowired
    private ShowService showService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ShowRepository showRepository;

    @Autowired
    private StudentRepository studentRepository;

    private Long studentId1;
    private Long studentId2;
    private Long showId;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        showRepository.deleteAll();
        studentRepository.deleteAll();

        // Create student 1
        var s1 = studentService.createStudent(StudentRequest.builder()
                .name("Jackie")
                .email("jackie@campus.edu")
                .department("Computer Science")
                .build());
        studentId1 = s1.getId();

        // Create student 2
        var s2 = studentService.createStudent(StudentRequest.builder()
                .name("Arun")
                .email("arun@campus.edu")
                .department("Mechanical Engineering")
                .build());
        studentId2 = s2.getId();

        // Create show with 2 seats
        var sh = showService.createShow(ShowRequest.builder()
                .title("Interstellar")
                .showDate(LocalDate.of(2026, 10, 10))
                .showTime(LocalTime.of(19, 0))
                .totalSeats(2)
                .build());
        showId = sh.getId();
    }

    @Test
    @DisplayName("End-to-End lifecycle: Booking -> Seat Decrement -> Duplicate Prevention -> Cancellation -> Seat Increment")
    void testBookingLifecycle() {
        // Initial state: 2 seats available
        Show initialShow = showRepository.findById(showId).orElseThrow();
        assertThat(initialShow.getAvailableSeats()).isEqualTo(2);

        // Step 1: Student 1 books a ticket
        BookingResponse booking1 = bookingService.bookTicket(BookingRequest.builder()
                .studentId(studentId1)
                .showId(showId)
                .build());

        assertThat(booking1).isNotNull();
        assertThat(booking1.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(booking1.getMessage()).isEqualTo("Ticket booked successfully");

        // Step 2: Verify available seats decreased to 1
        Show showAfterBooking1 = showRepository.findById(showId).orElseThrow();
        assertThat(showAfterBooking1.getAvailableSeats()).isEqualTo(1);

        // Step 3: Student 1 tries duplicate booking -> Must fail with DuplicateBookingException
        assertThatThrownBy(() -> bookingService.bookTicket(BookingRequest.builder()
                .studentId(studentId1)
                .showId(showId)
                .build()))
                .isInstanceOf(DuplicateBookingException.class)
                .hasMessage("Student has already booked this show");

        // Step 4: Student 2 books the final seat
        BookingResponse booking2 = bookingService.bookTicket(BookingRequest.builder()
                .studentId(studentId2)
                .showId(showId)
                .build());
        assertThat(booking2.getStatus()).isEqualTo(BookingStatus.CONFIRMED);

        // Available seats now 0
        Show showSoldOut = showRepository.findById(showId).orElseThrow();
        assertThat(showSoldOut.getAvailableSeats()).isEqualTo(0);

        // Step 5: A 3rd student tries to book when seats = 0 -> Must fail with NoSeatsAvailableException
        var s3 = studentService.createStudent(StudentRequest.builder()
                .name("Priya")
                .email("priya@campus.edu")
                .department("Electrical Engineering")
                .build());

        assertThatThrownBy(() -> bookingService.bookTicket(BookingRequest.builder()
                .studentId(s3.getId())
                .showId(showId)
                .build()))
                .isInstanceOf(NoSeatsAvailableException.class)
                .hasMessage("No seats available for this show");

        // Step 6: Student 1 cancels their booking
        BookingResponse cancelledBooking = bookingService.cancelBooking(booking1.getId());
        assertThat(cancelledBooking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        assertThat(cancelledBooking.getMessage()).isEqualTo("Booking cancelled successfully");

        // Available seats restored to 1
        Show showAfterCancel = showRepository.findById(showId).orElseThrow();
        assertThat(showAfterCancel.getAvailableSeats()).isEqualTo(1);

        // Step 7: Cancelling already cancelled booking fails
        assertThatThrownBy(() -> bookingService.cancelBooking(booking1.getId()))
                .isInstanceOf(BookingException.class)
                .hasMessage("Booking is already cancelled");

        // Step 8: Now Student 3 can book the newly freed seat!
        BookingResponse booking3 = bookingService.bookTicket(BookingRequest.builder()
                .studentId(s3.getId())
                .showId(showId)
                .build());
        assertThat(booking3.getStatus()).isEqualTo(BookingStatus.CONFIRMED);

        Show showFinal = showRepository.findById(showId).orElseThrow();
        assertThat(showFinal.getAvailableSeats()).isEqualTo(0);
    }
}
