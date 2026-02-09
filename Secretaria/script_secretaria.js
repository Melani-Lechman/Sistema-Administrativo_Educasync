document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const calendar = document.querySelector(".calendar"),
      date = document.querySelector(".date"),
      daysContainer = document.querySelector(".days"),
      prev = document.querySelector(".prev"),
      next = document.querySelector(".next"),
      gotoBtn = document.querySelector(".goto-btn"),
      dateInput = document.querySelector(".date-input"),
      todayBtn = document.querySelector(".today-btn"),
      eventDay = document.querySelector(".event-day"),
      eventDate = document.querySelector(".event-date"),
      eventsContainer = document.querySelector(".events"),
      addEventBtn = document.querySelector(".add-event"),
      addEventWrapper = document.querySelector(".add-event-wrapper"),
      addEventCloseBtn = document.querySelector(".close"),
      addEventTitle = document.querySelector(".event-name"),
      addEventTimeFrom = document.querySelector(".event-time-from"),
      addEventLocation = document.querySelector(".event-location"),
      addEventSubmit = document.querySelector(".add-event-btn"),
      courseButtonsGrid = document.querySelector(".boton-grid"),
      deleteModal = document.getElementById('delete-modal'),
      confirmDeleteBtn = document.getElementById('confirm-delete-btn'),
      cancelDeleteBtn = document.getElementById('cancel-delete-btn'),
      plannerModal = document.getElementById('planner-modal'),
      planEventBtn = document.getElementById('plan-event-btn'),
      keepDateBtn = document.getElementById('keep-date-btn'),
      cancelPlanBtn = document.getElementById('cancel-plan-btn'),
      editColorsBtn = document.querySelector('.edit-colors-btn'),
      colorEditorPanel = document.querySelector('.color-editor-panel'),
      closeColorEditorBtn = document.getElementById('close-color-editor'),
      editorInstruction = document.getElementById('editor-instruction'),
      editorFields = document.getElementById('editor-fields'),
      courseNameEditor = document.getElementById('course-name-editor'),
      colorInput = document.getElementById('color-input'),
      saveColorBtn = document.getElementById('save-color-btn'),
      colorPickerLink = document.getElementById('color-picker-link'),
      alertModal = document.getElementById('alert-modal'),
      alertOkBtn = document.getElementById('alert-ok-btn'),
      alertModalTitle = document.getElementById('alert-modal-title'),
      alertModalMessage = document.getElementById('alert-modal-message');

    // --- ESTADO INICIAL ---
    let today = new Date();
    let activeDay;
    let month = today.getMonth();
    let year = today.getFullYear();
    let eventsArr = [];
    let coursesArr = [];
    let selectedCourses = [];
    let eventToDelete = null;
    let pendingEvent = null;
    let isColorEditMode = false;
    let courseToEdit = null;

    const months = [ "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre" ];

    // --- CARGA DE DATOS INICIAL ---
    async function loadInitialData() {
        coursesArr = await window.electronAPI.readData('courses.json');
        eventsArr = await window.electronAPI.readData('events.json') || [];

        if (!coursesArr) {
            courseButtonsGrid.innerHTML = "<p class='error-msg'>Error al cargar cursos.</p>";
            return;
        }
        
        activeDay = today.getDate();
        
        renderCourseButtons();
        initCalendar();
        
        getActiveDay(activeDay);
        updateEvents(activeDay);
    }

    // --- FUNCIONES DEL CALENDARIO ---
    function initCalendar() {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);
        const prevDays = prevLastDay.getDate();
        const lastDate = lastDay.getDate();
        const dayOfWeek = firstDay.getDay();
        const nextDays = 7 - lastDay.getDay() - 1;
        date.innerHTML = months[month] + " " + year;
        let days = "";
        for (let x = dayOfWeek; x > 0; x--) { days += `<div class="day prev-date">${prevDays - x + 1}</div>`; }
        for (let i = 1; i <= lastDate; i++) {
            const isEvent = eventsArr.some(e => e.day === i && e.month === month + 1 && e.year === year);
            if (i === new Date().getDate() && year === new Date().getFullYear() && month === new Date().getMonth()) {
                days += `<div class="day today ${activeDay === i ? 'active' : ''} ${isEvent ? 'event' : ''}">${i}</div>`;
            } else {
                days += `<div class="day ${activeDay === i ? 'active' : ''} ${isEvent ? 'event' : ''}">${i}</div>`;
            }
        }
        for (let j = 1; j <= nextDays; j++) { days += `<div class="day next-date">${j}</div>`; }
        daysContainer.innerHTML = days;
        addDayClickListener();
    }
    function prevMonth() { month--; if (month < 0) { month = 11; year--; } initCalendar(); }
    function nextMonth() { month++; if (month > 11) { month = 0; year++; } initCalendar(); }

    function updateEvents(date) {
        let eventsHTML = "";
        const eventsForDay = eventsArr.find(e => e.day === date && e.month === month + 1 && e.year === year);
        if (eventsForDay && eventsForDay.events.length > 0) {
            eventsForDay.events.forEach((eventItem, index) => {
                const totalStudents = eventItem.courses.reduce((sum, course) => sum + course.students, 0);
                eventsHTML += `
                <div class="event">
                    <div class="title"><span>${eventItem.title}</span><i class="fas fa-trash delete-event" data-event-index="${index}"></i></div>
                    <div class="event-time">${eventItem.timeFrom} @ ${eventItem.location} (${totalStudents} alumnos)</div>
                    <div class="event-courses">Cursos: ${eventItem.courses.map(c => `${c.year} ${c.modality !== 'Inicial' ? c.modality : ''}`).join(', ')}</div>
                </div>`;
            });
        } else {
            eventsHTML = `<div class="no-event"><h3>No hay eventos</h3></div>`;
        }
        eventsContainer.innerHTML = eventsHTML;
        addDeleteListener();
    }
    function getActiveDay(date) {
        const day = new Date(year, month, date);
        const dayName = day.toString().split(" ")[0];
        const dayNamesSpanish = { Sun: 'Domingo', Mon: 'Lunes', Tue: 'Martes', Wed: 'Miércoles', Thu: 'Jueves', Fri: 'Viernes', Sat: 'Sábado' };
        eventDay.innerHTML = dayNamesSpanish[dayName];
        eventDate.innerHTML = date + " " + months[month] + " " + year;
    }
