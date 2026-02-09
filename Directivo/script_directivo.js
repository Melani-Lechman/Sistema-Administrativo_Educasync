document.addEventListener('DOMContentLoaded', async () => {
    // --- ELEMENTOS DEL DOM ---
    const navLinks = document.querySelectorAll('.nav-link');
    const contentArea = document.getElementById('content-area');
    const viewTitle = document.getElementById('view-title');
    const logoutBtn = document.getElementById('logout-btn');
    const configSchedulesBtn = document.getElementById('config-schedules-btn');

    // --- DATOS GLOBALES ---
    let allEvents = [];
    let allCourses = [];
    let schoolData = {};
    const DAYS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'];

    // --- CARGA Y GUARDADO DE DATOS ---
    async function loadData() {

    // --- Cargar EVENTS ---
    allEvents = await window.electronAPI.readData('events.json') || [];

    // --- Cargar COURSES con conversión a número SIEMPRE ---
    allCourses = (await window.electronAPI.readData('courses.json') || []).map(course => ({
        ...course,
        students: course.students !== undefined ? Number(course.students) : 0
    }));

    // --- Cargar SCHEDULES ---
    schoolData = await window.electronAPI.readData('schedules.json');

    // Corrección si schedules.json está vacío o corrupto
    if (!schoolData || !schoolData.timeSlots) {
        schoolData = {
            "timeSlots": { "mañana": ["07:45 - 08:25"], "tarde": ["13:30 - 14:10"] },
            "1": { "name": "Primer Año", "divisions": {} },
            "2": { "name": "Segundo Año", "divisions": {} },
            "3": { "name": "Tercer Año", "divisions": {} },
            "4": { "name": "Cuarto Año", "divisions": {} },
            "5": { "name": "Quinto Año", "divisions": {} },
            "6": { "name": "Sexto Año", "divisions": {} }
        };
        await saveData('schedules.json', schoolData);
    }

    // Cargar vista inicial
    switchView('inicio');
}


    async function saveData(fileName, data) {
        const result = await window.electronAPI.writeData(fileName, data);
        if (!result.success) {
            showAlert(`Error: No se pudieron guardar los cambios en ${fileName}.`);
        }
        return result;
    }

    // =============================================================
    // --- RENDERIZADO DE VISTAS ---
    // =============================================================

    function renderInicioView() {
        const today= new Date();
        today.setHours(0,0,0,0);
        let upcomingEventsCount = 0;
        allEvents.forEach(dayEntry => {
            const eventDate = new Date(dayEntry.year, dayEntry.month - 1, dayEntry.day);
            eventDate.setHours(0,0,0,0);
            const diffDays = (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);  
             if (eventDate >= today) {
                upcomingEventsCount += dayEntry.events.length;
            }
        });

        const courseCount = allCourses.length;
        const totalStudents = allCourses.reduce((sum, course) => sum + (course.students || 0), 0);
        return `
            <div class="stats-grid">
                <div class="stat-card"><h4>Eventos Próximos</h4><p>${upcomingEventsCount}</p><i class="fas fa-calendar-alt"></i></div>
                <div class="stat-card"><h4>Cursos Activos</h4><p>${courseCount}</p><i class="fas fa-book"></i></div>
                <div class="stat-card"><h4>Total de Alumnos</h4><p>${totalStudents}</p><i class="fas fa-users"></i></div>
            </div>
        `;
    }

function renderEventosView() {
        let tableRows = '';
        allEvents.forEach((dayEntry, dayIndex) => {
            dayEntry.events.forEach((event, eventIndex) => {
                const eventId = `${dayIndex}-${eventIndex}`;
                tableRows += `
                    <tr>
                        <td>${event.title}</td>
                        <td>${dayEntry.day}/${dayEntry.month}/${dayEntry.year}</td>
                        <td>${event.timeFrom}</td>
                        <td>${event.location}</td>
                        <td>
                            <button class="btn btn-edit event-edit-btn" data-event-id="${eventId}">Editar</button>
                            <button class="btn btn-delete event-delete-btn" data-event-id="${eventId}">Eliminar</button>
                        </td>
                    </tr>`;
            });
        });
        return `
            <div class="table-container">
                <table class="data-table">
                    <thead><tr><th>Nombre</th><th>Fecha</th><th>Hora</th><th>Lugar</th><th>Acciones</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
        `;
    }

    function renderCursosView() {
        let tableRows = allCourses.map(course => `
            <tr>
                <td><div class="color-preview" style="background-color: ${course.color};"></div> ${course.color}</td>
                <td>${course.text}</td>
                <td>${course.modality}</td>
                <td><button class="btn btn-edit course-edit-btn" data-course-id="${course.id}">Editar</button></td>
            </tr>`).join('');
        return `
            <div class="table-container">
                <table class="data-table">
                    <thead><tr><th>Color</th><th>Número</th><th>Modalidad</th><th>Acciones</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>`;
    }

    function renderInfoCursoView() {
        let content = '';
        for (const yearId in schoolData) {
            if (yearId === 'timeSlots') continue;
            const year = schoolData[yearId];
            content += `
                <div class="year-accordion">
                    <div class="year-header"><span>${year.name}</span><span class="arrow">▼</span></div>
                    <div class="divisions-container">
                        ${Object.keys(year.divisions).map(divName => `<div class="division" data-year-id="${yearId}" data-division-name="${divName}">${divName}</div>`).join('')}
                        <button class="btn manage-sections-btn" data-year-id="${yearId}"><i class="fa-solid fa-gear"></i></button>
                    </div>
                </div>`;
        }
        return content;
    }

    // =============================================================
    // --- LÓGICA DE GESTIÓN CON VALIDACIÓN Y ALERTAS ESTÉTICAS ---
    // =============================================================

    // ---  Nuevas funciones para modales genéricos ---
    function showAlert(title, message) {
        const modal = document.getElementById('alert-modal');
        modal.querySelector('#alert-title').textContent = title;
        modal.querySelector('#alert-message').textContent = message;
        modal.querySelector('#alert-confirm-btn').classList.add('hidden');
        modal.querySelector('#alert-cancel-btn').classList.add('hidden');
        modal.querySelector('#alert-ok-btn').classList.remove('hidden');
        modal.classList.remove('hidden');
    }

    function showConfirm(title, message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('alert-modal');
            modal.querySelector('#alert-title').textContent = title;
            modal.querySelector('#alert-message').textContent = message;
            modal.querySelector('#alert-confirm-btn').classList.remove('hidden');
            modal.querySelector('#alert-cancel-btn').classList.remove('hidden');
            modal.querySelector('#alert-ok-btn').classList.add('hidden');
            modal.classList.remove('hidden');

            modal.querySelector('#alert-confirm-btn').onclick = () => { modal.classList.add('hidden'); resolve(true); };
            modal.querySelector('#alert-cancel-btn').onclick = () => { modal.classList.add('hidden'); resolve(false); };
        });
    }

    // =============================================================
    // --- LÓGICA DE GESTIÓN (Eventos, Cursos, Horarios) ---
    // =============================================================

    function openEventModal(eventId = null) {
        const modal = document.getElementById('event-modal');
        const form = document.getElementById('event-form');
        form.reset();
        modal.querySelector('h2').textContent = eventId ? 'Editar Evento' : 'Crear Evento';
        
        if (eventId) {
            const [dayIndex, eventIndex] = eventId.split('-');
            const dayEntry = allEvents[dayIndex];
            const event = dayEntry.events[eventIndex];
            form.querySelector('#event-id-input').value = eventId;
            form.querySelector('#event-title').value = event.title;
            form.querySelector('#event-date').value = `${String(dayEntry.day).padStart(2,'0')}/${String(dayEntry.month).padStart(2,'0')}/${dayEntry.year}`;
            form.querySelector('#event-time').value = event.timeFrom;
            form.querySelector('#event-location').value = event.location;
        } else {
            form.querySelector('#event-id-input').value = '';
        }
        modal.classList.remove('hidden');
    }
    
   // --- Gestión de Eventos (con validación) ---
