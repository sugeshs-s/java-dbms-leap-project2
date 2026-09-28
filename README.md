# TicketDesk – Campus Movie/Show Ticket Booking System

A production-style, high-concurrency RESTful API built with **Java 17**, **Spring Boot 3.x**, **Spring Data JPA / Hibernate**, and **MySQL 8+** for managing auditorium movie and show ticket bookings on a college campus.

---

## 1. Project Title
**TicketDesk – Campus Movie/Show Ticket Booking System**

---

## 2. Project Description
TicketDesk provides an automated online booking platform for college auditoriums and campus event organizers. It eliminates physical queues at counter booths, provides real-time visibility into show dates, timings, total capacity, and available seats, and ensures strict concurrency control to prevent overbooking when multiple students attempt to reserve the final seats simultaneously.

---

## 3. Problem Statement
Campus movie and cultural screenings previously relied on manual counter ticketing:
- Long lines and congestion before showtimes.
- No real-time seat availability updates for students.
- High risk of double booking or exceeding auditorium capacity.
- Lack of an automated cancellation mechanism to restore seats back to the pool.
- Race conditions during high-demand screenings when the last remaining seats are contested.

---

## 4. Key Features
- **Student Profile Management**: Register students with campus email uniqueness verification, update details, and view booking history.
- **Auditorium Show Scheduling**: Add and update movie/show schedules with positive seat capacity. Initial `availableSeats` are automatically set to `totalSeats`.
- **Search & Filtering**: Filter shows dynamically by date, movie title (case-insensitive substring match), or seat availability (e.g. `available=true`).
- **Ticket Booking Engine**: Real-time seat allocation enforcing strict validation (active show existence, remaining seats check, single-booking policy).
- **Zero Overbooking Guarantee**: Pessimistic write locking (`SELECT ... FOR UPDATE`) guarantees serializable seat decrement even under heavy concurrent loads.
- **Duplicate Booking Prevention**: Restricts students from holding multiple active bookings for the same screening at both the database level (indexing) and service layer.
- **Cancellation & Seat Recovery**: Students can cancel active reservations, which automatically increments `availableSeats` back into the pool while preventing redundant cancellations.
- **Interactive API Documentation**: OpenAPI 3 / Swagger UI embedded for live interactive testing and contract exploration.
- **Production-Ready Exception Handling**: Consistent JSON error structures with HTTP 400, 404, 409, and 500 status codes.

---

## 5. Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Language** | Java 17 (or Java 21) | LTS Release |
| **Framework** | Spring Boot 3.3.x | `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-validation` |
| **ORM & Persistence** | Hibernate 6.x / Spring Data JPA | JPQL, Criteria Specification, Pessimistic Locking |
| **Database** | MySQL 8.0+ | InnoDB Engine, Foreign Keys, Unique & Check Constraints |
| **API Documentation** | SpringDoc OpenAPI 2.6.x | Swagger UI 3.0 specification |
| **Testing** | JUnit 5 & Mockito | MockMvc, Slice Tests, Multi-Threaded Concurrency Tests |
| **Test Database** | H2 Database (In-Memory) | MySQL compatibility mode for self-contained automated builds |
| **Build Tool** | Apache Maven 3.9+ | Standard Maven layout and plugins |
| **Productivity** | Lombok | Boilerplate reduction with explicit constructor support |

---

## 6. Architecture & Package Structure

The system strictly follows a clean layered architecture with constructor injection:

