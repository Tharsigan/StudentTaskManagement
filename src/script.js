"use strict";

const BORROWING_DAYS = 7;
const FINE_PER_DAY = 500;

const STORAGE_KEYS = {
    books: "libraflow_books_v1",
    records: "libraflow_lending_records_v1",
    reservations: "libraflow_reservations_v1",
    theme: "libraflow_theme_v1"
};

const PAGE_INFO = {
    dashboard: ["Dashboard", "Your library at a glance."],
    books: ["Book Collection", "Manage books, copies, and availability."],
    borrowing: ["Borrowing", "Borrower-focused view of active book loans and deadlines."],
    lending: ["Lending Management", "Librarian-focused issue, return, and fine management."],
    reservations: ["Reservations", "Manage book reservation requests."],
    history: ["Lending History", "Review past and current lending transactions."]
};

const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

let books = readStorage(STORAGE_KEYS.books, null);
let records = readStorage(STORAGE_KEYS.records, []);
let reservations = readStorage(STORAGE_KEYS.reservations, []);
let currentPage = "dashboard";
let currentModalSubmit = null;

if (!Array.isArray(records)) records = [];
if (!Array.isArray(reservations)) reservations = [];

if (!Array.isArray(books)) {
    books = [
        { id: 1, title: "Atomic Habits", author: "James Clear", isbn: "9780735211292", category: "Self Development", total: 4 },
        { id: 2, title: "The Psychology of Money", author: "Morgan Housel", isbn: "9780857197689", category: "Finance", total: 3 },
        { id: 3, title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", category: "Technology", total: 2 },
        { id: 4, title: "Deep Work", author: "Cal Newport", isbn: "9781455586691", category: "Productivity", total: 3 },
        { id: 5, title: "Rich Dad Poor Dad", author: "Robert T. Kiyosaki", isbn: "9781612680194", category: "Finance", total: 4 },
        { id: 6, title: "The Alchemist", author: "Paulo Coelho", isbn: "9780061122415", category: "Fiction", total: 2 }
    ];
}

function saveData() {
    localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(books));
    localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
    localStorage.setItem(STORAGE_KEYS.reservations, JSON.stringify(reservations));
}

function localDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
    const date = new Date(`${dateString}T12:00:00`);
    date.setDate(date.getDate() + days);
    return localDate(date);
}

