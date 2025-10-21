const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Login/Registro
  registerUser: (data) => ipcRenderer.invoke('register-user', data),
  loginUser: (data) => ipcRenderer.invoke('login-user', data),
  resetPassword: (data) => ipcRenderer.invoke('reset-password', data),
  
  // Navegación
  navigateToLogin: () => ipcRenderer.send('navigate-to-login'),

  // FUNCIÓN PARA ABRIR LA VENTANA DEL CALENDARIO 
  openCalendarWindow: () => ipcRenderer.send('open-calendar-window'),

  // Datos
  readData: (fileName) => ipcRenderer.invoke('read-data', fileName),
  writeData: (fileName, data) => ipcRenderer.invoke('write-data', { fileName, data }),
  
  // Otros
  openLink: (url) => ipcRenderer.send('open-external-link', url),
});

