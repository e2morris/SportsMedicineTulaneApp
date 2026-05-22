// Initialize EmailJS (you'll need to set this up - see SETUP_GUIDE.md)
// EmailJS.init("YOUR_PUBLIC_KEY"); // Uncomment and add your key

// Data Storage
const STORAGE_KEY = "at_appointments";

// Services Configuration (matching Stanford-style)
const SERVICES = [
  { id: "new-injury", name: "New Injury", duration: 30 },
  { id: "follow-up", name: "Follow Up Injury", duration: 30 },
  { id: "treatment", name: "Treatment", duration: 20 },
  { id: "rehab", name: "Rehab", duration: 20 },
  { id: "cupping", name: "Cupping", duration: 5 },
  { id: "taping", name: "Taping", duration: 5 },
  { id: "concussion", name: "Concussion Evaluation", duration: 15 },
  { id: "rowing-screen", name: "Rowing Screen", duration: 20 },
  { id: "physical-vitals", name: "Physical Vitals", duration: 5 },
  { id: "illness", name: "Illness", duration: 15 },
  { id: "meeting", name: "Meeting", duration: 10 },
];

// Booking State
let bookingState = {
  service: null,
  date: null,
  time: null,
  duration: null,
};

// Session Storage for booking state persistence
const BOOKING_STATE_KEY = "booking_state";

// Save booking state to sessionStorage
function saveBookingState() {
  sessionStorage.setItem(BOOKING_STATE_KEY, JSON.stringify(bookingState));
}

// Load booking state from sessionStorage
function loadBookingState() {
  const saved = sessionStorage.getItem(BOOKING_STATE_KEY);
  if (saved) {
    try {
      bookingState = JSON.parse(saved);
      // Restore UI state if we have a booking in progress
      if (bookingState.service) {
        // If we're on contact step, restore the selections
        updateSelectedServiceDisplay();
        if (bookingState.date) {
          updateSelectedDateDisplay();
        }
        if (bookingState.time) {
          updateAppointmentSummary();
        }
      }
    } catch (e) {
      console.error("Error loading booking state:", e);
    }
  }
}

// Clear booking state from sessionStorage
function clearBookingState() {
  sessionStorage.removeItem(BOOKING_STATE_KEY);
}

// Validation functions
function validateEmail(email) {
  if (!email) return { valid: false, message: "Email is required" };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emails = email
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e);

  for (const e of emails) {
    if (!emailRegex.test(e)) {
      return { valid: false, message: "Please enter a valid email address" };
    }
  }

  return { valid: true };
}

function validatePhone(phone) {
  if (!phone) return { valid: true, message: "" }; // Phone is optional
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  const digitsOnly = phone.replace(/\D/g, "");

  if (digitsOnly.length < 10) {
    return { valid: false, message: "Phone number must be at least 10 digits" };
  }

  if (!phoneRegex.test(phone)) {
    return { valid: false, message: "Please enter a valid phone number" };
  }

  return { valid: true };
}

function formatPhoneNumber(value) {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "");

  // Format as (XXX) XXX-XXXX
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

// Show error message
function showError(message, container) {
  const errorId = container.id ? `${container.id}-error` : "form-error";
  let errorEl = document.getElementById(errorId);

  if (!errorEl) {
    errorEl = document.createElement("div");
    errorEl.id = errorId;
    errorEl.className = "error-message";
    container.appendChild(errorEl);
  }

  errorEl.textContent = message;
  errorEl.style.display = "block";
}

// Hide error message
function hideError(container) {
  const errorId = container.id ? `${container.id}-error` : "form-error";
  const errorEl = document.getElementById(errorId);
  if (errorEl) {
    errorEl.style.display = "none";
  }
}