function formatDate(dateString) {
    if (!dateString) return "—";
    const date = new Date(`${dateString}T12:00:00`);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatMoney(amount) {
    return "LKR " + Number(amount || 0).toLocaleString("en-LK", {
        maximumFractionDigits: 0
    });
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function nextId(items) {
    return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function findBook(bookId) {
    return books.find(book => book.id === Number(bookId));
}

function activeRecords() {
    return records.filter(record => !record.returnedOn);
}

function activeCountForBook(bookId) {
    return activeRecords().filter(record => record.bookId === Number(bookId)).length;
}

function availableCopies(book) {
    return Math.max(0, Number(book.total) - activeCountForBook(book.id));
}

function pendingReservationForBook(bookId) {
    return reservations.find(reservation =>
        reservation.bookId === Number(bookId) &&
        reservation.status === "Pending"
    );
}

function overdueDays(record, today = localDate()) {
    if (!record.dueDate || today <= record.dueDate) return 0;
    const due = new Date(`${record.dueDate}T12:00:00`);
    const current = new Date(`${today}T12:00:00`);
    return Math.max(0, Math.floor((current - due) / 86400000));
}

function currentFine(record) {
    return overdueDays(record) * FINE_PER_DAY;
}

function recordStatus(record) {
    if (record.returnedOn) return "Returned";
    if (overdueDays(record) > 0) return "Overdue";
    if (record.dueDate === localDate()) return "Due Today";
    return "Borrowed";
}

function statusClass(status) {
    const classes = {
        "Available": "available",
        "Borrowed": "borrowed",
        "Overdue": "overdue",
        "Due Today": "pending",
        "Returned": "returned",
        "Pending": "pending",
        "Fulfilled": "fulfilled",
        "Cancelled": "cancelled",
        "Active": "active"
    };
    return classes[status] || "active";
}

function statusBadge(status) {
    return `<span class="status status-${statusClass(status)}">${escapeHTML(status)}</span>`;
}

function bookTitle(bookId) {
    return findBook(bookId)?.title || "Deleted book";
}

function personCell(primary, secondary = "") {
    return `<div class="table-primary">${escapeHTML(primary)}</div>
        ${secondary ? `<div class="table-secondary">${escapeHTML(secondary)}</div>` : ""}`;
}

function emptyRow(columnCount, message) {
    return `<tr><td colspan="${columnCount}" class="empty-cell">${escapeHTML(message)}</td></tr>`;
}

function filteredRecords(input, sourceRecords = records) {
    const query = (input?.value || "").trim().toLowerCase();
    if (!query) return sourceRecords;
    return sourceRecords.filter(record => {
        const text = [
            bookTitle(record.bookId),
            record.borrower,
            record.borrowerContact,
            record.id
        ].join(" ").toLowerCase();
        return text.includes(query);
    });
}

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    $("#toastContainer").appendChild(toast);
    setTimeout(() => toast.remove(), 3800);
}

function navigateTo(page) {
    if (!PAGE_INFO[page]) return;
    currentPage = page;

    $$(".page").forEach(section => {
        section.classList.toggle("active", section.id === `page-${page}`);
    });

    $$(".nav-link").forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });

    $("#pageTitle").textContent = PAGE_INFO[page][0];
    $("#pageSubtitle").textContent = PAGE_INFO[page][1];

    renderAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function openModal(title, fields, submitLabel, onSubmit, eyebrow = "LIBRARY MANAGEMENT") {
    $("#modalTitle").textContent = title;
    $("#modalEyebrow").textContent = eyebrow;
    $("#modalSubmit").textContent = submitLabel;

    const container = $("#modalFields");
    container.replaceChildren();

    fields.forEach(field => {
        const wrapper = document.createElement("div");
        wrapper.className = `form-field${field.full ? " full" : ""}`;

        const label = document.createElement("label");
        label.htmlFor = field.name;
        label.textContent = field.label;
        wrapper.appendChild(label);

        let input;

        if (field.type === "select") {
            input = document.createElement("select");
            (field.options || []).forEach(optionData => {
                const option = document.createElement("option");
                option.value = optionData.value;
                option.textContent = optionData.label;
                input.appendChild(option);
            });
        } else if (field.type === "textarea") {
            input = document.createElement("textarea");
        } else {
            input = document.createElement("input");
            input.type = field.type || "text";
        }

        input.id = field.name;
        input.name = field.name;
        input.required = Boolean(field.required);
        if (field.value !== undefined) input.value = field.value;
        if (field.min !== undefined) input.min = field.min;
        if (field.max !== undefined) input.max = field.max;
        if (field.step !== undefined) input.step = field.step;
        if (field.placeholder) input.placeholder = field.placeholder;
        if (field.readonly) input.readOnly = true;

        if (field.type === "select") {
            input.value = field.value ?? (field.options?.[0]?.value ?? "");
        }

        wrapper.appendChild(input);

        if (field.hint) {
            const hint = document.createElement("small");
            hint.className = "form-hint";
            hint.textContent = field.hint;
            wrapper.appendChild(hint);
        }

        container.appendChild(wrapper);
    });

    currentModalSubmit = onSubmit;
    $("#modalBackdrop").classList.add("open");

    const firstInput = container.querySelector("input:not([readonly]), select, textarea");
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
}

function closeModal() {
    $("#modalBackdrop").classList.remove("open");
    $("#modalForm").reset();
    $("#modalFields").replaceChildren();
    currentModalSubmit = null;
}

function openAddBookModal() {
    openModal("Add a New Book", [
        { name: "title", label: "Book title", required: true, full: true, placeholder: "Enter the title" },
        { name: "author", label: "Author", required: true, placeholder: "Author name" },
        { name: "isbn", label: "ISBN", required: true, placeholder: "ISBN number" },
        { name: "category", label: "Category", required: true, placeholder: "e.g. Science" },
        { name: "total", label: "Total copies", type: "number", required: true, min: 1, step: 1, value: 1, hint: "Enter the total number of physical copies." }
    ], "Add Book", values => {
        const isbn = values.isbn.trim();

        if (books.some(book => book.isbn.toLowerCase() === isbn.toLowerCase())) {
            showToast("A book with this ISBN already exists.", "error");
            return false;
        }

        books.push({
            id: nextId(books),
            title: values.title.trim(),
            author: values.author.trim(),
            isbn,
            category: values.category.trim(),
            total: Number(values.total)
        });

        saveData();
        closeModal();
        renderAll();
        showToast("Book added to the collection.");
        return true;
    });
}

function openBorrowModal(prefilledBookId = "") {
    const availableBooks = books.filter(book => availableCopies(book) > 0);

    if (!availableBooks.length) {
        showToast("No book copies are currently available to borrow.", "error");
        navigateTo("books");
        return;
    }

    const bookOptions = availableBooks.map(book => ({
        value: String(book.id),
        label: `${book.title} — ${availableCopies(book)} available`
    }));

    const initialBookId = availableBooks.some(book => String(book.id) === String(prefilledBookId))
        ? String(prefilledBookId)
        : bookOptions[0].value;

    const fields = [
        { name: "bookId", label: "Select book", type: "select", options: bookOptions, value: initialBookId, required: true, full: true },
        { name: "borrower", label: "Borrower's full name", required: true, placeholder: "Enter full name" },
        { name: "borrowerContact", label: "Contact / Student ID", required: true, placeholder: "Phone or student ID" },
        { name: "borrowDate", label: "Borrow date", type: "date", required: true, value: localDate(), full: true },
        { name: "dueDate", label: "Return due date", type: "date", required: true, readonly: true, value: addDays(localDate(), BORROWING_DAYS), full: true, hint: "Automatically set to 7 calendar days after the borrow date." }
    ];

    openModal("Borrow a Book", fields, "Confirm Borrowing", values => {
        const book = findBook(values.bookId);

        if (!book || availableCopies(book) < 1) {
            showToast("This book has no available copies.", "error");
            return false;
        }

        if (!values.borrowDate || values.borrowDate > localDate()) {
            showToast("The borrow date cannot be in the future.", "error");
            return false;
        }

        const dueDate = addDays(values.borrowDate, BORROWING_DAYS);

        const pending = pendingReservationForBook(book.id);
        if (pending && pending.borrower.toLowerCase() !== values.borrower.trim().toLowerCase()) {
            const proceed = window.confirm(
                `This book is reserved by ${pending.borrower}. Cancel that reservation and lend it to ${values.borrower}?`
            );
            if (!proceed) return false;
        }

        if (pending) {
            pending.status = "Fulfilled";
            pending.fulfilledOn = localDate();
        }

        records.push({
            id: nextId(records),
            bookId: book.id,
            borrower: values.borrower.trim(),
            borrowerContact: values.borrowerContact.trim(),
            borrowedOn: values.borrowDate,
            dueDate,
            returnedOn: "",
            finePaid: 0,
            fineRecorded: 0
        });

        saveData();
        closeModal();
        renderAll();
        showToast(`Book borrowed successfully. Due date: ${formatDate(dueDate)}.`);
        return true;
    });

    const borrowDateInput = $("#borrowDate");
    const dueDateInput = $("#dueDate");

    borrowDateInput.addEventListener("change", () => {
        if (borrowDateInput.value) {
            dueDateInput.value = addDays(borrowDateInput.value, BORROWING_DAYS);
        }
    });
}

function openReservationModal(prefilledBookId = "") {
    const reservableBooks = books.filter(book => {
        const pending = pendingReservationForBook(book.id);
        return !pending;
    });

    if (!reservableBooks.length) {
        showToast("Every book already has a pending reservation.", "error");
        return;
    }

    const options = reservableBooks.map(book => ({
        value: String(book.id),
        label: `${book.title} (${availableCopies(book)} available)`
    }));

    const selected = options.some(option => option.value === String(prefilledBookId))
        ? String(prefilledBookId)
        : options[0].value;

    openModal("Create a Reservation", [
        { name: "bookId", label: "Book", type: "select", options, value: selected, required: true, full: true },
        { name: "borrower", label: "Requester's full name", required: true, placeholder: "Enter full name" },
        { name: "contact", label: "Contact / Student ID", required: true, placeholder: "Phone or student ID" },
        { name: "requestedOn", label: "Request date", type: "date", value: localDate(), required: true, full: true }
    ], "Create Reservation", values => {
        const book = findBook(values.bookId);
        if (!book) {
            showToast("Selected book could not be found.", "error");
            return false;
        }

        if (pendingReservationForBook(book.id)) {
            showToast("This book already has a pending reservation.", "error");
            return false;
        }

        reservations.push({
            id: nextId(reservations),
            bookId: book.id,
            borrower: values.borrower.trim(),
            contact: values.contact.trim(),
            requestedOn: values.requestedOn,
            status: "Pending"
        });

        saveData();
        closeModal();
        renderAll();
        showToast("Reservation created successfully.");
        return true;
    });
}

function renderDashboard() {
    const active = activeRecords();
    const overdue = active.filter(record => overdueDays(record) > 0);
    const totalCopies = books.reduce((sum, book) => sum + Number(book.total), 0);
    const available = books.reduce((sum, book) => sum + availableCopies(book), 0);

    $("#statTotalBooks").textContent = totalCopies;
    $("#statAvailable").textContent = available;
    $("#statBorrowed").textContent = active.length;
    $("#statOverdue").textContent = overdue.length;

    const recent = [...active].sort((a, b) => b.id - a.id).slice(0, 6);
    $("#dashboardLending").innerHTML = recent.length ? recent.map(record => `
        <tr>
            <td>${personCell(bookTitle(record.bookId), record.borrower)}</td>
            <td>${formatDate(record.dueDate)}</td>
            <td>${statusBadge(recordStatus(record))}</td>
        </tr>
    `).join("") : emptyRow(3, "No active lending records yet.");

    $("#dashboardOverdue").innerHTML = overdue.length ? overdue.map(record => `
        <tr>
            <td>${personCell(bookTitle(record.bookId), record.borrower)}</td>
            <td>${formatDate(record.dueDate)}</td>
            <td>${overdueDays(record)}</td>
            <td><strong>${formatMoney(currentFine(record))}</strong></td>
        </tr>
    `).join("") : emptyRow(4, "Great! There are no overdue books.");
}

function renderBooks() {
    const query = ($("#bookSearch").value || "").trim().toLowerCase();
    const filter = $("#bookFilter").value;

    const filtered = books.filter(book => {
        const matches = [book.title, book.author, book.isbn, book.category]
            .join(" ").toLowerCase().includes(query);

        const available = availableCopies(book);
        const matchesFilter =
            filter === "all" ||
            (filter === "available" && available > 0) ||
            (filter === "borrowed" && available === 0);

        return matches && matchesFilter;
    });

    const totalCopies = books.reduce((sum, book) => sum + Number(book.total), 0);
    $("#collectionSummary").textContent =
        `${books.length} unique titles · ${totalCopies} total copies · ${books.reduce((sum, book) => sum + availableCopies(book), 0)} available copies`;

    $("#booksGrid").innerHTML = filtered.length ? filtered.map(book => {
        const available = availableCopies(book);
        const tone = Math.abs(Number(book.id)) % 6;
        const pending = pendingReservationForBook(book.id);

        return `
            <article class="book-card">
                <div class="book-cover">
                    <div class="cover-symbol cover-tone-${tone}">${escapeHTML(book.title.charAt(0).toUpperCase())}</div>
                    <div class="book-availability">${statusBadge(available > 0 ? "Available" : "Borrowed")}</div>
                </div>
                <div class="book-card-content">
                    <h3>${escapeHTML(book.title)}</h3>
                    <p class="book-author">by ${escapeHTML(book.author)}</p>
                    <div class="book-meta">
                        <span>Category <strong>${escapeHTML(book.category)}</strong></span>
                        <span>ISBN <strong>${escapeHTML(book.isbn)}</strong></span>
                        <span>Copies <strong>${available} available / ${book.total} total</strong></span>
                        ${pending ? `<span>Reservation <strong>${escapeHTML(pending.borrower)}</strong></span>` : ""}
                    </div>
                    <div class="book-card-actions">
                        <button class="button button-primary" data-action="borrow-book" data-id="${book.id}" ${available < 1 ? "disabled" : ""}>Borrow</button>
                        <button class="button button-secondary" data-action="add-reservation" data-id="${book.id}">Reserve</button>
                        <button class="row-action danger" data-action="delete-book" data-id="${book.id}" aria-label="Delete ${escapeHTML(book.title)}">×</button>
                    </div>
                </div>
            </article>
        `;
    }).join("") : `<div class="panel"><p class="empty-cell">No books match your search.</p></div>`;
}

function renderBorrowing() {
    const active = activeRecords();
    const dueToday = active.filter(record => record.dueDate === localDate());
    const overdue = active.filter(record => overdueDays(record) > 0);

    $("#borrowActiveCount").textContent = active.length;
    $("#borrowDueTodayCount").textContent = dueToday.length;
    $("#borrowOverdueCount").textContent = overdue.length;

    const filtered = filteredRecords($("#borrowingSearch"), active);

    $("#borrowingTable").innerHTML = filtered.length ? filtered.map(record => `
        <tr>
            <td>${personCell(bookTitle(record.bookId), `Record #${record.id}`)}</td>
            <td>${personCell(record.borrower, record.borrowerContact)}</td>
            <td>${formatDate(record.borrowedOn)}</td>
            <td>${formatDate(record.dueDate)}</td>
            <td>${statusBadge(recordStatus(record))}</td>
            <td><button class="row-action" data-action="return-book" data-id="${record.id}">Return book</button></td>
        </tr>
    `).join("") : emptyRow(6, active.length ? "No borrowing records match your search." : "No books are currently borrowed.");
}

function renderLending() {
    const active = activeRecords();
    const returned = records.filter(record => record.returnedOn);
    const fineTotal = active.reduce((sum, record) => sum + currentFine(record), 0);

    $("#lendingActiveCount").textContent = active.length;
    $("#lendingFineTotal").textContent = formatMoney(fineTotal);
    $("#lendingReturnedCount").textContent = returned.length;

    const filtered = filteredRecords($("#lendingSearch"), active);

    $("#lendingTable").innerHTML = filtered.length ? filtered.map(record => `
        <tr>
            <td>${personCell(bookTitle(record.bookId), record.borrower)}</td>
            <td>${formatDate(record.borrowedOn)}</td>
            <td>${formatDate(record.dueDate)}</td>
            <td><strong>${formatMoney(currentFine(record))}</strong></td>
            <td>${statusBadge(recordStatus(record))}</td>
            <td><button class="row-action" data-action="return-book" data-id="${record.id}">Process return</button></td>
        </tr>
    `).join("") : emptyRow(6, active.length ? "No lending records match your search." : "There are no active lending records.");
}

function renderReservations() {
    const sorted = [...reservations].sort((a, b) => b.id - a.id);

    $("#reservationsTable").innerHTML = sorted.length ? sorted.map(reservation => `
        <tr>
            <td>${personCell(bookTitle(reservation.bookId), `Reservation #${reservation.id}`)}</td>
            <td>${personCell(reservation.borrower, reservation.contact)}</td>
            <td>${formatDate(reservation.requestedOn)}</td>
            <td>${statusBadge(reservation.status)}</td>
            <td>
                ${reservation.status === "Pending"
                    ? `<button class="row-action danger" data-action="cancel-reservation" data-id="${reservation.id}">Cancel</button>`
                    : `<span class="table-secondary">${reservation.fulfilledOn ? `Processed ${formatDate(reservation.fulfilledOn)}` : "—"}</span>`}
            </td>
        </tr>
    `).join("") : emptyRow(5, "No reservations have been created.");
}

function renderHistory() {
    const returned = records.filter(record => record.returnedOn);
    const recordedFineTotal = records.reduce((sum, record) => sum + Number(record.fineRecorded || 0), 0);

    $("#historyTotalCount").textContent = records.length;
    $("#historyReturnedCount").textContent = returned.length;
    $("#historyFineTotal").textContent = formatMoney(recordedFineTotal);

    const filtered = filteredRecords($("#historySearch"), [...records].sort((a, b) => b.id - a.id));

    $("#historyTable").innerHTML = filtered.length ? filtered.map(record => {
        const status = record.returnedOn ? "Returned" : recordStatus(record);
        const fine = record.returnedOn
            ? Number(record.fineRecorded || 0)
            : currentFine(record);

        return `
            <tr>
                <td>${personCell(bookTitle(record.bookId), record.borrower)}</td>
                <td>${formatDate(record.borrowedOn)}</td>
                <td>${formatDate(record.dueDate)}</td>
                <td>${formatDate(record.returnedOn)}</td>
                <td><strong>${formatMoney(fine)}</strong></td>
                <td>${statusBadge(status)}</td>
            </tr>
        `;
    }).join("") : emptyRow(6, "No lending history matches your search.");
}

function renderAll() {
    renderDashboard();
    renderBooks();
    renderBorrowing();
    renderLending();
    renderReservations();
    renderHistory();
    $("#todayDate").textContent = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function returnBook(recordId) {
    const record = records.find(item => item.id === Number(recordId));
    if (!record || record.returnedOn) {
        showToast("This book has already been returned or the record was not found.", "error");
        return;
    }

    const daysLate = overdueDays(record);
    const fine = daysLate * FINE_PER_DAY;

    const message = fine > 0
        ? `Return "${bookTitle(record.bookId)}" from ${record.borrower}?\n\nDue date: ${formatDate(record.dueDate)}\nOverdue days: ${daysLate}\nFine due: ${formatMoney(fine)}\n\nConfirming records the fine. It does not process an actual payment.`
        : `Return "${bookTitle(record.bookId)}" from ${record.borrower}?\n\nNo overdue fine is due.`;

    if (!window.confirm(message)) return;

    record.returnedOn = localDate();
    record.fineRecorded = fine;
    record.finePaid = 0;

    saveData();
    renderAll();

    if (fine > 0) {
        showToast(`Book returned. Fine recorded: ${formatMoney(fine)}. Payment must be collected separately.`);
    } else {
        showToast("Book returned successfully. No overdue fine.");
    }
}

function deleteBook(bookId) {
    const book = findBook(bookId);
    if (!book) return;

    const hasActiveLoan = activeRecords().some(record => record.bookId === book.id);
    if (hasActiveLoan) {
        showToast("This book has an active loan. Process the return before deleting it.", "error");
        return;
    }

    const confirmed = window.confirm(
        `Delete "${book.title}" from the collection?\n\nExisting lending history will remain in the system.`
    );
    if (!confirmed) return;

    books = books.filter(item => item.id !== book.id);
    reservations.forEach(reservation => {
        if (reservation.bookId === book.id && reservation.status === "Pending") {
            reservation.status = "Cancelled";
        }
    });

    saveData();
    renderAll();
    showToast("Book removed from the collection.");
}

function cancelReservation(reservationId) {
    const reservation = reservations.find(item => item.id === Number(reservationId));
    if (!reservation || reservation.status !== "Pending") return;

    if (!window.confirm(`Cancel the reservation by ${reservation.borrower}?`)) return;

    reservation.status = "Cancelled";
    saveData();
    renderAll();
    showToast("Reservation cancelled.");
}

function handleAction(action, id) {
    switch (action) {
        case "add-book":
            openAddBookModal();
            break;
        case "borrow-book":
            openBorrowModal(id || "");
            break;
        case "add-reservation":
            openReservationModal(id || "");
            break;
        case "return-book":
            returnBook(id);
            break;
        case "delete-book":
            deleteBook(id);
            break;
        case "cancel-reservation":
            cancelReservation(id);
            break;
        default:
            break;
    }
}

function setTheme(theme) {
    document.body.classList.toggle("dark", theme === "dark");
    $("#themeIcon").textContent = theme === "dark" ? "☀" : "☾";
    $("#themeText").textContent = theme === "dark" ? "Light mode" : "Dark mode";
    localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function initialiseEvents() {
    $$(".nav-link").forEach(button => {
        button.addEventListener("click", () => navigateTo(button.dataset.page));
    });

    $$("[data-go]").forEach(button => {
        button.addEventListener("click", () => navigateTo(button.dataset.go));
    });

    document.addEventListener("click", event => {
        const actionButton = event.target.closest("[data-action]");
        if (!actionButton) return;

        handleAction(actionButton.dataset.action, actionButton.dataset.id);
    });

    $("#headerAddBook").addEventListener("click", openAddBookModal);

    $("#themeToggle").addEventListener("click", () => {
        const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
        setTheme(nextTheme);
    });

    $("#bookSearch").addEventListener("input", renderBooks);
    $("#bookFilter").addEventListener("change", renderBooks);
    $("#borrowingSearch").addEventListener("input", renderBorrowing);
    $("#lendingSearch").addEventListener("input", renderLending);
    $("#historySearch").addEventListener("input", renderHistory);

    $("#modalClose").addEventListener("click", closeModal);
    $("#modalCancel").addEventListener("click", closeModal);

    $("#modalBackdrop").addEventListener("click", event => {
        if (event.target === $("#modalBackdrop")) closeModal();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeModal();
    });

    $("#modalForm").addEventListener("submit", event => {
        event.preventDefault();
        if (!currentModalSubmit) return;

        const formData = new FormData(event.currentTarget);
        const values = Object.fromEntries(formData.entries());

        const succeeded = currentModalSubmit(values);
        if (succeeded) closeModal();
    });
}

function initialise() {
    setTheme(readStorage(STORAGE_KEYS.theme, "light"));
    initialiseEvents();
    saveData();
    renderAll();
}

initialise();