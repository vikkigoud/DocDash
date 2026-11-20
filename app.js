/**
 * SRS - Student Result System
 * Application Logic, Evaluation Engine, UI Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const AppState = {
    currentView: 'student',
    selectedStudentId: null,
    teacherBranch: 'CSE',
    teacherSemester: '5',
    teacherSubjectCode: null,
    adminSearchQuery: '',
    adminBranchFilter: 'ALL'
  };

  // DOM Elements Cache
  const elements = {
    // Nav & System
    navInstName: document.getElementById('nav-inst-name'),
    navSessionName: document.getElementById('nav-session-name'),
    roleTabs: document.querySelectorAll('.role-tab-btn'),
    viewSections: document.querySelectorAll('.view-section'),
    statusPublishPill: document.getElementById('status-publish-pill'),
    statusPublishText: document.getElementById('status-publish-text'),
    toastContainer: document.getElementById('toast-container'),

    // Student View
    selectStudentQuick: document.getElementById('select-student-quick'),
    btnPrintResult: document.getElementById('btn-print-result'),
    studentUnpublishedNotice: document.getElementById('student-unpublished-notice'),
    studentResultContainer: document.getElementById('student-result-container'),
    resAvatar: document.getElementById('res-avatar'),
    resName: document.getElementById('res-name'),
    resRoll: document.getElementById('res-roll'),
    resBranch: document.getElementById('res-branch'),
    resSem: document.getElementById('res-sem'),
    resSec: document.getElementById('res-sec'),
    resAttendance: document.getElementById('res-attendance'),
    resTerm: document.getElementById('res-term'),
    resSgpa: document.getElementById('res-sgpa'),
    resSgpaStatus: document.getElementById('res-sgpa-status'),
    resCgpa: document.getElementById('res-cgpa'),
    resCredits: document.getElementById('res-credits'),
    resVerdict: document.getElementById('res-verdict'),
    resStanding: document.getElementById('res-standing'),
    studentMarksTbody: document.getElementById('student-marks-tbody'),

    // Print Marksheet
    printInstName: document.getElementById('print-inst-name'),
    printSubName: document.getElementById('print-sub-name'),
    printAddress: document.getElementById('print-address'),
    pName: document.getElementById('p-name'),
    pRoll: document.getElementById('p-roll'),
    pBranch: document.getElementById('p-branch'),
    pSem: document.getElementById('p-sem'),
    pSession: document.getElementById('p-session'),
    pExamMonth: document.getElementById('p-exam-month'),
    printMarksTbody: document.getElementById('print-marks-tbody'),
    pTotalCredits: document.getElementById('p-total-credits'),
    pMaxTotal: document.getElementById('p-max-total'),
    pObtainedTotal: document.getElementById('p-obtained-total'),
    pSgpaFinal: document.getElementById('p-sgpa-final'),
    pIssueDate: document.getElementById('p-issue-date'),

    // Teacher View
    teacherFilterBranch: document.getElementById('teacher-filter-branch'),
    teacherFilterSemester: document.getElementById('teacher-filter-semester'),
    teacherFilterSubject: document.getElementById('teacher-filter-subject'),
    teacherSubjectMeta: document.getElementById('teacher-subject-meta'),
    teacherRosterCount: document.getElementById('teacher-roster-count'),
    teacherMarksTbody: document.getElementById('teacher-marks-tbody'),
    btnTeacherSave: document.getElementById('btn-teacher-save'),
    btnTeacherAutofill: document.getElementById('btn-teacher-autofill'),
    thMaxInt: document.getElementById('th-max-int'),
    thMaxExt: document.getElementById('th-max-ext'),

    // Admin View
    kpiTotalStudents: document.getElementById('kpi-total-students'),
    kpiPassRate: document.getElementById('kpi-pass-rate'),
    kpiAvgCgpa: document.getElementById('kpi-avg-cgpa'),
    kpiTopper: document.getElementById('kpi-topper'),
    kpiTopperCgpa: document.getElementById('kpi-topper-cgpa'),
    adminSearchInput: document.getElementById('admin-search-input'),
    adminFilterBranch: document.getElementById('admin-filter-branch'),
    adminStudentCount: document.getElementById('admin-student-count'),
    adminStudentsTbody: document.getElementById('admin-students-tbody'),
    adminSubjectsTbody: document.getElementById('admin-subjects-tbody'),
    btnOpenAddStudent: document.getElementById('btn-open-add-student'),
    btnExportCsv: document.getElementById('btn-export-csv'),
    btnTogglePublish: document.getElementById('btn-toggle-publish'),
    btnResetData: document.getElementById('btn-reset-data'),

    // Student Modal
    modalStudent: document.getElementById('modal-student'),
    modalStudentTitle: document.getElementById('modal-student-title'),
    modalStudentClose: document.getElementById('modal-student-close'),
    modalStudentCancel: document.getElementById('modal-student-cancel'),
    formStudent: document.getElementById('form-student'),
    studentEditId: document.getElementById('student-edit-id'),
    inputRoll: document.getElementById('input-roll'),
    inputName: document.getElementById('input-name'),
    inputBranch: document.getElementById('input-branch'),
    inputSemester: document.getElementById('input-semester'),
    inputSection: document.getElementById('input-section'),
    inputAttendance: document.getElementById('input-attendance'),
    inputEmail: document.getElementById('input-email'),
    inputPhone: document.getElementById('input-phone')
  };

  // ==========================================================================
  // Helper & Evaluation Engine
  // ==========================================================================

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = '✓';
    if (type === 'danger') icon = '✕';
    if (type === 'info') icon = 'ℹ';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  function getGradeClass(grade) {
    if (grade === 'A+') return 'grade-A_plus';
    if (grade === 'B+') return 'grade-B_plus';
    return `grade-${grade}`;
  }

  function computeStudentSemesterMetrics(studentId) {
    const students = DataStore.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const subjects = DataStore.getSubjects().filter(
      sub => sub.branch === student.branch && sub.semester === student.semester
    );
    const marksData = DataStore.getMarks().filter(m => m.studentId === studentId);

    let totalCredits = 0;
    let earnedCredits = 0;
    let totalCreditPoints = 0;
    let totalMaxMarks = 0;
    let totalObtainedMarks = 0;
    let hasBacklog = false;

    const subjectBreakdown = subjects.map(sub => {
      const markEntry = marksData.find(m => m.subjectCode === sub.code) || { internal: 0, external: 0 };
      const internal = Number(markEntry.internal) || 0;
      const external = Number(markEntry.external) || 0;
      const total = internal + external;
      const maxTotal = sub.maxInternal + sub.maxExternal;
      const percentage = (total / maxTotal) * 100;
      const gradeRule = DataStore.calculateGrade(percentage);

      totalCredits += sub.credits;
      totalMaxMarks += maxTotal;
      totalObtainedMarks += total;

      if (gradeRule.grade !== 'F' && total >= 40) {
        earnedCredits += sub.credits;
        totalCreditPoints += (sub.credits * gradeRule.point);
      } else {
        hasBacklog = true;
      }

      return {
        subject: sub,
        internal,
        external,
        total,
        maxTotal,
        percentage: percentage.toFixed(1),
        grade: gradeRule.grade,
        point: gradeRule.point,
        remark: gradeRule.remark,
        creditPoints: (sub.credits * gradeRule.point).toFixed(1)
      };
    });

    const sgpa = totalCredits > 0 ? (totalCreditPoints / totalCredits).toFixed(2) : '0.00';
    // CGPA Calculation: Weighted blend of previous semesters and current semester
    const prevCgpa = student.prevCgpa || 8.0;
    const cgpa = ((prevCgpa * 4 + parseFloat(sgpa)) / 5).toFixed(2);

    let verdict = 'FIRST CLASS WITH DISTINCTION';
    if (hasBacklog) {
      verdict = 'BACKLOG / FAILED';
    } else if (parseFloat(cgpa) < 5.0) {
      verdict = 'PASS CLASS';
    } else if (parseFloat(cgpa) < 6.5) {
      verdict = 'SECOND CLASS';
    } else if (parseFloat(cgpa) < 8.0) {
      verdict = 'FIRST CLASS';
    }

    return {
      student,
      subjectBreakdown,
      totalCredits,
      earnedCredits,
      totalCreditPoints: totalCreditPoints.toFixed(1),
      totalMaxMarks,
      totalObtainedMarks,
      sgpa,
      cgpa,
      hasBacklog,
      verdict
    };
  }

  // ==========================================================================
  // View 1: Student Portal
  // ==========================================================================

  function populateStudentDropdown() {
    const students = DataStore.getStudents();
    elements.selectStudentQuick.innerHTML = '';

    students.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.rollNo} - ${s.name} (${s.branch})`;
      elements.selectStudentQuick.appendChild(opt);
    });

    if (students.length > 0) {
      if (!AppState.selectedStudentId || !students.some(s => s.id === AppState.selectedStudentId)) {
        AppState.selectedStudentId = students[0].id;
      }
      elements.selectStudentQuick.value = AppState.selectedStudentId;
    }
  }

  function renderStudentResult() {
    const settings = DataStore.getSettings();
    const isPublished = settings.resultsPublished;

    // Toggle publication banner
    if (!isPublished) {
      elements.studentUnpublishedNotice.style.display = 'block';
    } else {
      elements.studentUnpublishedNotice.style.display = 'none';
    }

    const metrics = computeStudentSemesterMetrics(AppState.selectedStudentId);
    if (!metrics) {
      elements.studentMarksTbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 2rem;">No student selected or found.</td></tr>`;
      return;
    }

    const { student, subjectBreakdown, totalCredits, earnedCredits, totalMaxMarks, totalObtainedMarks, sgpa, cgpa, hasBacklog, verdict } = metrics;

    // Profile Details
    const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    elements.resAvatar.textContent = initials;
    elements.resName.textContent = student.name;
    elements.resRoll.textContent = `Roll No: ${student.rollNo}`;
    elements.resBranch.textContent = `Branch: ${student.branch}`;
    elements.resSem.textContent = `Semester: ${student.semester}`;
    elements.resSec.textContent = `Section: ${student.section || 'A'}`;
    elements.resAttendance.textContent = `Attendance: ${student.attendance || 90}%`;

    // GPA Banner
    elements.resSgpa.textContent = sgpa;
    elements.resCgpa.textContent = cgpa;
    elements.resCredits.textContent = `${earnedCredits} / ${totalCredits}`;
    elements.resVerdict.textContent = verdict;
    elements.resStanding.textContent = hasBacklog ? 'Status: Supplementary Required' : 'Status: Promoted / Cleared';

    if (hasBacklog) {
      elements.resVerdict.style.color = '#f87171';
      elements.resSgpa.style.color = '#f87171';
    } else {
      elements.resVerdict.style.color = '#fde047';
      elements.resSgpa.style.color = '#60a5fa';
    }

    // Results Table Rows
    elements.studentMarksTbody.innerHTML = '';
    subjectBreakdown.forEach(item => {
      const tr = document.createElement('tr');
      const gradeClass = getGradeClass(item.grade);

      tr.innerHTML = `
        <td><strong style="color: var(--primary);">${item.subject.code}</strong></td>
        <td>${item.subject.name}</td>
        <td style="text-align: center; font-weight: 600;">${item.subject.credits}</td>
        <td style="text-align: center;">${item.internal} <span style="font-size:0.75rem; color:var(--text-light);">/${item.subject.maxInternal}</span></td>
        <td style="text-align: center;">${item.external} <span style="font-size:0.75rem; color:var(--text-light);">/${item.subject.maxExternal}</span></td>
        <td style="text-align: center;"><strong>${item.total}</strong></td>
        <td style="text-align: center;"><span class="grade-pill ${gradeClass}">${item.grade}</span></td>
        <td style="text-align: center; font-weight: 700;">${item.point}</td>
        <td>
          <div class="score-bar-wrapper">
            <div class="score-bar-bg">
              <div class="score-bar-fill" style="width: ${item.percentage}%; background-color: ${item.total < 40 ? '#ef4444' : 'var(--primary)'};"></div>
            </div>
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">${item.percentage}%</span>
          </div>
        </td>
      `;
      elements.studentMarksTbody.appendChild(tr);
    });

    // Populate Official Print Marksheet
    renderPrintMarksheet(metrics, settings);
  }

  function renderPrintMarksheet(metrics, settings) {
    const { student, subjectBreakdown, totalCredits, totalMaxMarks, totalObtainedMarks, sgpa } = metrics;

    elements.printInstName.textContent = settings.institutionName;
    elements.printSubName.textContent = settings.subHeading;
    elements.printAddress.textContent = settings.address;

    elements.pName.textContent = student.name;
    elements.pRoll.textContent = student.rollNo;
    elements.pBranch.textContent = student.branch === 'CSE' ? 'B.Tech - Computer Science & Engineering' : 'B.Tech - Information Technology';
    elements.pSem.textContent = `Semester ${student.semester} / Year III`;
    elements.pSession.textContent = settings.academicSession || '2024 - 2025';

    elements.printMarksTbody.innerHTML = '';
    subjectBreakdown.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.subject.code}</strong></td>
        <td>${item.subject.name}</td>
        <td style="text-align: center;">${item.subject.credits}</td>
        <td style="text-align: center;">${item.maxTotal}</td>
        <td style="text-align: center; font-weight: bold;">${item.total}</td>
        <td style="text-align: center;"><strong>${item.grade}</strong></td>
        <td style="text-align: center;">${item.point}</td>
        <td style="text-align: center;">${item.creditPoints}</td>
      `;
      elements.printMarksTbody.appendChild(tr);
    });

    elements.pTotalCredits.textContent = totalCredits;
    elements.pMaxTotal.textContent = totalMaxMarks;
    elements.pObtainedTotal.textContent = totalObtainedMarks;
    elements.pSgpaFinal.textContent = sgpa;

    const today = new Date();
    elements.pIssueDate.textContent = today.toLocaleDateString('en-GB');
  }

  // ==========================================================================
  // View 2: Faculty / Teacher Portal
  // ==========================================================================

  function populateTeacherSubjectDropdown() {
    const branch = elements.teacherFilterBranch.value;
    const semester = elements.teacherFilterSemester.value;
    const subjects = DataStore.getSubjects().filter(s => s.branch === branch && s.semester === semester);

    elements.teacherFilterSubject.innerHTML = '';
    subjects.forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub.code;
      opt.textContent = `${sub.code} - ${sub.name}`;
      elements.teacherFilterSubject.appendChild(opt);
    });

    if (subjects.length > 0) {
      if (!AppState.teacherSubjectCode || !subjects.some(s => s.code === AppState.teacherSubjectCode)) {
        AppState.teacherSubjectCode = subjects[0].code;
      }
      elements.teacherFilterSubject.value = AppState.teacherSubjectCode;
    }

    updateTeacherSubjectMeta();
  }

  function updateTeacherSubjectMeta() {
    const subjectCode = elements.teacherFilterSubject.value;
    const subject = DataStore.getSubjects().find(s => s.code === subjectCode);
    if (!subject) return;

    elements.teacherSubjectMeta.textContent = `Credits: ${subject.credits} | Max Int: ${subject.maxInternal} | Max Ext: ${subject.maxExternal}`;
    elements.thMaxInt.textContent = `(Max ${subject.maxInternal})`;
    elements.thMaxExt.textContent = `(Max ${subject.maxExternal})`;
  }

  function renderTeacherRoster() {
    const branch = elements.teacherFilterBranch.value;
    const semester = elements.teacherFilterSemester.value;
    const subjectCode = elements.teacherFilterSubject.value;
    const subject = DataStore.getSubjects().find(s => s.code === subjectCode);

    if (!subject) return;

    const students = DataStore.getStudents().filter(s => s.branch === branch && s.semester === semester);
    const marksData = DataStore.getMarks();

    elements.teacherRosterCount.textContent = `Showing ${students.length} students enrolled in ${branch} Sem-${semester}`;
    elements.teacherMarksTbody.innerHTML = '';

    if (students.length === 0) {
      elements.teacherMarksTbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 1.5rem;">No students found for this department and semester.</td></tr>`;
      return;
    }

    students.forEach((student, index) => {
      const markEntry = marksData.find(m => m.studentId === student.id && m.subjectCode === subjectCode) || { internal: '', external: '' };
      const internalVal = markEntry.internal !== '' ? markEntry.internal : '';
      const externalVal = markEntry.external !== '' ? markEntry.external : '';

      const tr = document.createElement('tr');
      tr.dataset.studentId = student.id;

      tr.innerHTML = `
        <td style="color: var(--text-muted); font-size: 0.8rem;">${index + 1}</td>
        <td><strong>${student.rollNo}</strong></td>
        <td>${student.name}</td>
        <td style="text-align: center;">
          <input type="number" class="marks-input input-internal" 
                 data-student="${student.id}" 
                 min="0" max="${subject.maxInternal}" 
                 value="${internalVal}" placeholder="0">
        </td>
        <td style="text-align: center;">
          <input type="number" class="marks-input input-external" 
                 data-student="${student.id}" 
                 min="0" max="${subject.maxExternal}" 
                 value="${externalVal}" placeholder="0">
        </td>
        <td style="text-align: center;"><strong class="row-total">-</strong></td>
        <td style="text-align: center;"><span class="grade-pill row-grade">-</span></td>
        <td style="text-align: center; font-weight: 700;" class="row-point">-</td>
        <td style="text-align: center;"><span class="badge badge-gray row-status">Pending</span></td>
      `;

      elements.teacherMarksTbody.appendChild(tr);
      calculateRowScores(tr, subject);
    });

    // Attach real-time input listeners to every input in this table
    elements.teacherMarksTbody.querySelectorAll('.marks-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const row = e.target.closest('tr');
        validateAndClampInput(e.target);
        calculateRowScores(row, subject);
      });
    });
  }

  function validateAndClampInput(input) {
    const max = Number(input.getAttribute('max'));
    let val = Number(input.value);

    if (val > max) {
      input.classList.add('invalid');
      showToast(`Warning: Maximum marks allowed is ${max}!`, 'danger');
    } else if (val < 0) {
      input.classList.add('invalid');
      input.value = 0;
    } else {
      input.classList.remove('invalid');
    }
  }

  function calculateRowScores(row, subject) {
    const intInput = row.querySelector('.input-internal');
    const extInput = row.querySelector('.input-external');
    const totalEl = row.querySelector('.row-total');
    const gradeEl = row.querySelector('.row-grade');
    const pointEl = row.querySelector('.row-point');
    const statusEl = row.querySelector('.row-status');

    const intVal = intInput.value !== '' ? Number(intInput.value) : null;
    const extVal = extInput.value !== '' ? Number(extInput.value) : null;

    if (intVal === null && extVal === null) {
      totalEl.textContent = '-';
      gradeEl.textContent = '-';
      gradeEl.className = 'grade-pill';
      pointEl.textContent = '-';
      statusEl.textContent = 'Not Entered';
      statusEl.className = 'badge badge-gray';
      return;
    }

    const internal = intVal || 0;
    const external = extVal || 0;
    const total = internal + external;
    const maxTotal = subject.maxInternal + subject.maxExternal;
    const percentage = (total / maxTotal) * 100;
    const gradeRule = DataStore.calculateGrade(percentage);

    totalEl.textContent = total;
    gradeEl.textContent = gradeRule.grade;
    gradeEl.className = `grade-pill ${getGradeClass(gradeRule.grade)}`;
    pointEl.textContent = gradeRule.point;

    if (total >= 40 && gradeRule.grade !== 'F') {
      statusEl.textContent = 'Passed';
      statusEl.className = 'badge badge-green';
    } else {
      statusEl.textContent = 'Failed';
      statusEl.className = 'badge badge-red';
    }
  }

  function saveTeacherMarks() {
    const subjectCode = elements.teacherFilterSubject.value;
    const subject = DataStore.getSubjects().find(s => s.code === subjectCode);
    if (!subject) return;

    let currentMarks = DataStore.getMarks();
    let hasErrors = false;

    elements.teacherMarksTbody.querySelectorAll('tr').forEach(row => {
      const studentId = row.dataset.studentId;
      const intInput = row.querySelector('.input-internal');
      const extInput = row.querySelector('.input-external');

      if (!studentId || !intInput || !extInput) return;

      const internal = Number(intInput.value) || 0;
      const external = Number(extInput.value) || 0;

      if (internal > subject.maxInternal || external > subject.maxExternal) {
        hasErrors = true;
      }

      // Remove existing entry for this student and subject
      currentMarks = currentMarks.filter(m => !(m.studentId === studentId && m.subjectCode === subjectCode));

      // Add updated entry
      currentMarks.push({
        studentId,
        subjectCode,
        internal,
        external
      });
    });

    if (hasErrors) {
      showToast('Some mark entries exceed maximum limits. Please correct them.', 'danger');
      return;
    }

    DataStore.saveMarks(currentMarks);
    showToast(`Marks for course ${subjectCode} successfully saved!`, 'success');

    // Update other dependent views
    renderStudentResult();
    renderAdminKPIs();
    renderAdminStudentsTable();
  }

  function autofillTeacherMarks() {
    const subjectCode = elements.teacherFilterSubject.value;
    const subject = DataStore.getSubjects().find(s => s.code === subjectCode);
    if (!subject) return;

    elements.teacherMarksTbody.querySelectorAll('tr').forEach(row => {
      const intInput = row.querySelector('.input-internal');
      const extInput = row.querySelector('.input-external');

      // Generate good realistic random marks
      const randomInt = Math.floor(subject.maxInternal * 0.7) + Math.floor(Math.random() * (subject.maxInternal * 0.3));
      const randomExt = Math.floor(subject.maxExternal * 0.65) + Math.floor(Math.random() * (subject.maxExternal * 0.35));

      intInput.value = randomInt;
      extInput.value = randomExt;
      calculateRowScores(row, subject);
    });

    showToast('Autofilled sample marks for active roster. Click "Save All Marks" to persist.', 'info');
  }

  // ==========================================================================
  // View 3: Admin Dashboard
  // ==========================================================================

  function renderAdminKPIs() {
    const students = DataStore.getStudents();
    elements.kpiTotalStudents.textContent = students.length;

    if (students.length === 0) {
      elements.kpiPassRate.textContent = '0%';
      elements.kpiAvgCgpa.textContent = '0.00';
      elements.kpiTopper.textContent = 'None';
      elements.kpiTopperCgpa.textContent = '-';
      return;
    }

    let passCount = 0;
    let totalCgpaSum = 0;
    let topStudent = null;
    let topCgpa = -1;

    students.forEach(student => {
      const metrics = computeStudentSemesterMetrics(student.id);
      if (metrics) {
        if (!metrics.hasBacklog) passCount++;
        const numCgpa = parseFloat(metrics.cgpa);
        totalCgpaSum += numCgpa;

        if (numCgpa > topCgpa) {
          topCgpa = numCgpa;
          topStudent = { student, cgpa: metrics.cgpa };
        }
      }
    });

    const passRate = Math.round((passCount / students.length) * 100);
    const avgCgpa = (totalCgpaSum / students.length).toFixed(2);

    elements.kpiPassRate.textContent = `${passRate}%`;
    elements.kpiAvgCgpa.textContent = avgCgpa;

    if (topStudent) {
      elements.kpiTopper.textContent = topStudent.student.name;
      elements.kpiTopperCgpa.textContent = `CGPA: ${topStudent.cgpa} (${topStudent.student.branch})`;
    }
  }

  function renderAdminStudentsTable() {
    const students = DataStore.getStudents();
    const query = AppState.adminSearchQuery.toLowerCase().trim();
    const branchFilter = AppState.adminBranchFilter;

    const filtered = students.filter(s => {
      const matchesBranch = branchFilter === 'ALL' || s.branch === branchFilter;
      const matchesSearch = !query ||
        s.name.toLowerCase().includes(query) ||
        s.rollNo.toLowerCase().includes(query) ||
        (s.email && s.email.toLowerCase().includes(query));
      return matchesBranch && matchesSearch;
    });

    elements.adminStudentCount.textContent = `Showing ${filtered.length} of ${students.length} students`;
    elements.adminStudentsTbody.innerHTML = '';

    if (filtered.length === 0) {
      elements.adminStudentsTbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 2rem;">No matching student records found.</td></tr>`;
      return;
    }

    filtered.forEach(student => {
      const metrics = computeStudentSemesterMetrics(student.id);
      const sgpa = metrics ? metrics.sgpa : '-';
      const cgpa = metrics ? metrics.cgpa : '-';
      const hasBacklog = metrics ? metrics.hasBacklog : false;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${student.rollNo}</strong></td>
        <td>${student.name}</td>
        <td><span class="badge badge-gray">${student.branch}</span></td>
        <td>Sem ${student.semester}</td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${student.email || 'N/A'}<br>${student.phone || ''}</td>
        <td style="text-align: center;"><span class="badge ${student.attendance >= 85 ? 'badge-green' : 'badge-gray'}">${student.attendance || 90}%</span></td>
        <td style="text-align: center; font-weight: 700; color: ${hasBacklog ? 'var(--danger)' : 'var(--primary)'};">${sgpa}</td>
        <td style="text-align: center; font-weight: 700;">${cgpa}</td>
        <td style="text-align: center;">
          <div style="display: inline-flex; gap: 0.35rem;">
            <button class="btn btn-secondary btn-sm btn-action-view" data-id="${student.id}" title="View Marksheet">👁️ View</button>
            <button class="btn btn-secondary btn-sm btn-action-edit" data-id="${student.id}" title="Edit Student">✏️ Edit</button>
            <button class="btn btn-danger btn-sm btn-action-delete" data-id="${student.id}" title="Delete Student">🗑️</button>
          </div>
        </td>
      `;
      elements.adminStudentsTbody.appendChild(tr);
    });

    // Attach Row Action Handlers
    elements.adminStudentsTbody.querySelectorAll('.btn-action-view').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.selectedStudentId = btn.dataset.id;
        elements.selectStudentQuick.value = btn.dataset.id;
        renderStudentResult();
        switchRoleView('student');
        showToast('Switched to Student Portal result view.', 'info');
      });
    });

    elements.adminStudentsTbody.querySelectorAll('.btn-action-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        openStudentModal(btn.dataset.id);
      });
    });

    elements.adminStudentsTbody.querySelectorAll('.btn-action-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        deleteStudent(btn.dataset.id);
      });
    });
  }

  function renderAdminSubjectsTable() {
    const subjects = DataStore.getSubjects();
    elements.adminSubjectsTbody.innerHTML = '';

    subjects.forEach(sub => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: var(--primary);">${sub.code}</strong></td>
        <td>${sub.name}</td>
        <td><span class="badge badge-gray">${sub.branch}</span></td>
        <td>Semester ${sub.semester}</td>
        <td style="text-align: center; font-weight: 700;">${sub.credits}</td>
        <td style="text-align: center;">${sub.maxInternal}</td>
        <td style="text-align: center;">${sub.maxExternal}</td>
        <td style="text-align: center; font-weight: 700;">${sub.maxInternal + sub.maxExternal}</td>
      `;
      elements.adminSubjectsTbody.appendChild(tr);
    });
  }

  // ==========================================================================
  // Student Modal (Add & Edit)
  // ==========================================================================

  function openStudentModal(studentId = null) {
    elements.formStudent.reset();
    if (studentId) {
      const student = DataStore.getStudents().find(s => s.id === studentId);
      if (!student) return;

      elements.modalStudentTitle.textContent = 'Edit Student Details';
      elements.studentEditId.value = student.id;
      elements.inputRoll.value = student.rollNo;
      elements.inputName.value = student.name;
      elements.inputBranch.value = student.branch;
      elements.inputSemester.value = student.semester;
      elements.inputSection.value = student.section || 'A';
      elements.inputAttendance.value = student.attendance || 90;
      elements.inputEmail.value = student.email || '';
      elements.inputPhone.value = student.phone || '';
    } else {
      elements.modalStudentTitle.textContent = 'Add New Student';
      elements.studentEditId.value = '';
    }

    elements.modalStudent.classList.add('open');
  }

  function closeStudentModal() {
    elements.modalStudent.classList.remove('open');
  }

  function handleSaveStudent(e) {
    e.preventDefault();
    const id = elements.studentEditId.value;
    const rollNo = elements.inputRoll.value.trim().toUpperCase();
    const name = elements.inputName.value.trim();
    const branch = elements.inputBranch.value;
    const semester = elements.inputSemester.value;
    const section = elements.inputSection.value.trim().toUpperCase() || 'A';
    const attendance = Number(elements.inputAttendance.value) || 90;
    const email = elements.inputEmail.value.trim();
    const phone = elements.inputPhone.value.trim();

    let students = DataStore.getStudents();

    // Check duplicate roll number
    const duplicate = students.find(s => s.rollNo === rollNo && s.id !== id);
    if (duplicate) {
      showToast(`Student with Roll Number ${rollNo} already exists!`, 'danger');
      return;
    }

    if (id) {
      // Edit existing
      students = students.map(s => {
        if (s.id === id) {
          return { ...s, rollNo, name, branch, semester, section, attendance, email, phone };
        }
        return s;
      });
      showToast(`Student ${name} updated successfully!`, 'success');
    } else {
      // Add new
      const newStudent = {
        id: 's_' + Date.now().toString(36),
        rollNo,
        name,
        branch,
        semester,
        section,
        attendance,
        email,
        phone,
        academicYear: '2024-2025',
        prevCgpa: 8.0
      };
      students.push(newStudent);
      AppState.selectedStudentId = newStudent.id;
      showToast(`New student ${name} enrolled successfully!`, 'success');
    }

    DataStore.saveStudents(students);
    closeStudentModal();

    // Refresh all views
    populateStudentDropdown();
    renderStudentResult();
    renderAdminKPIs();
    renderAdminStudentsTable();
    renderTeacherRoster();
  }

  function deleteStudent(studentId) {
    const student = DataStore.getStudents().find(s => s.id === studentId);
    if (!student) return;

    if (!confirm(`Are you sure you want to remove student: ${student.name} (${student.rollNo})?`)) {
      return;
    }

    let students = DataStore.getStudents().filter(s => s.id !== studentId);
    let marks = DataStore.getMarks().filter(m => m.studentId !== studentId);

    DataStore.saveStudents(students);
    DataStore.saveMarks(marks);

    showToast(`Student ${student.name} has been removed.`, 'info');

    populateStudentDropdown();
    renderStudentResult();
    renderAdminKPIs();
    renderAdminStudentsTable();
    renderTeacherRoster();
  }

  // ==========================================================================
  // System Tools: CSV Export, Toggle Publish, Reset Data
  // ==========================================================================

  function toggleResultsPublication() {
    const settings = DataStore.getSettings();
    settings.resultsPublished = !settings.resultsPublished;
    DataStore.saveSettings(settings);

    updatePublishStatusBadge();
    renderStudentResult();

    if (settings.resultsPublished) {
      showToast('Semester results are now PUBLIC and visible to all students.', 'success');
    } else {
      showToast('Semester results have been UNPUBLISHED (Draft review mode).', 'info');
    }
  }

  function updatePublishStatusBadge() {
    const settings = DataStore.getSettings();
    if (settings.resultsPublished) {
      elements.statusPublishPill.className = 'badge-publish published';
      elements.statusPublishText.textContent = 'Results Published';
    } else {
      elements.statusPublishPill.className = 'badge-publish unpublished';
      elements.statusPublishText.textContent = 'Draft / Under Review';
    }
  }

  function exportResultsCsv() {
    const students = DataStore.getStudents();
    if (students.length === 0) {
      showToast('No student data available to export.', 'danger');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Roll Number,Student Name,Department,Semester,Section,Attendance %,SGPA,CGPA,Verdict\r\n';

    students.forEach(student => {
      const metrics = computeStudentSemesterMetrics(student.id);
      const row = [
        `"${student.rollNo}"`,
        `"${student.name}"`,
        `"${student.branch}"`,
        `"${student.semester}"`,
        `"${student.section || 'A'}"`,
        student.attendance || 90,
        metrics ? metrics.sgpa : '0.00',
        metrics ? metrics.cgpa : '0.00',
        `"${metrics ? metrics.verdict : 'N/A'}"`
      ];
      csvContent += row.join(',') + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SRS_Class_Results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Class results successfully exported to CSV file!', 'success');
  }

  function resetToDemoData() {
    if (confirm('Reset system data to initial clean sample records? Any newly entered data will be refreshed.')) {
      DataStore.resetAll();
      showToast('All data restored to default demo state.', 'success');
      initApp();
    }
  }

  // ==========================================================================
  // Role & View Navigation
  // ==========================================================================

  function switchRoleView(viewName) {
    AppState.currentView = viewName;

    elements.roleTabs.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    elements.viewSections.forEach(sec => {
      sec.classList.toggle('active', sec.id === `view-${viewName}`);
    });

    if (viewName === 'student') {
      renderStudentResult();
    } else if (viewName === 'teacher') {
      populateTeacherSubjectDropdown();
      renderTeacherRoster();
    } else if (viewName === 'admin') {
      renderAdminKPIs();
      renderAdminStudentsTable();
      renderAdminSubjectsTable();
    }
  }

  // ==========================================================================
  // Event Bindings
  // ==========================================================================

  function bindEvents() {
    // Navigation tabs
    elements.roleTabs.forEach(btn => {
      btn.addEventListener('click', () => switchRoleView(btn.dataset.view));
    });

    // Student View events
    elements.selectStudentQuick.addEventListener('change', (e) => {
      AppState.selectedStudentId = e.target.value;
      renderStudentResult();
    });

    elements.btnPrintResult.addEventListener('click', () => {
      window.print();
    });

    // Teacher View events
    elements.teacherFilterBranch.addEventListener('change', () => {
      populateTeacherSubjectDropdown();
      renderTeacherRoster();
    });

    elements.teacherFilterSemester.addEventListener('change', () => {
      populateTeacherSubjectDropdown();
      renderTeacherRoster();
    });

    elements.teacherFilterSubject.addEventListener('change', () => {
      AppState.teacherSubjectCode = elements.teacherFilterSubject.value;
      updateTeacherSubjectMeta();
      renderTeacherRoster();
    });

    elements.btnTeacherSave.addEventListener('click', saveTeacherMarks);
    elements.btnTeacherAutofill.addEventListener('click', autofillTeacherMarks);

    // Admin View events
    elements.adminSearchInput.addEventListener('input', (e) => {
      AppState.adminSearchQuery = e.target.value;
      renderAdminStudentsTable();
    });

    elements.adminFilterBranch.addEventListener('change', (e) => {
      AppState.adminBranchFilter = e.target.value;
      renderAdminStudentsTable();
    });

    elements.btnOpenAddStudent.addEventListener('click', () => openStudentModal());
    elements.modalStudentClose.addEventListener('click', closeStudentModal);
    elements.modalStudentCancel.addEventListener('click', closeStudentModal);
    elements.formStudent.addEventListener('submit', handleSaveStudent);

    elements.btnTogglePublish.addEventListener('click', toggleResultsPublication);
    elements.btnExportCsv.addEventListener('click', exportResultsCsv);
    elements.btnResetData.addEventListener('click', resetToDemoData);

    // Close modal on click outside
    elements.modalStudent.addEventListener('click', (e) => {
      if (e.target === elements.modalStudent) closeStudentModal();
    });
  }

  // ==========================================================================
  // Application Startup
  // ==========================================================================

  function initApp() {
    DataStore.init();
    updatePublishStatusBadge();
    populateStudentDropdown();
    renderStudentResult();
    populateTeacherSubjectDropdown();
    renderTeacherRoster();
    renderAdminKPIs();
    renderAdminStudentsTable();
    renderAdminSubjectsTable();
  }

  bindEvents();
  initApp();
});
