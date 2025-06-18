
<p align="center">
   <img src="https://github.com/user-attachments/assets/05b5d018-3d87-4143-9ba6-9198ac2b6a8e" alt="mediaSplitter" width="200" height="200" />
</p>

# 🎬 Media Splitter

A cross-platform desktop application built with Electron and FFmpeg that allows you to split media files (video/audio) into smaller parts based on file size.
  
## ✨ Features

- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Wide Format Support**: Supports MP4, AVI, MKV, MOV, WMV, FLV, WebM, MP3, WAV, FLAC, AAC, M4A, and more
- **Smart Splitting**: Automatically calculates optimal split points based on target file size
- **Real-time Progress**: Live progress tracking with detailed information
- **Drag & Drop**: Simply drag media files into the application
- **Modern UI**: Beautiful, responsive interface with dark theme
- **Efficient Processing**: Uses codec copying when possible for faster splitting
- **Keyboard Shortcuts**: Ctrl+O to select file, Ctrl+Enter to start splitting

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/media-splitter.git
   cd media-splitter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the application:**
   ```bash
   npm start
   ```

### Building for Production

Build for all platforms:
```bash
npm run build
```

Build for specific platforms:
```bash
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## 📖 Usage Guide

### Basic Usage

1. **Select Media File**
   - Click "Choose File" button or drag & drop a media file
   - Supported formats: MP4, AVI, MKV, MOV, WMV, FLV, WebM, MP3, WAV, FLAC, AAC, M4A

2. **Configure Split Settings**
   - Set the maximum size per part (KB, MB, or GB)
   - Choose output folder where split files will be saved

3. **Start Splitting**
   - Click "Split Media File" button
   - Monitor progress in real-time
   - Files will be saved as `filename_part1.ext`, `filename_part2.ext`, etc.

### Advanced Features

- **Drag & Drop**: Drag media files directly into the application window
- **Keyboard Shortcuts**: 
  - `Ctrl+O` (or `Cmd+O` on Mac): Select file
  - `Ctrl+Enter` (or `Cmd+Enter` on Mac): Start splitting
  - `Escape`: Clear selected file
- **Smart Codec Handling**: The app automatically uses codec copying when possible for faster processing

## 🛠️ Technical Details

### Architecture

- **Frontend**: HTML, CSS, JavaScript with modern ES6+ features
- **Backend**: Electron main process with Node.js
- **Media Processing**: FFmpeg via fluent-ffmpeg library
- **Cross-Platform**: Electron framework ensures compatibility across all platforms

### Dependencies

- **Electron**: Cross-platform desktop app framework
- **fluent-ffmpeg**: Node.js wrapper for FFmpeg
- **ffmpeg-static**: Bundled FFmpeg binaries
- **ffprobe-static**: Bundled FFprobe for media analysis

### File Structure

```
media-splitter/
├── src/
│   ├── main.js          # Electron main process
│   ├── preload.js       # Context bridge for security
│   ├── renderer.html    # Main UI
│   ├── styles.css       # Application styles
│   └── renderer.js      # Frontend logic
├── assets/              # App icons and resources
├── package.json         # Project configuration
└── README.md           # This file
```

## 🎯 How It Works

1. **File Analysis**: Uses FFprobe to analyze media file properties (duration, bitrate, format)
2. **Split Calculation**: Calculates optimal segment duration based on file size and target part size
3. **Processing**: Uses FFmpeg to split the file at calculated intervals
4. **Progress Tracking**: Provides real-time updates on processing status
5. **Output Management**: Saves split files with sequential naming

## 🔧 Configuration

### FFmpeg Integration

The application includes FFmpeg binaries for all platforms. If you need to use a custom FFmpeg installation:

1. Modify `src/main.js`
2. Update the FFmpeg path configuration:
   ```javascript
   ffmpeg.setFfmpegPath('/path/to/your/ffmpeg');
   ```

### Build Configuration

Customize build settings in `package.json` under the `build` section:

- Change app icons
- Modify installer options
- Configure code signing (for distribution)

## 🐛 Troubleshooting

### Common Issues

1. **Large file processing is slow**
   - The app uses codec copying when possible
   - Processing time depends on file size and system performance

2. **Permission errors on output folder**
   - Ensure the selected output folder has write permissions
   - Try selecting a different output directory

### Performance Tips

- **SSD Storage**: Use SSD for input/output folders for better performance
- **File Format**: Same-format splitting (MP4 to MP4) is faster due to codec copying
- **System Resources**: Close other applications during processing of large files

## 📦 Distribution

### Creating Installers

The build process creates platform-specific installers:

- **Windows**: NSIS installer & Portable (.exe)
- **macOS**: DMG package (.dmg)
- **Linux**: AppImage (.AppImage)

### Code Signing (Optional)

For distribution, consider code signing:

1. **Windows**: Use SignTool with a code signing certificate
2. **macOS**: Use Apple Developer certificate
3. **Linux**: Use GPG signing for repositories

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **FFmpeg Team**: For the powerful media processing capabilities
- **Electron Team**: For the cross-platform framework
- **Node.js Community**: For the excellent ecosystem of packages

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing issues on GitHub
3. Create a new issue with detailed information
4. Include system information and error logs

---

**Happy splitting! 🎬✂️**