// Show global error alert
function showGlobalError(message) {
  let alertContainer = document.getElementById("global-error-alert");

  if (!alertContainer) {
    alertContainer = document.createElement("div");
    alertContainer.id = "global-error-alert";
    alertContainer.className = "error-alert";
    const contactSection = document.querySelector(
      "#step-contact .contact-form-section"
    );
    if (contactSection) {
      contactSection.insertBefore(alertContainer, contactSection.firstChild);
    }
  }

  alertContainer.innerHTML = `
    <span class="error-alert-icon">⚠️</span>
    <span>${message}</span>
  `;
  alertContainer.classList.remove("hidden");

  // Scroll to error
  alertContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Hide global error alert
function hideGlobalError() {
  const alertContainer = document.getElementById("global-error-alert");
  if (alertContainer) {
    alertContainer.classList.add("hidden");
  }
}

// Show global success alert
function showGlobalSuccess(message) {
  let alertContainer = document.getElementById("global-success-alert");

  if (!alertContainer) {
    alertContainer = document.createElement("div");
    alertContainer.id = "global-success-alert";
    alertContainer.className = "success-alert";
    const contactSection = document.querySelector(
      "#step-contact .contact-form-section"
    );
    if (contactSection) {
      contactSection.insertBefore(alertContainer, contactSection.firstChild);
    }
  }

  alertContainer.innerHTML = `
    <span class="error-alert-icon">✓</span>
    <span>${message}</span>
  `;
  alertContainer.classList.remove("hidden");
}

// Get appointments from localStorage
function getAppointments() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Save appointments to localStorage
function saveAppointments(appointments) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Format time for display
function formatTime(timeString) {
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes.padStart(2, "0")} ${ampm}`;
}

// Check if date is today
function isToday(dateString) {
  const today = new Date();
  const date = new Date(dateString);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// Check if date is past
function isPast(dateString, timeString) {
  const appointmentDateTime = new Date(`${dateString}T${timeString}`);
  return appointmentDateTime < new Date();
}

// Get service by ID
function getServiceById(id) {
  return SERVICES.find((s) => s.id === id);
}

// Get service label
function getServiceLabel(id) {
  const service = getServiceById(id);
  return service ? `${service.name} (${service.duration} mins)` : id;
}

// Initialize Services List
function initializeServices() {
  const servicesList = document.getElementById("services-list");
  if (!servicesList) return;

  servicesList.innerHTML = SERVICES.map(
    (service) => `
    <div class="service-item">
      <div class="service-info">
        <div class="service-name">${service.name}</div>
        <div class="service-duration">(${service.duration} mins)</div>
      </div>
      <button class="book-button" onclick="selectService('${service.id}')">BOOK</button>
    </div>
  `
  ).join("");
}

// Step Navigation with browser history support
function goToStep(stepName, skipHistory = false) {
  // Hide all steps
  document.querySelectorAll(".booking-step").forEach((step) => {
    step.classList.remove("active-step");
  });

  // Show target step
  const targetStep = document.getElementById(`step-${stepName}`);
  if (targetStep) {
    targetStep.classList.add("active-step");
  }

  // Update browser history
  if (!skipHistory && window.history && window.history.pushState) {
    const url = new URL(window.location);
    url.hash = `step-${stepName}`;
    window.history.pushState({ step: stepName }, "", url);
  }

  // Initialize step-specific content
  if (stepName === "date") {
    initializeCalendar();
    updateSelectedServiceDisplay();
  } else if (stepName === "time") {
    initializeTimeSlots();
    updateSelectedServiceDisplay2();
    updateSelectedDateDisplay();
  } else if (stepName === "contact") {
    updateAppointmentSummary();
    updateSelectedServiceDisplay3();
  }

  // Save booking state
  saveBookingState();
}

// Service Selection
function selectService(serviceId) {
  const service = getServiceById(serviceId);
  if (!service) return;

  bookingState.service = serviceId;
  bookingState.duration = service.duration;
  saveBookingState(); // Save to sessionStorage

  // Hide service list container
  const serviceListContainer = document.getElementById(
    "service-list-container"
  );
  if (serviceListContainer) {
    serviceListContainer.style.display = "none";
  }

  // Show the date/time selection box (replaces service list)
  const dateTimeBox = document.getElementById("date-time-selection");
  if (dateTimeBox) {
    dateTimeBox.style.display = "block";
  }

  // Update selected service display
  const display = document.getElementById("selected-service-text-inline");
  if (display) {
    display.textContent = getServiceLabel(serviceId);
  }

  // Initialize calendar
  initializeCalendarInline();
}

// Navigate back to service selection from any step
function goBackToServiceSelection() {
  // Reset any date/time selections in inline view
  backToServiceSelection();

  // Navigate to service step
  goToStep("service");

  // Ensure service list is visible
  const serviceListContainer = document.getElementById(
    "service-list-container"
  );
  if (serviceListContainer) {
    serviceListContainer.style.display = "block";
  }

  // Hide date/time selection box
  const dateTimeBox = document.getElementById("date-time-selection");
  if (dateTimeBox) {
    dateTimeBox.style.display = "none";
  }
}

// Back to service selection
function backToServiceSelection() {
  // Hide date/time selection box
  const dateTimeBox = document.getElementById("date-time-selection");
  if (dateTimeBox) {
    dateTimeBox.style.display = "none";
  }

  // Show service list container
  const serviceListContainer = document.getElementById(
    "service-list-container"
  );
  if (serviceListContainer) {
    serviceListContainer.style.display = "block";
  }

  // Reset booking state
  bookingState = { service: null, date: null, time: null, duration: null };
  clearBookingState(); // Clear from sessionStorage

  // Hide time slots if shown
  const timeSlotsContainer = document.getElementById("time-slots-container");
  if (timeSlotsContainer) {
    timeSlotsContainer.style.display = "none";
  }

  // Hide selected date header
  const dateHeader = document.getElementById("selected-date-header-inline");
  if (dateHeader) {
    dateHeader.style.display = "none";
  }
}

// Update Selected Service Display
function updateSelectedServiceDisplay() {
  const display = document.getElementById("selected-service-text");
  if (display && bookingState.service) {
    display.textContent = getServiceLabel(bookingState.service);
  }

  // Show selected date header when date is selected
  const dateHeader = document.getElementById("selected-date-header");
  if (dateHeader && bookingState.date) {
    dateHeader.style.display = "block";
    const dateText = document.getElementById("selected-date-text");
    if (dateText) {
      dateText.textContent = formatDate(bookingState.date);
    }
  }
}

function updateSelectedServiceDisplay2() {
  const display = document.getElementById("selected-service-text-time");
  if (display && bookingState.service) {
    display.textContent = getServiceLabel(bookingState.service);
  }
}

function updateSelectedServiceDisplay3() {
  const display = document.getElementById("selected-service-text-contact");
  if (display && bookingState.service) {
    display.textContent = getServiceLabel(bookingState.service);
  }
}

// Calendar Functions
let currentCalendarDate = new Date();
let currentCalendarDateInline = new Date();

function initializeCalendar() {
  renderCalendar();
  setupCalendarNavigation();
}

function initializeCalendarInline() {
  renderCalendarInline();
  setupCalendarNavigationInline();
}

function setupCalendarNavigation() {
  const prevBtn = document.getElementById("prev-month");
  const nextBtn = document.getElementById("next-month");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      renderCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      renderCalendar();
    });
  }
}

function setupCalendarNavigationInline() {
  const prevBtn = document.getElementById("prev-month-inline");
  const nextBtn = document.getElementById("next-month-inline");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      currentCalendarDateInline.setMonth(
        currentCalendarDateInline.getMonth() - 1
      );
      renderCalendarInline();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentCalendarDateInline.setMonth(
        currentCalendarDateInline.getMonth() + 1
      );
      renderCalendarInline();
    });
  }
}

function renderCalendar() {
  const monthYear = document.getElementById("calendar-month-year");
  const grid = document.getElementById("calendar-grid");

  if (!monthYear || !grid) return;

  // Update month/year display
  monthYear.textContent = currentCalendarDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Get first day of month and number of days
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Day headers
  const dayHeaders = ["S", "M", "T", "W", "T", "F", "S"];
  let html = dayHeaders
    .map((day) => `<div class="calendar-day-header">${day}</div>`)
    .join("");

  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    html += '<div class="calendar-day"></div>';
  }

  // Days of the month
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateString = date.toISOString().split("T")[0];
    const isPastDate = date < today;
    const isSelected = bookingState.date === dateString;
    const isTodayDate =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
    const isFullyBooked = !isPastDate && isDateFullyBooked(dateString);
    const hasAppointments =
      !isPastDate &&
      getAppointments().some(
        (apt) => apt.date === dateString && apt.status !== "canceled"
      );

    let classes = "calendar-day";
    if (isPastDate || isFullyBooked) classes += " disabled";
    if (isFullyBooked) classes += " unavailable";
    if (hasAppointments && !isFullyBooked) classes += " full";
    if (isSelected) classes += " selected";
    if (isTodayDate) classes += " today";

    html += `<div class="${classes}" data-date="${dateString}" onclick="selectDate('${dateString}')">${day}</div>`;
  }

  grid.innerHTML = html;
}

function renderCalendarInline() {
  const monthYear = document.getElementById("calendar-month-year-inline");
  const grid = document.getElementById("calendar-grid-inline");

  if (!monthYear || !grid) return;

  // Update month/year display
  monthYear.textContent = currentCalendarDateInline.toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );

  // Get first day of month and number of days
  const year = currentCalendarDateInline.getFullYear();
  const month = currentCalendarDateInline.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Day headers
  const dayHeaders = ["S", "M", "T", "W", "T", "F", "S"];
  let html = dayHeaders
    .map((day) => `<div class="calendar-day-header">${day}</div>`)
    .join("");

  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    html += '<div class="calendar-day"></div>';
  }

  // Days of the month
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateString = date.toISOString().split("T")[0];
    const isPastDate = date < today;
    const isSelected = bookingState.date === dateString;
    const isTodayDate =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
    const isFullyBooked = !isPastDate && isDateFullyBooked(dateString);
    const hasAppointments =
      !isPastDate &&
      getAppointments().some(
        (apt) => apt.date === dateString && apt.status !== "canceled"
      );

    let classes = "calendar-day";
    if (isPastDate || isFullyBooked) classes += " disabled";
    if (isFullyBooked) classes += " unavailable";
    if (hasAppointments && !isFullyBooked) classes += " full";
    if (isSelected) classes += " selected";
    if (isTodayDate) classes += " today";

    html += `<div class="${classes}" data-date="${dateString}" onclick="selectDateInline('${dateString}')">${day}</div>`;
  }

  grid.innerHTML = html;
}

function selectDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) return; // Can't select past dates

  bookingState.date = dateString;
  saveBookingState(); // Save to sessionStorage
  renderCalendar(); // Re-render to show selection

  // Update selected date display in date step
  const dateHeader = document.getElementById("selected-date-header");
  if (dateHeader) {
    dateHeader.style.display = "block";
    const dateText = document.getElementById("selected-date-text");
    if (dateText) {
      dateText.textContent = formatDate(dateString);
    }
  }

  goToStep("time");
}

function selectDateInline(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) return; // Can't select past dates

  bookingState.date = dateString;
  saveBookingState(); // Save to sessionStorage
  renderCalendarInline(); // Re-render to show selection

  // Show selected date header
  const dateHeader = document.getElementById("selected-date-header-inline");
  if (dateHeader) {
    dateHeader.style.display = "block";
    const dateText = document.getElementById("selected-date-text-inline");
    if (dateText) {
      dateText.textContent = formatDate(dateString);
    }
  }

  // Show and initialize time slots
  const timeSlotsContainer = document.getElementById("time-slots-container");
  if (timeSlotsContainer) {
    timeSlotsContainer.style.display = "block";
    initializeTimeSlotsInline();

    // Smooth scroll to time slots
    setTimeout(() => {
      timeSlotsContainer.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
  }
}

function updateSelectedDateDisplay() {
  const display = document.getElementById("selected-date-display");
  if (display && bookingState.date) {
    display.textContent = formatDate(bookingState.date);
  }
}

// Time Slots
function initializeTimeSlots() {
  const grid = document.getElementById("time-slots-grid");
  if (!grid || !bookingState.date) return;

  // Generate time slots (every 5 minutes from 8 AM to 6 PM)
  const slots = generateTimeSlots();
  const bookedSlots = getBookedTimeSlots(bookingState.date);

  grid.innerHTML = slots
    .map((slot) => {
      const isBooked = isTimeSlotBooked(slot, bookedSlots);
      const isSelected = bookingState.time === slot;
      let classes = "time-slot";
      if (isBooked) classes += " disabled";
      if (isSelected) classes += " selected";

      return `<div class="${classes}" onclick="selectTime('${slot}')">${formatTime(
        slot
      )}</div>`;
    })
    .join("");
}

function initializeTimeSlotsInline() {
  const grid = document.getElementById("time-slots-grid-inline");
  if (!grid || !bookingState.date) return;

  // Generate time slots (every 5 minutes from 8 AM to 6 PM)
  const slots = generateTimeSlots();
  const bookedSlots = getBookedTimeSlots(bookingState.date);

  grid.innerHTML = slots
    .map((slot) => {
      const isBooked = isTimeSlotBooked(slot, bookedSlots);
      const isSelected = bookingState.time === slot;
      let classes = "time-slot";
      if (isBooked) classes += " disabled";
      if (isSelected) classes += " selected";

      return `<div class="${classes}" onclick="selectTimeInline('${slot}')">${formatTime(
        slot
      )}</div>`;
    })
    .join("");
}

function generateTimeSlots() {
  const slots = [];
  const startHour = 8; // 8 AM
  const endHour = 18; // 6 PM

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      slots.push(timeString);
    }
  }

  return slots;
}

function getBookedTimeSlots(date) {
  const appointments = getAppointments();
  return appointments
    .filter((apt) => apt.date === date && apt.status !== "canceled")
    .map((apt) => ({
      start: apt.startTime,
      end: apt.endTime,
      duration: apt.duration || 30,
      status: apt.status,
    }));
}

function isTimeSlotBooked(slot, bookedSlots) {
  const slotTime = new Date(`2000-01-01T${slot}`);
  const duration = bookingState.duration || 30;
  const slotEnd = new Date(slotTime.getTime() + duration * 60000);

  return bookedSlots.some((booked) => {
    if (booked.status === "canceled") return false; // Ignore canceled appointments
    const bookedStart = new Date(`2000-01-01T${booked.start}`);
    const bookedEnd = new Date(`2000-01-01T${booked.start}`);
    bookedEnd.setMinutes(bookedEnd.getMinutes() + (booked.duration || 30));

    return (
      (slotTime >= bookedStart && slotTime < bookedEnd) ||
      (slotEnd > bookedStart && slotEnd <= bookedEnd) ||
      (slotTime <= bookedStart && slotEnd >= bookedEnd)
    );
  });
}

// Check if a date is fully booked (no available slots)
function isDateFullyBooked(dateString) {
  const appointments = getAppointments();
  const dateAppointments = appointments.filter(
    (apt) => apt.date === dateString && apt.status !== "canceled"
  );

  // Generate all possible slots for the day
  const allSlots = generateTimeSlots();
  const bookedSlots = dateAppointments.map((apt) => ({
    start: apt.startTime,
    end: apt.endTime,
    duration: apt.duration || 30,
  }));

  // Check if there's at least one available slot for any service duration
  const serviceDurations = SERVICES.map((s) => s.duration);

  for (const slot of allSlots) {
    // Check if this slot is available for at least one service type
    for (const duration of serviceDurations) {
      const slotTime = new Date(`2000-01-01T${slot}`);
      const slotEnd = new Date(slotTime.getTime() + duration * 60000);

      const isBooked = bookedSlots.some((booked) => {
        const bookedStart = new Date(`2000-01-01T${booked.start}`);
        const bookedEnd = new Date(`2000-01-01T${booked.start}`);
        bookedEnd.setMinutes(bookedEnd.getMinutes() + (booked.duration || 30));

        return (
          (slotTime >= bookedStart && slotTime < bookedEnd) ||
          (slotEnd > bookedStart && slotEnd <= bookedEnd) ||
          (slotTime <= bookedStart && slotEnd >= bookedEnd)
        );
      });

      if (!isBooked) {
        return false; // Found at least one available slot
      }
    }
  }

  return true; // All slots are booked for all service types
}

function selectTime(timeString) {
  const slot = document.querySelector(
    `.time-slot[onclick="selectTime('${timeString}')"]`
  );
  if (slot && slot.classList.contains("disabled")) return;

  bookingState.time = timeString;
  saveBookingState(); // Save to sessionStorage
  initializeTimeSlots(); // Re-render to show selection
  goToStep("contact");
}

function selectTimeInline(timeString) {
  const slot = document.querySelector(
    `.time-slot[onclick="selectTimeInline('${timeString}')"]`
  );
  if (slot && slot.classList.contains("disabled")) return;

  bookingState.time = timeString;
  saveBookingState(); // Save to sessionStorage
  initializeTimeSlotsInline(); // Re-render to show selection

  // Navigate to contact form step
  goToStep("contact");
}

// Appointment Summary
function updateAppointmentSummary() {
  if (!bookingState.service || !bookingState.date || !bookingState.time) return;

  const service = getServiceById(bookingState.service);
  const serviceNameEl = document.getElementById(
    "appointment-service-name-contact"
  );
  const datetimeEl = document.getElementById("appointment-datetime-contact");

  if (serviceNameEl) {
    serviceNameEl.textContent = `${service.name} (${service.duration} mins)`;
  }

  if (datetimeEl && bookingState.date && bookingState.time) {
    const date = new Date(bookingState.date);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const monthName = date.toLocaleDateString("en-US", { month: "long" });
    const day = date.getDate();
    const year = date.getFullYear();
    const ordinal = getOrdinal(day);
    const timeFormatted = formatTime(bookingState.time);

    datetimeEl.textContent = `${dayName}, ${monthName} ${ordinal}, ${year} at ${timeFormatted} CST`;
  }
}

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const start = new Date();
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return `${end.getHours().toString().padStart(2, "0")}:${end
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

// Contact Form Submission with improved error handling and loading states
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    hideGlobalError();

    // Validate booking state
    if (!bookingState.service || !bookingState.date || !bookingState.time) {
      showGlobalError(
        "Please complete all booking steps (select service, date, and time)."
      );
      // Navigate to the appropriate step
      if (!bookingState.service) {
        goToStep("service");
      } else if (!bookingState.date) {
        backToServiceSelection();
      } else if (!bookingState.time) {
        goToStep("time");
      }
      return;
    }

    const formData = new FormData(contactForm);
    const firstName = formData.get("firstName")?.trim();
    const lastName = formData.get("lastName")?.trim();
    const email = formData.get("email")?.trim();
    const phone = formData.get("phone")?.trim() || "";

    // Validate required fields
    if (!firstName || !lastName) {
      showGlobalError("Please enter both first and last name.");
      return;
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      showGlobalError(emailValidation.message);
      return;
    }

    // Validate phone if provided
    if (phone) {
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.valid) {
        showGlobalError(phoneValidation.message);
        return;
      }
    }

    const service = getServiceById(bookingState.service);
    const endTime = calculateEndTime(bookingState.time, bookingState.duration);
    const fullName = `${firstName} ${lastName}`.trim();

    const appointment = {
      id: generateId(),
      name: fullName,
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      date: bookingState.date,
      startTime: bookingState.time,
      endTime: endTime,
      duration: bookingState.duration,
      reason: bookingState.service,
      serviceName: service.name,
      notes: "",
      status: "booked",
      createdAt: new Date().toISOString(),
      cancelToken: generateId(), // For cancellation link
    };

    // Re-check for conflicts (in case another booking was made)
    const appointments = getAppointments();
    const hasConflict = appointments.some((apt) => {
      if (apt.status === "canceled") return false; // Ignore canceled appointments
      if (apt.date !== appointment.date) return false;
      const aptStart = new Date(`${apt.date}T${apt.startTime}`);
      const aptEnd = new Date(`${apt.date}T${apt.endTime}`);
      const newStart = new Date(`${appointment.date}T${appointment.startTime}`);
      const newEnd = new Date(`${appointment.date}T${appointment.endTime}`);

      return (
        (newStart >= aptStart && newStart < aptEnd) ||
        (newEnd > aptStart && newEnd <= aptEnd) ||
        (newStart <= aptStart && newEnd >= aptEnd)
      );
    });

    if (hasConflict) {
      showGlobalError(
        "This time slot is already booked. Please select a different time."
      );
      // Go back to time selection
      goToStep("time");
      return;
    }

    // Get submit button and show loading state
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : "";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add("loading");
    }

    try {
      // Save appointment
      appointments.push(appointment);
      saveAppointments(appointments);

      // Send email reminder (if EmailJS is configured)
      try {
        await sendEmailReminder(appointment);
      } catch (error) {
        console.log("Email reminder not sent:", error);
        // Don't block confirmation if email fails
      }

      // Clear booking state
      clearBookingState();
      bookingState = { service: null, date: null, time: null, duration: null };

      // Show confirmation
      showConfirmation(appointment);

      // Reset form
      contactForm.reset();
    } catch (error) {
      console.error("Error saving appointment:", error);
      showGlobalError(
        "An error occurred while saving your appointment. Please try again."
      );

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove("loading");
        submitButton.textContent = originalButtonText;
      }
    }
  });

  // Real-time form validation
  const emailInput = document.getElementById("athlete-email");
  const phoneInput = document.getElementById("athlete-phone");
  const firstNameInput = document.getElementById("athlete-first-name");
  const lastNameInput = document.getElementById("athlete-last-name");

  // Email validation
  if (emailInput) {
    emailInput.addEventListener("blur", () => {
      const email = emailInput.value.trim();
      const validation = validateEmail(email);
      const formGroup = emailInput.closest(".form-group");

      if (email && !validation.valid) {
        emailInput.classList.add("error");
        emailInput.classList.remove("valid");
        showError(validation.message, formGroup);
      } else if (email && validation.valid) {
        emailInput.classList.remove("error");
        emailInput.classList.add("valid");
        hideError(formGroup);
      } else {
        emailInput.classList.remove("error", "valid");
        hideError(formGroup);
      }
    });

    emailInput.addEventListener("input", () => {
      if (emailInput.classList.contains("error")) {
        const email = emailInput.value.trim();
        const validation = validateEmail(email);
        const formGroup = emailInput.closest(".form-group");

        if (validation.valid || !email) {
          emailInput.classList.remove("error");
          if (email) emailInput.classList.add("valid");
          hideError(formGroup);
        }
      }
    });
  }

  // Phone validation and formatting
  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      const formatted = formatPhoneNumber(e.target.value);
      if (formatted !== e.target.value) {
        const cursorPos = e.target.selectionStart;
        e.target.value = formatted;
        // Try to maintain cursor position
        const newPos = Math.min(
          cursorPos + (formatted.length - e.target.value.length),
          formatted.length
        );
        e.target.setSelectionRange(newPos, newPos);
      }

      const phone = e.target.value.trim();
      const validation = validatePhone(phone);
      const formGroup = phoneInput.closest(".form-group");

      if (phone && !validation.valid) {
        phoneInput.classList.add("error");
        phoneInput.classList.remove("valid");
        showError(validation.message, formGroup);
      } else if (phone && validation.valid) {
        phoneInput.classList.remove("error");
        phoneInput.classList.add("valid");
        hideError(formGroup);
      } else {
        phoneInput.classList.remove("error", "valid");
        hideError(formGroup);
      }
    });

    phoneInput.addEventListener("blur", () => {
      const phone = phoneInput.value.trim();
      const validation = validatePhone(phone);
      const formGroup = phoneInput.closest(".form-group");

      if (phone && !validation.valid) {
        phoneInput.classList.add("error");
        showError(validation.message, formGroup);
      } else if (phone && validation.valid) {
        phoneInput.classList.remove("error");
        phoneInput.classList.add("valid");
        hideError(formGroup);
      }
    });
  }

  // Name validation
  [firstNameInput, lastNameInput].forEach((input) => {
    if (input) {
      input.addEventListener("blur", () => {
        const value = input.value.trim();
        const formGroup = input.closest(".form-group");

        if (!value) {
          input.classList.add("error");
          input.classList.remove("valid");
          showError("This field is required", formGroup);
        } else {
          input.classList.remove("error");
          input.classList.add("valid");
          hideError(formGroup);
        }
      });

      input.addEventListener("input", () => {
        if (input.classList.contains("error") && input.value.trim()) {
          input.classList.remove("error");
          input.classList.add("valid");
          hideError(input.closest(".form-group"));
        }
      });
    }
  });
}