```
src/main/java/com/ticketdesk/
│
├── config/
│   └── OpenApiConfig.java              # Swagger / OpenAPI documentation beans
│
├── controller/
│   ├── StudentController.java          # Student REST endpoints (/api/students)
│   ├── ShowController.java             # Show REST endpoints (/api/shows)
│   └── BookingController.java          # Booking REST endpoints (/api/bookings)
│
├── service/
│   ├── StudentService.java             # Student service interface
│   ├── ShowService.java                # Show service interface
│   ├── BookingService.java             # Booking service interface
│   └── impl/
│       ├── StudentServiceImpl.java     # Student business logic & validation
│       ├── ShowServiceImpl.java        # Show filtering & capacity management
│       └── BookingServiceImpl.java     # Transactional booking & concurrency locking
│
├── repository/
│   ├── StudentRepository.java          # Student JPA repository
│   ├── ShowRepository.java             # Show JPA repository with Pessimistic Lock
│   └── BookingRepository.java          # Booking JPA repository
│
├── entity/
│   ├── Student.java                    # Student JPA entity
│   ├── Show.java                       # Show JPA entity (table: "shows")
│   ├── Booking.java                    # Booking JPA entity
│   └── BookingStatus.java              # Enum: CONFIRMED, CANCELLED
│
├── dto/
│   ├── StudentRequest.java             # Create/Update student payload
│   ├── StudentResponse.java            # Student response representation
│   ├── ShowRequest.java                # Create/Update show payload
│   ├── ShowResponse.java               # Show response representation
│   ├── BookingRequest.java             # Booking payload (studentId, showId)
│   ├── BookingResponse.java            # Booking response with confirmation message
│   └── ErrorResponse.java              # Standardized API error response
│
├── exception/
│   ├── ResourceNotFoundException.java  # HTTP 404 (Entity not found)
│   ├── BookingException.java           # HTTP 400 (Invalid booking actions)
│   ├── DuplicateBookingException.java  # HTTP 409 (Student already booked)
│   ├── NoSeatsAvailableException.java  # HTTP 409 (Sold out)
│   └── GlobalExceptionHandler.java     # Centralized @RestControllerAdvice
│
└── TicketDeskApplication.java          # Spring Boot main entry point
```

---

## 7. Database Schema & DDL

The database scripts are located in `database/schema.sql` and sample data in `database/data.sql`.

### Table Summary:
1. **`students`**:
   - `id`: `BIGINT AUTO_INCREMENT PRIMARY KEY`
   - `name`: `VARCHAR(255) NOT NULL`
   - `email`: `VARCHAR(255) NOT NULL UNIQUE`
   - `department`: `VARCHAR(255)`
   - `created_at`: `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`

2. **`shows`** (Named `"shows"` to avoid reserved keyword issues):
   - `id`: `BIGINT AUTO_INCREMENT PRIMARY KEY`
   - `title`: `VARCHAR(255) NOT NULL`
   - `show_date`: `DATE NOT NULL`
   - `show_time`: `TIME NOT NULL`
   - `total_seats`: `INT NOT NULL CHECK (total_seats > 0)`
   - `available_seats`: `INT NOT NULL CHECK (available_seats >= 0 AND available_seats <= total_seats)`
   - `created_at`: `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`

3. **`bookings`**:
   - `id`: `BIGINT AUTO_INCREMENT PRIMARY KEY`
   - `student_id`: `BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE`
   - `show_id`: `BIGINT NOT NULL REFERENCES shows(id) ON DELETE CASCADE`
   - `booking_date`: `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
   - `status`: `VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED'`
   - Indexes: `INDEX idx_booking_student_show (student_id, show_id)`, `INDEX idx_booking_status (status)`

---

## 8. Entity Relationships

```
┌──────────────┐                 ┌──────────────┐                 ┌──────────────┐
│   Student    │ 1             * │   Booking    │ *             1 │     Show     │
├──────────────┤─────────────────┼──────────────┼─────────────────┼──────────────┤
│ id (PK)      │                 │ id (PK)      │                 │ id (PK)      │
│ name         │                 │ student_id   │                 │ title        │
│ email (UQ)   │                 │ show_id      │                 │ show_date    │
│ department   │                 │ booking_date │                 │ show_time    │
│ created_at   │                 │ status       │                 │ total_seats  │
└──────────────┘                 └──────────────┘                 │ avail_seats  │
                                                                  │ created_at   │
                                                                  └──────────────┘
```

- **Student to Booking**: One-to-Many (`@OneToMany(mappedBy = "student")`).
- **Show to Booking**: One-to-Many (`@OneToMany(mappedBy = "show")`).
- **Booking to Student/Show**: Many-to-One (`@ManyToOne(fetch = FetchType.LAZY)`).

