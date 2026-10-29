
"use strict";

/* =========================================================
   TOTAL WINNERS CHILD
   School Results Portal — Main JavaScript
   ========================================================= */

/*
  IMPORTANT:
  Keep these storage keys unchanged to preserve existing data.
  This application currently stores data in this browser only.
*/

const TWC_CONFIG = Object.freeze({
  databaseKey: "twc_portal_demo_v1",
  adminPasswordKey: "twc_admin_password_demo",
  adminSessionKey: "twc_admin_logged_in",
  studentSessionKey: "twc_student_logged_in",
  minimumAdminPasswordLength: 8,
  minimumStudentPasswordLength: 4,
  caMaximum: 40,
  examMaximum: 60,
  totalMaximum: 100
});

const TWC_SUBJECTS = Object.freeze({
  SS1: [
    "English Language",
    "Mathematics",
    "Biology",
    "Chemistry",
    "Physics",
    "Further Mathematics",
    "Agricultural Science",
    "Geography",
    "Civic Education",
    "Economics",
    "Financial Accounting",
    "Commerce",
    "Marketing",
    "Literature in English",
    "Government",
    "Christian Religious Studies (CRS)",
    "Data Processing"
  ],

  Science: [
    "English Language",
    "Mathematics",
    "Biology",
    "Chemistry",
    "Physics",
    "Further Mathematics",
    "Agricultural Science",
    "Geography",
    "Civic Education",
    "Economics",
    "Data Processing"
  ],

  Arts: [
    "English Language",
    "Mathematics",
    "Literature in English",
    "Government",
    "Christian Religious Studies (CRS)",
    "Economics",
    "Biology",
    "Civic Education",
    "Financial Accounting",
    "Commerce",
    "Marketing",
    "Data Processing"
  ]
});

/* =========================================================
   SHARED UTILITIES
   ========================================================= */

function twcGetElement(id) {
  return document.getElementById(id);
}

function twcNormalizeId(value) {
  return String(value ?? "").trim().toUpperCase();
}

function twcNormalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function twcShowMessage(id, text, success = false) {
  const element = twcGetElement(id);
  if (!element) return;

  element.textContent = text;
  element.style.color = success ? "#138653" : "#b42318";
  element.setAttribute("role", "status");
}

function twcClearMessage(id) {
  const element = twcGetElement(id);
  if (element) element.textContent = "";
}

function twcReadDatabase() {
  try {
    const raw = localStorage.getItem(TWC_CONFIG.databaseKey);

    if (!raw) {
      return { students: [] };
    }

    const database = JSON.parse(raw);

    if (!database || !Array.isArray(database.students)) {
      throw new Error("The saved student database has an invalid format.");
    }

    return database;
  } catch (error) {
    console.error("TWC database read error:", error);
    throw new Error(
      "The saved student data could not be read. Please preserve your backup before making changes."
    );
  }
}

function twcSaveDatabase(database) {
  try {
    localStorage.setItem(
      TWC_CONFIG.databaseKey,
      JSON.stringify(database)
    );
    return true;
  } catch (error) {
    console.error("TWC database save error:", error);
    throw new Error(
      "Student data could not be saved. Check browser storage and available space."
    );
  }
}

function twcGetSubjectsForStudent(student) {
  if (
    Array.isArray(student.assignedSubjects) &&
    student.assignedSubjects.length > 0
  ) {
    return student.assignedSubjects;
  }

  /*
    Backward compatibility:
    Older student records may not have assignedSubjects.
  */
  if (student.className === "SS1") {
    return [...TWC_SUBJECTS.SS1];
  }

  if (student.department === "Arts") {
    return [...TWC_SUBJECTS.Arts];
  }

  if (student.department === "Science") {
    return [...TWC_SUBJECTS.Science];
  }

  return [];
}

