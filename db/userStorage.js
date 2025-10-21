const fs = require('fs');
const path = require('path');

const usersFilePath = path.join(__dirname, 'users.json');

function getUsers() {
    if (!fs.existsSync(usersFilePath)) {
        return [];
    }
    const data = fs.readFileSync(usersFilePath, 'utf-8');
    return JSON.parse(data);
}

function saveUsers(users) {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
}

async function registerUser(userData) {
    const users = getUsers();
    const existingUser = users.find(u => u.email === userData.email || u.nombre === userData.nombre);
    if (existingUser) {
        throw new Error('El email o nombre de usuario ya existe.');
    }
    const newUser = {
        id: Date.now(),
        ...userData
    };
    users.push(newUser);
    saveUsers(users);
    return { success: true };
}

async function loginUser(credentials) {
    const users = getUsers();
    const user = users.find(u => u.nombre === credentials.nombre && u.contrasena === credentials.contrasena);
    return user ? { success: true } : { success: false };
}

async function resetPassword(data) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.email === data.email && u.nombre === data.nombre);

    if (userIndex === -1) {
        return { success: false, error: 'Email o nombre incorrecto' };
    }

    users[userIndex].contrasena = data.newPassword;
    saveUsers(users);
    return { success: true };
}

module.exports = {
    getUsers,
    registerUser,
    loginUser,
    resetPassword
};