---

## 9. Setup Instructions

### Prerequisites:
- **Java Development Kit (JDK)**: 17 or higher (`java -version`)
- **Apache Maven**: 3.8+ (`mvn -v`)
- **MySQL Server**: 8.0+ running on port `3306`

### Step 1: Clone or Navigate to the Project
```bash
cd "c:\Users\HP\OneDrive\Desktop\Leap project 2"
```

### Step 2: Configure MySQL
Create the database and run the schema setup:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/data.sql
```
*(Alternatively, Spring Boot automatically creates/updates tables using `spring.jpa.hibernate.ddl-auto=update` and creates the database if it doesn't exist via connection parameters).*

### Step 3: Run the Application
```bash
mvn spring-boot:run
```

The application starts on port `8080`.

---

## 10. MySQL Configuration

Configure connection properties in `src/main/resources/application.properties` or provide environment variables:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ticketdesk?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:root}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

To run with custom MySQL credentials:
```bash
# PowerShell
$env:DB_USERNAME="your_user"
$env:DB_PASSWORD="your_password"
mvn spring-boot:run

# Linux / macOS
DB_USERNAME=your_user DB_PASSWORD=your_password mvn spring-boot:run
```

---

## 11. Maven Commands

| Action | Command |
|---|---|
| **Compile Project** | `mvn clean compile` |
| **Run Unit & Integration Tests** | `mvn clean test` |
| **Package JAR File** | `mvn clean package` |
| **Run Application via Maven** | `mvn spring-boot:run` |
| **Run Executable JAR** | `java -jar target/ticketdesk-backend-1.0.0.jar` |

---

## 12. REST API Endpoint Documentation

### Base URL: `http://localhost:8080`

### A. Student APIs
| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `POST` | `/api/students` | Create new student profile | `201 Created` |
| `GET` | `/api/students` | Get all students | `200 OK` |
| `GET` | `/api/students/{id}` | Get student by ID | `200 OK` / `404 Not Found` |
| `PUT` | `/api/students/{id}` | Update student details | `200 OK` / `404 Not Found` |
| `DELETE` | `/api/students/{id}` | Delete student | `204 No Content` |

### B. Show APIs
| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `POST` | `/api/shows` | Create a new show (`availableSeats = totalSeats`) | `201 Created` |
| `GET` | `/api/shows` | Get all shows (with optional filtering) | `200 OK` |
| `GET` | `/api/shows/{id}` | Get show details and remaining seats | `200 OK` / `404 Not Found` |
| `PUT` | `/api/shows/{id}` | Update show information | `200 OK` / `404 Not Found` |
| `DELETE` | `/api/shows/{id}` | Delete a show screening | `204 No Content` |

**Show Search/Filter Query Parameters (Optional)**:
- `GET /api/shows?date=2026-10-05`
- `GET /api/shows?title=Avengers`
- `GET /api/shows?available=true`
- Combinable: `GET /api/shows?date=2026-10-05&title=Avengers&available=true`

### C. Booking APIs
| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `POST` | `/api/bookings` | Book a ticket for a show | `201 Created` / `409 Conflict` |
| `GET` | `/api/bookings` | List all bookings across all shows | `200 OK` |
| `GET` | `/api/bookings/{id}` | Get booking details by ID | `200 OK` / `404 Not Found` |
| `DELETE` | `/api/bookings/{id}` | Cancel booking (restores 1 seat) | `200 OK` / `400 Bad Request` |
| `GET` | `/api/students/{studentId}/bookings` | Get all bookings of a student | `200 OK` |
| `GET` | `/api/shows/{showId}/bookings` | Get all bookings for a show | `200 OK` |

---

## 13. Sample JSON Requests & Responses

### 1. Create Student
**`POST /api/students`**
```json
{
  "name": "Jackie",
  "email": "jackie@campus.edu",
  "department": "Computer Science"
}
```
**Response (201 Created)**:
```json
{
  "id": 1,
  "name": "Jackie",
  "email": "jackie@campus.edu",
  "department": "Computer Science",
  "createdAt": "2026-09-28T10:30:00"
}
```

