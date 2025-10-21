const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const userStorage = require('./db/userStorage');

let mainWindow; // La ventana principal (Login)

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('login.html');
}


app.whenReady().then(() => {
    createWindow();
    startEventChecker(); //inicio el verificador de correos
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- MANEJADORES DE LOGIN Y NAVEGACIÓN ---
ipcMain.handle('login-user', async (event, credentials) => {
  const result = await userStorage.loginUser(credentials);
  if (result.success && mainWindow) {
    const userRole = credentials.nombre.toLowerCase();
    let viewPath = '';

    if (userRole === 'secretaria') {
      viewPath = path.join(__dirname, 'Secretaria', 'index_secretaria.html');
    } else if (userRole === 'directivo' || userRole === 'directivo1') {
      viewPath = path.join(__dirname, 'Directivo', 'index_directivo.html');
    } else{
      viewPath = path.join(__dirname, 'Secretaria', 'index_secretaria.html');
    } 
    
    if (viewPath && fs.existsSync(viewPath)) {
        mainWindow.loadFile(viewPath);
    }
  }
  return result;
});

ipcMain.on('navigate-to-login', () => {
    if (mainWindow) {
        mainWindow.loadFile(path.join(__dirname, 'login.html'));
    }
});


// MANEJADOR PARA ABRIR LA VENTANA DEL CALENDARIO
ipcMain.on('open-calendar-window', () => {
    // Evita abrir múltiples ventanas del calendario
    const allWindows = BrowserWindow.getAllWindows();
    const existingCalendarWin = allWindows.find(win => win.getTitle().includes("Secretaria"));
    if (existingCalendarWin) {
        existingCalendarWin.focus();
        return;
    }

    const calendarWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        parent: mainWindow, 
        modal: false, // Permite interactuar con ambas ventanas
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), 
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    calendarWindow.loadFile(path.join(__dirname, 'Secretaria', 'index_secretaria.html'));
});


// --- OTROS MANEJADORES ---
ipcMain.handle('register-user', async (event, userData) => await userStorage.registerUser(userData));
ipcMain.handle('reset-password', async (event, data) => await userStorage.resetPassword(data));
ipcMain.on('open-external-link', (event, url) => { shell.openExternal(url); });
ipcMain.handle('read-data', (event, fileName) => {
  const filePath = path.join(__dirname, 'Secretaria', fileName);
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return null;
  } catch (error) { return null; }
});
ipcMain.handle('write-data', (event, { fileName, data }) => {
  const filePath = path.join(__dirname, 'Secretaria', fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) { return { success: false }; }
});

// =================================================================
// --- LÓGICA DE NOTIFICACIONES POR CORREO ---
// =================================================================

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sistema.educasync@gmail.com',      
    pass: 'bdnq jicc nfrt qzad'
  }
});

async function checkEventsAndSendEmails() {
    console.log(`[${new Date().toLocaleString()}] Verificando eventos para enviar notificaciones...`);
    const users = userStorage.getUsers();
    if (!users || users.length === 0) {
        console.log("No hay usuarios registrados para notificar.");
        return;
    }

    const eventsFilePath = path.join(__dirname, 'Secretaria', 'events.json');
    if (!fs.existsSync(eventsFilePath)) return;

    let allEvents = JSON.parse(fs.readFileSync(eventsFilePath, 'utf-8'));
    const now = new Date();
    let changesMade = false;

    for (const dayEntry of allEvents) {
        for (const event of dayEntry.events) {
            const eventDate = new Date(dayEntry.year, dayEntry.month - 1, dayEntry.day);
            const timeParts = event.timeFrom.match(/(\d+):(\d+)/);
            if (timeParts) { eventDate.setHours(timeParts[1], timeParts[2]); }

            const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

            if (diffHours > 23 && diffHours <= 24 && !event.notified) {
                console.log(`Evento "${event.title}" encontrado para notificar.`);
                const recipientEmails = users.map(user => user.email).join(', ');
                const totalStudents = event.courses.reduce((sum, course) => sum + (course.students || 0), 0);
                
                const mailOptions = {
                    from: `"EducaSync Notificaciones" <${transporter.options.auth.user}>`,
                    to: recipientEmails,
                    subject: `Recordatorio de Evento: ${event.title}`,
                    html: `
                        <h1>Recordatorio de Evento - EducaSync</h1>
                        <p>Hola desde Educasync,</p>
                        <p>Te recordamos que el evento <strong>${event.title}</strong> está programado para mañana.</p>
                        <ul>
                            <li><strong>Fecha:</strong> ${dayEntry.day}/${dayEntry.month}/${dayEntry.year}</li>
                            <li><strong>Horario:</strong> ${event.timeFrom}</li>
                            <li><strong>Lugar:</strong> ${event.location}</li>
                           <li><strong>Cantidad de Alumnos:</strong> ${totalStudents} alumnos</li>
                        </ul>
                        <p>¡Exitos y que salga todo Bien!</p>
                    `
                };

                try {
                    await transporter.sendMail(mailOptions);
                    console.log(`Correo de recordatorio enviado a: ${recipientEmails}`);
                    event.notified = true;
                    changesMade = true;
                } catch (error) {
                    console.error('Error al enviar el correo:', error);
                }
            }
        }
    }

    if (changesMade) {
        fs.writeFileSync(eventsFilePath, JSON.stringify(allEvents, null, 2));
    }
}
function startEventChecker() {
    console.log("Modo de prueba de correos activado. Verificando cada 10 segundos.");
    // ✅ CAMBIO PARA PRUEBA: Se ejecuta cada 10 segundos!!! esto debe cambiarse a cada hora en producción que es lo que está comentado abajo.
    setInterval(checkEventsAndSendEmails, 10000); 

    // ⚠️ La línea original para producción es:
    // setInterval(checkEventsAndSendEmails, 1000 * 60 * 60); // Cada hora
}