// --- FUNCIONES DE GESTIÓN DE CURSOS ---
    function renderCourseButtons() {
        courseButtonsGrid.innerHTML = coursesArr.map(course => `
        <div class="boton-contenedor">
            <div class="texto-hover">${course.modality}</div>
            <button class="boton" style="background-color: ${course.color};" data-id="${course.id}">${course.text}</button>
        </div>
        `).join('');
        addCourseButtonListeners();
    }
    function addCourseButtonListeners() {
        courseButtonsGrid.querySelectorAll('.boton').forEach(button => {
            button.addEventListener('click', (e) => {
                const courseId = e.currentTarget.dataset.id;
                if (isColorEditMode) {
                    const course = coursesArr.find(c => c.id === courseId);
                    if (course && (course.modality === 'TIPP' || course.modality === 'MMO')) {
                        selectCourseForEditing(course);
                    }
                } else {
                    e.currentTarget.classList.toggle('selected');
                    if (selectedCourses.includes(courseId)) {
                        selectedCourses = selectedCourses.filter(id => id !== courseId);
                    } else {
                        selectedCourses.push(courseId);
                    }
                }
            });
        });
    }
    function resetSelectedCourses() {
        selectedCourses = [];
        courseButtonsGrid.querySelectorAll('.boton.selected').forEach(b => b.classList.remove('selected'));
    }
