document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const recoverForm = document.getElementById('recoverForm');

    const goToRegisterBtn = document.getElementById('goToRegister');
    const goToLoginBtn = document.getElementById('goToLogin');
    const forgotPasswordLink = document.querySelector('.forgot-password');
    const cancelRecoverBtn = document.getElementById('cancelRecover');

   // Referencias para el modal de alerta
    const alertModal = document.getElementById('alert-modal');
    const alertOkBtn = document.getElementById('alert-ok-btn');
    const alertModalTitle = document.getElementById('alert-title');
    const alertModalMessage = document.getElementById('alert-message');

    function showForm(formToShow) {
        [loginForm, registerForm, recoverForm].forEach(form => {
            form.classList.remove('active');
        });
        formToShow.classList.add('active');
    }
 
     // Nueva función para mostrar alertas con el modal personalizado.
     
    function showAlert(title, message) {
        alertModalTitle.textContent = title;
        alertModalMessage.textContent = message;
        alertModal.classList.remove('hidden');
    }

    goToRegisterBtn.addEventListener('click', () => showForm(registerForm));
    goToLoginBtn.addEventListener('click', () => showForm(loginForm));
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(recoverForm);
    });
    cancelRecoverBtn.addEventListener('click', () => showForm(loginForm));

  //  Listener para el botón "Entendido" del modal de alerta
    alertOkBtn.addEventListener('click', () => {
        alertModal.classList.add('hidden');
    });

    // Lógica de Login 
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const credentials = {
            nombre: document.getElementById('loginNombre').value,
            contrasena: document.getElementById('loginPassword').value,
        };
        const result = await window.electronAPI.loginUser(credentials);
        if (!result.success) {
           showAlert('Nombre o contraseña incorrectos.');
        }
    });

    // Lógica de Registro 
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userData = {
            email: document.getElementById('registerEmail').value,
            nombre: document.getElementById('registerNombre').value,
            contrasena: document.getElementById('registerPassword').value,
        };
        const result = await window.electronAPI.registerUser(userData);
        if (result.success) {
            showAlert('Registro Exitoso', 'El usuario ha sido registrado correctamente.');
            showForm(loginForm);
        } else {
            showAlert(`Error en el registro: ${result.error}`);
        }
    });

    // Lógica de Recuperación de Contraseña 
    recoverForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            return  showAlert('Las contraseñas no coinciden.');
            
        }
        const data = {
            email: document.getElementById('recoverEmail').value,
            nombre: document.getElementById('recoverNombre').value,
            newPassword: newPassword,
        };
        const result = await window.electronAPI.resetPassword(data);
        if (result.success) {
            showAlert('Contraseña actualizada con éxito!');
            showForm(loginForm);
        } else {
            showAlert(`Error: ${result.error}`);
        }
    });
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Login/Registro
  registerUser: (data) => ipcRenderer.invoke('register-user', data),
  loginUser: (data) => ipcRenderer.invoke('login-user', data),
  resetPassword: (data) => ipcRenderer.invoke('reset-password', data),
  
  // Navegación
  navigateToLogin: () => ipcRenderer.send('navigate-to-login'),

  // Datos del Calendario
  readData: (fileName) => ipcRenderer.invoke('read-data', fileName),
  writeData: (fileName, data) => ipcRenderer.invoke('write-data', { fileName, data }),
  
  // Otros
  openLink: (url) => ipcRenderer.send('open-external-link', url),
  downloadTemplate: (csv) => ipcRenderer.invoke('download-template', csv),
});
