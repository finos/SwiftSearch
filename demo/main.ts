import { app, BrowserWindow } from 'electron';

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            preload: __dirname + '/preload.js',
        },
        width: 800,
    });

    mainWindow.loadURL('file://' + __dirname + '/search.html');
});
