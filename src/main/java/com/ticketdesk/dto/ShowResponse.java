package com.ticketdesk.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Response containing show details")
public class ShowResponse {

    @Schema(description = "Unique show ID", example = "1")
    private Long id;

    @Schema(description = "Title of the show or movie", example = "Avengers: Endgame")
    private String title;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @Schema(description = "Date of the show", example = "2026-10-05")
    private LocalDate showDate;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
    @Schema(description = "Time of the show", example = "18:00")
    private LocalTime showTime;

    @Schema(description = "Total seats configured for the show", example = "100")
    private Integer totalSeats;

    @Schema(description = "Currently available seats remaining", example = "99")
    private Integer availableSeats;

    @Schema(description = "Date and time when the show was created")
    private LocalDateTime createdAt;
}