async function saveEvent(e) {
    e.preventDefault();
    
    const form = e.target;
    const eventId = form.querySelector('#event-id-input').value.trim(); 
    
    const dateValue = form.querySelector('#event-date').value;
    const timeValue = form.querySelector('#event-time').value;

    // Validación de formatos
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue) || !/^\d{2}:\d{2}$/.test(timeValue)) {
        return showAlert("Formato Inválido", "Por favor, use dd/mm/aaaa para la fecha y HH:MM para la hora.");
    }

    const [day, month, year] = dateValue.split('/');
    const dateObj = new Date(year, month - 1, day);

    // Validación de existencia de fecha real
    if (
        dateObj.getFullYear() != year ||
        dateObj.getMonth() != month - 1 ||
        dateObj.getDate() != day
    ) {
        return showAlert("Fecha Inválida", "La fecha ingresada no es válida.");
    }

    // Datos del evento
    const eventData = {
        title: form.querySelector('#event-title').value,
        timeFrom: form.querySelector('#event-time').value,
        location: form.querySelector('#event-location').value,
        courses: []
    };

    // ----------------------------------------------------
    // ---------   EDITAR EVENTO EXISTENTE   --------------
    // ----------------------------------------------------
    if (eventId) {
          const eventData = {
                title: form.querySelector('#event-title').value,
                timeFrom: timeValue,
                location: form.querySelector('#event-location').value
            };

        const [dayIndex, eventIndex] = eventId.split('-');
        const originalDayEntry = allEvents[dayIndex];
        const originalEvent = originalDayEntry.events[eventIndex];

        const isSameDate =
            originalDayEntry.day == day &&
            originalDayEntry.month == month &&
            originalDayEntry.year == year;
            
        if (isSameDate) {
            // Misma fecha → actualizar datos solamente
            originalDayEntry.events[eventIndex] = { ...originalEvent, ...eventData };
        } else {
            // Fecha cambiada → mover evento
            originalDayEntry.events.splice(eventIndex, 1);

            if (originalDayEntry.events.length === 0) {
                allEvents.splice(dayIndex, 1);
            }

            let newDayEntry = allEvents.find(
                d => d.day == day && d.month == month && d.year == year
            );

            const newEvent = { ...originalEvent, ...eventData };

            if (newDayEntry) {
                newDayEntry.events.push(newEvent);
            } else {
                allEvents.push({
                    day: parseInt(day),
                    month: parseInt(month),
                    year: parseInt(year),
                    events: [newEvent]
                });
            }
        }

    } else {
        // ----------------------------------------------------
        // ---------    CREAR NUEVO EVENTO        ------------
        // ----------------------------------------------------
        const eventData = {
                title: form.querySelector('#event-title').value,
                timeFrom: timeValue,
                location: form.querySelector('#event-location').value,
                courses: []
            }
        let dayEntry = allEvents.find(
            d => d.day == day && d.month == month && d.year == year
            
        );

        if (dayEntry) {
            dayEntry.events.push(eventData);
        } else {
            allEvents.push({
                day: parseInt(day),
                month: parseInt(month),
                year: parseInt(year),
                events: [eventData]
            });
        }
    }

    // ----------------------------------------------------
    // ---------   GUARDADO FINAL Y REFRESCO   ------------
    // ----------------------------------------------------
    if ((await saveData('events.json', allEvents)).success) {
        document.getElementById('event-modal').classList.add('hidden');
        await refreshIfInEventosView(); // Recarga auto si estás en Eventos
    }
}

 
    async function deleteEvent(eventId) {
        const confirmed = await showConfirm("Confirmar Eliminación", "¿Estás seguro de que quieres eliminar este evento?");
        if (confirmed) {
            const [dayIndex, eventIndex] = eventId.split('-');
            allEvents[dayIndex].events.splice(eventIndex, 1);
            if (allEvents[dayIndex].events.length === 0) {
                allEvents.splice(dayIndex, 1);
            }
            if ((await saveData('events.json', allEvents)).success) {
                 document.getElementById('event-modal').classList.add('hidden');
                    await refreshIfInEventosView(); // <-- refresca automáticamente
}
        }
    }
    
    
    function openCourseModal(courseId) {
    const modal = document.getElementById('course-modal');
    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;
    modal.querySelector('#course-id-input').value = course.id;
    modal.querySelector('#course-text').value = course.text;
    modal.querySelector('#course-modality').value = course.modality;
    modal.querySelector('#course-color').value = course.color;

    modal.querySelector('#course-students').value = course.students ?? 0;

    modal.classList.remove('hidden');
}


    async function saveCourse(e) {
        e.preventDefault();
        const form = e.target;
        const courseId = form.querySelector('#course-id-input').value;
        const courseIndex = allCourses.findIndex(c => c.id === courseId);
        if (courseIndex > -1) {
            allCourses[courseIndex].text = form.querySelector('#course-text').value;
            allCourses[courseIndex].modality = form.querySelector('#course-modality').value;
            allCourses[courseIndex].color = form.querySelector('#course-color').value;
            allCourses[courseIndex].students = parseInt(form.querySelector('#course-students').value, 10);
            
            if ((await saveData('courses.json', allCourses)).success) {
                document.getElementById('course-modal').classList.add('hidden');
                switchView('cursos');
            }
        }
    }
    
    function openScheduleModal(yearId, divisionName) {
        const modal = document.getElementById('schedule-modal');
        modal.querySelector('#schedule-title').textContent = `Horario: ${schoolData[yearId].name} - ${divisionName}`;
        const tabsContainer = modal.querySelector('#schedule-tabs');
        tabsContainer.innerHTML = '';
        ['mañana', 'tarde'].forEach(turno => {
            const tabBtn = document.createElement('button');
            tabBtn.className = 'tab-btn';
            tabBtn.textContent = `Turno ${turno.charAt(0).toUpperCase() + turno.slice(1)}`;
            tabBtn.onclick = () => {
                tabsContainer.querySelector('.active')?.classList.remove('active');
                tabBtn.classList.add('active');
                renderScheduleGrid(yearId, divisionName, turno);
            };
            tabsContainer.appendChild(tabBtn);
        });
        modal.classList.remove('hidden');
        tabsContainer.querySelector('.tab-btn').click();
    }

    function renderScheduleGrid(yearId, divisionName, turno) {
        const table = document.getElementById('schedule-table');
        table.querySelector('thead').innerHTML = `<tr><th>HORA</th>${DAYS.map(d => `<th>${d}</th>`).join('')}</tr>`;
        const tableBody = table.querySelector('tbody');
        tableBody.innerHTML = '';
        const schedule = schoolData[yearId].divisions[divisionName][turno];
        schoolData.timeSlots[turno].forEach(slot => {
            const tr = tableBody.insertRow();
            tr.innerHTML = `<td class="time-slot">${slot}</td>`;
            DAYS.forEach(day => {
                const cell = tr.insertCell();
                const slotData = schedule.find(item => item.dia === day && item.hora === slot);
                if (slotData) {
                    cell.innerHTML = `<div class="slot-content"><span class="materia">${slotData.materia || ''}</span><span class="profesor">${slotData.profesor || ''}</span>${slotData.aula ? `<span class="aula">Aula: ${slotData.aula}</span>` : ''}</div>`;
                }
                cell.onclick = () => openSlotEditorModal(yearId, divisionName, day, slot, turno);
            });
        });
    }

    function openSlotEditorModal(yearId, divisionName, day, timeslot, turno) {
        const modal = document.getElementById('slot-editor-modal');
        const [materia, profesor, aula] = ['#slot-materia', '#slot-profesor', '#slot-aula'].map(id => modal.querySelector(id));
        const [saveBtn, deleteBtn] = ['#save-slot-btn', '#delete-slot-btn'].map(id => modal.querySelector(id));
        
        modal.querySelector('#slot-editor-title').textContent = `Editar: ${day} (${timeslot})`;
        const schedule = schoolData[yearId].divisions[divisionName][turno];
        const data = schedule.find(item => item.dia === day && item.hora === timeslot);
        
        materia.value = data?.materia || '';
        profesor.value = data?.profesor || '';
        aula.value = data?.aula || '';

        saveBtn.onclick = async () => {
            let entry = schedule.find(item => item.dia === day && item.hora === timeslot);
            if (materia.value || profesor.value || aula.value) {
                const newData = { hora: timeslot, dia: day, materia: materia.value, profesor: profesor.value, aula: aula.value };
                if (entry) Object.assign(entry, newData); 
                else schedule.push(newData);
            } else if (entry) {
                schedule.splice(schedule.indexOf(entry), 1);
            }
            await saveData('schedules.json', schoolData);
            modal.classList.add('hidden');
            renderScheduleGrid(yearId, divisionName, turno);
        };
        deleteBtn.onclick = async () => {
            const index = schedule.findIndex(item => item.dia === day && item.hora === timeslot);
            if (index > -1) schedule.splice(index, 1);
            await saveData('schedules.json', schoolData);
            modal.classList.add('hidden');
            renderScheduleGrid(yearId, divisionName, turno);
        };
        modal.classList.remove('hidden');
    }

    function openSectionsModal(yearId) {
        const modal = document.getElementById('sections-modal');
        const [title, list, addBtn, input] = ['#sections-title', '#sections-list', '#add-section-btn', '#new-section-name'].map(id => modal.querySelector(id));
        title.textContent = `Gestionar Secciones de ${schoolData[yearId].name}`;
        input.value = '';

        const renderList = () => {
            list.innerHTML = '';
            for (const divName in schoolData[yearId].divisions) {
                const item = document.createElement('div');
                item.className = 'section-item';
                item.innerHTML = `<span>${divName}</span><button class="btn danger">Eliminar</button>`;
               item.querySelector('button').onclick = async () => {
                    const confirmed = await showConfirm(
                        "Confirmar Eliminación", 
                        `¿Seguro que quieres eliminar la división "${divName}"? Se perderán todos sus horarios.`
                    );
                    if (confirmed) {
                        delete schoolData[yearId].divisions[divName];
                        await saveData('schedules.json', schoolData);
                        renderList();
                        switchView('info-curso'); // Para refrescar el acordeón
                    }
                };
                list.appendChild(item);
            }
        };

        addBtn.onclick = async () => {
            const newName = input.value.trim().toUpperCase();
            if (newName && !schoolData[yearId].divisions[newName]) {
                schoolData[yearId].divisions[newName] = { mañana: [], tarde: [] };
                await saveData('schedules.json', schoolData);
                input.value = '';
                renderList();
                switchView('info-curso');
            } else { 
                return showAlert('Nombre de sección inválido o ya existe.'); }
        };
        renderList();
        modal.classList.remove('hidden');
    }

    function openTimeSlotsModal() {
        const modal = document.getElementById('time-slots-modal');
        const saveBtn = modal.querySelector('#save-time-slots-btn');

        ['mañana', 'tarde'].forEach(turno => {
            const listContainer = modal.querySelector(`#time-slots-list-${turno}`);
            const addBtn = modal.querySelector(`.add-time-slot-btn[data-turno="${turno}"]`);
            
            const renderList = () => {
                listContainer.innerHTML = '';
                schoolData.timeSlots[turno].forEach((slot, index) => {
                    const item = document.createElement('div');
                    item.className = 'time-slot-item';
                    item.innerHTML = `<input type="text" value="${slot}"><button class="btn danger">✖</button>`;
                    item.querySelector('button').onclick = () => { schoolData.timeSlots[turno].splice(index, 1); renderList(); };
                    listContainer.appendChild(item);
                });
            };
            addBtn.onclick = () => { schoolData.timeSlots[turno].push('Nuevo Horario'); renderList(); };
            renderList();
        });

        saveBtn.onclick = async () => {
            ['mañana', 'tarde'].forEach(turno => {
                const inputs = modal.querySelectorAll(`#time-slots-list-${turno} input`);
                schoolData.timeSlots[turno] = Array.from(inputs).map(input => input.value.trim()).filter(Boolean);
            });
            await saveData('schedules.json', schoolData);
            modal.classList.add('hidden');
        };
        modal.classList.remove('hidden');
    }

    // =============================================================
    // --- FUNCIÓN PRINCIPAL Y EVENT LISTENERS ---
    // =============================================================
    
  async function switchView(viewName) {
    let content = '', title = '';
    configSchedulesBtn.classList.add('hidden');

    // Recargar datos siempre que cambiamos de vista
    allEvents = await window.electronAPI.readData('events.json') || [];

    // --- AQUÍ: conversión garantizada SIEMPRE ---
    allCourses = ((await window.electronAPI.readData('courses.json')) || []).map(course => ({
        ...course,
        students: course.students !== undefined ? Number(course.students) : 0
    }));

    switch (viewName) {
        case 'inicio':
            title = 'Panel de Inicio';
            content = renderInicioView();
            break;

        case 'eventos':
            title = 'Gestión de Eventos';
            content = renderEventosView();
            break;

        case 'cursos':
            title = 'Gestión de Cursos';
            content = renderCursosView();
            break;

        case 'info-curso':
            title = 'Información por Curso';
            content = renderInfoCursoView();
            configSchedulesBtn.classList.remove('hidden');
            break;

        default:
            title = 'Panel de Inicio';
            content = renderInicioView();
    }

    viewTitle.textContent = title;
    contentArea.innerHTML = content;

    setupEventListenersForView(viewName);

    // Marcar la pestaña activa
    // --- RESET REAL DE TODAS LAS NAVS ---
navLinks.forEach(link => link.classList.remove('active'));

// --- ACTIVAR SOLO LA CORRECTA ---
const navToActivate = document.querySelector(`.nav-link[data-view="${viewName}"]`);
if (navToActivate) navToActivate.classList.add('active');


}


    function setupEventListenersForView(viewName) {
         if (viewName === 'eventos') {
            document.getElementById('create-event-btn')?.addEventListener('click', () => openEventModal());
            document.querySelectorAll('.event-edit-btn').forEach(b => b.addEventListener('click', e => openEventModal(e.currentTarget.dataset.eventId)));
            document.querySelectorAll('.event-delete-btn').forEach(b => b.addEventListener('click', e => deleteEvent(e.currentTarget.dataset.eventId)));
            
            // Formato automático para el modal de eventos
            const eventDateInput = document.getElementById('event-date');
            const eventTimeInput = document.getElementById('event-time');
            if(eventDateInput) {
                eventDateInput.addEventListener("input", (e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value.length > 2 && value.length <= 4) { value = value.slice(0, 2) + "/" + value.slice(2); } 
                    else if (value.length > 4) { value = value.slice(0, 2) + "/" + value.slice(2, 4) + "/" + value.slice(4, 8); }
                    e.target.value = value;
                });
            }
            if(eventTimeInput) {
                eventTimeInput.addEventListener("input", (e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value.length > 2 && value.length <= 4) { value = value.slice(0, 2) + ":" + value.slice(2); }
                    else if (value.length > 4) { value = value.slice(0, 2) + ":" + value.slice(2, 4); }
                    e.target.value = value;
                });
            }
        }
        if (viewName === 'eventos') {
            document.getElementById('create-event-btn')?.addEventListener('click', () => openEventModal());
            document.querySelectorAll('.event-edit-btn').forEach(b => b.addEventListener('click', e => openEventModal(e.currentTarget.dataset.eventId)));
            document.querySelectorAll('.event-delete-btn').forEach(b => b.addEventListener('click', e => deleteEvent(e.currentTarget.dataset.eventId)));
        }
        if (viewName === 'cursos') {
            document.querySelectorAll('.course-edit-btn').forEach(b => b.addEventListener('click', e => openCourseModal(e.currentTarget.dataset.courseId)));
        }
        if (viewName === 'info-curso') {
            document.querySelectorAll('.year-header').forEach(h => h.addEventListener('click', () => {
                h.classList.toggle('active');
                h.nextElementSibling.style.display = h.classList.contains('active') ? 'flex' : 'none';
            }));
            document.querySelectorAll('.division').forEach(b => b.addEventListener('click', e => openScheduleModal(e.currentTarget.dataset.yearId, e.currentTarget.dataset.divisionName)));
            document.querySelectorAll('.manage-sections-btn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openSectionsModal(e.currentTarget.dataset.yearId); }));
        }
    }
    
    // Listeners globales
    logoutBtn.addEventListener('click', e => { e.preventDefault(); window.electronAPI.navigateToLogin(); });
    configSchedulesBtn.addEventListener('click', openTimeSlotsModal);
    
    navLinks.forEach(link => {
        if (link.id !== 'logout-btn') {
            link.addEventListener('click', e => {
                e.preventDefault();
                const viewName = e.currentTarget.dataset.view;

                if (viewName === 'calendario') {
                    window.electronAPI.openCalendarWindow();
                } else {
                    switchView(viewName);
                }
            });
        }
    });
    
