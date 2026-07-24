// ============================================================
// ACSE Student Portal — Google Sheets + Google Drive Backend
// ============================================================

// 🔧 PASTE YOUR DEPLOYED APPS SCRIPT WEB APP URL HERE:
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwMi6KQs0Ye7-RPnOWei54M0-I90cnuDGyOucTnKB4LM9tcnZY7EkyebnzHqsr6wMuX/exec';

// --- Helper: Convert File to Base64 ---
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// --- Helper: Submit form data + PDF to Google Sheets via Apps Script ---
async function submitToSheet(formData, file, fileName) {
    const base64 = await fileToBase64(file);
    const payload = {
        formData: formData,
        fileName: fileName,
        fileBase64: base64
    };
    await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
    });
}

// --- Helper: Detect specific form type from event level ---
function getFormType(eventLevel) {
    if (eventLevel === 'NPTEL Online Course') return 'nptel';
    if (['Sports / Games', 'Culturals'].includes(eventLevel)) return 'extracurricular';
    if (['Start-up Ideathon / Hackathon', 'International / National / Inter Univ', 'Project Expo / Paper Presentation'].includes(eventLevel)) return 'cocurricular';
    if (['Dept Association / Class Rep / CDMC', 'University Student Body', 'University Committees', 'NCC'].includes(eventLevel)) return 'admin';
    if (['Seed Grant / In-house Stipend', 'Summer Internship Program', 'Internship with Stipend', 'International Internship / Exchange', 'Paper Publication', 'National/State/District Recognition'].includes(eventLevel)) return 'academic';
    return 'general';
}


// ============================================================
// Button Listeners for Event Cards
// ============================================================
const submitGenericCocurricularBtn = document.getElementById('submit-generic-cocurricular-btn');
if (submitGenericCocurricularBtn) {
    submitGenericCocurricularBtn.addEventListener('click', () => {
        openCocurricularSelectionModal();
    });
}

const submitNptelBtn = document.getElementById('submit-nptel-btn');
if (submitNptelBtn) {
    submitNptelBtn.addEventListener('click', () => {
        openModal('NPTEL Online Course', false);
    });
}

const submitExtracurricularBtn = document.getElementById('submit-extracurricular-btn');
if (submitExtracurricularBtn) {
    submitExtracurricularBtn.addEventListener('click', () => {
        openExtracurricularSelectionModal();
    });
}

const submitAdminBtn = document.getElementById('submit-admin-btn');
if (submitAdminBtn) {
    submitAdminBtn.addEventListener('click', () => {
        openAdminSelectionModal();
    });
}

const submitAcademicBtn = document.getElementById('submit-academic-btn');
if (submitAcademicBtn) {
    submitAcademicBtn.addEventListener('click', () => {
        openAcademicSelectionModal();
    });
}

function showNotice(id, msg) {
    const el = document.getElementById(id);
    el.textContent = '⚠️ ' + msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
}

