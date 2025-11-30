const express = require('express');
const Friendship = require('../models/Friendship');
const User = require('../models/User');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Send friend request
router.post('/request/:userId', authMiddleware, async (req, res) => {
  try {
    const recipientId = req.params.userId;

    if (recipientId === req.userId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    // Check if friendship already exists
    const existing = await Friendship.findOne({
      $or: [
        { requester: req.userId, recipient: recipientId },
        { requester: recipientId, recipient: req.userId }
      ]
    });

    if (existing) {
      return res.status(400).json({ message: 'Friend request already exists' });
    }

    // Create friendship
    const friendship = new Friendship({
      requester: req.userId,
      recipient: recipientId,
      status: 'pending'
    });

    await friendship.save();

    // Create notification
    await Notification.create({
      recipient: recipientId,
      sender: req.userId,
      type: 'friend_request',
      friendshipId: friendship._id
    });

    res.status(201).json({
      message: 'Friend request sent',
      friendship
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept friend request
router.put('/accept/:friendshipId', authMiddleware, async (req, res) => {
  try {
    const friendship = await Friendship.findOne({
      _id: req.params.friendshipId,
      recipient: req.userId,
      status: 'pending'
    });

    if (!friendship) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    friendship.status = 'accepted';
    friendship.updatedAt = new Date();
    await friendship.save();

    // Create notification for requester
    await Notification.create({
      recipient: friendship.requester,
      sender: req.userId,
      type: 'friend_accept',
      friendshipId: friendship._id
    });

    res.json({
      message: 'Friend request accepted',
      friendship
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject friend request
router.put('/reject/:friendshipId', authMiddleware, async (req, res) => {
  try {
    const friendship = await Friendship.findOne({
      _id: req.params.friendshipId,
      recipient: req.userId,
      status: 'pending'
    });

    if (!friendship) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    friendship.status = 'rejected';
    friendship.updatedAt = new Date();
    await friendship.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unfriend
router.delete('/unfriend/:userId', authMiddleware, async (req, res) => {
  try {
    const friendship = await Friendship.findOneAndDelete({
      $or: [
        { requester: req.userId, recipient: req.params.userId },
        { requester: req.params.userId, recipient: req.userId }
      ],
      status: 'accepted'
    });

    if (!friendship) {
      return res.status(404).json({ message: 'Friendship not found' });
    }

    res.json({ message: 'Unfriended successfully' });
  } catch (error) {
    console.error('Unfriend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get friend list
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [
        { requester: req.userId, status: 'accepted' },
        { recipient: req.userId, status: 'accepted' }
      ]
    })
    .populate('requester', 'firstname lastname profilePicture')
    .populate('recipient', 'firstname lastname profilePicture');

    // Extract friend user objects
    const friends = friendships.map(friendship => {
      return friendship.requester._id.toString() === req.userId
        ? friendship.recipient
        : friendship.requester;
    });

    res.json({ friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending requests (received)
router.get('/requests/received', authMiddleware, async (req, res) => {
  try {
    const requests = await Friendship.find({
      recipient: req.userId,
      status: 'pending'
    })
    .populate('requester', 'firstname lastname profilePicture')
    .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get received requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending requests (sent)
router.get('/requests/sent', authMiddleware, async (req, res) => {
  try {
    const requests = await Friendship.find({
      requester: req.userId,
      status: 'pending'
    })
    .populate('recipient', 'firstname lastname profilePicture')
    .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check friendship status with a user
router.get('/status/:userId', authMiddleware, async (req, res) => {
  try {
    const friendship = await Friendship.findOne({
      $or: [
        { requester: req.userId, recipient: req.params.userId },
        { requester: req.params.userId, recipient: req.userId }
      ]
    });

    if (!friendship) {
      return res.json({ status: 'none' });
    }

    // Determine relationship from current user's perspective
    let relationship = friendship.status;
    if (friendship.status === 'pending') {
      if (friendship.requester.toString() === req.userId) {
        relationship = 'pending_sent';
      } else {
        relationship = 'pending_received';
      }
    }

    res.json({
      status: relationship,
      friendshipId: friendship._id
    });
  } catch (error) {
    console.error('Check friendship status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get friend suggestions (users not friends with)
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    // Get all existing friendships
    const friendships = await Friendship.find({
      $or: [
        { requester: req.userId },
        { recipient: req.userId }
      ]
    });

    // Extract user IDs to exclude
    const excludeIds = [req.userId];
    friendships.forEach(f => {
      if (f.requester.toString() !== req.userId) {
        excludeIds.push(f.requester);
      }
      if (f.recipient.toString() !== req.userId) {
        excludeIds.push(f.recipient);
      }
    });

    // Find users not in exclude list
    const suggestions = await User.find({
      _id: { $nin: excludeIds }
    })
    .select('firstname lastname profilePicture')
    .limit(10);

    res.json({ suggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get friend count
router.get('/count/:userId', authMiddleware, async (req, res) => {
  try {
    const count = await Friendship.countDocuments({
      $or: [
        { requester: req.params.userId, status: 'accepted' },
        { recipient: req.params.userId, status: 'accepted' }
      ]
    });

    res.json({ count });
  } catch (error) {
    console.error('Get friend count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
