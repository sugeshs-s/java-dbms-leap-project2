package com.ticketdesk.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.ticketdesk.entity.BookingStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Response containing booking details and confirmation status")
public class BookingResponse {

    @Schema(description = "Unique booking ID", example = "1")
    private Long id;

    @Schema(description = "ID of the student", example = "1")
    private Long studentId;

    @Schema(description = "ID of the show", example = "1")
    private Long showId;

    @Schema(description = "Name of the student", example = "Jackie")
    private String studentName;

    @Schema(description = "Title of the show", example = "Avengers: Endgame")
    private String showTitle;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Schema(description = "Date and time when the booking was made", example = "2026-09-28T10:30:00")
    private LocalDateTime bookingDate;

    @Schema(description = "Current booking status", example = "CONFIRMED")
    private BookingStatus status;

    @Schema(description = "Status or outcome message", example = "Ticket booked successfully")
    private String message;
}
