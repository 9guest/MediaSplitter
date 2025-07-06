const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');

// Set FFmpeg and FFprobe paths
const ffmpegPath = ffmpegStatic.replace('app.asar', 'app.asar.unpacked');
const ffprobePath = ffprobeStatic.path.replace('app.asar', 'app.asar.unpacked');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

console.log('FFmpeg path:', ffmpegStatic);
console.log('FFprobe path:', ffprobeStatic.path);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 700,
    minWidth: 600,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to format duration
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// IPC Handlers
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Media Files', extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'mp3', 'wav', 'flac', 'aac', 'm4a'] },
      { name: 'Video Files', extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'] },
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'flac', 'aac', 'm4a'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-output-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-file-info', async (event, filePath) => {
  console.log('Attempting to get file info for:', filePath);
  const safeFilePath = filePath.replace(/\\/g, '/');
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(safeFilePath, (err, metadata) => {
      if (err) {
        console.error('FFprobe error:', err);
        reject(err);
        return;
      }
      
      try {
        const stats = fs.statSync(safeFilePath);
        const fileInfo = {
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          duration: metadata.format.duration,
          durationFormatted: formatDuration(metadata.format.duration),
          bitrate: metadata.format.bit_rate,
          format: metadata.format.format_name,
          filename: path.basename(safeFilePath)
        };
        
        console.log('File info retrieved successfully:', fileInfo);
        resolve(fileInfo);
      } catch (statError) {
        console.error('Error reading file stats:', statError);
        reject(statError);
      }
    });
  });
});

ipcMain.handle('split-file', async (event, options) => {
  const { inputPath, outputDir, maxSizeBytes, fileInfo } = options;
  
  try {
    const totalDuration = fileInfo.duration;
    const totalSize = fileInfo.size;
    const estimatedBitrate = (totalSize * 8) / totalDuration; // bits per second
    const segmentDuration = (maxSizeBytes * 8) / estimatedBitrate; // seconds per segment
    
    const numSegments = Math.ceil(totalDuration / segmentDuration);
    const baseName = path.parse(fileInfo.filename).name;
    const extension = path.parse(fileInfo.filename).ext;
    
    const results = [];
    
    for (let i = 0; i < numSegments; i++) {
      const startTime = i * segmentDuration;
      const outputFileName = `${baseName}_part${i + 1}${extension}`;
      const outputPath = path.join(outputDir, outputFileName);
      
      await new Promise((resolve, reject) => {
        const command = ffmpeg(inputPath)
          .seekInput(startTime)
          .duration(segmentDuration)
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine);
          })
          .on('progress', (progress) => {
            const overallProgress = ((i + (progress.percent / 100)) / numSegments) * 100;
            event.sender.send('split-progress', {
              currentSegment: i + 1,
              totalSegments: numSegments,
              segmentProgress: progress.percent || 0,
              overallProgress: overallProgress || 0,
              currentFile: outputFileName
            });
          })
          .on('end', () => {
            const stats = fs.statSync(outputPath);
            results.push({
              filename: outputFileName,
              path: outputPath,
              size: stats.size,
              sizeFormatted: formatBytes(stats.size)
            });
            resolve();
          })
          .on('error', (err) => {
            reject(err);
          });
        
        // Use copy codec when possible for faster processing
        if (path.extname(inputPath).toLowerCase() === extension.toLowerCase()) {
          command.videoCodec('copy').audioCodec('copy');
        }
        
        command.run();
      });
    }
    
    return {
      success: true,
      segments: results,
      totalSegments: numSegments
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('open-folder', async (event, folderPath) => {
  shell.openPath(folderPath);
});

ipcMain.on('preset-saved', (event, preset) => {
  console.log('Preset saved:', preset);
});