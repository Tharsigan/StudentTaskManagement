# Library Management System — Test Cases

## Test Case 1: Add a Book

**Test ID:** TC01

**Action:** Enter a valid book title and author, then click Add Book.

**Expected Result:** The book appears in the book collection with
Available status.

**Actual Result:** To be recorded during testing.

**Status:** Not Tested

---

## Test Case 2: Empty Book Title

**Test ID:** TC02

**Action:** Leave the book title empty and attempt to submit the form.

**Expected Result:** The browser prevents submission because the
book title is required.

**Actual Result:** To be recorded during testing.

**Status:** Not Tested

---

## Test Case 3: Empty Author

**Test ID:** TC03

**Action:** Enter a book title but leave the author field empty.

**Expected Result:** The browser prevents submission.

**Actual Result:** To be recorded during testing.

**Status:** Not Tested

---

## Test Case 4: Borrow a Book

**Test ID:** TC04

**Action:** Click Borrow for an available book.

**Expected Result:** The status changes to Borrowed and the
statistics update.

**Actual Result:** To be recorded during testing.

**Status:** Not Tested

---

## Test Case 5: Return a Book

**Test ID:** TC05

**Action:** Click Return for a borrowed book.

**Expected Result:** The status changes to Available and the
statistics update.

**Actual Result:** To be recorded during testing.

**Status:** Not Tested

---

## Test Case 6: Remove a Book

**Test ID:** TC06

**Action:** Click Remove and confirm the action.

**Expected Result:** The selected book disappears from the
collection and the statistics update.

**Actual Result:** To be recorded during testing.

**Status:** Not Tested

---

## Test Case 7: Search by Title

**Test ID:** TC07

**Action:** Enter a book title in the search field.

**Expected Result:** Matching books are displayed.

**Actual Result:** To be recorded during testing.

**Status:** Not Tested

---

## Test Case 8: Search by Author

**Test ID:** TC08

**Action:** Enter an author's name in the search field.

**Expected Result:** Books matching the author are displayed.

**Actual Result:** To be recorded during testing.

**Status:** Not Tested

---

## Test Case 9: Search with No Matches

**Test ID:** TC09

**Action:** Enter a search term that does not match any book.

**Expected Result:** The application displays a no-matching-books
message.

**Actual Result:** To be recorded during testing.

**Status:** Not Tested

---

## Test Case 10: Update Statistics

**Test ID:** TC10

**Action:** Add, borrow, return, and remove books.

**Expected Result:** Total, Available, and Borrowed counts remain
consistent with the book collection.

**Actual Result:** To be recorded during testing.

**Status:** Not Tested