// --- FUNCIONES DE GESTIÓN DE EVENTOS ---
    function initiateAddEvent() {
        const title = addEventTitle.value, timeFrom = addEventTimeFrom.value, location = addEventLocation.value;
         if (!title || !timeFrom || !location) {
        return showAlert("Campos Incompletos", "Por favor, complete todos los campos para agregar el evento.");
      }
      if (!/^\d{2}:\d{2}$/.test(timeFrom)) {
        return showAlert("Formato de Hora Inválido", "Por favor, use el formato HH:MM para la hora.");
      }
      if (selectedCourses.length === 0) {
        return showAlert("Sin Cursos", "Por favor, seleccione al menos un curso para el evento.");
      }
        pendingEvent = { title, timeFrom, location, courses: coursesArr.filter(c => selectedCourses.includes(c.id)) };
        const selectedDate = new Date(year, month, activeDay);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const diffTime = selectedDate.getTime() - todayDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) { plannerModal.classList.remove('hidden'); } 
        else { saveEvent(selectedDate); }
    }
    async function saveEvent(dateToSave) {
        if (!pendingEvent) return;
        const day = dateToSave.getDate(), monthVal = dateToSave.getMonth() + 1, yearVal = dateToSave.getFullYear();
        let dayEntry = eventsArr.find(e => e.day === day && e.month === monthVal && e.year === yearVal);
        if (dayEntry) { dayEntry.events.push(pendingEvent); } 
        else { eventsArr.push({ day, month: monthVal, year: yearVal, events: [pendingEvent] }); }
        await window.electronAPI.writeData('events.json', eventsArr);
        addEventWrapper.classList.remove("active");
        addEventTitle.value = ""; addEventTimeFrom.value = ""; addEventLocation.value = "";
        resetSelectedCourses();
        updateEvents(activeDay);
        initCalendar();
        pendingEvent = null;
    }
    function showDeleteModal(eventContext) { eventToDelete = eventContext; deleteModal.classList.remove('hidden'); }
    async function handleDeleteEvent() {
        if (!eventToDelete) return;
        const { index, day, month: eventMonth, year: eventYear } = eventToDelete;
        let dayEntry = eventsArr.find(e => e.day === day && e.month === eventMonth && e.year === eventYear);
        if (dayEntry) {
            dayEntry.events.splice(index, 1);
            if (dayEntry.events.length === 0) { eventsArr = eventsArr.filter(e => e !== dayEntry); }
            await window.electronAPI.writeData('events.json', eventsArr);
            if (day === activeDay && (eventMonth - 1) === month && eventYear === year) { updateEvents(activeDay); }
            initCalendar();
        }
        deleteModal.classList.add('hidden');
        eventToDelete = null;
    }
// --- FUNCIONES DE EDICIÓN DE COLORES ---
    function showAlert(title, message) {
        alertModalTitle.textContent = title;
        alertModalMessage.textContent = message;
        alertModal.classList.remove('hidden');
    }

    function toggleColorEditMode() {
        isColorEditMode = !isColorEditMode;
        colorEditorPanel.classList.toggle('hidden', !isColorEditMode);
        courseButtonsGrid.querySelectorAll('.boton').forEach(btn => {
            const course = coursesArr.find(c => c.id === btn.dataset.id);
            if (course && (course.modality === 'TIPP' || course.modality === 'MMO')) {
                btn.classList.toggle('editable', isColorEditMode);
            }
        });
        if (!isColorEditMode) {
            resetColorEditor();
        }
    }
    function selectCourseForEditing(course) {
        courseToEdit = course;
        editorInstruction.classList.add('hidden');
        editorFields.classList.remove('hidden');
        courseNameEditor.textContent = `${course.year} ${course.modality}`;
        colorInput.value = course.color;
    }
    async function saveNewColor() {
        if (!courseToEdit) return;
        const newColor = colorInput.value.trim();
        if (!/^#[0-9A-F]{6}$/i.test(newColor)) {
            return showAlert("Formato Inválido", "Use un código hexadecimal, ej: #E67E22");
        }
        const courseIndex = coursesArr.findIndex(c => c.id === courseToEdit.id);
        if (courseIndex > -1) {
            coursesArr[courseIndex].color = newColor;
            await window.electronAPI.writeData('courses.json', coursesArr);
            renderCourseButtons();
        }
        toggleColorEditMode();
    }
    function resetColorEditor() {
        editorInstruction.classList.remove('hidden');
        editorFields.classList.add('hidden');
        courseToEdit = null;
        colorInput.value = '';
    }

    // --- EVENTOS DE INTERACCIÓN ---
    function addDayClickListener() {
        daysContainer.querySelectorAll(".day:not(.next-date):not(.prev-date)").forEach(day => {
            day.addEventListener("click", (e) => {
                activeDay = Number(e.target.innerHTML);
                getActiveDay(activeDay);
                updateEvents(activeDay);
                daysContainer.querySelectorAll(".day").forEach(d => d.classList.remove("active"));
                e.currentTarget.classList.add("active");
            });
        });
    }
    function addDeleteListener() {
        eventsContainer.querySelectorAll('.delete-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventIndex = e.currentTarget.dataset.eventIndex;
                showDeleteModal({ index: parseInt(eventIndex), day: activeDay, month: month + 1, year: year });
            });
        });
    }
