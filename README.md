# Student Result & Record Management System (SRS)

A clean, modern, and minimal frontend-only web application for managing academic results, grade calculations, student directories, and marks evaluation.

Built entirely using **HTML5**, **CSS3**, and **Vanilla JavaScript** (ES6+). Zero third-party dependencies, zero build steps required.

---

## 🌟 Key Features

### 🎓 1. Student Result Portal
- **Roll Number Lookup**: Instant selector to switch between enrolled students or search by roll number.
- **Dynamic GPA & CGPA Engine**:
  - Automatically calculates **SGPA** (Semester Grade Point Average) based on course credits and 10-point grade scale.
  - Automatically calculates **CGPA** (Cumulative Grade Point Average) across academic history.
  - Generates clear performance status: `DISTINCTION`, `FIRST CLASS`, `SECOND CLASS`, or `BACKLOG / FAILED`.
- **Detailed Subject Marks Breakdown**: Shows Course Code, Subject Title, Credits, Internal Marks, Semester Exam Marks, Total, Letter Grade (O, A+, A, B+, B, C, P, F), and Grade Points.
- **Visual Performance Indicator**: Subject-wise progress bar reflecting percentage score.
- **Official Printable Marksheet**: Formatted with institutional header, student credentials, subject ledger, and Dean / Controller of Examinations signature blocks for single-click clean printing or saving to PDF.

### 👨‍🏫 2. Faculty / Teacher Portal
- **Department & Class Filtering**: Filter roster by Department (`CSE`, `IT`), Semester (`5`), and Course.
- **Course Weightage Display**: Displays active course credit weightage, maximum internal marks, and maximum external marks.
- **Real-Time Marks Entry**:
  - Tabular roster input for Internal and External exam marks.
  - Instant auto-grading: totals, letter grades, and grade points calculate live as values are typed.
  - Input validation: protects against negative numbers or values exceeding the course maximum.
- **Batch Actions**: One-click **Save All Marks** and **Autofill Demo Marks** for rapid evaluation.

### ⚙️ 3. Admin Dashboard & Control Center
- **Key Performance Indicators (KPIs)**:
  - Total Enrolled Students.
  - Overall Class Pass Percentage.
  - Class Average CGPA.
  - Department Top Performer highlight.
- **Student Directory & CRUD Management**:
  - Live search by Name or Roll Number.
  - Filter directory by Department / Branch.
  - Add new students via modal form (Roll No, Name, Branch, Semester, Section, Attendance, Email, Phone).
  - Edit existing student details or delete records with safety confirmations.
  - Quick "View Marksheet" action button jumps directly to the student's result card.
- **System Controls**:
  - **Publish / Unpublish Toggle**: Switch results between public release and faculty draft review mode.
  - **Export to CSV**: Download full class result sheet in standardized spreadsheet format.
  - **Reset Demo Data**: Restore default sample dataset at any time.

---

## 📁 Project Structure

```
SRS PROJECT/
├── index.html          # Semantic single-page application structure & modals
├── css/
│   └── style.css       # Clean, modern CSS variables, cards, tables, badges, & @media print
├── js/
│   ├── data.js         # Default database (students, subjects, marks) & LocalStorage sync
│   └── app.js          # Core application logic, evaluation formulas, and UI handlers
└── README.md           # Documentation and user guide
```

---

## 🚀 How to Run

1. Open the project folder:
   ```
   C:\Users\vikas\OneDrive\Desktop\SRS PROJECT
   ```
2. Double-click **`index.html`** to open it directly in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, Safari).
3. No web server, Node.js, or internet connection is required—all data is persisted locally in your browser's `localStorage`.

---

## 📊 10-Point Grading Scale

| Score Range (%) | Letter Grade | Grade Point | Academic Remark |
|:---------------:|:------------:|:-----------:|:----------------|
| 90 – 100        | **O**        | 10          | Outstanding     |
| 80 – 89         | **A+**       | 9           | Excellent       |
| 70 – 79         | **A**        | 8           | Very Good       |
| 60 – 69         | **B+**       | 7           | Good            |
| 55 – 59         | **B**        | 6           | Above Average   |
| 50 – 54         | **C**        | 5           | Average         |
| 40 – 49         | **P**        | 4           | Pass            |
| Below 40        | **F**        | 0           | Fail / Backlog  |

**SGPA Formula**:
$$\text{SGPA} = \frac{\sum (\text{Credits}_i \times \text{Grade Point}_i)}{\sum \text{Credits}_i}$$