### 2. Create Show
**`POST /api/shows`**
```json
{
  "title": "Avengers: Endgame",
  "showDate": "2026-10-05",
  "showTime": "18:00",
  "totalSeats": 100
}
```
**Response (201 Created)**:
```json
{
  "id": 1,
  "title": "Avengers: Endgame",
  "showDate": "2026-10-05",
  "showTime": "18:00",
  "totalSeats": 100,
  "availableSeats": 100,
  "createdAt": "2026-09-28T10:30:00"
}
```

### 3. Book a Ticket
**`POST /api/bookings`**
```json
{
  "studentId": 1,
  "showId": 1
}
```
**Response (201 Created)**:
```json
{
  "id": 1,
  "studentId": 1,
  "showId": 1,
  "studentName": "Jackie",
  "showTitle": "Avengers: Endgame",
  "bookingDate": "2026-09-28T10:30:00",
  "status": "CONFIRMED",
  "message": "Ticket booked successfully"
}
```

### 4. Duplicate Booking Error
**`POST /api/bookings` (Attempted again for the same student & show)**:
```json
{
  "studentId": 1,
  "showId": 1
}
```
**Response (409 Conflict)**:
```json
{
  "status": 409,
  "message": "Student has already booked this show"
}
```

### 5. Sold-Out Show Booking Error
**`POST /api/bookings` (When availableSeats == 0)**:
```json
{
  "studentId": 2,
  "showId": 1
}
```
**Response (409 Conflict)**:
```json
{
  "status": 409,
  "message": "No seats available for this show"
}
```

### 6. Cancel Booking
**`DELETE /api/bookings/1`**
**Response (200 OK)**:
```json
{
  "id": 1,
  "studentId": 1,
  "showId": 1,
  "studentName": "Jackie",
  "showTitle": "Avengers: Endgame",
  "bookingDate": "2026-09-28T10:30:00",
  "status": "CANCELLED",
  "message": "Booking cancelled successfully"
}
```

### 7. Cancelling Already Cancelled Booking Error
**`DELETE /api/bookings/1` (Repeated cancel call)**:
**Response (400 Bad Request)**:
```json
{
  "status": 400,
  "message": "Booking is already cancelled"
}
```

### 8. Validation Error Example
**`POST /api/students` (Invalid input)**:
```json
{
  "name": "",
  "email": "invalid-email"
}
```
**Response (400 Bad Request)**:
```json
{
  "status": 400,
  "message": "Validation failed",
  "errors": {
    "name": "Name cannot be blank",
    "email": "Email must be valid"
  }
}
```

---

## 14. Core Business Rules

1. **Rule 1: Seat Availability Check**: A student can book only if `availableSeats > 0`. If `availableSeats == 0`, the system rejects the booking with `HTTP 409 Conflict` (`"No seats available for this show"`).
2. **Rule 2: Single-Booking Policy**: A student cannot book the same show more than once. If an active booking exists, returns `HTTP 409 Conflict` (`"Student has already booked this show"`).
3. **Rule 3: Seat Decrement**: Every successful booking decrements `availableSeats` by exactly 1.
4. **Rule 4: Seat Restoration on Cancellation**: When a booking is cancelled, `availableSeats` increases by 1.
5. **Rule 5: No Repeated Cancellations**: A booking with status `CANCELLED` cannot be cancelled again (`HTTP 400 Bad Request`).
6. **Rule 6: Non-Negative Seat Bound**: `availableSeats` can never fall below 0.
7. **Rule 7: Upper Bound on Seats**: `availableSeats` can never exceed `totalSeats`.
8. **Rule 8: Entity Existence**: Both student and show must exist before booking can be placed (`HTTP 404 Not Found`).
9. **Rule 9: Atomic Transactions**: All booking creation and cancellation operations are executed inside `@Transactional` boundaries.
10. **Rule 10: Concurrency Protection**: High-concurrency operations prevent race conditions and overbooking.