// ============================================================
// Main Certificate Form Modal
// ============================================================
function openModal(selectedEvent, isReadonly = true) {
    eventLevelInput.value = selectedEvent;
    modalEventNameDisplay.textContent = selectedEvent;
    
    eventSpecificInput.value = "";
    
    // Dynamic placeholder and label
    const eventSpecificLabel = document.querySelector('label[for="event-specific-name"]');
    
    if (selectedEvent === 'NPTEL Online Course') {
        eventSpecificLabel.textContent = "Course Name *";
        eventSpecificInput.placeholder = "e.g. Data Structures, Python, etc.";
    } else if (["Sports / Games", "Culturals"].includes(selectedEvent)) {
        eventSpecificLabel.textContent = "Specific Event / Sport / Activity *";
        eventSpecificInput.placeholder = "e.g. Cricket Tournament, Group Dance";
    } else if (["Start-up Ideathon / Hackathon", "International / National / Inter Univ", "Project Expo / Paper Presentation"].includes(selectedEvent)) {
        eventSpecificLabel.textContent = "Specific Event / Project Name *";
        eventSpecificInput.placeholder = "e.g. IEEE Hackathon, AI Project Expo";
    } else if (selectedEvent === "Dept Association / Class Rep / CDMC") {
        eventSpecificLabel.textContent = "Class or Department Role *";
        eventSpecificInput.placeholder = "e.g. Class Representative, CDMC Member";
    } else if (selectedEvent === "NCC") {
        eventSpecificLabel.textContent = "NCC Role / Rank *";
        eventSpecificInput.placeholder = "e.g. NCC Cadet, Sergeant";
    } else if (["University Student Body", "University Committees"].includes(selectedEvent)) {
        eventSpecificLabel.textContent = "University Role / Committee *";
        eventSpecificInput.placeholder = "e.g. Student Council President, Cultural Secretary";
    } else if (["Summer Internship Program", "Internship with Stipend", "International Internship / Exchange"].includes(selectedEvent)) {
        eventSpecificLabel.textContent = "Internship Name & Company Name *";
        eventSpecificInput.placeholder = "e.g. Software Engineer Intern at Amazon";
    } else if (["Seed Grant / In-house Stipend", "Paper Publication", "National/State/District Recognition"].includes(selectedEvent)) {
        eventSpecificLabel.textContent = "Specific Topic / Title *";
        eventSpecificInput.placeholder = "e.g. AI Research Paper, Tech Patent";
    } else {
        eventSpecificLabel.textContent = "Specific Event / Topic *";
        eventSpecificInput.placeholder = "e.g. Workshop, Seminar";
    }

    // NPTEL specific UI
    const nptelGradeGroup = document.getElementById("nptel-grade-group");
    const eventRoleGroup = document.getElementById("event-role-group");
    
    if (selectedEvent === 'NPTEL Online Course') {
        if (nptelGradeGroup) nptelGradeGroup.style.display = 'block';
        if (eventRoleGroup) eventRoleGroup.style.display = 'none';
        document.querySelectorAll('input[name="event-role"]').forEach(r => r.removeAttribute('required'));
        document.querySelectorAll('input[name="nptel-grade"]').forEach(r => r.setAttribute('required', 'required'));
    } else if ([
        "Summer Internship Program", "Internship with Stipend", "International Internship / Exchange",
        "Seed Grant / In-house Stipend", "Paper Publication", "National/State/District Recognition",
        "Dept Association / Class Rep / CDMC", "University Student Body", "University Committees", "NCC"
    ].includes(selectedEvent)) {
        if (nptelGradeGroup) nptelGradeGroup.style.display = 'none';
        if (eventRoleGroup) eventRoleGroup.style.display = 'none';
        document.querySelectorAll('input[name="event-role"]').forEach(r => r.removeAttribute('required'));
        document.querySelectorAll('input[name="nptel-grade"]').forEach(r => r.removeAttribute('required'));
    } else {
        if (nptelGradeGroup) nptelGradeGroup.style.display = 'none';
        if (eventRoleGroup) eventRoleGroup.style.display = 'block';
        document.querySelectorAll('input[name="event-role"]').forEach(r => r.setAttribute('required', 'required'));
        document.querySelectorAll('input[name="nptel-grade"]').forEach(r => r.removeAttribute('required'));
    }

    // Extracurricular level UI
    const extraLevelGroup = document.getElementById("extracurricular-level-group");
    const extraLevelSelect = document.getElementById("extracurricular-level");
    const extraEvents = ["Sports / Games", "Culturals"];
    
    if (extraEvents.includes(selectedEvent)) {
        if (extraLevelGroup) extraLevelGroup.style.display = 'block';
        if (extraLevelSelect) extraLevelSelect.setAttribute('required', 'required');
    } else {
        if (extraLevelGroup) extraLevelGroup.style.display = 'none';
        if (extraLevelSelect) extraLevelSelect.removeAttribute('required');
    }

    modal.style.display = 'flex';
}

// --- Modal Elements ---
const modal = document.getElementById("form-modal");
const eventLevelInput = document.getElementById("event-level");
const eventSpecificInput = document.getElementById("event-specific-name");
const modalEventNameDisplay = document.getElementById("modal-event-name");
const form = document.getElementById("certificate-form");
const submitButton = document.getElementById("submit-btn-text");
const nameInput = document.getElementById("name");
const regNoInput = document.getElementById("reg-no");
const contactInput = document.getElementById("contact");
const yearInput = document.getElementById("year");
const branchInput = document.getElementById("branch");
const sectionInput = document.getElementById("section");
const certFileInput = document.getElementById("cert-file");
const mainFileErrorMsg = document.getElementById("main-file-error-msg");
const collegeNameGroup = document.getElementById("college-name-group");
const collegeNameInput = document.getElementById("college-name");

