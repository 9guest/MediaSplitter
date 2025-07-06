// DOM Elements
const selectFileBtn = document.getElementById('selectFileBtn');
const clearFileBtn = document.getElementById('clearFileBtn');
const selectedFileDiv = document.getElementById('selectedFile');
const fileNameDiv = selectedFileDiv.querySelector('.file-name');
const fileSizeSpan = selectedFileDiv.querySelector('.file-size');
const fileDurationSpan = selectedFileDiv.querySelector('.file-duration');
const fileFormatSpan = selectedFileDiv.querySelector('.file-format');

const sizeValueInput = document.getElementById('sizeValue');
const sizeUnitSelect = document.getElementById('sizeUnit');
const outputFolderInput = document.getElementById('outputFolder');
const selectFolderBtn = document.getElementById('selectFolderBtn');

const splitBtn = document.getElementById('splitBtn');
const progressSection = document.getElementById('progressSection');
const currentFileSpan = document.getElementById('currentFile');
const progressPercentSpan = document.getElementById('progressPercent');
const segmentProgressSpan = document.getElementById('segmentProgress');
const progressFill = document.getElementById('progressFill');

const resultsSection = document.getElementById('resultsSection');
const totalPartsSpan = document.getElementById('totalParts');
const openFolderBtn = document.getElementById('openFolderBtn');
const filesList = document.getElementById('filesList');

const toastContainer = document.getElementById('toastContainer');
const dropOverlay = document.getElementById('dropOverlay');

// State
let selectedFile = null;
let fileInfo = null;
let outputFolder = null;
let isProcessing = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPreset();
    outputFolder = outputFolderInput.value; // <-- Add this line
    setupEventListeners();
    updateUI();
});

function setupEventListeners() {
    // File selection
    selectFileBtn.addEventListener('click', selectFile);
    clearFileBtn.addEventListener('click', clearFile);
    
    // Folder selection
    selectFolderBtn.addEventListener('click', selectOutputFolder);
    
    // Split button
    splitBtn.addEventListener('click', startSplitting);
    
    // Open folder button
    openFolderBtn.addEventListener('click', openOutputFolder);
    
    // Input validation
    sizeValueInput.addEventListener('input', () => {
        updateUI();
        savePreset();
    });
    sizeUnitSelect.addEventListener('change', () => {
        savePreset();
    });
    outputFolderInput.addEventListener('input', () => {
        outputFolder = outputFolderInput.value; // <-- Add this line
        updateUI();
        savePreset();
    });
    splitBtn.addEventListener('click', () => {
        savePreset();
    });
    
    // Progress listener
    window.electronAPI.onSplitProgress((data) => {
        console.log('Progress update received:', data);
        updateProgress(data);
    });
}

async function selectFile() {
  try {
    console.log('Attempting to select file...');
    const filePath = await window.electronAPI.selectFile();
    console.log('Selected file path:', filePath);
    
    if (filePath) {
      selectedFile = filePath;
      showToast('Loading file information...', 'info');
      
      try {
        console.log('Getting file info for:', filePath);
        fileInfo = await window.electronAPI.getFileInfo(filePath);
        console.log('File info received:', fileInfo);
        displayFileInfo();
        updateUI();
        showToast('File loaded successfully!', 'success');
      } catch (error) {
        console.error('Error getting file info:', error);
        showToast(`Error loading file: ${error.message}`, 'error');
        clearFile();
      }
    }
  } catch (error) {
    console.error('Error selecting file:', error);
    showToast(`Error selecting file: ${error.message}`, 'error');
  }
}

function clearFile() {
    selectedFile = null;
    fileInfo = null;
    selectedFileDiv.style.display = 'none';
    hideResults();
    updateUI();
    showToast('File cleared', 'info');
}

function displayFileInfo() {
    if (fileInfo) {
        fileNameDiv.textContent = fileInfo.filename;
        fileSizeSpan.textContent = fileInfo.sizeFormatted;
        fileDurationSpan.textContent = fileInfo.durationFormatted;
        fileFormatSpan.textContent = fileInfo.format.toUpperCase();
        selectedFileDiv.style.display = 'flex';
    }
}

async function selectOutputFolder() {
    try {
        const folderPath = await window.electronAPI.selectOutputFolder();
        if (folderPath) {
            outputFolder = folderPath;
            outputFolderInput.value = folderPath;
            updateUI();
            showToast('Output folder selected', 'success');
        }
    } catch (error) {
        console.error('Error selecting folder:', error);
        showToast('Error selecting output folder', 'error');
    }
}

function updateUI() {
    const hasFile = selectedFile && fileInfo;
    const hasOutputFolder = outputFolder && outputFolder.trim() !== '';
    const hasSizeValue = sizeValueInput.value && parseFloat(sizeValueInput.value) > 0;
    
    splitBtn.disabled = !hasFile || !hasOutputFolder || !hasSizeValue || isProcessing;
}