function twcGetGrade(total) {
  if (total >= 90) return { grade: "A1", remark: "Excellent" };
  if (total >= 80) return { grade: "B2", remark: "Very Good" };
  if (total >= 70) return { grade: "B3", remark: "Good" };
  if (total >= 65) return { grade: "C4", remark: "Credit" };
  if (total >= 60) return { grade: "C5", remark: "Credit" };
  if (total >= 50) return { grade: "C6", remark: "Credit" };
  if (total >= 45) return { grade: "D7", remark: "Pass" };
  if (total >= 40) return { grade: "E8", remark: "Pass" };

  return { grade: "F9", remark: "Fail" };
}

function twcGetPerformance(average) {
  if (average >= 70) {
    return {
      color: "#159447",
      remark: "Very good performance. Keep up the excellent effort."
    };
  }

  if (average >= 50) {
    return {
      color: "#e5a000",
      remark: "Fair performance. More consistent study can improve your results."
    };
  }

  return {
    color: "#d92d20",
    remark: "Your performance needs improvement. Seek help from your teachers."
  };
}

function twcCreateOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function twcAppendCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = String(value ?? "");
  row.appendChild(cell);
  return cell;
}

function twcRequireElements(ids) {
  return ids.every(id => Boolean(twcGetElement(id)));
}

/* =========================================================
   STUDENT LOGIN PAGE — index.html
   ========================================================= */

function twcInitStudentLogin() {
  const form = twcGetElement("student-login-form");

  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();
    twcClearMessage("student-login-message");

    const id = twcNormalizeId(
      twcGetElement("student-id")?.value
    );

    const password =
      twcGetElement("student-password")?.value ?? "";

    if (!id || !password) {
      twcShowMessage(
        "student-login-message",
        "Please enter both your student ID and password."
      );
      return;
    }

    let database;

    try {
      database = twcReadDatabase();
    } catch (error) {
      twcShowMessage(
        "student-login-message",
        error.message
      );
      return;
    }

    const student = database.students.find(item =>
      twcNormalizeId(item.id) === id
    );

    if (!student) {
      twcShowMessage(
        "student-login-message",
        "Student not registered. Check your student ID or visit the school administrator."
      );
      return;
    }

    if (String(student.password ?? "") !== password) {
      twcShowMessage(
        "student-login-message",
        "Incorrect password. Need help with a wrong password? Visit your school administrator for a password change."
      );
      return;
    }

    /*
      Store only the logged-in student ID in the session.
      The dashboard retrieves that student's own record.
    */
    sessionStorage.setItem(
      TWC_CONFIG.studentSessionKey,
      String(student.id)
    );

    window.location.href = "dashboard.html";
  });
}

/* =========================================================
   ADMIN PAGE — admin.html
   ========================================================= */