async function refreshIfInEventosView() {
    const currentView = document.querySelector('.nav-link.active')?.dataset.view;
    
    if (currentView === 'eventos') {
        await switchView('eventos'); // recarga lista con datos nuevos
    }
}


 //  Listener para el botón OK del modal de alerta
    document.getElementById('alert-ok-btn').addEventListener('click', () => {
        document.getElementById('alert-modal').classList.add('hidden');
    });

    document.querySelectorAll('.close-btn').forEach(btn => btn.addEventListener('click', (e) => e.currentTarget.closest('.modal-overlay').classList.add('hidden')));
    document.getElementById('event-form')?.addEventListener('submit', saveEvent);
    document.getElementById('course-form')?.addEventListener('submit', saveCourse);

    loadData();
});

 // LÓGICA DE DESCARGA DE HORARIO COMO IMAGEN
       document.addEventListener('DOMContentLoaded', () => {
        const downloadBtn = document.querySelector('.btn-download'); // Usamos la clase del botón
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                // CORRECCIÓN: Usar el ID real del contenedor en el HTML
                const areaCaptura = document.getElementById('horario-captura');
                
                // CORRECCIÓN: Validar si existe el título o poner uno por defecto
                const tituloElem = document.querySelector('.header-horario h2');
                const titulo = tituloElem ? tituloElem.innerText : 'horario';

                // Feedback visual
                const originalContent = downloadBtn.innerHTML;
                downloadBtn.disabled = true;
                downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';

                // Ejecutar captura
                html2canvas(areaCaptura, {
                    scale: 2,
                    useCORS: true, // Importante si hay imágenes o fuentes externas
                    backgroundColor: "#ffffff",
                    logging: false // Cambiar a true si necesitas ver el error en consola
                }).then(canvas => {
                    const link = document.createElement('a');
                    link.download = `${titulo.replace(/\s+/g, '_')}.png`;
                    link.href = canvas.toDataURL("image/png");
                    link.click();

                    // Restaurar botón
                    downloadBtn.disabled = false;
                    downloadBtn.innerHTML = originalContent;
                }).catch(err => {
                    console.error("Error capturando horario:", err);
                    alert("Error al generar la imagen. Revisa la consola.");
                    downloadBtn.disabled = false;
                    downloadBtn.innerHTML = originalContent;
                });
            });
        }
    });
    