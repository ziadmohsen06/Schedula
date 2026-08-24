const User = require('../models/User');
const Task = require('../models/Task');
const Friendship = require('../models/Friendship');

// Same formula shown on the user's own Streak page — kept consistent so a
// friend's number on the leaderboard means the same thing as their own.
const getUserStats = async (userId) => {
  const completed = await Task.find({ user: userId, status: 'completed' }).sort({ completedAt: -1 }).limit(100);
  const totalCompleted = completed.length;
  const streak = Math.max(0, Math.min(7, Math.round(totalCompleted / 2)));
  return { totalCompleted, streak };
};

const sendFriendRequest = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide a friend\'s email' });
    }

    const recipient = await User.findOne({ email });
    if (!recipient) {
      return res.status(404).json({ message: 'No user found with that email' });
    }
    if (recipient._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot add yourself' });
    }

    const existing = await Friendship.findOne({
      $or: [
        { requester: req.user._id, recipient: recipient._id },
        { requester: recipient._id, recipient: req.user._id }
      ]
    });
    if (existing) {
      return res.status(400).json({ message: existing.status === 'accepted' ? 'You are already friends' : 'A request already exists' });
    }

    const friendship = await Friendship.create({ requester: req.user._id, recipient: recipient._id });
    res.status(201).json(friendship);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send friend request' });
  }
};

const getIncomingRequests = async (req, res) => {
  try {
    const requests = await Friendship.find({ recipient: req.user._id, status: 'pending' })
      .populate('requester', 'name email photoUrl');
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch friend requests' });
  }
};

const respondToRequest = async (req, res) => {
  try {
    if (!['accept', 'decline'].includes(req.params.action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const friendship = await Friendship.findById(req.params.id);
    if (!friendship) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (friendship.recipient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (req.params.action === 'accept') {
      friendship.status = 'accepted';
      await friendship.save();
      return res.status(200).json(friendship);
    }

    await Friendship.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Request declined' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to respond to request' });
  }
};

const getFriends = async (req, res) => {
  try {
    const friendships = await Friendship.find({
      status: 'accepted',
      $or: [{ requester: req.user._id }, { recipient: req.user._id }]
    }).populate('requester recipient', 'name email photoUrl');

    const friends = await Promise.all(friendships.map(async (f) => {
      const friend = f.requester._id.toString() === req.user._id.toString() ? f.recipient : f.requester;
      const stats = await getUserStats(friend._id);
      return { friendshipId: f._id, _id: friend._id, name: friend.name, email: friend.email, photoUrl: friend.photoUrl, ...stats };
    }));

    res.status(200).json(friends);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch friends' });
  }
};

const removeFriend = async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.id);
    if (!friendship) {
      return res.status(404).json({ message: 'Friendship not found' });
    }
    const isParty = [friendship.requester.toString(), friendship.recipient.toString()].includes(req.user._id.toString());
    if (!isParty) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Friendship.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Friend removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove friend' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const friendships = await Friendship.find({
      status: 'accepted',
      $or: [{ requester: req.user._id }, { recipient: req.user._id }]
    }).populate('requester recipient', 'name');

    const selfStats = await getUserStats(req.user._id);
    const entries = [{ _id: req.user._id, name: `${req.user.name} (you)`, ...selfStats }];

    for (const f of friendships) {
      const friend = f.requester._id.toString() === req.user._id.toString() ? f.recipient : f.requester;
      const stats = await getUserStats(friend._id);
      entries.push({ _id: friend._id, name: friend.name, ...stats });
    }

    entries.sort((a, b) => b.streak - a.streak || b.totalCompleted - a.totalCompleted);
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Failed to build leaderboard' });
  }
};

module.exports = {
  sendFriendRequest,
  getIncomingRequests,
  respondToRequest,
  getFriends,
  removeFriend,
  getLeaderboard
};