function twcInitAdmin() {
  if (!twcGetElement("admin-login-form")) return;

  const requiredIds = [
    "admin-login-panel",
    "admin-workspace",
    "admin-password",
    "admin-confirm-password",
    "admin-confirm-label",
    "admin-submit-button",
    "admin-setup-message",
    "admin-login-message",
    "admin-logout-button",
    "register-student-form",
    "new-name",
    "new-id",
    "new-password",
    "new-class",
    "new-department",
    "subject-checkboxes",
    "register-message",
    "result-student",
    "result-session",
    "result-term",
    "result-subject",
    "result-ca",
    "result-exam",
    "upload-result-form",
    "result-message",
    "students-table-body",
    "reset-student",
    "reset-password",
    "reset-student-password-form",
    "reset-password-message",
    "export-data-button"
  ];

  if (!twcRequireElements(requiredIds)) {
    console.error(
      "TWC admin setup: one or more expected HTML element IDs are missing."
    );
    return;
  }

  const loginForm = twcGetElement("admin-login-form");
  const loginPanel = twcGetElement("admin-login-panel");
  const workspace = twcGetElement("admin-workspace");
  const classSelect = twcGetElement("new-class");
  const departmentSelect = twcGetElement("new-department");
  const subjectContainer = twcGetElement("subject-checkboxes");

  function updateAdminPasswordForm() {
    const savedPassword = localStorage.getItem(
      TWC_CONFIG.adminPasswordKey
    );

    const passwordExists = Boolean(savedPassword);

    twcGetElement("admin-confirm-label").classList.toggle(
      "hidden",
      passwordExists
    );

    twcGetElement("admin-confirm-password").required =
      !passwordExists;

    twcGetElement("admin-submit-button").textContent =
      passwordExists ? "Sign In" : "Create Admin Password";

    twcGetElement("admin-setup-message").textContent =
      passwordExists
        ? "Welcome back. Enter your administrator password."
        : "First use: create a private administrator password of at least 8 characters.";
  }

  function showAdminWorkspace() {
    loginPanel.classList.add("hidden");
    workspace.classList.remove("hidden");

    twcRenderStudents();
    twcUpdateStudentOptions();
    twcUpdateSubjectCheckboxes();
  }

  function showAdminLogin() {
    sessionStorage.removeItem(TWC_CONFIG.adminSessionKey);

    workspace.classList.add("hidden");
    loginPanel.classList.remove("hidden");

    loginForm.reset();
    updateAdminPasswordForm();
  }

  /* ---------- Admin password login ---------- */

  loginForm.addEventListener("submit", event => {
    event.preventDefault();
    twcClearMessage("admin-login-message");

    const password =
      twcGetElement("admin-password").value;

    const savedPassword = localStorage.getItem(
      TWC_CONFIG.adminPasswordKey
    );

    if (!savedPassword) {
      const confirmation =
        twcGetElement("admin-confirm-password").value;

      if (
        password.length <
        TWC_CONFIG.minimumAdminPasswordLength
      ) {
        twcShowMessage(
          "admin-login-message",
          "Choose a password containing at least 8 characters."
        );
        return;
      }

      if (password !== confirmation) {
        twcShowMessage(
          "admin-login-message",
          "The passwords do not match. Please try again."
        );
        return;
      }

      try {
        localStorage.setItem(
          TWC_CONFIG.adminPasswordKey,
          password
        );
      } catch (error) {
        twcShowMessage(
          "admin-login-message",
          "The password could not be saved in this browser."
        );
        return;
      }
    } else if (password !== savedPassword) {
      twcShowMessage(
        "admin-login-message",
        "Incorrect administrator password."
      );
      return;
    }

    sessionStorage.setItem(
      TWC_CONFIG.adminSessionKey,
      "yes"
    );

    twcShowMessage(
      "admin-login-message",
      "Welcome, Admin!",
      true
    );

    showAdminWorkspace();
  });

  twcGetElement("admin-logout-button").addEventListener(
    "click",
    showAdminLogin
  );

  /* ---------- Subjects by class and department ---------- */

  function getAvailableSubjects(className, department) {
    if (className === "SS1") {
      return [...TWC_SUBJECTS.SS1];
    }

    if (className === "SS2" || className === "SS3") {
      if (department === "Science") {
        return [...TWC_SUBJECTS.Science];
      }

      if (department === "Arts") {
        return [...TWC_SUBJECTS.Arts];
      }
    }

    return [];
  }

  function twcUpdateSubjectCheckboxes() {
    subjectContainer.replaceChildren();

    const className = classSelect.value;
    const department = departmentSelect.value;

    const subjects = getAvailableSubjects(
      className,
      department
    );

    if (subjects.length === 0) {
      const note = document.createElement("p");
      note.className = "muted";
      note.textContent =
        "Select a class and the correct department to display subjects.";

      subjectContainer.appendChild(note);
      return;
    }

    subjects.forEach(subject => {
      const label = document.createElement("label");
      label.className = "subject-option";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "assigned-subject";
      checkbox.value = subject;
      checkbox.checked = true;

      const text = document.createElement("span");
      text.textContent = subject;

      label.append(checkbox, text);
      subjectContainer.appendChild(label);
    });
  }

  classSelect.addEventListener("change", () => {
    if (classSelect.value === "SS1") {
      departmentSelect.value = "General";
      departmentSelect.disabled = true;
    } else {
      departmentSelect.disabled = false;

      if (departmentSelect.value === "General") {
        departmentSelect.value = "";
      }
    }

    twcUpdateSubjectCheckboxes();
  });

  departmentSelect.addEventListener(
    "change",
    twcUpdateSubjectCheckboxes
  );

  /* ---------- Student list and dropdowns ---------- */

  function twcRenderStudents() {
    const tableBody = twcGetElement("students-table-body");
    tableBody.replaceChildren();

    let database;

    try {
      database = twcReadDatabase();
    } catch (error) {
      twcShowMessage("admin-action-message", error.message);
      return;
    }

    if (database.students.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");

      cell.colSpan = 5;
      cell.textContent = "No students have been registered yet.";

      row.appendChild(cell);
      tableBody.appendChild(row);
      return;
    }

    database.students.forEach(student => {
      const row = document.createElement("tr");

      twcAppendCell(row, student.name);
      twcAppendCell(row, student.id);
      twcAppendCell(row, student.className);
      twcAppendCell(row, student.department);
      twcAppendCell(
        row,
        twcGetSubjectsForStudent(student).length
      );

      tableBody.appendChild(row);
    });
  }

  function fillStudentDropdown(selectId, placeholder) {
    const select = twcGetElement(selectId);
    const previousValue = select.value;

    select.replaceChildren();
    select.appendChild(
      twcCreateOption("", placeholder)
    );

    let database;

    try {
      database = twcReadDatabase();
    } catch (error) {
      console.error(error);
      return;
    }

    database.students.forEach(student => {
      select.appendChild(
        twcCreateOption(
          String(student.id),
          `${student.name} (${student.id})`
        )
      );
    });

    if (
      [...select.options].some(
        option => option.value === previousValue
      )
    ) {
      select.value = previousValue;
    }
  }

  function twcUpdateResultSubjectDropdown() {
    const subjectSelect = twcGetElement("result-subject");
    const studentId = twcGetElement("result-student").value;

    subjectSelect.replaceChildren();

    const database = twcReadDatabase();

    const student = database.students.find(item =>
      String(item.id) === studentId
    );

    if (!student) {
      subjectSelect.appendChild(
        twcCreateOption("", "Select a student first")
      );
      return;
    }

    subjectSelect.appendChild(
      twcCreateOption("", "Select assigned subject")
    );

    twcGetSubjectsForStudent(student).forEach(subject => {
      subjectSelect.appendChild(
        twcCreateOption(subject, subject)
      );
    });
  }

  function twcUpdateStudentOptions() {
    fillStudentDropdown(
      "result-student",
      "Select student"
    );

    fillStudentDropdown(
      "reset-student",
      "Select student"
    );

    twcUpdateResultSubjectDropdown();
  }

  twcGetElement("result-student").addEventListener(
    "change",
    twcUpdateResultSubjectDropdown
  );

  /* ---------- Register a student ---------- */

  twcGetElement("register-student-form").addEventListener(
    "submit",
    event => {
      event.preventDefault();
      twcClearMessage("register-message");

      const name = twcGetElement("new-name").value.trim();
      const id = twcNormalizeId(
        twcGetElement("new-id").value
      );
      const password =
        twcGetElement("new-password").value;
      const className = classSelect.value;
      const department = departmentSelect.value;

      const assignedSubjects = [
        ...subjectContainer.querySelectorAll(
          'input[name="assigned-subject"]:checked'
        )
      ].map(input => input.value);

      if (
        !name ||
        !id ||
        !password ||
        !className ||
        !department
      ) {
        twcShowMessage(
          "register-message",
          "Please complete all student details."
        );
        return;
      }

      if (
        password.length <
        TWC_CONFIG.minimumStudentPasswordLength
      ) {
        twcShowMessage(
          "register-message",
          "The student's password must contain at least 4 characters."
        );
        return;
      }

      if (
        className === "SS1" &&
        department !== "General"
      ) {
        twcShowMessage(
          "register-message",
          "SS1 students must use General / SS1."
        );
        return;
      }

      if (
        className !== "SS1" &&
        !["Science", "Arts"].includes(department)
      ) {
        twcShowMessage(
          "register-message",
          "SS2 and SS3 students must be assigned to Science or Arts."
        );
        return;
      }

      const validSubjects = getAvailableSubjects(
        className,
        department
      );

      if (
        assignedSubjects.length === 0 ||
        assignedSubjects.some(
          subject => !validSubjects.includes(subject)
        )
      ) {
        twcShowMessage(
          "register-message",
          "Tick at least one valid subject for this student."
        );
        return;
      }

      let database;

      try {
        database = twcReadDatabase();
      } catch (error) {
        twcShowMessage("register-message", error.message);
        return;
      }

      const duplicate = database.students.some(student =>
        twcNormalizeId(student.id) === id
      );

      if (duplicate) {
        twcShowMessage(
          "register-message",
          "This student ID already exists. Choose a unique ID."
        );
        return;
      }

      database.students.push({
        id,
        name,
        password,
        className,
        department,
        assignedSubjects,
        results: []
      });

      try {
        twcSaveDatabase(database);
      } catch (error) {
        twcShowMessage("register-message", error.message);
        return;
      }

      twcGetElement("register-student-form").reset();
      departmentSelect.disabled = false;
      subjectContainer.replaceChildren();

      twcRenderStudents();
      twcUpdateStudentOptions();

      twcShowMessage(
        "register-message",
        `Student ${name} registered successfully. Their login ID is ${id}.`,
        true
      );
    }
  );

  /* ---------- Save or update a result ---------- */

  twcGetElement("upload-result-form").addEventListener(
    "submit",
    event => {
      event.preventDefault();
      twcClearMessage("result-message");

      const studentId =
        twcGetElement("result-student").value;
      const session =
        twcGetElement("result-session").value.trim();
      const term =
        twcGetElement("result-term").value;
      const subject =
        twcGetElement("result-subject").value;
      const caRaw = twcGetElement("result-ca").value;
      const examRaw = twcGetElement("result-exam").value;

      if (
        !studentId ||
        !session ||
        !term ||
        !subject ||
        caRaw === "" ||
        examRaw === ""
      ) {
        twcShowMessage(
          "result-message",
          "Complete every result field before saving."
        );
        return;
      }

      const ca = Number(caRaw);
      const exam = Number(examRaw);

      if (
        !Number.isFinite(ca) ||
        !Number.isFinite(exam) ||
        ca < 0 ||
        ca > TWC_CONFIG.caMaximum ||
        exam < 0 ||
        exam > TWC_CONFIG.examMaximum
      ) {
        twcShowMessage(
          "result-message",
          "CA must be between 0 and 40. Examination score must be between 0 and 60."
        );
        return;
      }

      let database;

      try {
        database = twcReadDatabase();
      } catch (error) {
        twcShowMessage("result-message", error.message);
        return;
      }

      const student = database.students.find(item =>
        String(item.id) === studentId
      );

      if (!student) {
        twcShowMessage(
          "result-message",
          "Student record not found. Register the student first."
        );
        return;
      }

      if (!twcGetSubjectsForStudent(student).includes(subject)) {
        twcShowMessage(
          "result-message",
          "This subject is not assigned to the selected student."
        );
        return;
      }

      if (!Array.isArray(student.results)) {
        student.results = [];
      }

      const total = ca + exam;
      const gradeInfo = twcGetGrade(total);

      const result = {
        session,
        term,
        subject,
        ca,
        exam,
        total,
        grade: gradeInfo.grade,
        remark: gradeInfo.remark
      };

      const existingIndex = student.results.findIndex(item =>
        twcNormalizeText(item.session) ===
          twcNormalizeText(session) &&
        twcNormalizeText(item.term) ===
          twcNormalizeText(term) &&
        twcNormalizeText(item.subject) ===
          twcNormalizeText(subject)
      );

      if (existingIndex >= 0) {
        student.results[existingIndex] = result;
      } else {
        student.results.push(result);
      }

      try {
        twcSaveDatabase(database);
      } catch (error) {
        twcShowMessage("result-message", error.message);
        return;
      }

      twcGetElement("result-subject").value = "";
      twcGetElement("result-ca").value = "";
      twcGetElement("result-exam").value = "";

      twcShowMessage(
        "result-message",
        `${subject}: ${total}/100, Grade ${gradeInfo.grade} — ${gradeInfo.remark}. Result saved for ${student.name}.`,
        true
      );
    }
  );

  /* ---------- Administrator resets student passwords ---------- */

  twcGetElement("reset-student-password-form").addEventListener(
    "submit",
    event => {
      event.preventDefault();
      twcClearMessage("reset-password-message");

      const studentId =
        twcGetElement("reset-student").value;
      const newPassword =
        twcGetElement("reset-password").value;

      if (!studentId) {
        twcShowMessage(
          "reset-password-message",
          "Select a registered student."
        );
        return;
      }

      if (
        newPassword.length <
        TWC_CONFIG.minimumStudentPasswordLength
      ) {
        twcShowMessage(
          "reset-password-message",
          "The new student password must contain at least 4 characters."
        );
        return;
      }

      let database;

      try {
        database = twcReadDatabase();
      } catch (error) {
        twcShowMessage(
          "reset-password-message",
          error.message
        );
        return;
      }

      const student = database.students.find(item =>
        String(item.id) === studentId
      );

      if (!student) {
        twcShowMessage(
          "reset-password-message",
          "Student record not found."
        );
        return;
      }

      student.password = newPassword;

      try {
        twcSaveDatabase(database);
      } catch (error) {
        twcShowMessage(
          "reset-password-message",
          error.message
        );
        return;
      }

      twcGetElement("reset-password-form")?.reset();

      // Correct form ID used by the supplied admin.html.
      twcGetElement("reset-student-password-form").reset();

      twcShowMessage(
        "reset-password-message",
        `Password updated for ${student.name}. Give the new password to the student privately.`,
        true
      );
    }
  );

  /* ---------- Export a backup ---------- */

  twcGetElement("export-data-button").addEventListener(
    "click",
    () => {
      let database;

      try {
        database = twcReadDatabase();
      } catch (error) {
        twcShowMessage("admin-action-message", error.message);
        return;
      }

      const blob = new Blob(
        [JSON.stringify(database, null, 2)],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "twc-student-data-backup.json";
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);

      twcShowMessage(
        "admin-action-message",
        "Student data backup export started. Keep the file private.",
        true
      );
    }
  );

  updateAdminPasswordForm();

  if (
    sessionStorage.getItem(TWC_CONFIG.adminSessionKey) === "yes"
  ) {
    showAdminWorkspace();
  }
}