async function startSplitting() {
    if (!selectedFile || !fileInfo || !outputFolder) {
        showToast('Please select a file and output folder', 'error');
        return;
    }
    
    const sizeValue = parseFloat(sizeValueInput.value);
    const sizeUnit = sizeUnitSelect.value;
    
    if (!sizeValue || sizeValue <= 0) {
        showToast('Please enter a valid size', 'error');
        return;
    }
    
    // Convert size to bytes
    const multipliers = {
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024
    };
    
    const maxSizeBytes = sizeValue * multipliers[sizeUnit];
    
    if (maxSizeBytes >= fileInfo.size) {
        showToast('File is already smaller than the specified size', 'warning');
        return;
    }
    
    isProcessing = true;
    updateUI();
    showProgress();
    hideResults();
    
    try {
        const options = {
            inputPath: selectedFile,
            outputDir: outputFolder,
            maxSizeBytes: maxSizeBytes,
            fileInfo: fileInfo
        };
        
        showToast('Starting file splitting...', 'info');
        
        const result = await window.electronAPI.splitFile(options);
        
        if (result.success) {
            showToast(`Successfully split into ${result.totalSegments} parts!`, 'success');
            displayResults(result);
        } else {
            showToast(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error splitting file:', error);
        showToast('An error occurred while splitting the file', 'error');
    } finally {
        isProcessing = false;
        updateUI();
        hideProgress();
    }
}

function updateProgress(data) {
    currentFileSpan.textContent = `Processing: ${data.currentFile}`;
    progressPercentSpan.textContent = `${Math.round(data.overallProgress)}%`;
    segmentProgressSpan.textContent = `Segment ${data.currentSegment} of ${data.totalSegments}`;
    progressFill.style.width = `${data.overallProgress}%`;
}

function showProgress() {
    progressSection.style.display = 'block';
    progressFill.style.width = '0%';
    currentFileSpan.textContent = 'Preparing...';
    progressPercentSpan.textContent = '0%';
    segmentProgressSpan.textContent = 'Segment 0 of 0';
}

function hideProgress() {
    progressSection.style.display = 'none';
}

function displayResults(result) {
    totalPartsSpan.textContent = result.totalSegments;
    
    // Clear previous results
    filesList.innerHTML = '';
    
    // Add each segment to the list
    result.segments.forEach(segment => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileName = document.createElement('div');
        fileName.className = 'file-item-name';
        fileName.textContent = segment.filename;
        
        const fileSize = document.createElement('div');
        fileSize.className = 'file-item-size';
        fileSize.textContent = segment.sizeFormatted;
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(fileSize);
        filesList.appendChild(fileItem);
    });
    
    resultsSection.style.display = 'block';
}

function hideResults() {
    resultsSection.style.display = 'none';
}

async function openOutputFolder() {
    if (outputFolder) {
        try {
            await window.electronAPI.openFolder(outputFolder);
        } catch (error) {
            console.error('Error opening folder:', error);
            showToast('Error opening output folder', 'error');
        }
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getToastIcon(type);
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toastContainer.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

function getToastIcon(type) {
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    return icons[type] || icons.info;
}

// Utility function to format file sizes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Handle drag and drop
document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropOverlay.style.display = 'flex';
});

document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropOverlay.style.display = 'none';
});

document.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropOverlay.style.display = 'none';
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        const file = files[0];
        const filePath = file.path;
        
        // Check if it's a media file
        const mediaExtensions = [
            '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm',
            '.mp3', '.wav', '.flac', '.aac', '.m4a'
        ];
        
        const ext = filePath.toLowerCase().substr(filePath.lastIndexOf('.'));
        if (mediaExtensions.includes(ext)) {
            selectedFile = filePath;
            showToast('Loading dropped file...', 'info');
            
            try {
                fileInfo = await window.electronAPI.getFileInfo(filePath);
                displayFileInfo();
                updateUI();
                showToast('File loaded successfully!', 'success');
            } catch (error) {
                console.error('Error getting file info:', error);
                showToast('Error loading file information', 'error');
                clearFile();
            }
        } else {
            showToast('Please drop a valid media file', 'error');
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'o':
                e.preventDefault();
                selectFile();
                break;
            case 'Enter':
                if (!splitBtn.disabled) {
                    e.preventDefault();
                    startSplitting();
                }
                break;
        }
    }
    
    if (e.key === 'Escape') {
        if (selectedFile) {
            clearFile();
        }
    }
});

function savePreset() {
    const preset = {
        sizeValue: sizeValueInput.value,
        sizeUnit: sizeUnitSelect.value,
        outputFolder: outputFolderInput.value
    };
    localStorage.setItem('mediaSplitterPreset', JSON.stringify(preset));
    if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.send('preset-saved', preset);
    } else if (window.electronAPI && window.electronAPI.sendPresetSaved) {
        window.electronAPI.sendPresetSaved(preset);
    } else if (window.ipcRenderer) {
        window.ipcRenderer.send('preset-saved', preset);
    } else if (window && window.require) {
        // Fallback for direct require (not recommended in contextIsolation)
        try {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('preset-saved', preset);
        } catch (e) {}
    }
}

function loadPreset() {
    const preset = localStorage.getItem('mediaSplitterPreset');
    if (preset) {
        try {
            const { sizeValue, sizeUnit, outputFolder } = JSON.parse(preset);
            if (sizeValue) sizeValueInput.value = sizeValue;
            if (sizeUnit) sizeUnitSelect.value = sizeUnit;
            if (outputFolder) {
                outputFolderInput.value = outputFolder;
                outputFolder = outputFolder;
            }
        } catch (e) {
            // Ignore parse errors
        }
    }
}