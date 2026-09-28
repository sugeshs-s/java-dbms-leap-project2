package com.ticketdesk.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ticketdesk.dto.ShowRequest;
import com.ticketdesk.dto.ShowResponse;
import com.ticketdesk.exception.GlobalExceptionHandler;
import com.ticketdesk.exception.ResourceNotFoundException;
import com.ticketdesk.service.ShowService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ShowController.class)
@Import(GlobalExceptionHandler.class)
class ShowControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ShowService showService;

    private ShowResponse showResponse;
    private ShowRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = ShowRequest.builder()
                .title("Avengers: Endgame")
                .showDate(LocalDate.of(2026, 10, 5))
                .showTime(LocalTime.of(18, 0))
                .totalSeats(100)
                .build();

        showResponse = ShowResponse.builder()
                .id(1L)
                .title("Avengers: Endgame")
                .showDate(LocalDate.of(2026, 10, 5))
                .showTime(LocalTime.of(18, 0))
                .totalSeats(100)
                .availableSeats(100)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("POST /api/shows returns 201 Created")
    void testCreateShow_Success() throws Exception {
        when(showService.createShow(any(ShowRequest.class))).thenReturn(showResponse);

        mockMvc.perform(post("/api/shows")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Avengers: Endgame"))
                .andExpect(jsonPath("$.totalSeats").value(100))
                .andExpect(jsonPath("$.availableSeats").value(100));
    }

    @Test
    @DisplayName("POST /api/shows returns 400 Bad Request on invalid input")
    void testCreateShow_ValidationFailure() throws Exception {
        ShowRequest invalid = ShowRequest.builder()
                .title("") // Blank title
                .totalSeats(-5) // Negative seats
                .build();

        mockMvc.perform(post("/api/shows")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Validation failed"));
    }

    @Test
    @DisplayName("GET /api/shows returns 200 OK with list")
    void testGetAllShows() throws Exception {
        when(showService.getAllShows(any(), any(), any())).thenReturn(List.of(showResponse));

        mockMvc.perform(get("/api/shows?title=Avengers&available=true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Avengers: Endgame"));
    }

    @Test
    @DisplayName("GET /api/shows/{id} returns 200 OK")
    void testGetShowById_Success() throws Exception {
        when(showService.getShowById(1L)).thenReturn(showResponse);

        mockMvc.perform(get("/api/shows/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.availableSeats").value(100));
    }

    @Test
    @DisplayName("GET /api/shows/{id} returns 404 Not Found")
    void testGetShowById_NotFound() throws Exception {
        when(showService.getShowById(999L)).thenThrow(new ResourceNotFoundException("Show not found with id: 999"));

        mockMvc.perform(get("/api/shows/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("DELETE /api/shows/{id} returns 204 No Content")
    void testDeleteShow() throws Exception {
        mockMvc.perform(delete("/api/shows/1"))
                .andExpect(status().isNoContent());
    }
}
