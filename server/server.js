const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure data and uploads directories exist
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Initialize content file if it doesn't exist
if (!fs.existsSync(CONTENT_FILE)) {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify([], null, 2));
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// API Routes

// Get all content
app.get('/api/content', (req, res) => {
    try {
        const data = fs.readFileSync(CONTENT_FILE, 'utf8');
        const content = JSON.parse(data);
        res.json(content);
    } catch (error) {
        console.error('Error reading content:', error);
        res.status(500).json({ error: 'Failed to read content' });
    }
});

// Update all content (replace existing)
app.post('/api/content', (req, res) => {
    try {
        const newContent = req.body;
        if (!Array.isArray(newContent)) {
            return res.status(400).json({ error: 'Content must be an array' });
        }

        fs.writeFileSync(CONTENT_FILE, JSON.stringify(newContent, null, 2));
        console.log(`[${new Date().toISOString()}] Content updated:`, newContent.length, 'items');
        res.json({ success: true, message: 'Content updated successfully' });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error updating content:`, error);
        res.status(500).json({ error: 'Failed to update content' });
    }
});

// Delete content by ID
app.delete('/api/content/:id', (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[${new Date().toISOString()}] Deletion request for ID:`, id);
        
        const data = fs.readFileSync(CONTENT_FILE, 'utf8');
        let content = JSON.parse(data);
        
        const initialLength = content.length;
        // Robust ID matching (handling potential string/number mismatch)
        content = content.filter(item => String(item.id) !== String(id));
        
        if (content.length === initialLength) {
            console.warn(`[${new Date().toISOString()}] Content not found for deletion:`, id);
            // Return 200 with success: false instead of 404 to avoid Axios throwing
            return res.json({ success: false, message: 'Content not found' });
        }

        fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2));
        console.log(`[${new Date().toISOString()}] Content deleted successfully:`, id);
        res.json({ success: true, message: 'Content deleted successfully' });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error deleting content:`, error);
        res.json({ success: false, error: 'Failed to delete content' });
    }
});

// Upload media file
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Return the filename. The app will construct the URL using the Pi's known IP.
        const filename = req.file.filename;

        console.log(`[${new Date().toISOString()}] File uploaded:`, filename);
        res.json({
            success: true,
            filename: filename,
            message: 'File uploaded successfully'
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error uploading file:`, error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Health check / Status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        mode: 'offline-server',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Offline Server running on port ${PORT}`);
    console.log(`Serving uploads from ${UPLOADS_DIR}`);
});
