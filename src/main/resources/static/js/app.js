/**
 * TicketDesk – Campus Auditorium Ticket Booking System
 * Dynamic Frontend Logic & REST API Client
 */

const API_BASE = '/api';

// State
let allShows = [];
let allStudents = [];
let allBookings = [];
let selectedShowForBooking = null;

// DOM Elements
const showsGrid = document.getElementById('showsGrid');
const bookingsTableBody = document.getElementById('bookingsTableBody');
const studentsTableBody = document.getElementById('studentsTableBody');

// Stats Elements
const statTotalShows = document.getElementById('statTotalShows');
const statAvailSeats = document.getElementById('statAvailSeats');
const statTotalBookings = document.getElementById('statTotalBookings');
const statTotalStudents = document.getElementById('statTotalStudents');

// Filter Elements
const searchShowInput = document.getElementById('searchShowInput');
const filterDateInput = document.getElementById('filterDateInput');
const filterAvailableOnly = document.getElementById('filterAvailableOnly');
const studentFilterSelect = document.getElementById('studentFilterSelect');

// Modals
const bookingModal = document.getElementById('bookingModal');
const newShowModal = document.getElementById('newShowModal');
const newStudentModal = document.getElementById('newStudentModal');
const ticketReceiptModal = document.getElementById('ticketReceiptModal');

// ===================================================================
// Initialization
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initEventListeners();
    refreshAllData();
});

function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            switchTab(targetTab);
        });
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(`tab-${tabId}`);

    if (activeBtn) activeBtn.classList.add('active');
    if (activeContent) activeContent.classList.add('active');

    if (tabId === 'bookings') fetchBookings();
    if (tabId === 'students') fetchStudents();
    if (tabId === 'shows') fetchShows();
}

function initEventListeners() {
    // Search & Filter Listeners
    let debounceTimer;
    searchShowInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fetchShows, 250);
    });

    filterDateInput.addEventListener('change', fetchShows);
    filterAvailableOnly.addEventListener('change', fetchShows);

    studentFilterSelect.addEventListener('change', () => {
        const studentId = studentFilterSelect.value;
        if (studentId) {
            fetchStudentBookings(studentId);
        } else {
            fetchBookings();
        }
    });

    // Form Submissions
    document.getElementById('bookingForm').addEventListener('submit', handleBookingSubmit);
    document.getElementById('newShowForm').addEventListener('submit', handleNewShowSubmit);
    document.getElementById('newStudentForm').addEventListener('submit', handleNewStudentSubmit);

    // Modal Close
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(el => {
        el.addEventListener('click', closeAllModals);
    });

    // Backdrop click close
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeAllModals();
        });
    });
}

// ===================================================================
// API Operations
// ===================================================================

async function refreshAllData() {
    await Promise.all([fetchShows(), fetchStudents(), fetchBookings()]);
    updateGlobalStats();
}

