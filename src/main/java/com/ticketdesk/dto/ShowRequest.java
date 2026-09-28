package com.ticketdesk.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request body for creating or updating a show")
public class ShowRequest {

    @NotBlank(message = "Title cannot be blank")
    @Schema(description = "Title of the show or movie", example = "Avengers: Endgame")
    private String title;

    @NotNull(message = "Show date is required")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @Schema(description = "Date of the show (YYYY-MM-DD)", example = "2026-10-05")
    private LocalDate showDate;

    @NotNull(message = "Show time is required")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
    @Schema(description = "Time of the show (HH:mm)", example = "18:00")
    private LocalTime showTime;

    @NotNull(message = "Total seats is required")
    @Positive(message = "Total seats must be greater than 0")
    @Schema(description = "Total seating capacity for the show", example = "100")
    private Integer totalSeats;
}