function showConfirmation(appointment) {
  const confirmation = document.getElementById("step-confirmation");
  const details = document.getElementById("confirmation-details");

  if (details) {
    const cancelUrl = `${window.location.origin}${window.location.pathname}?cancel=${appointment.cancelToken}`;

    details.innerHTML = `
      <div class="summary-item">
        <span class="summary-label">Name:</span>
        <span class="summary-value">${appointment.name}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Service:</span>
        <span class="summary-value">${appointment.serviceName}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Date:</span>
        <span class="summary-value">${formatDate(appointment.date)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Time:</span>
        <span class="summary-value">${formatTime(
          appointment.startTime
        )} - ${formatTime(appointment.endTime)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Email:</span>
        <span class="summary-value">${appointment.email}</span>
      </div>
      ${
        appointment.phone
          ? `
      <div class="summary-item">
        <span class="summary-label">Phone:</span>
        <span class="summary-value">${appointment.phone}</span>
      </div>
      `
          : ""
      }
      <div class="appointment-id">
        Appointment ID: ${appointment.id}
      </div>
      <a href="#" class="cancel-link" onclick="cancelAppointmentById('${
        appointment.id
      }'); return false;">
        Cancel this appointment
      </a>
    `;
  }

  goToStep("confirmation");
}

function resetBooking() {
  bookingState = { service: null, date: null, time: null, duration: null };
  clearBookingState(); // Clear from sessionStorage
  if (contactForm) contactForm.reset();
  goToStep("service");
}

