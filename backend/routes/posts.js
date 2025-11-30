const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const upload = require('../config/multer');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Create post with optional image
router.post('/create', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Post content is required' });
    }

    let imagePath = null;

    // If image uploaded, compress it
    if (req.file) {
      const compressedFilename = `compressed-${Date.now()}.jpg`;
      const compressedPath = path.join('uploads', 'posts', compressedFilename);

      // Ensure uploads/posts directory exists
      await fs.mkdir('uploads/posts', { recursive: true });

      // Compress image with Sharp
      await sharp(req.file.path)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toFile(compressedPath);

      // Delete temp file
      await fs.unlink(req.file.path);

      imagePath = `/${compressedPath.replace(/\\/g, '/')}`;
    }

    // Create post
    const post = new Post({
      author: req.userId,
      content,
      image: imagePath
    });

    await post.save();

    // Populate author info
    await post.populate('author', 'firstname lastname profilePicture');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error creating post' });
  }
});

// Get all posts (feed)
router.get('/feed', authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'firstname lastname profilePicture')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ posts });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's posts
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'firstname lastname profilePicture')
      .sort({ createdAt: -1 });

    res.json({ posts });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/:postId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete image file if exists
    if (post.image) {
      const imagePath = path.join(__dirname, '..', post.image.substring(1));
      try {
        await fs.unlink(imagePath);
      } catch (err) {
        console.log('Image file not found or already deleted');
      }
    }

    await Post.findByIdAndDelete(req.params.postId);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike post
router.post('/:postId/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate('author');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userIndex = post.likes.indexOf(req.userId);

    if (userIndex > -1) {
      // Unlike
      post.likes.splice(userIndex, 1);
    } else {
      // Like
      post.likes.push(req.userId);
      
      // Create notification if not liking own post
      if (post.author._id.toString() !== req.userId) {
        const Notification = require('../models/Notification');
        await Notification.create({
          recipient: post.author._id,
          sender: req.userId,
          type: 'like',
          post: post._id
        });
      }
    }

    await post.save();

    res.json({
      message: userIndex > -1 ? 'Post unliked' : 'Post liked',
      likes: post.likes.length,
      isLiked: userIndex === -1
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment
router.post('/:postId/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.postId).populate('author');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      user: req.userId,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Create notification if not commenting on own post
    if (post.author._id.toString() !== req.userId) {
      const Notification = require('../models/Notification');
      await Notification.create({
        recipient: post.author._id,
        sender: req.userId,
        type: 'comment',
        post: post._id,
        commentText: text.trim()
      });
    }

    // Populate user info for the new comment
    await post.populate('comments.user', 'firstname lastname profilePicture');

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get post comments
router.get('/:postId/comments', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('comments.user', 'firstname lastname profilePicture');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ comments: post.comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete comment
router.delete('/:postId/comment/:commentId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the comment author
    if (comment.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    comment.remove();
    await post.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
