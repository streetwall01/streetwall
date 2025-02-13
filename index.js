const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs').promises;
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;
const config = require('./config.json');

// Import models
const Post = require('./models/Post');
const Appeal = require('./models/Appeal');
const Admin = require('./models/Admin');
const Stalk = require('./models/Stalk');

// Connect to MongoDB
mongoose.connect(config.mongodb.uri, config.mongodb.options)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Set views directory explicitly
app.set('views', path.join(__dirname, 'views'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|heic/i;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images, GIFs, videos, and Live Photos are allowed!'));
  }
});

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'public/uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Session middleware with MongoDB store
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: config.mongodb.uri,
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: config.session.cookie
}));

// Admin authentication middleware
const isAdmin = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.redirect('/admin/login');
  }
};

// Function to generate unique post ID
function generatePostId() {
  return new mongoose.Types.ObjectId().toString();
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  // Handle appeal submissions
  socket.on('submitAppeal', async (appealData) => {
    try {
      const appeal = new Appeal({
        id: generatePostId(),
        ...appealData
      });
      await appeal.save();
      io.emit('newAppeal', appeal);
      socket.emit('appealSubmitted', { success: true });
    } catch (error) {
      console.error('Error submitting appeal:', error);
      socket.emit('appealSubmitted', { success: false });
    }
  });

  // Handle stats request
  socket.on('requestStats', async () => {
    try {
      const totalPosts = await Post.countDocuments({ isDeleted: false });
      const totalImages = await Post.aggregate([
        { $match: { isDeleted: false } },
        { $unwind: "$media" },
        { $match: { "media.type": "image" } },
        { $count: "total" }
      ]);

      // Calculate storage used
      const uploadDir = path.join(__dirname, 'public/uploads');
      let storageUsed = 0;
      try {
        const files = await fs.readdir(uploadDir);
        for (const file of files) {
          const stats = await fs.stat(path.join(uploadDir, file));
          storageUsed += stats.size;
        }
      } catch (error) {
        console.error('Error calculating storage:', error);
      }

      socket.emit('statsUpdate', {
        totalPosts,
        totalImages: totalImages[0]?.total || 0,
        storageUsed: (storageUsed / (1024 * 1024)).toFixed(2) + ' MB'
      });
    } catch (error) {
      console.error('Error getting stats:', error);
    }
  });

  socket.on('viewPost', async (postId) => {
    try {
      const stalk = await Stalk.findOneAndUpdate(
        { postId: postId },
        { $inc: { viewCount: 1 }, lastViewed: new Date() },
        { upsert: true, new: true }
      );
      io.emit('updateViews', stalk.viewCount);
    } catch (error) {
      console.error('Error updating view count:', error);
    }
  });
});

// Routes
app.get('/', async (req, res) => {
  try {
    const messages = await Post.find({ isDeleted: false }).sort({ timestamp: -1 });
    res.render('index', { messages });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).send('Error loading posts');
  }
});

app.get('/upload', (req, res) => {
  res.render('upload');
});

app.get('/delete-appeal', (req, res) => {
  res.render('delete-appeal');
});

app.get('/about', (req, res) => {
  res.render('about');
});

// View individual post route
app.get('/post/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) {
      return res.status(404).redirect('/');
    }

    // Get or create view count
    let stalk = await Stalk.findOne({ postId: post._id });
    if (!stalk) {
      stalk = new Stalk({ postId: post._id });
      await stalk.save();
    }

    res.render('stalk', { post, views: stalk.viewCount });
  } catch (error) {
    console.error('Error viewing post:', error);
    res.status(500).redirect('/');
  }
});

