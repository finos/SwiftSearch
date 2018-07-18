import { app, BrowserWindow } from 'electron';

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        height: 600,
        width: 800,
        webPreferences: {
            nodeIntegration: false,
            preload: __dirname + '/preload.js',
        },
    });

    mainWindow.loadURL('file://' + __dirname + '/search.html');
});
