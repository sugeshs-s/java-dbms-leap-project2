package com.ticketdesk.service;

import com.ticketdesk.dto.BookingRequest;
import com.ticketdesk.dto.ShowRequest;
import com.ticketdesk.dto.StudentRequest;
import com.ticketdesk.entity.Booking;
import com.ticketdesk.entity.BookingStatus;
import com.ticketdesk.entity.Show;
import com.ticketdesk.repository.BookingRepository;
import com.ticketdesk.repository.ShowRepository;
import com.ticketdesk.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
class BookingConcurrencyTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private StudentService studentService;

    @Autowired
    private ShowService showService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ShowRepository showRepository;

    @Autowired
    private StudentRepository studentRepository;

    private Long showId;
    private final List<Long> studentIds = new ArrayList<>();
    private static final int CONCURRENT_USERS = 10;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        showRepository.deleteAll();
        studentRepository.deleteAll();
        studentIds.clear();

        // 1. Create a show with only 1 single available seat
        var showResponse = showService.createShow(ShowRequest.builder()
                .title("Exclusive Premier – Final Seat Concurrency Test")
                .showDate(LocalDate.of(2026, 10, 15))
                .showTime(LocalTime.of(20, 0))
                .totalSeats(1)
                .build());
        showId = showResponse.getId();

        // 2. Create 10 distinct students
        for (int i = 1; i <= CONCURRENT_USERS; i++) {
            var student = studentService.createStudent(StudentRequest.builder()
                    .name("Student " + i)
                    .email("student" + i + "@campus.edu")
                    .department("Engineering")
                    .build());
            studentIds.add(student.getId());
        }
    }

    @Test
    @DisplayName("Rule 10 & Test 13: 10 concurrent students competing for 1 available seat produces exactly 1 booking and 0 overbooking")
    void testConcurrentBookingFinalSeat() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_USERS);
        CountDownLatch readyLatch = new CountDownLatch(CONCURRENT_USERS);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(CONCURRENT_USERS);

        AtomicInteger successfulBookings = new AtomicInteger(0);
        AtomicInteger failedBookings = new AtomicInteger(0);

        for (int i = 0; i < CONCURRENT_USERS; i++) {
            final Long studentId = studentIds.get(i);
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    // Wait for all threads to be ready so they fire simultaneously
                    startLatch.await();
                    bookingService.bookTicket(BookingRequest.builder()
                            .studentId(studentId)
                            .showId(showId)
                            .build());
                    successfulBookings.incrementAndGet();
                } catch (Exception e) {
                    failedBookings.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        // Wait until all threads are queued up
        readyLatch.await(5, TimeUnit.SECONDS);

        // Fire all threads simultaneously
        startLatch.countDown();

        // Wait for all tasks to finish
        boolean completedInTime = doneLatch.await(15, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completedInTime).isTrue();

        // Assertions: Concurrency protection must ensure EXACTLY 1 booking succeeded
        assertThat(successfulBookings.get())
                .as("Only 1 student should successfully book the single available seat")
                .isEqualTo(1);

        assertThat(failedBookings.get())
                .as("Remaining 9 students should fail with concurrency/seat availability conflict")
                .isEqualTo(CONCURRENT_USERS - 1);

        // Verify Show state in database
        Show show = showRepository.findById(showId).orElseThrow();
        assertThat(show.getAvailableSeats())
                .as("Available seats must be exactly 0, never negative")
                .isEqualTo(0);

        // Verify Bookings in database
        List<Booking> bookings = bookingRepository.findByShowId(showId);
        long confirmedCount = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .count();

        assertThat(confirmedCount)
                .as("Total confirmed bookings in DB must equal 1")
                .isEqualTo(1);
    }
}