app.post('/submit-appeal', async (req, res) => {
  try {
    const { email, postId, reason } = req.body;
    
    if (!email || !postId || !reason) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const appeal = new Appeal({
      id: generatePostId(),
      email,
      postId,
      reason
    });
    
    await appeal.save();
    io.emit('newAppeal', appeal);
    res.json({ success: true });
  } catch (error) {
    console.error('Error submitting appeal:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/', upload.array('files', 10), async (req, res) => {
  try {
    const { message } = req.body;
    const files = req.files || [];
    const mediaFiles = [];

    // Process each uploaded file
    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.heic'].includes(ext);

      if (isImage) {
        // Process image with sharp
        const processedFilename = 'processed_' + file.filename;
        const processedPath = path.join('public/uploads', processedFilename);
        
        await sharp(file.path)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(processedPath);

        // Delete original file
        await fs.unlink(file.path);

        mediaFiles.push({
          filename: processedFilename,
          type: 'image',
          originalName: file.originalname
        });
      } else {
        mediaFiles.push({
          filename: file.filename,
          type: 'video',
          originalName: file.originalname
        });
      }
    }

    // Create new post if there's content or media
    if (message?.trim() || mediaFiles.length > 0) {
      const newPost = new Post({
        content: message,
        media: mediaFiles,
        timestamp: new Date()
      });

      await newPost.save();

      // Emit new post to all connected clients
      io.emit('newMessage', {
        _id: newPost._id.toString(),
        content: newPost.content || '',
        media: newPost.media || [],
        timestamp: newPost.timestamp
      });

      res.redirect('/');
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ error: 'Error processing upload: ' + error.message });
  }
});

// Admin routes
app.get('/admin/login', (req, res) => {
  res.render('admin-login', { error: null });
});

app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // First login attempt - create admin user
    let admin = await Admin.findOne({ username });
    if (!admin) {
      admin = new Admin({
        username: config.admin.username,
        password: config.admin.password,
        email: 'admin@streetwall.com'
      });
      await admin.save();
    }

    if (username === config.admin.username && password === config.admin.password) {
      req.session.isAdmin = true;
      admin.lastLogin = new Date();
      await admin.save();
      res.redirect('/admin/dashboard');
    } else {
      res.render('admin-login', { error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('admin-login', { error: 'An error occurred during login' });
  }
});

app.get('/admin/dashboard', isAdmin, async (req, res) => {
  try {
    const [posts, appeals, stats] = await Promise.all([
      Post.find({ isDeleted: false }).sort({ timestamp: -1 }),
      Appeal.find().sort({ timestamp: -1 }),
      {
        totalPosts: await Post.countDocuments({ isDeleted: false }),
        totalImages: (await Post.aggregate([
          { $match: { isDeleted: false } },
          { $unwind: "$media" },
          { $match: { "media.type": "image" } },
          { $count: "total" }
        ]))[0]?.total || 0
      }
    ]);

    // Generate activities from posts and appeals
    const postActivities = posts.map(post => ({
      timestamp: post.timestamp,
      action: 'New Post',
      details: `Post ID: ${post._id}`
    }));

    const appealActivities = appeals.map(appeal => ({
      timestamp: appeal.timestamp,
      action: 'New Appeal',
      details: `Appeal for Post ID: ${appeal.postId} (${appeal.status})`
    }));

    // Combine and sort activities
    const activities = [...postActivities, ...appealActivities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10); // Get only the 10 most recent activities

    res.render('admin-dashboard', { 
      posts, 
      appeals, 
      stats,
      activities
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
});

// Admin delete post route
app.delete('/admin/delete-post/:id', isAdmin, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Mark post as deleted instead of actually deleting it
    post.isDeleted = true;
    await post.save();

    // Emit event for real-time updates
    io.emit('postDeleted', postId);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post' });
  }
});

// Handle appeal route
app.post('/admin/handle-appeal/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, postId } = req.body;
    
    // Find and update the appeal
    const appeal = await Appeal.findById(id);
    
    if (!appeal) {
      return res.status(404).json({ success: false, message: 'Appeal not found' });
    }

    // Update appeal status
    appeal.status = status;
    appeal.processedAt = new Date();
    appeal.processed = true;
    
    // If approved, delete the associated post
    if (status === 'approved') {
      const post = await Post.findById(postId);
      if (post) {
        post.isDeleted = true;
        await post.save();
        
        // Emit post deleted event
        io.emit('postDeleted', postId);
      }
    }

    await appeal.save();

    // Emit appeal updated event
    io.emit('appealUpdated', {
      appealId: id,
      status,
      postId: status === 'approved' ? postId : null
    });

    res.json({ 
      success: true, 
      message: `Appeal ${status}`,
      appeal: appeal
    });

  } catch (error) {
    console.error('Error handling appeal:', error);
    res.status(500).json({ success: false, message: 'Error handling appeal' });
  }
});

// Clear all appeals route
app.post('/admin/clear-appeals', isAdmin, async (req, res) => {
  try {
    // Delete all appeals from the database
    await Appeal.deleteMany({});
    
    // Emit event for real-time updates
    io.emit('appealsCleared');
    
    res.json({ success: true, message: 'All appeals cleared successfully' });
  } catch (error) {
    console.error('Error clearing appeals:', error);
    res.status(500).json({ success: false, message: 'Failed to clear appeals' });
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Start server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});