---

## 15. How Overbooking is Prevented (Concurrency Protection)

In a high-demand scenario, multiple students may attempt to book the final available seat at the same exact millisecond. A naïve implementation (`read availableSeats -> check in Java -> decrement -> save`) suffers from the classic **Lost Update / Race Condition** anomaly:
- Thread A reads `availableSeats = 1`.
- Thread B reads `availableSeats = 1` before Thread A writes.
- Thread A updates `availableSeats = 0` and saves booking.
- Thread B updates `availableSeats = 0` and saves booking.
- **Result: 2 bookings created for 1 seat (OVERBOOKING!).**

### TicketDesk Solution: Pessimistic Write Locking (`SELECT ... FOR UPDATE`)
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT s FROM Show s WHERE s.id = :id")
Optional<Show> findByIdWithLock(@Param("id") Long id);
```

1. When a booking request arrives, the transaction queries the `Show` record using `findByIdWithLock(showId)`.
2. Hibernate executes a `SELECT ... FOR UPDATE` query against MySQL, placing an exclusive row-level lock on that specific show record.
3. If Thread B arrives concurrently, its transaction blocks and waits at the database level until Thread A commits or rolls back.
4. Thread A verifies `availableSeats == 1`, decrements it to `0`, saves the `Booking`, and commits the transaction, releasing the lock.
5. Thread B then acquires the lock, re-reads the fresh row state (`availableSeats == 0`), trips the `availableSeats <= 0` condition, and throws `NoSeatsAvailableException` (HTTP 409 Conflict).
6. **Proven in Automated Tests**: The multi-threaded test `BookingConcurrencyTest.java` launches 10 concurrent threads competing for 1 seat simultaneously, verifying that **exactly 1 booking succeeds and 9 fail with 0 overbooking**.

---

## 16. How Duplicate Bookings are Prevented

Duplicate bookings by the same student for the same show are prevented using a multi-layer defense:

1. **Service Layer Validation**:
   ```java
   boolean alreadyBooked = bookingRepository.existsByStudentIdAndShowIdAndStatus(
           student.getId(),
           show.getId(),
           BookingStatus.CONFIRMED
   );
   if (alreadyBooked) {
       throw new DuplicateBookingException("Student has already booked this show");
   }
   ```
2. **Database Indexing**:
   The `bookings` table incorporates a composite index on `(student_id, show_id)` for high-speed indexing and status checking:
   ```sql
   INDEX idx_booking_student_show (student_id, show_id),
   INDEX idx_booking_status (status)
   ```
3. If a student cancels their booking, their prior booking status transitions to `CANCELLED`, which allows them to book a ticket again in the future if seats are available.

---

## 17. How to Test Using Postman

1. Open Postman.
2. Click **Import** and select the file:
   `postman/TicketDesk.postman_collection.json`
3. Optionally import the environment file:
   `postman/TicketDesk_environment.json`
4. Run the requests in sequence:
   - **Step 1**: Run `1.1 Create Student (Jackie)` (automatically saves `studentId`).
   - **Step 2**: Run `2.1 Create Show (Avengers)` (automatically saves `showId`).
   - **Step 3**: Run `2.2 Get All Shows` and verify show is listed with 100 seats.
   - **Step 4**: Run `3.1 Book Ticket (Valid)` (automatically saves `bookingId`).
   - **Step 5**: Run `3.2 Verify Seat Count Decreased` (verifies `availableSeats` = 99).
   - **Step 6**: Run `3.3 Try Duplicate Booking` (asserts HTTP 409 with `"Student has already booked this show"`).
   - **Step 7**: Run `3.4 Get Booking by ID`.
   - **Step 8**: Run `3.5 Get Student Bookings`.
   - **Step 9**: Run `3.6 Get Show Bookings`.
   - **Step 10**: Run `3.7 Cancel Booking` (verifies status changes to `CANCELLED`).
   - **Step 11**: Run `3.8 Verify Seat Count Restored` (verifies seats restored to 100).
   - **Step 12**: Run `3.9 Try Cancelling Already Cancelled Booking` (asserts HTTP 400).

---

## 18. Modern React + Vite Frontend Application

The project includes a modern, responsive React + Vite web application located in the `frontend/` directory.

### Technology Stack:
- **Framework**: React 18 + Vite 5
- **Routing**: React Router DOM 6
- **Icons**: Lucide React
- **HTTP Client**: Axios with centralized API services
- **Theme**: Dark Navy (`#0f172a`), Electric Purple (`#6366f1`), Clean Off-White Background (`#f8fafc`)

