package com.ticketdesk.service.impl;

import com.ticketdesk.dto.ShowRequest;
import com.ticketdesk.dto.ShowResponse;
import com.ticketdesk.entity.Show;
import com.ticketdesk.exception.ResourceNotFoundException;
import com.ticketdesk.repository.ShowRepository;
import com.ticketdesk.service.ShowService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ShowServiceImpl implements ShowService {

    private final ShowRepository showRepository;

    public ShowServiceImpl(ShowRepository showRepository) {
        this.showRepository = showRepository;
    }

    @Override
    @Transactional
    public ShowResponse createShow(ShowRequest request) {
        if (request.getTotalSeats() == null || request.getTotalSeats() <= 0) {
            throw new IllegalArgumentException("Total seats must be greater than 0");
        }

        Show show = Show.builder()
                .title(request.getTitle().trim())
                .showDate(request.getShowDate())
                .showTime(request.getShowTime())
                .totalSeats(request.getTotalSeats())
                .availableSeats(request.getTotalSeats())
                .build();

        Show saved = showRepository.save(show);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShowResponse> getAllShows(LocalDate date, String title, Boolean available) {
        Specification<Show> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (date != null) {
                predicates.add(criteriaBuilder.equal(root.get("showDate"), date));
            }

            if (title != null && !title.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("title")),
                        "%" + title.trim().toLowerCase() + "%"
                ));
            }

            if (available != null) {
                if (available) {
                    predicates.add(criteriaBuilder.greaterThan(root.get("availableSeats"), 0));
                } else {
                    predicates.add(criteriaBuilder.equal(root.get("availableSeats"), 0));
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return showRepository.findAll(spec).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ShowResponse getShowById(Long id) {
        Show show = showRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + id));
        return mapToResponse(show);
    }

    @Override
    @Transactional
    public ShowResponse updateShow(Long id, ShowRequest request) {
        Show show = showRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + id));

        if (request.getTotalSeats() == null || request.getTotalSeats() <= 0) {
            throw new IllegalArgumentException("Total seats must be greater than 0");
        }

        int bookedSeats = show.getTotalSeats() - show.getAvailableSeats();
        if (request.getTotalSeats() < bookedSeats) {
            throw new IllegalArgumentException("Cannot reduce total seats to " + request.getTotalSeats()
                    + " because " + bookedSeats + " seats have already been booked");
        }

        show.setTitle(request.getTitle().trim());
        show.setShowDate(request.getShowDate());
        show.setShowTime(request.getShowTime());
        show.setTotalSeats(request.getTotalSeats());
        show.setAvailableSeats(request.getTotalSeats() - bookedSeats);

        Show updated = showRepository.save(show);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteShow(Long id) {
        if (!showRepository.existsById(id)) {
            throw new ResourceNotFoundException("Show not found with id: " + id);
        }
        showRepository.deleteById(id);
    }

    private ShowResponse mapToResponse(Show show) {
        return ShowResponse.builder()
                .id(show.getId())
                .title(show.getTitle())
                .showDate(show.getShowDate())
                .showTime(show.getShowTime())
                .totalSeats(show.getTotalSeats())
                .availableSeats(show.getAvailableSeats())
                .createdAt(show.getCreatedAt())
                .build();
    }
}