// Email Reminder Function
async function sendEmailReminder(appointment) {
  if (typeof emailjs === "undefined") {
    console.log("EmailJS not configured. Skipping email reminder.");
    return;
  }

  try {
    const templateParams = {
      to_name: appointment.name,
      to_email: appointment.email,
      appointment_date: formatDate(appointment.date),
      appointment_time: `${formatTime(appointment.startTime)} - ${formatTime(
        appointment.endTime
      )}`,
      appointment_service: appointment.serviceName,
      message:
        "This is a reminder of your upcoming athletic training appointment.",
    };

    // Uncomment and configure these with your EmailJS service ID and template ID
    // await emailjs.send(
    //   "YOUR_SERVICE_ID",
    //   "YOUR_TEMPLATE_ID",
    //   templateParams
    // );

    console.log("Email reminder sent successfully");
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

// Dashboard Functions
function displayDashboard() {
  const appointments = getAppointments();
  const stats = calculateStats(appointments);
  updateStats(stats);
  displayAppointments(appointments);
}

function calculateStats(appointments) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Filter out canceled appointments for active stats
  const activeAppointments = appointments.filter(
    (apt) => apt.status !== "canceled"
  );

  let upcoming = 0;
  let todayCount = 0;

  activeAppointments.forEach((apt) => {
    const aptDate = new Date(`${apt.date}T${apt.startTime}`);
    if (aptDate >= today && aptDate < weekFromNow) {
      upcoming++;
    }
    if (isToday(apt.date)) {
      todayCount++;
    }
  });

  return {
    total: activeAppointments.length,
    upcoming,
    today: todayCount,
  };
}

function updateStats(stats) {
  const totalEl = document.getElementById("total-appointments");
  const upcomingEl = document.getElementById("upcoming-appointments");
  const todayEl = document.getElementById("today-appointments");

  if (totalEl) totalEl.textContent = stats.total;
  if (upcomingEl) upcomingEl.textContent = stats.upcoming;
  if (todayEl) todayEl.textContent = stats.today;
}

function displayAppointments(appointments) {
  const listContainer = document.getElementById("appointments-list");

  if (appointments.length === 0) {
    listContainer.innerHTML =
      '<div class="empty-state"><p>No appointments scheduled yet.</p></div>';
    return;
  }

  appointments.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`);
    const dateB = new Date(`${b.date}T${b.startTime}`);
    return dateA - dateB;
  });

  const filteredAppointments = applyFilters(appointments);

  if (filteredAppointments.length === 0) {
    listContainer.innerHTML =
      '<div class="empty-state"><p>No appointments match your filters.</p></div>';
    return;
  }

  listContainer.innerHTML = filteredAppointments
    .map((apt) => createAppointmentCard(apt))
    .join("");
}

function createAppointmentCard(appointment) {
  const isPastAppt = isPast(appointment.date, appointment.startTime);
  const isTodayAppt = isToday(appointment.date);
  const isCanceled = appointment.status === "canceled";
  const cardClass = isCanceled
    ? "past"
    : isPastAppt
    ? "past"
    : isTodayAppt
    ? "today"
    : "";
  const serviceName =
    appointment.serviceName || getServiceLabel(appointment.reason);

  return `
    <div class="appointment-card ${cardClass}" data-id="${appointment.id}">
      <div class="appointment-header">
        <div class="appointment-info">
          <div class="appointment-name">
            ${appointment.name}
            ${
              isCanceled
                ? '<span style="color: #dc3545; font-size: 0.875rem; font-weight: normal; margin-left: 0.5rem;">(Canceled)</span>'
                : ""
            }
          </div>
          <div class="appointment-contact">
            <div>📧 ${appointment.email}</div>
            ${appointment.phone ? `<div>📞 ${appointment.phone}</div>` : ""}
          </div>
          <div class="appointment-datetime">
            <div class="datetime-item">📅 ${formatDate(appointment.date)}</div>
            <div class="datetime-item">🕐 ${formatTime(
              appointment.startTime
            )} - ${formatTime(appointment.endTime)}</div>
          </div>
          <span class="appointment-reason">${serviceName}</span>
          <div class="appointment-notes" id="notes-${appointment.id}">
            ${
              appointment.notes
                ? `
              <div style="margin-top: 0.75rem;">
                <strong>Notes:</strong>
                <p style="margin-top: 0.25rem; color: var(--text-light); font-size: 0.875rem;">${appointment.notes}</p>
                <button class="btn-edit" onclick="editNotes('${appointment.id}')" style="margin-top: 0.5rem;">Edit Notes</button>
              </div>
            `
                : `
              <button class="btn-edit" onclick="editNotes('${appointment.id}')" style="margin-top: 0.75rem;">Add Notes</button>
            `
            }
          </div>
        </div>
        <div class="appointment-actions">
          ${
            !isCanceled
              ? `
            <button class="btn-icon" onclick="cancelAppointment('${appointment.id}')" title="Cancel appointment" style="color: #dc3545;">
              ✕
            </button>
          `
              : ""
          }
          <button class="btn-icon btn-delete" onclick="deleteAppointment('${
            appointment.id
          }')" title="Delete appointment">
            🗑️
          </button>
        </div>
      </div>
    </div>
  `;
}

// Edit notes for an appointment
function editNotes(appointmentId) {
  const appointments = getAppointments();
  const appointment = appointments.find((apt) => apt.id === appointmentId);
  if (!appointment) return;

  const notesContainer = document.getElementById(`notes-${appointmentId}`);
  if (!notesContainer) return;

  const currentNotes = appointment.notes || "";

  notesContainer.innerHTML = `
    <div style="margin-top: 0.75rem;">
      <textarea id="notes-input-${appointmentId}" style="width: 100%; min-height: 80px; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px; font-family: inherit; font-size: 0.875rem; resize: vertical;">${currentNotes}</textarea>
      <div class="appointment-notes-actions" style="margin-top: 0.5rem;">
        <button class="btn-save-notes" onclick="saveNotes('${appointmentId}')">Save</button>
        <button class="btn-cancel-notes" onclick="cancelEditNotes('${appointmentId}')">Cancel</button>
      </div>
    </div>
  `;
}

function saveNotes(appointmentId) {
  const notesInput = document.getElementById(`notes-input-${appointmentId}`);
  if (!notesInput) return;

  const notes = notesInput.value.trim();
  const appointments = getAppointments();
  const updated = appointments.map((apt) => {
    if (apt.id === appointmentId) {
      return { ...apt, notes };
    }
    return apt;
  });

  saveAppointments(updated);
  displayDashboard(); // Refresh to show updated notes
}

function cancelEditNotes(appointmentId) {
  displayDashboard(); // Just refresh to show original state
}

function applyFilters(appointments) {
  const searchTerm =
    document.getElementById("search-input")?.value.toLowerCase() || "";
  const dateFilter = document.getElementById("filter-date")?.value || "all";
  const reasonFilter = document.getElementById("filter-reason")?.value || "all";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  return appointments.filter((apt) => {
    if (searchTerm) {
      const searchable = `${apt.name} ${apt.email} ${apt.phone}`.toLowerCase();
      if (!searchable.includes(searchTerm)) return false;
    }

    const aptDate = new Date(`${apt.date}T${apt.startTime}`);
    switch (dateFilter) {
      case "today":
        if (!isToday(apt.date)) return false;
        break;
      case "week":
        if (aptDate < today || aptDate >= weekFromNow) return false;
        break;
      case "month":
        if (aptDate < today || aptDate >= monthFromNow) return false;
        break;
      case "upcoming":
        if (aptDate < today) return false;
        break;
      case "past":
        if (aptDate >= today) return false;
        break;
    }

    if (reasonFilter !== "all" && apt.reason !== reasonFilter) return false;

    return true;
  });
}

// Cancel appointment by ID (from confirmation page)
function cancelAppointmentById(id) {
  if (!confirm("Are you sure you want to cancel this appointment?")) {
    return;
  }

  const appointments = getAppointments();
  const updated = appointments.map((apt) => {
    if (apt.id === id) {
      return { ...apt, status: "canceled" };
    }
    return apt;
  });

  saveAppointments(updated);

  // If on confirmation page, show canceled message
  const confirmation = document.getElementById("step-confirmation");
  if (confirmation && confirmation.classList.contains("active-step")) {
    const details = document.getElementById("confirmation-details");
    if (details) {
      details.innerHTML = `
        <div class="summary-item">
          <span class="summary-label">Status:</span>
          <span class="summary-value" style="color: #dc3545;">Canceled</span>
        </div>
        <p style="margin-top: 1rem; color: var(--text-light);">
          Your appointment has been canceled successfully.
        </p>
      `;
    }
  } else {
    displayDashboard();
    alert("Appointment canceled successfully.");
  }
}

// Delete appointment (from dashboard - permanent deletion)
function deleteAppointment(id) {
  if (
    !confirm(
      "Are you sure you want to permanently delete this appointment? This cannot be undone."
    )
  ) {
    return;
  }

  const appointments = getAppointments();
  const filtered = appointments.filter((apt) => apt.id !== id);
  saveAppointments(filtered);
  displayDashboard();
}

// Cancel appointment (from dashboard - marks as canceled)
function cancelAppointment(id) {
  if (!confirm("Are you sure you want to cancel this appointment?")) {
    return;
  }

  const appointments = getAppointments();
  const updated = appointments.map((apt) => {
    if (apt.id === id) {
      return { ...apt, status: "canceled" };
    }
    return apt;
  });

  saveAppointments(updated);
  displayDashboard();
}

// Filter event listeners
const searchInput = document.getElementById("search-input");
const filterDate = document.getElementById("filter-date");
const filterReason = document.getElementById("filter-reason");

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const appointments = getAppointments();
    displayAppointments(appointments);
  });
}

if (filterDate) {
  filterDate.addEventListener("change", () => {
    const appointments = getAppointments();
    displayAppointments(appointments);
  });
}

if (filterReason) {
  filterReason.addEventListener("change", () => {
    const appointments = getAppointments();
    displayAppointments(appointments);
  });
}

// Export to CSV
const exportBtn = document.getElementById("export-btn");
if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    const appointments = getAppointments();
    if (appointments.length === 0) {
      alert("No appointments to export.");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Date",
      "Start Time",
      "End Time",
      "Service",
      "Duration (mins)",
      "Notes",
      "Created At",
    ];
    const rows = appointments.map((apt) => [
      apt.name,
      apt.email,
      apt.phone,
      apt.date,
      apt.startTime,
      apt.endTime,
      apt.serviceName || getServiceLabel(apt.reason),
      apt.duration || 30,
      apt.notes || "",
      apt.createdAt,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `appointments_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

// Refresh button
const refreshBtn = document.getElementById("refresh-btn");
if (refreshBtn) {
  refreshBtn.addEventListener("click", () => {
    displayDashboard();
  });
}

// Dashboard link
const dashboardLink = document.getElementById("dashboard-link");
if (dashboardLink) {
  dashboardLink.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".booking-step").forEach((step) => {
      step.classList.remove("active-step");
    });
    const dashboard = document.getElementById("dashboard");
    if (dashboard) {
      dashboard.style.display = "block";
      displayDashboard();
    }
  });
}