function closeModal() {
    modal.style.display = "none";
    form.reset();
    modalEventNameDisplay.textContent = "";
    collegeNameGroup.style.display = 'none';
    collegeNameInput.removeAttribute('required');
}

// --- Selection Modals ---
const extracurricularSelectionModal = document.getElementById("extracurricular-selection-modal");
const cocurricularSelectionModal = document.getElementById("cocurricular-selection-modal");
const adminSelectionModal = document.getElementById("admin-selection-modal");
const academicSelectionModal = document.getElementById("academic-selection-modal");

function openExtracurricularSelectionModal() { if (extracurricularSelectionModal) extracurricularSelectionModal.style.display = 'flex'; }
function openCocurricularSelectionModal() { if (cocurricularSelectionModal) cocurricularSelectionModal.style.display = 'flex'; }
function openAdminSelectionModal() { if (adminSelectionModal) adminSelectionModal.style.display = 'flex'; }
function openAcademicSelectionModal() { if (academicSelectionModal) academicSelectionModal.style.display = 'flex'; }

function closeAllSelectionModals() {
    if (extracurricularSelectionModal) extracurricularSelectionModal.style.display = 'none';
    if (cocurricularSelectionModal) cocurricularSelectionModal.style.display = 'none';
    if (adminSelectionModal) adminSelectionModal.style.display = 'none';
    if (academicSelectionModal) academicSelectionModal.style.display = 'none';
    if (examSelectionModal) examSelectionModal.style.display = 'none';
}

document.querySelectorAll("#extracurricular-selection-close-btn, #cocurricular-selection-close-btn, #admin-selection-close-btn, #academic-selection-close-btn").forEach(btn => {
    if (btn) btn.addEventListener("click", closeAllSelectionModals);
});

// Handle general selection button clicks to open main form
document.querySelectorAll('.general-select-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const eventName = this.getAttribute('data-event');
        closeAllSelectionModals();
        openModal(eventName, true);
    });
});

document.querySelectorAll(".close-btn, .close-btn-action").forEach(elem => {
    elem.addEventListener("click", closeModal);
});

window.addEventListener("click", function(event) {
    if (event.target === modal) closeModal();
});

