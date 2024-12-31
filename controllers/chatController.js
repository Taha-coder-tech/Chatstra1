const client = require('../config/oneSignalConfig');  // Ensure correct OneSignal config
const User = require('../models/userModel');  // Ensure correct User model path
const Chat = require('../models/chatModel');  // Ensure correct Chat model path
const Message = require('../models/messageModel'); // Assuming messages are in a separate model
const Group = require('../models/groupModel');  // Import group model

// Controller to send push notifications using OneSignal
const sendPushNotification = async (receiverId, title, body) => {
    try {
        const user = await User.findById(receiverId);

        if (!user || !user.fcmToken) {
            console.log('Push token not found for user:', receiverId);
            return;
        }

        const notification = {
            contents: { en: body },
            include_player_ids: [user.fcmToken], // OneSignal player ID (Push token)
            headings: { en: title },
        };

        await client.createNotification(notification);
        console.log('Push notification sent successfully');
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};

// Controller to send a message
const sendMessage = async (req, res) => {
    const { sender, receiver, message } = req.body;

    if (!message) {
        return res.status(400).json({ message: 'Message content is required' });
    }

    try {
        // Create the chat object in the database
        const chat = await Chat.create({ sender, receiver, message });

        // Fetch the sender's user info to include in the notification title
        const senderUser = await User.findById(sender);
        if (!senderUser) {
            return res.status(404).json({ message: 'Sender user not found' });
        }

        // Send push notification to the receiver
        await sendPushNotification(
            receiver,
            `${senderUser.name} sent you a message`,  // Template literal now fixed
            message
        );

        res.status(201).json(chat); // Return the chat message object
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Failed to send message', error: error.message });
    }
};

// Controller to retrieve messages
const getMessages = async (req, res) => {
    const { chatId } = req.params;

    try {
        // Get messages where either sender or receiver matches the chatId
        const chats = await Chat.find({
            $or: [{ sender: chatId }, { receiver: chatId }]
        }).populate('sender', 'name').populate('receiver', 'name');  // Populate sender and receiver names

        if (!chats || chats.length === 0) {
            return res.status(404).json({ message: 'No messages found' });
        }

        res.status(200).json(chats);  // Return the chats
    } catch (error) {
        console.error('Error retrieving messages:', error);
        res.status(500).json({ message: 'Failed to retrieve messages', error: error.message });
    }
};

// Pin a message
const pinMessage = async (req, res) => {
    const { chatId, messageId } = req.body;

    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        if (!chat.pinnedMessages.includes(messageId)) {
            chat.pinnedMessages.push(messageId);
            await chat.save();
            return res.status(200).json({ message: 'Message pinned successfully' });
        } else {
            return res.status(400).json({ message: 'Message is already pinned' });
        }
    } catch (error) {
        console.error('Error pinning message:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Unpin a message
const unpinMessage = async (req, res) => {
    const { chatId, messageId } = req.body;

    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        chat.pinnedMessages = chat.pinnedMessages.filter(id => id.toString() !== messageId);
        await chat.save();
        res.status(200).json({ message: 'Message unpinned successfully' });
    } catch (error) {
        console.error('Error unpinning message:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// New method to fetch a chat, including messages and pinned messages
const getChat = async (req, res) => {
    const { chatId } = req.params;

    try {
        const chat = await Chat.findById(chatId)
            .populate('users', 'username email')
            .populate('pinnedMessages')
            .populate('messages');

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        res.status(200).json(chat);
    } catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Forward a message to another user or group
const forwardMessage = async (req, res) => {
    const { senderId, messageId, receiverId, groupId } = req.body;

    try {
        // Find the original message by ID
        const originalMessage = await Chat.findById(messageId);
        if (!originalMessage) {
            return res.status(404).json({ message: 'Original message not found' });
        }

        // Forward to a user (if receiverId is provided)
        if (receiverId) {
            const newMessage = new Chat({
                sender: senderId,
                receiver: receiverId,
                message: originalMessage.message,
            });

            await newMessage.save();
            return res.status(200).json({ message: 'Message forwarded successfully', newMessage });
        }

        // Forward to a group (if groupId is provided)
        if (groupId) {
            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({ message: 'Group not found' });
            }

            const newGroupMessage = { sender: senderId, message: originalMessage.message };
            group.messages.push(newGroupMessage);
            await group.save();

            return res.status(200).json({ message: 'Message forwarded to group successfully', newGroupMessage });
        }

        return res.status(400).json({ message: 'Invalid receiver or group details' });
    } catch (error) {
        console.error('Error forwarding message:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    sendMessage,
    getMessages,
    pinMessage,  // New method
    unpinMessage, // New method
    getChat, // New method
    forwardMessage, // New method
};