/* =========================================================
   STUDENT DASHBOARD — dashboard.html
   ========================================================= */

function twcInitStudentDashboard() {
  if (!twcGetElement("student-results-body")) return;

  const studentId = sessionStorage.getItem(
    TWC_CONFIG.studentSessionKey
  );

  if (!studentId) {
    window.location.replace("index.html");
    return;
  }

  let database;

  try {
    database = twcReadDatabase();
  } catch (error) {
    twcShowMessage("no-results-message", error.message);
    return;
  }

  const student = database.students.find(item =>
    String(item.id) === String(studentId)
  );

  if (!student) {
    sessionStorage.removeItem(TWC_CONFIG.studentSessionKey);
    window.location.replace("index.html");
    return;
  }

  const resultsBody = twcGetElement("student-results-body");
  const sessionSelect = twcGetElement("view-session");
  const termSelect = twcGetElement("view-term");

  twcGetElement("student-welcome").textContent =
    `Welcome, ${student.name}!`;

  twcGetElement("student-details").textContent =
    `Student ID: ${student.id} | Class: ${student.className} | Department: ${student.department}`;

  /* ---------- Populate available sessions ---------- */

  const sessions = [
    ...new Set(
      (student.results || [])
        .map(result => result.session)
        .filter(Boolean)
    )
  ].sort().reverse();

  sessions.forEach(session => {
    sessionSelect.appendChild(
      twcCreateOption(session, session)
    );
  });

  /* ---------- Render results and performance ---------- */

  function renderStudentResults() {
    resultsBody.replaceChildren();

    const selectedSession = sessionSelect.value;
    const selectedTerm = termSelect.value;

    const results = (student.results || []).filter(result =>
      (!selectedSession || result.session === selectedSession) &&
      (!selectedTerm || result.term === selectedTerm)
    );

    if (results.length === 0) {
      twcShowMessage(
        "no-results-message",
        "No results have been uploaded for this session and term yet."
      );

      twcGetElement("subject-count").textContent = "0";
      twcGetElement("average-value").textContent = "--%";

      const circle = twcGetElement("average-circle");
      circle.style.setProperty("--performance-color", "#9aa8bb");
      circle.style.setProperty("--average-degrees", "0deg");

      twcGetElement("average-remark").textContent =
        "Your performance will appear here when results are available.";

      twcGetElement("overall-comment").textContent =
        "No results are available for the selected period. Please contact the school administrator if you believe this is an error.";

      return;
    }

    twcClearMessage("no-results-message");

    let totalMarks = 0;

    results.forEach(result => {
      const total = Number(result.total);
      totalMarks += total;

      const gradeInfo = twcGetGrade(total);
      const row = document.createElement("tr");

      twcAppendCell(row, result.subject);
      twcAppendCell(row, `${result.ca}/40`);
      twcAppendCell(row, `${result.exam}/60`);
      twcAppendCell(row, `${total}/100`);

      const gradeCell = twcAppendCell(row, gradeInfo.grade);
      gradeCell.style.color =
        twcGetPerformance(total).color;
      gradeCell.style.fontWeight = "800";

      twcAppendCell(row, gradeInfo.remark);

      resultsBody.appendChild(row);
    });

    const average = totalMarks / results.length;
    const roundedAverage =
      Math.round(average * 100) / 100;

    const performance = twcGetPerformance(average);
    const circle = twcGetElement("average-circle");

    twcGetElement("subject-count").textContent =
      String(results.length);

    twcGetElement("average-value").textContent =
      `${roundedAverage}%`;

    circle.style.setProperty(
      "--performance-color",
      performance.color
    );

    circle.style.setProperty(
      "--average-degrees",
      `${Math.max(0, Math.min(100, average)) * 3.6}deg`
    );

    twcGetElement("average-remark").textContent =
      performance.remark;

    twcGetElement("overall-comment").textContent =
      performance.remark;
  }

  sessionSelect.addEventListener(
    "change",
    renderStudentResults
  );

  termSelect.addEventListener(
    "change",
    renderStudentResults
  );

  twcGetElement("print-result-button")?.addEventListener(
    "click",
    () => window.print()
  );

  twcGetElement("student-logout-button")?.addEventListener(
    "click",
    () => {
      sessionStorage.removeItem(TWC_CONFIG.studentSessionKey);
      window.location.href = "index.html";
    }
  );

  renderStudentResults();
}

/* =========================================================
   PAGE INITIALISATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  try {
    switch (page) {
      case "admin":
        twcInitAdmin();
        break;

      case "student-login":
        twcInitStudentLogin();
        break;

      case "student-dashboard":
        twcInitStudentDashboard();
        break;

      default:
        // Allows the script to be included on an unrelated page.
        break;
    }
  } catch (error) {
    console.error("TWC portal initialisation error:", error);

    const messageElement =
      twcGetElement("admin-login-message") ||
      twcGetElement("student-login-message") ||
      twcGetElement("no-results-message");

    if (messageElement) {
      messageElement.textContent =
        "The portal could not finish loading. Check that the HTML element IDs match the JavaScript and reload the page.";
    }
  }
});
