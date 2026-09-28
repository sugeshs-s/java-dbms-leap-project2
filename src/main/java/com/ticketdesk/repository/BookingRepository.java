package com.ticketdesk.repository;

import com.ticketdesk.entity.Booking;
import com.ticketdesk.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByStudentId(Long studentId);

    List<Booking> findByShowId(Long showId);

    boolean existsByStudentIdAndShowIdAndStatus(Long studentId, Long showId, BookingStatus status);

    Optional<Booking> findByStudentIdAndShowIdAndStatus(Long studentId, Long showId, BookingStatus status);
}
