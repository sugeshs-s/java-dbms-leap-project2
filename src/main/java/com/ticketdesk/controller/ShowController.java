package com.ticketdesk.controller;

import com.ticketdesk.dto.ShowRequest;
import com.ticketdesk.dto.ShowResponse;
import com.ticketdesk.service.ShowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/shows")
@Tag(name = "Show Management", description = "APIs for scheduling and managing campus movie/show screenings")
public class ShowController {

    private final ShowService showService;

    public ShowController(ShowService showService) {
        this.showService = showService;
    }

    @PostMapping
    @Operation(summary = "Create a new show", description = "Schedules a new show screening with totalSeats. availableSeats is automatically set to totalSeats.")
    @ApiResponse(responseCode = "201", description = "Show created successfully",
            content = @Content(schema = @Schema(implementation = ShowResponse.class)))
    @ApiResponse(responseCode = "400", description = "Validation failed or invalid seat count")
    public ResponseEntity<ShowResponse> createShow(@Valid @RequestBody ShowRequest request) {
        ShowResponse response = showService.createShow(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Get all shows", description = "Retrieves all shows with optional filtering by date, title, and seat availability.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved shows list")
    public ResponseEntity<List<ShowResponse>> getAllShows(
            @Parameter(description = "Filter shows on a specific date (YYYY-MM-DD)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,

            @Parameter(description = "Filter shows matching a title keyword")
            @RequestParam(required = false) String title,

            @Parameter(description = "Filter shows by availability (true = has seats, false = sold out)")
            @RequestParam(required = false) Boolean available
    ) {
        List<ShowResponse> shows = showService.getAllShows(date, title, available);
        return ResponseEntity.ok(shows);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get show by ID", description = "Retrieves show details, including total and remaining available seats.")
    @ApiResponse(responseCode = "200", description = "Show found")
    @ApiResponse(responseCode = "404", description = "Show not found")
    public ResponseEntity<ShowResponse> getShowById(@PathVariable Long id) {
        ShowResponse show = showService.getShowById(id);
        return ResponseEntity.ok(show);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update show details", description = "Updates title, date, time, and seat capacity of a show.")
    @ApiResponse(responseCode = "200", description = "Show updated successfully")
    @ApiResponse(responseCode = "400", description = "Validation failed")
    @ApiResponse(responseCode = "404", description = "Show not found")
    public ResponseEntity<ShowResponse> updateShow(@PathVariable Long id, @Valid @RequestBody ShowRequest request) {
        ShowResponse updated = showService.updateShow(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete show", description = "Deletes a show screening by ID.")
    @ApiResponse(responseCode = "204", description = "Show deleted successfully")
    @ApiResponse(responseCode = "404", description = "Show not found")
    public ResponseEntity<Void> deleteShow(@PathVariable Long id) {
        showService.deleteShow(id);
        return ResponseEntity.noContent().build();
    }
}