// --- BOTONES DE NAVEGACIÓN ---
    todayBtn.addEventListener("click", () => {
        today = new Date();
        month = today.getMonth();
        year = today.getFullYear();
        activeDay = today.getDate();
        initCalendar();
        getActiveDay(activeDay);
        updateEvents(activeDay);
    });

    prev.addEventListener("click", prevMonth);
    next.addEventListener("click", nextMonth);
    addEventBtn.addEventListener("click", () => addEventWrapper.classList.toggle("active"));
    addEventCloseBtn.addEventListener("click", () => addEventWrapper.classList.remove("active"));
    addEventSubmit.addEventListener("click", initiateAddEvent);
    confirmDeleteBtn.addEventListener('click', handleDeleteEvent);
    cancelDeleteBtn.addEventListener('click', () => { deleteModal.classList.add('hidden'); eventToDelete = null; });
    planEventBtn.addEventListener('click', () => {
        const selectedDate = new Date(year, month, activeDay); selectedDate.setDate(selectedDate.getDate() + 7);
        saveEvent(selectedDate); plannerModal.classList.add('hidden');
    });
    keepDateBtn.addEventListener('click', () => {
        const selectedDate = new Date(year, month, activeDay); saveEvent(selectedDate);
        plannerModal.classList.add('hidden');
    });
    //  Códigos de Colores
    cancelPlanBtn.addEventListener('click', () => { plannerModal.classList.add('hidden'); pendingEvent = null; });
    editColorsBtn.addEventListener('click', toggleColorEditMode);
    closeColorEditorBtn.addEventListener('click', toggleColorEditMode);
    saveColorBtn.addEventListener('click', saveNewColor);
    colorPickerLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.electronAPI.openLink('https://htmlcolorcodes.com/es/tabla-de-colores/');
    });

    // --- NAVEGACIÓN POR FECHA ---
    gotoBtn.addEventListener("click", gotoDate);
    dateInput.addEventListener("keypress", (e) => { if (e.key === "Enter") gotoDate(); });
    dateInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 2 && value.length <= 4) { value = value.slice(0, 2) + "/" + value.slice(2); } 
        else if (value.length > 4) { value = value.slice(0, 2) + "/" + value.slice(2, 4) + "/" + value.slice(4, 8); }
        e.target.value = value;
    });

    function gotoDate() {
        const dateValue = dateInput.value.trim();
        const dateArr = dateValue.split("/");

        if (dateArr.length === 3) {
            const d = parseInt(dateArr[0]);
            const m = parseInt(dateArr[1]);
            const y = parseInt(dateArr[2]);
            const dateToFind = new Date(y, m - 1, d);

            if (!isNaN(d) && !isNaN(m) && !isNaN(y) && dateToFind.getFullYear() === y && dateToFind.getMonth() === m - 1 && dateToFind.getDate() === d) {
                year = y; month = m - 1; activeDay = d;
                initCalendar();
                getActiveDay(activeDay);
                updateEvents(activeDay);
                dateInput.value = "";
                return;
            }
        }
        showAlert("Formato Inválido", "Por favor, use el formato día/mes/año (ej: 10/10/2025).");
    }
    
    addEventTimeFrom.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 2 && value.length <= 4) {
          value = value.slice(0, 2) + ":" + value.slice(2);
        } else if (value.length > 4) {
          value = value.slice(0, 2) + ":" + value.slice(2, 4);
        }
        e.target.value = value;
    });
// --- MODAL DE ALERTA ---
    alertOkBtn.addEventListener('click', () => {
        alertModal.classList.add('hidden');
    });

    // --- INICIALIZACIÓN ---
    loadInitialData();

}); 

