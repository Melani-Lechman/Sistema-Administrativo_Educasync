EducaSync - Sistema Administrativo Estudiantil

EducaSync es una aplicación de escritorio desarrollada con Electron para la gestión de eventos escolares, horarios y cursos. Está diseñada para ser utilizada por personal administrativo (Secretaría) y directivos, cada uno con su propia interfaz y funcionalidades.

Características Principales

Gestión de Roles: Interfaz diferenciada para Secretaría y Directivo.

Calendario de Eventos: Creación, visualización y eliminación de eventos.

Gestión de Cursos: Personalización de los cursos, incluyendo colores y cantidad de alumnos.

Gestor de Horarios: Herramienta para administrar los horarios por año, división y turno.

Notificaciones Automáticas: Envío de recordatorios por correo electrónico 24 horas antes de un evento.

Persistencia de Datos: Toda la información se guarda localmente en archivos JSON.

🚀 Instalación y Puesta en Marcha

Para ejecutar este proyecto en tu computadora, necesitarás tener instalado Node.js.

Clona o descarga el repositorio:
Obtén todos los archivos del proyecto y colócalos en una carpeta.

Abre una terminal:
Navega hasta la carpeta principal del proyecto usando tu terminal de comandos.

Instala las dependencias:
Ejecuta el siguiente comando. Esto descargará Electron y Nodemailer, que son necesarios para que la aplicación funcione.

npm install
npm install nodemailer

Configura el envío de correos (¡Muy Importante!):
Para que las notificaciones por correo funcionen, debes configurar tus credenciales de Gmail.

Abre el archivo main.js.

Busca la sección que dice // ⚠️ CONFIGURACIÓN DE NODEMAILER.

Sigue las instrucciones en los comentarios para reemplazar el email y la contraseña de aplicación.

Inicia la aplicación:
Una vez que todo esté instalado y configurado, ejecuta el siguiente comando para abrir la aplicación.

npm start

👥 Usuarios de Prueba

Puedes usar las siguientes credenciales para acceder a las diferentes vistas:

Rol Secretaria:

Usuario: secretaria

Contraseña: 1234

Rol Directivo:

Usuario: directivo

Contraseña: 1234

Tener en cuenta: Existen solamente dos usuarios Directivos, por lo que no se puden crear más de los que ya están establecidos tenemos a directivo y a directivo1, cualquier nuevo usuario tomará el rol de Secretaria!

Proyecto desarrollado por Melani Lechman.