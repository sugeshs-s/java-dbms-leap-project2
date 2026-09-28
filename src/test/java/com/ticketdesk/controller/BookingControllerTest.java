package com.ticketdesk.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ticketdesk.dto.BookingRequest;
import com.ticketdesk.dto.BookingResponse;
import com.ticketdesk.entity.BookingStatus;
import com.ticketdesk.exception.BookingException;
import com.ticketdesk.exception.DuplicateBookingException;
import com.ticketdesk.exception.GlobalExceptionHandler;
import com.ticketdesk.exception.NoSeatsAvailableException;
import com.ticketdesk.service.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BookingController.class)
@Import(GlobalExceptionHandler.class)
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BookingService bookingService;

    private BookingRequest bookingRequest;
    private BookingResponse bookingResponse;

    @BeforeEach
    void setUp() {
        bookingRequest = BookingRequest.builder()
                .studentId(1L)
                .showId(1L)
                .build();

        bookingResponse = BookingResponse.builder()
                .id(1L)
                .studentId(1L)
                .showId(1L)
                .studentName("Jackie")
                .showTitle("Avengers: Endgame")
                .bookingDate(LocalDateTime.now())
                .status(BookingStatus.CONFIRMED)
                .message("Ticket booked successfully")
                .build();
    }

    @Test
    @DisplayName("POST /api/bookings returns 201 Created on valid booking")
    void testBookTicket_Success() throws Exception {
        when(bookingService.bookTicket(any(BookingRequest.class))).thenReturn(bookingResponse);

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.studentId").value(1))
                .andExpect(jsonPath("$.showId").value(1))
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.message").value("Ticket booked successfully"));
    }

    @Test
    @DisplayName("POST /api/bookings returns 409 Conflict when student has already booked")
    void testBookTicket_DuplicateBooking_Returns409() throws Exception {
        when(bookingService.bookTicket(any(BookingRequest.class)))
                .thenThrow(new DuplicateBookingException("Student has already booked this show"));

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Student has already booked this show"));
    }

    @Test
    @DisplayName("POST /api/bookings returns 409 Conflict when no seats are available")
    void testBookTicket_NoSeatsAvailable_Returns409() throws Exception {
        when(bookingService.bookTicket(any(BookingRequest.class)))
                .thenThrow(new NoSeatsAvailableException("No seats available for this show"));

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("No seats available for this show"));
    }

    @Test
    @DisplayName("GET /api/bookings returns 200 OK")
    void testGetAllBookings() throws Exception {
        when(bookingService.getAllBookings()).thenReturn(List.of(bookingResponse));

        mockMvc.perform(get("/api/bookings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("CONFIRMED"));
    }

    @Test
    @DisplayName("GET /api/bookings/{id} returns 200 OK")
    void testGetBookingById() throws Exception {
        when(bookingService.getBookingById(1L)).thenReturn(bookingResponse);

        mockMvc.perform(get("/api/bookings/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.studentId").value(1));
    }

    @Test
    @DisplayName("DELETE /api/bookings/{id} returns 200 OK on successful cancellation")
    void testCancelBooking_Success() throws Exception {
        BookingResponse cancelledResponse = BookingResponse.builder()
                .id(1L)
                .studentId(1L)
                .showId(1L)
                .status(BookingStatus.CANCELLED)
                .message("Booking cancelled successfully")
                .build();

        when(bookingService.cancelBooking(1L)).thenReturn(cancelledResponse);

        mockMvc.perform(delete("/api/bookings/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.message").value("Booking cancelled successfully"));
    }

    @Test
    @DisplayName("DELETE /api/bookings/{id} returns 400 Bad Request when booking is already cancelled")
    void testCancelBooking_AlreadyCancelled_Returns400() throws Exception {
        when(bookingService.cancelBooking(1L))
                .thenThrow(new BookingException("Booking is already cancelled"));

        mockMvc.perform(delete("/api/bookings/1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Booking is already cancelled"));
    }

    @Test
    @DisplayName("GET /api/students/{id}/bookings returns student bookings")
    void testGetBookingsByStudent() throws Exception {
        when(bookingService.getBookingsByStudentId(1L)).thenReturn(List.of(bookingResponse));

        mockMvc.perform(get("/api/students/1/bookings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("GET /api/shows/{id}/bookings returns show bookings")
    void testGetBookingsByShow() throws Exception {
        when(bookingService.getBookingsByShowId(1L)).thenReturn(List.of(bookingResponse));

        mockMvc.perform(get("/api/shows/1/bookings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}