// Back to booking button
const backToBookingBtn = document.getElementById("back-to-booking");
if (backToBookingBtn) {
  backToBookingBtn.addEventListener("click", () => {
    const dashboard = document.getElementById("dashboard");
    if (dashboard) {
      dashboard.style.display = "none";
    }
    resetBooking();
  });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  initializeServices();

  // Check for cancel token in URL
  const urlParams = new URLSearchParams(window.location.search);
  const cancelToken = urlParams.get("cancel");
  if (cancelToken) {
    const appointments = getAppointments();
    const appointment = appointments.find(
      (apt) => apt.cancelToken === cancelToken
    );
    if (appointment) {
      if (
        confirm(
          `Cancel appointment for ${appointment.name} on ${formatDate(
            appointment.date
          )} at ${formatTime(appointment.startTime)}?`
        )
      ) {
        cancelAppointmentById(appointment.id);
        // Clean up URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    } else {
      alert(
        "Invalid cancellation link. The appointment may have already been canceled or does not exist."
      );
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  // Load booking state from sessionStorage
  loadBookingState();

  // Handle browser history navigation
  window.addEventListener("popstate", (e) => {
    const hash = window.location.hash;
    if (hash === "#dashboard") {
      document.querySelectorAll(".booking-step").forEach((step) => {
        step.classList.remove("active-step");
      });
      const dashboard = document.getElementById("dashboard");
      if (dashboard) {
        dashboard.style.display = "block";
        displayDashboard();
      }
    } else {
      const dashboard = document.getElementById("dashboard");
      if (dashboard) {
        dashboard.style.display = "none";
      }
      const stepMatch = hash.match(/^#step-(.+)$/);
      if (stepMatch) {
        goToStep(stepMatch[1], true); // Skip history update
      } else {
        goToStep("service", true);
      }
    }
  });

  // Check if we're on dashboard
  if (window.location.hash === "#dashboard") {
    const dashboard = document.getElementById("dashboard");
    if (dashboard) {
      dashboard.style.display = "block";
      displayDashboard();
    }
  } else {
    // Check hash for step navigation
    const hash = window.location.hash;
    const stepMatch = hash.match(/^#step-(.+)$/);
    if (stepMatch) {
      goToStep(stepMatch[1], true);
    } else {
      goToStep("service", true);
    }
  }

  // Schedule reminders
  scheduleReminders();
  setInterval(scheduleReminders, 60 * 60 * 1000); // Check every hour
});

// Schedule email reminders
function scheduleReminders() {
  const appointments = getAppointments();
  const now = new Date();

  appointments.forEach((apt) => {
    const aptDateTime = new Date(`${apt.date}T${apt.startTime}`);
    const timeDiff = aptDateTime - now;

    // Send 24-hour reminder
    if (
      timeDiff > 0 &&
      timeDiff <= 25 * 60 * 60 * 1000 &&
      !apt.reminder24hSent
    ) {
      sendEmailReminder(apt).then(() => {
        apt.reminder24hSent = true;
        const appointments = getAppointments();
        const updated = appointments.map((a) => (a.id === apt.id ? apt : a));
        saveAppointments(updated);
      });
    }

    // Send 2-hour reminder
    if (
      timeDiff > 0 &&
      timeDiff <= 2.5 * 60 * 60 * 1000 &&
      !apt.reminder2hSent
    ) {
      sendEmailReminder(apt).then(() => {
        apt.reminder2hSent = true;
        const appointments = getAppointments();
        const updated = appointments.map((a) => (a.id === apt.id ? apt : a));
        saveAppointments(updated);
      });
    }
  });
}
