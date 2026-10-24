const mongoose = require("mongoose");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

/**
 * Helper to sort two user ObjectIds so conversations are uniquely indexed
 */
const getSortedParticipants = (id1, id2) => {
  const s1 = id1.toString();
  const s2 = id2.toString();
  return s1 < s2 ? [id1, id2] : [id2, id1];
};

/**
 * GET /api/chat/conversations
 * Returns active conversations for current user
 */
module.exports.getConversations = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Please log in first" });
    }

    const currentUserId = req.user._id;

    // Fetch conversations where current user is a participant
    const convs = await Conversation.find({
      participants: currentUserId,
    })
      .populate("participants", "username avatarUrl xp balance bio")
      .populate("lastMessageSender", "username")
      .sort({ lastMessageAt: -1 })
      .lean();

    const formatted = convs.map((c) => {
      // Find the other participant (the friend)
      const friend = c.participants.find(
        (p) => p && p._id.toString() !== currentUserId.toString()
      );

      const unread = c.unreadCount?.[currentUserId.toString()] || 0;

      return {
        conversationId: c._id,
        friend: friend
          ? {
              id: friend._id,
              username: friend.username,
              avatarUrl: friend.avatarUrl || "",
              xp: friend.xp || 0,
              balance: friend.balance || 100000,
              bio: friend.bio || "",
            }
          : null,
        lastMessage: c.lastMessage || "",
        lastMessageSender: c.lastMessageSender?.username || "",
        lastMessageAt: c.lastMessageAt,
        unreadCount: unread,
      };
    }).filter((c) => c.friend !== null);

    res.status(200).json({
      success: true,
      conversations: formatted,
    });
  } catch (err) {
    console.error("getConversations error:", err);
    res.status(500).json({ success: false, message: "Failed to load chats" });
  }
};

/**
 * GET /api/chat/messages/:friendId
 * Returns messages between current user and a confirmed friend
 */
module.exports.getMessages = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Please log in first" });
    }

    const { friendId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    // Verify mutual friendship
    const currentUser = await User.findById(req.user._id).select("friends").lean();
    const isFriend = (currentUser?.friends || []).some(
      (fId) => fId.toString() === friendId.toString()
    );

    if (!isFriend) {
      return res.status(403).json({
        success: false,
        message: "You can only chat with confirmed mutual friends.",
      });
    }

    // Fetch friend profile info
    const friend = await User.findById(friendId)
      .select("username avatarUrl xp balance bio")
      .lean();

    if (!friend) {
      return res.status(404).json({ success: false, message: "Friend not found" });
    }

    const participants = getSortedParticipants(req.user._id, friendId);

    // Find conversation
    const conversation = await Conversation.findOne({
      participants: { $all: participants },
    }).lean();

    if (!conversation) {
      return res.status(200).json({
        success: true,
        conversationId: null,
        friend: {
          id: friend._id,
          username: friend.username,
          avatarUrl: friend.avatarUrl || "",
          xp: friend.xp || 0,
          balance: friend.balance || 100000,
          bio: friend.bio || "",
        },
        messages: [],
      });
    }

    // Fetch messages paginated (newest 100 messages)
    const messages = await Message.find({
      conversationId: conversation._id,
    })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    // Mark unread messages sent to current user as read
    const unreadIds = messages
      .filter((m) => m.recipient.toString() === req.user._id.toString() && !m.read)
      .map((m) => m._id);

    if (unreadIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadIds } },
        { $set: { read: true, readAt: new Date() } }
      );

      // Reset unread count for current user
      await Conversation.findByIdAndUpdate(conversation._id, {
        $set: { [`unreadCount.${req.user._id}`]: 0 },
      });
    }

    const formattedMessages = messages.map((m) => ({
      id: m._id,
      text: m.text,
      senderId: m.sender,
      isMine: m.sender.toString() === req.user._id.toString(),
      read: m.read || unreadIds.some((uid) => uid.toString() === m._id.toString()),
      createdAt: m.createdAt,
    }));

    res.status(200).json({
      success: true,
      conversationId: conversation._id,
      friend: {
        id: friend._id,
        username: friend.username,
        avatarUrl: friend.avatarUrl || "",
        xp: friend.xp || 0,
        balance: friend.balance || 100000,
        bio: friend.bio || "",
      },
      messages: formattedMessages,
    });
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ success: false, message: "Failed to load chat history" });
  }
};

/**
 * POST /api/chat/messages/:friendId
 * Send a message to a confirmed friend
 */
module.exports.sendMessage = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Please log in first" });
    }

    const { friendId } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Message text cannot be empty" });
    }

    // Verify mutual friendship
    const currentUser = await User.findById(req.user._id).select("friends").lean();
    const isFriend = (currentUser?.friends || []).some(
      (fId) => fId.toString() === friendId.toString()
    );

    if (!isFriend) {
      return res.status(403).json({
        success: false,
        message: "You can only message confirmed mutual friends.",
      });
    }

    const participants = getSortedParticipants(req.user._id, friendId);

    // Atomically find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: participants },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants,
        unreadCount: {},
      });
    }

    // Create Message document
    const newMessage = new Message({
      conversationId: conversation._id,
      sender: req.user._id,
      recipient: friendId,
      text: text.trim().substring(0, 2000),
      read: false,
    });

    await newMessage.save();

    // Update conversation metadata
    conversation.lastMessage = text.trim().substring(0, 100);
    conversation.lastMessageSender = req.user._id;
    conversation.lastMessageAt = new Date();

    const currentRecipientUnread = conversation.unreadCount.get(friendId.toString()) || 0;
    conversation.unreadCount.set(friendId.toString(), currentRecipientUnread + 1);
    conversation.unreadCount.set(req.user._id.toString(), 0);

    await conversation.save();

    res.status(201).json({
      success: true,
      message: {
        id: newMessage._id,
        text: newMessage.text,
        senderId: newMessage.sender,
        isMine: true,
        read: false,
        createdAt: newMessage.createdAt,
      },
    });
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

/**
 * POST /api/chat/messages/:friendId/read
 * Mark conversation with friend as read
 */
module.exports.markRead = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Please log in first" });
    }

    const { friendId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    await Message.updateMany(
      {
        recipient: req.user._id,
        sender: friendId,
        read: false,
      },
      {
        $set: { read: true, readAt: new Date() },
      }
    );

    const participants = getSortedParticipants(req.user._id, friendId);
    await Conversation.findOneAndUpdate(
      { participants: { $all: participants } },
      { $set: { [`unreadCount.${req.user._id}`]: 0 } }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("markRead error:", err);
    res.status(500).json({ success: false, message: "Failed to mark read" });
  }
};
