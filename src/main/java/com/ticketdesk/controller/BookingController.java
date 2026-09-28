package com.ticketdesk.controller;

import com.ticketdesk.dto.BookingRequest;
import com.ticketdesk.dto.BookingResponse;
import com.ticketdesk.dto.ErrorResponse;
import com.ticketdesk.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Booking Management", description = "APIs for booking tickets, canceling bookings, and tracking reservations")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/bookings")
    @Operation(summary = "Book a ticket for a show", description = "Reserves an available seat for a student. Enforces single-booking per student and concurrency protection.")
    @ApiResponse(responseCode = "201", description = "Ticket booked successfully",
            content = @Content(schema = @Schema(implementation = BookingResponse.class)))
    @ApiResponse(responseCode = "400", description = "Invalid request payload")
    @ApiResponse(responseCode = "404", description = "Student or Show not found")
    @ApiResponse(responseCode = "409", description = "Conflict - No seats available OR Student has already booked this show",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    public ResponseEntity<BookingResponse> bookTicket(@Valid @RequestBody BookingRequest request) {
        BookingResponse response = bookingService.bookTicket(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/bookings")
    @Operation(summary = "Get all bookings", description = "Retrieves all bookings made across all shows.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved bookings")
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        List<BookingResponse> bookings = bookingService.getAllBookings();
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/bookings/{id}")
    @Operation(summary = "Get booking by ID", description = "Retrieves detailed information about a specific booking.")
    @ApiResponse(responseCode = "200", description = "Booking found")
    @ApiResponse(responseCode = "404", description = "Booking not found")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable Long id) {
        BookingResponse booking = bookingService.getBookingById(id);
        return ResponseEntity.ok(booking);
    }

    @DeleteMapping("/bookings/{id}")
    @Operation(summary = "Cancel a booking", description = "Cancels an active booking and restores 1 available seat back to the show.")
    @ApiResponse(responseCode = "200", description = "Booking cancelled successfully",
            content = @Content(schema = @Schema(implementation = BookingResponse.class)))
    @ApiResponse(responseCode = "400", description = "Booking is already cancelled")
    @ApiResponse(responseCode = "404", description = "Booking not found")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable Long id) {
        BookingResponse cancelled = bookingService.cancelBooking(id);
        return ResponseEntity.ok(cancelled);
    }

    @GetMapping("/students/{studentId}/bookings")
    @Operation(summary = "Get all bookings for a student", description = "Retrieves all bookings (active and cancelled) for a specific student.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved student bookings")
    @ApiResponse(responseCode = "404", description = "Student not found")
    public ResponseEntity<List<BookingResponse>> getBookingsByStudentId(@PathVariable Long studentId) {
        List<BookingResponse> bookings = bookingService.getBookingsByStudentId(studentId);
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/shows/{showId}/bookings")
    @Operation(summary = "Get all bookings for a show", description = "Retrieves all bookings associated with a specific show screening.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved show bookings")
    @ApiResponse(responseCode = "404", description = "Show not found")
    public ResponseEntity<List<BookingResponse>> getBookingsByShowId(@PathVariable Long showId) {
        List<BookingResponse> bookings = bookingService.getBookingsByShowId(showId);
        return ResponseEntity.ok(bookings);
    }
}
