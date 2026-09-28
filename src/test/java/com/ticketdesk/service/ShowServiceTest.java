package com.ticketdesk.service;

import com.ticketdesk.dto.ShowRequest;
import com.ticketdesk.dto.ShowResponse;
import com.ticketdesk.entity.Show;
import com.ticketdesk.exception.ResourceNotFoundException;
import com.ticketdesk.repository.ShowRepository;
import com.ticketdesk.service.impl.ShowServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

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
class ShowServiceTest {

    @Mock
    private ShowRepository showRepository;

    @InjectMocks
    private ShowServiceImpl showService;

    private Show show;
    private ShowRequest showRequest;

    @BeforeEach
    void setUp() {
        show = Show.builder()
                .id(1L)
                .title("Avengers: Endgame")
                .showDate(LocalDate.of(2026, 10, 5))
                .showTime(LocalTime.of(18, 0))
                .totalSeats(100)
                .availableSeats(100)
                .createdAt(LocalDateTime.now())
                .build();

        showRequest = ShowRequest.builder()
                .title("Avengers: Endgame")
                .showDate(LocalDate.of(2026, 10, 5))
                .showTime(LocalTime.of(18, 0))
                .totalSeats(100)
                .build();
    }

    @Test
    @DisplayName("Create show successfully and initialize availableSeats to totalSeats")
    void testCreateShow_Success() {
        when(showRepository.save(any(Show.class))).thenReturn(show);

        ShowResponse response = showService.createShow(showRequest);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getTitle()).isEqualTo("Avengers: Endgame");
        assertThat(response.getTotalSeats()).isEqualTo(100);
        assertThat(response.getAvailableSeats()).isEqualTo(100);
        verify(showRepository).save(any(Show.class));
    }

    @Test
    @DisplayName("Create show fails when totalSeats <= 0")
    void testCreateShow_InvalidSeats_ThrowsException() {
        showRequest.setTotalSeats(0);

        assertThatThrownBy(() -> showService.createShow(showRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("greater than 0");

        verify(showRepository, never()).save(any(Show.class));
    }

    @Test
    @DisplayName("Get show by ID successfully")
    void testGetShowById_Success() {
        when(showRepository.findById(1L)).thenReturn(Optional.of(show));

        ShowResponse response = showService.getShowById(1L);

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Avengers: Endgame");
    }

    @Test
    @DisplayName("Get show by ID throws ResourceNotFoundException when not found")
    void testGetShowById_NotFound() {
        when(showRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> showService.getShowById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Show not found with id: 999");
    }

    @Test
    @DisplayName("Update show successfully")
    void testUpdateShow_Success() {
        when(showRepository.findById(1L)).thenReturn(Optional.of(show));
        when(showRepository.save(any(Show.class))).thenReturn(show);

        ShowRequest updateReq = ShowRequest.builder()
                .title("Avengers: Endgame (IMAX)")
                .showDate(LocalDate.of(2026, 10, 5))
                .showTime(LocalTime.of(19, 0))
                .totalSeats(120)
                .build();

        ShowResponse response = showService.updateShow(1L, updateReq);

        assertThat(response).isNotNull();
        verify(showRepository).save(any(Show.class));
    }

    @Test
    @DisplayName("Update show fails when reducing totalSeats below booked seats")
    void testUpdateShow_CannotReduceBelowBookedCount() {
        show.setTotalSeats(100);
        show.setAvailableSeats(80); // 20 booked
        when(showRepository.findById(1L)).thenReturn(Optional.of(show));

        ShowRequest updateReq = ShowRequest.builder()
                .title("Avengers")
                .showDate(LocalDate.of(2026, 10, 5))
                .showTime(LocalTime.of(18, 0))
                .totalSeats(15) // less than 20 booked
                .build();

        assertThatThrownBy(() -> showService.updateShow(1L, updateReq))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot reduce total seats");

        verify(showRepository, never()).save(any(Show.class));
    }

    @Test
    @DisplayName("Delete show successfully")
    void testDeleteShow_Success() {
        when(showRepository.existsById(1L)).thenReturn(true);
        doNothing().when(showRepository).deleteById(1L);

        showService.deleteShow(1L);

        verify(showRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Delete show throws ResourceNotFoundException when not found")
    void testDeleteShow_NotFound() {
        when(showRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> showService.deleteShow(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Get all shows with specification filter")
    @SuppressWarnings("unchecked")
    void testGetAllShows() {
        when(showRepository.findAll(any(Specification.class))).thenReturn(List.of(show));

        List<ShowResponse> list = showService.getAllShows(LocalDate.of(2026, 10, 5), "Avengers", true);

        assertThat(list).hasSize(1);
        assertThat(list.get(0).getTitle()).isEqualTo("Avengers: Endgame");
    }
}