### Frontend Directory Structure:
```
frontend/
├── src/
│   ├── components/       # Navbar, Footer, ShowCard, BookingCard, StatCard, etc.
│   ├── context/          # StudentContext (state management & localStorage persistence)
│   ├── pages/            # HomePage, ShowsPage, ShowDetailsPage, MyBookingsPage, AdminPage
│   ├── services/         # api.js, studentService.js, showService.js, bookingService.js
│   ├── styles/           # index.css (custom modern design system)
│   ├── App.jsx           # Main routing & layout
│   └── main.jsx          # React DOM entry point
├── package.json
└── vite.config.js        # Configured with proxy to http://localhost:8080
```

### Running the Frontend Locally:
```bash
cd frontend
npm install
npm run dev
```

Open:
👉 **[http://localhost:5173/](http://localhost:5173/)** (or `http://127.0.0.1:5173/`)

### Key Frontend Features:
1. **Interactive Navigation Bar**: Responsive header with quick navigation and real-time student selector dropdown populated dynamically from `GET /api/students`.
2. **Landing Page (`/`)**:
   - Hero banner with tagline: *"Your Campus. Your Shows. Your Seat."*
   - Real-time statistics counters (Total Shows, Available Seats, My Bookings) calculated from backend data.
   - Upcoming shows grid with dynamic availability meters and 1-click booking.
3. **Shows Page (`/shows`)**:
   - Filter shows by title, date, and availability status (High Availability, Limited Seats, Sold Out).
   - Card view with seat progress bar and direct links to show details or instant booking.
4. **Show Details Page (`/shows/:id`)**:
   - Comprehensive auditorium show overview with seat progress meter.
   - Integrated booking modal with student confirmation.
   - Automatic disabling of booking if the show is sold out (`availableSeats === 0`).
5. **My Bookings (`/my-bookings`)**:
   - View student-specific booking history.
   - Status indicators (`CONFIRMED`, `CANCELLED`).
   - Self-service booking cancellation with confirmation modal that automatically releases seats back to the auditorium pool.
6. **Campus Management / Admin Dashboard (`/admin`)**:
   - Live auditorium metrics: Total Shows, Total Students, Total Bookings, Available Seats.
   - Show creation form with instant feedback.
   - Show management (Edit & Delete actions).
   - Student onboarding form.
7. **Accessibility & Resilience**:
   - Accessible dialogs and modals.
   - Reusable toast notifications for success and error messages.
   - Responsive design for mobile, tablet, and desktop viewports.

---

## 19. Swagger UI / OpenAPI & Quick Links

- **React Web Frontend**: [http://localhost:5173/](http://localhost:5173/)
- **Spring Boot Backend**: [http://localhost:8080/](http://localhost:8080/)
- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON Docs**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

The interactive Swagger UI lets you explore all schemas, execute requests live, and view example payloads.

---

## 20. Future Enhancements

- **Seat Matrix & Seat Numbers**: Graphical auditorium seat selection (Row A - Seat 12).
- **JWT Authentication & RBAC**: Role-based access control separating Student and Campus Admin roles.
- **Email Notifications**: Asynchronous email delivery with QR code ticket upon booking.
- **Payment Gateway Integration**: Campus wallet, UPI, or credit card checkout.
- **Redis Caching**: Caching frequently accessed show schedules and seat availability counters.
- **Waitlist Queue**: Automatic ticket assignment from a waitlist when a student cancels.

---

## 20. License
This project is open-source under the [Apache License 2.0](LICENSE).
