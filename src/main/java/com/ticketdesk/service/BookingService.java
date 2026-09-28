package com.ticketdesk.service;

import com.ticketdesk.dto.BookingRequest;
import com.ticketdesk.dto.BookingResponse;

import java.util.List;

public interface BookingService {

    BookingResponse bookTicket(BookingRequest request);

    BookingResponse cancelBooking(Long bookingId);

    List<BookingResponse> getAllBookings();

    BookingResponse getBookingById(Long id);

    List<BookingResponse> getBookingsByStudentId(Long studentId);

    List<BookingResponse> getBookingsByShowId(Long showId);
}
