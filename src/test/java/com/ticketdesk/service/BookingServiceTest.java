package com.ticketdesk.service;

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
import com.ticketdesk.service.impl.BookingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private ShowRepository showRepository;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private Student student;
    private Show show;
    private Booking booking;
    private BookingRequest bookingRequest;

    @BeforeEach
    void setUp() {
        student = Student.builder()
                .id(1L)
                .name("Jackie")
                .email("jackie@campus.edu")
                .department("Computer Science")
                .build();

        show = Show.builder()
                .id(1L)
                .title("Avengers: Endgame")
                .showDate(LocalDate.of(2026, 10, 5))
                .showTime(LocalTime.of(18, 0))
                .totalSeats(100)
                .availableSeats(100)
                .build();

        booking = Booking.builder()
                .id(1L)
                .student(student)
                .show(show)
                .bookingDate(LocalDateTime.now())
                .status(BookingStatus.CONFIRMED)
                .build();

        bookingRequest = BookingRequest.builder()
                .studentId(1L)
                .showId(1L)
                .build();
    }

    @Test
    @DisplayName("Rule 3: Book available seat successfully and decrease available seats by 1")
    void testBookTicket_Success() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(showRepository.findByIdWithLock(1L)).thenReturn(Optional.of(show));
        when(bookingRepository.existsByStudentIdAndShowIdAndStatus(1L, 1L, BookingStatus.CONFIRMED)).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        BookingResponse response = bookingService.bookTicket(bookingRequest);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(response.getMessage()).isEqualTo("Ticket booked successfully");
        assertThat(show.getAvailableSeats()).isEqualTo(99); // Rule 3: decreased from 100 to 99

        verify(showRepository).save(show);
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    @DisplayName("Rule 8: Booking fails when student not found")
    void testBookTicket_StudentNotFound() {
        when(studentRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.bookTicket(bookingRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Student not found with id: 1");

        verify(showRepository, never()).findByIdWithLock(anyLong());
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    @DisplayName("Rule 8: Booking fails when show not found")
    void testBookTicket_ShowNotFound() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(showRepository.findByIdWithLock(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.bookTicket(bookingRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Show not found with id: 1");

        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    @DisplayName("Rule 2: Booking fails when active booking already exists for student and show")
    void testBookTicket_DuplicateBooking() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(showRepository.findByIdWithLock(1L)).thenReturn(Optional.of(show));
        when(bookingRepository.existsByStudentIdAndShowIdAndStatus(1L, 1L, BookingStatus.CONFIRMED)).thenReturn(true);

        assertThatThrownBy(() -> bookingService.bookTicket(bookingRequest))
                .isInstanceOf(DuplicateBookingException.class)
                .hasMessage("Student has already booked this show");

        verify(bookingRepository, never()).save(any(Booking.class));
        assertThat(show.getAvailableSeats()).isEqualTo(100);
    }

    @Test
    @DisplayName("Rule 1: Booking fails when no seats are available")
    void testBookTicket_NoSeatsAvailable() {
        show.setAvailableSeats(0);
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(showRepository.findByIdWithLock(1L)).thenReturn(Optional.of(show));
        when(bookingRepository.existsByStudentIdAndShowIdAndStatus(1L, 1L, BookingStatus.CONFIRMED)).thenReturn(false);

        assertThatThrownBy(() -> bookingService.bookTicket(bookingRequest))
                .isInstanceOf(NoSeatsAvailableException.class)
                .hasMessage("No seats available for this show");

        verify(bookingRepository, never()).save(any(Booking.class));
        assertThat(show.getAvailableSeats()).isEqualTo(0);
    }

    @Test
    @DisplayName("Rule 4 & 7: Cancel booking successfully and increase available seats by 1")
    void testCancelBooking_Success() {
        show.setAvailableSeats(99);
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(showRepository.findByIdWithLock(1L)).thenReturn(Optional.of(show));
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        BookingResponse response = bookingService.cancelBooking(1L);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        assertThat(response.getMessage()).isEqualTo("Booking cancelled successfully");
        assertThat(show.getAvailableSeats()).isEqualTo(100); // Rule 4: restored to 100

        verify(showRepository).save(show);
        verify(bookingRepository).save(booking);
    }

    @Test
    @DisplayName("Rule 5: Cancelling an already cancelled booking fails")
    void testCancelBooking_AlreadyCancelled_ThrowsException() {
        booking.setStatus(BookingStatus.CANCELLED);
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.cancelBooking(1L))
                .isInstanceOf(BookingException.class)
                .hasMessage("Booking is already cancelled");

        verify(showRepository, never()).findByIdWithLock(anyLong());
        verify(bookingRepository, never()).save(booking);
    }

    @Test
    @DisplayName("Cancel booking throws ResourceNotFoundException when booking does not exist")
    void testCancelBooking_NotFound() {
        when(bookingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.cancelBooking(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Booking not found with id: 999");
    }

    @Test
    @DisplayName("Get all bookings returns list")
    void testGetAllBookings() {
        when(bookingRepository.findAll()).thenReturn(List.of(booking));

        List<BookingResponse> list = bookingService.getAllBookings();

        assertThat(list).hasSize(1);
        assertThat(list.get(0).getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Get bookings by student ID returns student bookings")
    void testGetBookingsByStudentId() {
        when(studentRepository.existsById(1L)).thenReturn(true);
        when(bookingRepository.findByStudentId(1L)).thenReturn(List.of(booking));

        List<BookingResponse> list = bookingService.getBookingsByStudentId(1L);

        assertThat(list).hasSize(1);
        assertThat(list.get(0).getStudentId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Get bookings by show ID returns show bookings")
    void testGetBookingsByShowId() {
        when(showRepository.existsById(1L)).thenReturn(true);
        when(bookingRepository.findByShowId(1L)).thenReturn(List.of(booking));

        List<BookingResponse> list = bookingService.getBookingsByShowId(1L);

        assertThat(list).hasSize(1);
        assertThat(list.get(0).getShowId()).isEqualTo(1L);
    }
}