// ============================================================
// General Certificate Form Submission → Google Sheets + Drive
// ============================================================
form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const otherCollegeChoice = document.querySelector('input[name="other-college"]:checked');
    const file = certFileInput.files[0];

    if (!file) {
        mainFileErrorMsg.textContent = "Please select a certificate file.";
        mainFileErrorMsg.style.display = "block";
        return;
    }

    if (file.type !== "application/pdf") {
        mainFileErrorMsg.textContent = "Only PDF files are allowed.";
        mainFileErrorMsg.style.display = "block";
        return;
    }

    if (file.size > 1048576) {
        mainFileErrorMsg.textContent = "File size must be 1MB or less.";
        mainFileErrorMsg.style.display = "block";
        return;
    }

    mainFileErrorMsg.style.display = "none";
    toggleSubmitState(true);

    try {
        const regNo = regNoInput.value.trim();

        let prefix = eventLevelInput.value.trim();
        const extraLevelSelect = document.getElementById("extracurricular-level");
        if (extraLevelSelect && document.getElementById("extracurricular-level-group").style.display !== 'none' && extraLevelSelect.value) {
            prefix += ` (${extraLevelSelect.value})`;
        }

        const fullEventName = prefix + " - " + eventSpecificInput.value.trim();
        const evNameSanitized = fullEventName.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${regNo}_${evNameSanitized}_${Date.now()}.pdf`;

        // Determine role (handle NPTEL grade vs normal radio)
        let finalRole = "";
        const baseLevel = eventLevelInput.value.trim();

        if (baseLevel === 'NPTEL Online Course') {
            const selectedGrade = document.querySelector('input[name="nptel-grade"]:checked');
            if (selectedGrade) finalRole = "Grade: " + selectedGrade.value;
        } else {
            const selectedRole = document.querySelector('input[name="event-role"]:checked');
            if (selectedRole) finalRole = selectedRole.value;
        }

        // Determine specific form type
        const specificFormType = getFormType(baseLevel);
        const extraLevelVal = (extraLevelSelect && document.getElementById("extracurricular-level-group").style.display !== 'none') ? extraLevelSelect.value : '';
        const specificEventVal = eventSpecificInput.value.trim();

        const formData = {
            formType: specificFormType,
            name: nameInput.value.trim(),
            regNo: regNoInput.value.trim(),
            contact: contactInput.value.trim(),
            event: fullEventName,
            role: finalRole,
            year: yearInput.value.trim(),
            branch: branchInput.value.trim(),
            section: sectionInput.value.trim(),
            otherCollege: otherCollegeChoice ? otherCollegeChoice.value : "",
            collegeName: otherCollegeChoice && otherCollegeChoice.value === 'yes' ? collegeNameInput.value.trim() : "",
            // Type-specific fields
            eventType: baseLevel,
            specificEvent: specificEventVal,
            courseName: specificFormType === 'nptel' ? specificEventVal : '',
            grade: specificFormType === 'nptel' ? finalRole.replace('Grade: ', '') : '',
            category: specificFormType === 'extracurricular' ? baseLevel : '',
            level: extraLevelVal,
            examName: '',
            rankScore: ''
        };

        submitButton.textContent = 'Uploading PDF...';
        await submitToSheet(formData, file, fileName);

        submitButton.textContent = '✅ Submitted!';
        submitButton.style.background = '#00c896';

        setTimeout(() => {
            alert("✅ Certificate submitted!\n\nYour PDF has been sent to the server.\n\n⚠️ IMPORTANT: Please check with the admin that your submission appears in the portal within 5 minutes. If it does not appear, contact the admin directly (the file may be in Drive but the sheet row may not have saved).");
            form.reset();
            closeModal();
            toggleSubmitState(false);
        }, 1500);

    } catch (error) {
        console.error("Submission error:", error);
        alert("❌ Submission failed: " + error.message + "\n\nPlease check your internet connection and try again.");
        toggleSubmitState(false);
    }
});

function toggleSubmitState(isSubmitting) {
    submitButton.disabled = isSubmitting;
    if (isSubmitting) {
        submitButton.textContent = 'Submitting...';
        submitButton.style.opacity = '0.7';
        submitButton.style.cursor = 'not-allowed';
    } else {
        submitButton.textContent = 'Submit Certificate';
        submitButton.style.opacity = '1';
        submitButton.style.cursor = 'pointer';
        submitButton.style.background = '';
    }
}

// ============================================================
// DOMContentLoaded — College toggle & hash routing
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[name="other-college"]').forEach((radio) => {
        radio.addEventListener('change', function() {
            if (this.value === 'yes') {
                collegeNameGroup.style.display = 'block';
                collegeNameInput.setAttribute('required', 'required');
            } else {
                collegeNameGroup.style.display = 'none';
                collegeNameInput.removeAttribute('required');
                collegeNameInput.value = '';
            }
        });
    });

    const hash = window.location.hash;
    if (hash === '#competitive-exams') {
        openExamSelectionModal();
    } else if (hash === '#extra-curricular') {
        openExtracurricularSelectionModal();
    } else if (hash === '#co-curricular') {
        openCocurricularSelectionModal();
    } else if (hash === '#nptel') {
        openModal('NPTEL Online Course', false);
    } else if (hash === '#administrative') {
        openAdminSelectionModal();
    } else if (hash === '#other-academic') {
        openAcademicSelectionModal();
    }
});

// ============================================================
// Competitive Exams Modal Logic
// ============================================================
const competitiveModal = document.getElementById("competitive-modal");
const competitiveForm = document.getElementById("competitive-form");
const compSubmitBtn = document.getElementById("comp-submit-btn-text");
const submitCompetitiveBtn = document.getElementById("submit-competitive-btn");
const compFileErrorMsg = document.getElementById("file-error-msg");
const compExamNameInput = document.getElementById("comp-exam-name");

const examSelectionModal = document.getElementById("exam-selection-modal");
const examSelectionCloseBtn = document.getElementById("exam-selection-close-btn");

function openExamSelectionModal() {
    if (examSelectionModal) examSelectionModal.style.display = 'flex';
}

function closeExamSelectionModal() {
    if (examSelectionModal) examSelectionModal.style.display = 'none';
}

if (examSelectionCloseBtn) {
    examSelectionCloseBtn.addEventListener('click', closeExamSelectionModal);
}

document.querySelectorAll('.exam-select-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const examName = this.getAttribute('data-exam');
        compExamNameInput.value = examName;
        closeExamSelectionModal();
        openCompetitiveModal();
    });
});

window.addEventListener("click", function(event) {
    if (event.target === examSelectionModal) closeExamSelectionModal();
    if (event.target === competitiveModal) closeCompetitiveModal();
    if (event.target === extracurricularSelectionModal) extracurricularSelectionModal.style.display = 'none';
    if (event.target === cocurricularSelectionModal) cocurricularSelectionModal.style.display = 'none';
    if (event.target === adminSelectionModal) adminSelectionModal.style.display = 'none';
    if (event.target === academicSelectionModal) academicSelectionModal.style.display = 'none';
});

function openCompetitiveModal() {
    if (competitiveModal) competitiveModal.style.display = 'flex';
}

function closeCompetitiveModal() {
    if (competitiveModal) {
        competitiveModal.style.display = "none";
        competitiveForm.reset();
        compExamNameInput.value = "";
        compFileErrorMsg.style.display = "none";
    }
}

if (submitCompetitiveBtn) {
    submitCompetitiveBtn.addEventListener('click', openExamSelectionModal);
}

document.querySelectorAll(".competitive-close-btn, .competitive-close-btn-action").forEach(elem => {
    elem.addEventListener("click", closeCompetitiveModal);
});

// ============================================================
// Competitive Exam Form Submission → Google Sheets + Drive
// ============================================================
if (competitiveForm) {
    competitiveForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const fileInput = document.getElementById("comp-cert-file");
        const file = fileInput.files[0];

        if (!file) {
            compFileErrorMsg.textContent = "Please select a file.";
            compFileErrorMsg.style.display = "block";
            return;
        }

        if (file.type !== "application/pdf") {
            compFileErrorMsg.textContent = "Only PDF files are allowed.";
            compFileErrorMsg.style.display = "block";
            return;
        }

        if (file.size > 1048576) {
            compFileErrorMsg.textContent = "File size must be 1MB or less.";
            compFileErrorMsg.style.display = "block";
            return;
        }

        compFileErrorMsg.style.display = "none";
        compSubmitBtn.disabled = true;
        compSubmitBtn.textContent = 'Uploading PDF...';
        compSubmitBtn.style.opacity = '0.7';

        try {
            const regNo = document.getElementById("comp-reg-no").value.trim();
            const examName = document.getElementById("comp-exam-name").value;
            const fileName = `${regNo}_${examName}_${Date.now()}.pdf`;

            const rankScoreVal = document.getElementById("comp-rank-score").value.trim();

            const formData = {
                formType: 'competitive',
                name: document.getElementById("comp-name").value.trim(),
                regNo: regNo,
                contact: document.getElementById("comp-contact").value.trim(),
                event: examName + " Competitive Exam",
                role: "Rank/Score: " + rankScoreVal,
                year: document.getElementById("comp-year").value.trim(),
                branch: document.getElementById("comp-branch").value.trim(),
                section: "",
                otherCollege: "",
                collegeName: "",
                // Competitive-specific fields
                examName: examName,
                rankScore: rankScoreVal,
                eventType: '', specificEvent: '', courseName: '', grade: '', category: '', level: ''
            };

            compSubmitBtn.textContent = 'Saving to Sheet...';
            await submitToSheet(formData, file, fileName);

            compSubmitBtn.textContent = '✅ Submitted!';
            compSubmitBtn.style.background = '#00c896';

            setTimeout(() => {
                alert("✅ Rank certificate submitted!\n\nYour PDF has been sent to the server.\n\n⚠️ IMPORTANT: Please check with the admin that your submission appears in the portal within 5 minutes. If it does not appear, contact the admin directly.");
                competitiveForm.reset();
                closeCompetitiveModal();
                compSubmitBtn.disabled = false;
                compSubmitBtn.textContent = 'Submit Details';
                compSubmitBtn.style.opacity = '1';
                compSubmitBtn.style.background = '';
            }, 1500);

        } catch (error) {
            console.error("Upload error:", error);
            alert("❌ Submission failed: " + error.message + "\n\nPlease check your internet connection and try again.");
            compSubmitBtn.disabled = false;
            compSubmitBtn.textContent = 'Submit Details';
            compSubmitBtn.style.opacity = '1';
        }
    });
}
