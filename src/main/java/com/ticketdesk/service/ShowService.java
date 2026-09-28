package com.ticketdesk.service;

import com.ticketdesk.dto.ShowRequest;
import com.ticketdesk.dto.ShowResponse;

import java.time.LocalDate;
import java.util.List;

public interface ShowService {

    ShowResponse createShow(ShowRequest request);

    List<ShowResponse> getAllShows(LocalDate date, String title, Boolean available);

    ShowResponse getShowById(Long id);

    ShowResponse updateShow(Long id, ShowRequest request);

    void deleteShow(Long id);
}