// 1. Shows
async function fetchShows() {
    try {
        const title = searchShowInput.value.trim();
        const date = filterDateInput.value;
        const available = filterAvailableOnly.checked;

        let queryParams = [];
        if (title) queryParams.push(`title=${encodeURIComponent(title)}`);
        if (date) queryParams.push(`date=${encodeURIComponent(date)}`);
        if (available) queryParams.push(`available=true`);

        const url = `${API_BASE}/shows${queryParams.length ? '?' + queryParams.join('&') : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch shows');
        
        allShows = await res.json();
        renderShows(allShows);
        updateGlobalStats();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

// 2. Students
async function fetchStudents() {
    try {
        const res = await fetch(`${API_BASE}/students`);
        if (!res.ok) throw new Error('Failed to fetch students');
        
        allStudents = await res.json();
        renderStudents(allStudents);
        populateStudentSelects();
        updateGlobalStats();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

// 3. Bookings
async function fetchBookings() {
    try {
        const res = await fetch(`${API_BASE}/bookings`);
        if (!res.ok) throw new Error('Failed to fetch bookings');
        
        allBookings = await res.json();
        renderBookings(allBookings);
        updateGlobalStats();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

async function fetchStudentBookings(studentId) {
    try {
        const res = await fetch(`${API_BASE}/students/${studentId}/bookings`);
        if (!res.ok) throw new Error('Failed to fetch bookings for student');
        
        const bookings = await res.json();
        renderBookings(bookings);
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

// ===================================================================
// Render Functions
// ===================================================================

function renderShows(shows) {
    if (!shows || shows.length === 0) {
        showsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">🎬</div>
                <h3 class="empty-title">No Shows Found</h3>
                <p class="empty-text">No screenings match your current filters. Try changing your search or add a new show.</p>
                <button class="btn btn-primary" onclick="openNewShowModal()">
                    <span>➕ Schedule First Show</span>
                </button>
            </div>
        `;
        return;
    }

    showsGrid.innerHTML = shows.map(show => {
        const percentLeft = Math.round((show.availableSeats / show.totalSeats) * 100);
        let badgeClass = 'badge-available';
        let badgeText = `${show.availableSeats} Available`;
        let fillClass = 'fill-high';

        if (show.availableSeats === 0) {
            badgeClass = 'badge-soldout';
            badgeText = 'Sold Out';
            fillClass = 'fill-low';
        } else if (percentLeft <= 25) {
            badgeClass = 'badge-limited';
            badgeText = 'Filling Fast';
            fillClass = 'fill-medium';
        }

        const isSoldOut = show.availableSeats === 0;

        return `
            <div class="show-card">
                <div class="show-card-header">
                    <h3 class="show-title">${escapeHtml(show.title)}</h3>
                    <span class="status-badge ${badgeClass}">${badgeText}</span>
                </div>

                <div class="show-schedule">
                    <div class="schedule-pill">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span>${formatDate(show.showDate)}</span>
                    </div>
                    <div class="schedule-pill">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>${formatTime(show.showTime)}</span>
                    </div>
                </div>

                <div class="seat-meter">
                    <div class="seat-meter-header">
                        <span style="color: var(--text-muted); font-size: 0.8rem;">Seat Capacity</span>
                        <span style="font-weight: 700; font-size: 0.85rem;">${show.availableSeats} / ${show.totalSeats} seats</span>
                    </div>
                    <div class="seat-meter-bar">
                        <div class="seat-meter-fill ${fillClass}" style="width: ${percentLeft}%;"></div>
                    </div>
                </div>

                <div class="show-card-footer">
                    <button class="btn btn-primary" onclick="openBookingModal(${show.id})" ${isSoldOut ? 'disabled' : ''}>
                        <span>${isSoldOut ? '❌ Sold Out' : '🎟️ Book Ticket'}</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderBookings(bookings) {
    if (!bookings || bookings.length === 0) {
        bookingsTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem;">
                    <div class="empty-icon" style="font-size: 2.2rem;">🎟️</div>
                    <p style="color: var(--text-muted); margin-top: 0.5rem;">No bookings found.</p>
                </td>
            </tr>
        `;
        return;
    }

    bookingsTableBody.innerHTML = bookings.map(b => {
        const isConfirmed = b.status === 'CONFIRMED';
        const badgeClass = isConfirmed ? 'badge-confirmed' : 'badge-cancelled';
        
        return `
            <tr>
                <td><span class="ticket-id">#TK-${String(b.id).padStart(4, '0')}</span></td>
                <td>
                    <div style="font-weight: 600; color: #fff;">${escapeHtml(b.studentName || 'Student #' + b.studentId)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-dim);">ID: ${b.studentId}</div>
                </td>
                <td>
                    <div style="font-weight: 600; color: #fff;">${escapeHtml(b.showTitle || 'Show #' + b.showId)}</div>
                </td>
                <td style="color: var(--text-muted); font-size: 0.85rem;">
                    ${formatDateTime(b.bookingDate)}
                </td>
                <td>
                    <span class="status-badge ${badgeClass}">${b.status}</span>
                </td>
                <td style="text-align: right;">
                    ${isConfirmed ? `
                        <button class="btn btn-danger btn-sm" onclick="cancelBooking(${b.id})">
                            <span>Cancel Ticket</span>
                        </button>
                    ` : `
                        <span style="font-size: 0.8rem; color: var(--text-dim);">Cancelled</span>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

function renderStudents(students) {
    if (!students || students.length === 0) {
        studentsTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem;">
                    <div class="empty-icon" style="font-size: 2.2rem;">🎓</div>
                    <p style="color: var(--text-muted); margin-top: 0.5rem;">No students registered yet.</p>
                </td>
            </tr>
        `;
        return;
    }

    studentsTableBody.innerHTML = students.map(s => `
        <tr>
            <td><span class="ticket-id">#STU-${String(s.id).padStart(3, '0')}</span></td>
            <td style="font-weight: 600; color: #fff;">${escapeHtml(s.name)}</td>
            <td style="color: #a5b4fc;">${escapeHtml(s.email)}</td>
            <td style="color: var(--text-muted);">${escapeHtml(s.department || 'General')}</td>
            <td style="text-align: right;">
                <button class="btn btn-secondary btn-sm" onclick="viewStudentBookings(${s.id})">
                    <span>View Bookings</span>
                </button>
            </td>
        </tr>
    `).join('');
}

function populateStudentSelects() {
    const bookingSelect = document.getElementById('bookingStudentSelect');
    
    // Booking modal select
    bookingSelect.innerHTML = `
        <option value="" disabled selected>-- Select Student --</option>
        ${allStudents.map(s => `
            <option value="${s.id}">${escapeHtml(s.name)} (${escapeHtml(s.email)})</option>
        `).join('')}
    `;

    // Bookings tab filter select
    studentFilterSelect.innerHTML = `
        <option value="">All Students</option>
        ${allStudents.map(s => `
            <option value="${s.id}">${escapeHtml(s.name)}</option>
        `).join('')}
    `;
}

// ===================================================================
// Action Handlers
// ===================================================================

function openBookingModal(showId) {
    selectedShowForBooking = allShows.find(s => s.id === showId);
    if (!selectedShowForBooking) return;

    document.getElementById('bookingShowTitle').textContent = selectedShowForBooking.title;
    document.getElementById('bookingShowSchedule').textContent = 
        `${formatDate(selectedShowForBooking.showDate)} at ${formatTime(selectedShowForBooking.showTime)}`;
    document.getElementById('bookingShowSeats').textContent = 
        `${selectedShowForBooking.availableSeats} of ${selectedShowForBooking.totalSeats} seats remaining`;

    // Render interactive mini seating grid preview
    renderMiniSeatGrid(selectedShowForBooking);

    bookingModal.classList.add('open');
}

function renderMiniSeatGrid(show) {
    const grid = document.getElementById('miniSeatGrid');
    const total = Math.min(show.totalSeats, 24); // Show representative 24 seats
    const booked = Math.round(((show.totalSeats - show.availableSeats) / show.totalSeats) * total);

    let html = '';
    for (let i = 0; i < total; i++) {
        if (i < booked) {
            html += '<div class="mini-seat booked" title="Booked Seat"></div>';
        } else {
            html += '<div class="mini-seat available" title="Available Seat"></div>';
        }
    }
    grid.innerHTML = html;
}

async function handleBookingSubmit(e) {
    e.preventDefault();
    const studentId = document.getElementById('bookingStudentSelect').value;
    if (!studentId || !selectedShowForBooking) {
        showToast('Validation Error', 'Please select a student to book for', 'warning');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Processing...</span>';

    try {
        const res = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: Number(studentId),
                showId: selectedShowForBooking.id
            })
        });

        const data = await res.json();

        if (res.status === 201) {
            closeAllModals();
            showToast('Success!', data.message || 'Ticket booked successfully', 'success');
            openTicketReceipt(data);
            await refreshAllData();
        } else if (res.status === 409) {
            showToast('Booking Conflict (409)', data.message, 'error');
        } else {
            showToast('Booking Failed', data.message || 'Unable to book ticket', 'error');
        }
    } catch (err) {
        showToast('Network Error', err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Confirm Booking</span>';
    }
}

async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking? This will restore 1 seat back to the show.')) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
            method: 'DELETE'
        });

        const data = await res.json();

        if (res.ok) {
            showToast('Cancelled', data.message || 'Booking cancelled successfully', 'info');
            await refreshAllData();
        } else {
            showToast('Error', data.message || 'Cannot cancel booking', 'error');
        }
    } catch (err) {
        showToast('Network Error', err.message, 'error');
    }
}

function openTicketReceipt(booking) {
    document.getElementById('receiptId').textContent = `#TK-${String(booking.id).padStart(4, '0')}`;
    document.getElementById('receiptStudent').textContent = booking.studentName || `Student #${booking.studentId}`;
    document.getElementById('receiptShow').textContent = booking.showTitle || `Show #${booking.showId}`;
    document.getElementById('receiptDate').textContent = formatDateTime(booking.bookingDate);
    document.getElementById('receiptStatus').textContent = booking.status;

    ticketReceiptModal.classList.add('open');
}

// ===================================================================
// Admin / Modal Operations
// ===================================================================

function openNewShowModal() {
    newShowModal.classList.add('open');
}

function openNewStudentModal() {
    newStudentModal.classList.add('open');
}

async function handleNewShowSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('newShowTitle').value.trim();
    const showDate = document.getElementById('newShowDate').value;
    const showTime = document.getElementById('newShowTime').value;
    const totalSeats = Number(document.getElementById('newShowSeats').value);

    try {
        const res = await fetch(`${API_BASE}/shows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, showDate, showTime, totalSeats })
        });

        const data = await res.json();

        if (res.status === 201) {
            closeAllModals();
            document.getElementById('newShowForm').reset();
            showToast('Show Created!', `Successfully added "${data.title}" with ${data.totalSeats} seats.`, 'success');
            await refreshAllData();
        } else {
            showToast('Error Creating Show', data.message || 'Validation failed', 'error');
        }
    } catch (err) {
        showToast('Network Error', err.message, 'error');
    }
}

async function handleNewStudentSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('newStudentName').value.trim();
    const email = document.getElementById('newStudentEmail').value.trim();
    const department = document.getElementById('newStudentDept').value.trim();

    try {
        const res = await fetch(`${API_BASE}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, department })
        });

        const data = await res.json();

        if (res.status === 201) {
            closeAllModals();
            document.getElementById('newStudentForm').reset();
            showToast('Student Registered!', `Registered ${data.name} (${data.email})`, 'success');
            await refreshAllData();
        } else if (res.status === 409) {
            showToast('Conflict', data.message || 'Student with this email already exists', 'error');
        } else {
            showToast('Error', data.message || 'Validation failed', 'error');
        }
    } catch (err) {
        showToast('Network Error', err.message, 'error');
    }
}

function viewStudentBookings(studentId) {
    switchTab('bookings');
    studentFilterSelect.value = studentId;
    fetchStudentBookings(studentId);
}

function closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
}

// ===================================================================
// Stats & Helpers
// ===================================================================

function updateGlobalStats() {
    statTotalShows.textContent = allShows.length;
    
    const availableSeats = allShows.reduce((acc, curr) => acc + (curr.availableSeats || 0), 0);
    statAvailSeats.textContent = availableSeats;

    const confirmedBookings = allBookings.filter(b => b.status === 'CONFIRMED').length;
    statTotalBookings.textContent = confirmedBookings;

    statTotalStudents.textContent = allStudents.length;
}

function showToast(title, message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const mins = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${mins} ${ampm}`;
}

function formatDateTime(dtStr) {
    if (!dtStr) return '';
    const d = new Date(dtStr);
    return d.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit' 
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
