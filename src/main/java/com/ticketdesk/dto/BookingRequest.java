package com.ticketdesk.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request body for booking a ticket")
public class BookingRequest {

    @NotNull(message = "Student ID is required")
    @Schema(description = "ID of the student making the booking", example = "1")
    private Long studentId;

    @NotNull(message = "Show ID is required")
    @Schema(description = "ID of the show being booked", example = "1")
    private Long showId;
}
