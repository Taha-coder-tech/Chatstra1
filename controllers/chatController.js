const client = require('../config/oneSignalConfig');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');

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
        // Create the chat object
        const chat = await Chat.create({ sender, receiver, message });

        // Send push notification to the receiver
        const senderUser = await User.findById(sender);
        await sendPushNotification(
            receiver,
            `${senderUser.name} sent you a message`,
            message
        );

        res.status(201).json(chat);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
};

// Controller to retrieve messages
const getMessages = async (req, res) => {
    const { chatId } = req.params;

    try {
        const chats = await Chat.find({
            $or: [{ sender: chatId }, { receiver: chatId }]
        }).populate('sender', 'name').populate('receiver', 'name');

        res.status(200).json(chats);
    } catch (error) {
        console.error('Error retrieving messages:', error);
        res.status(500).json({ message: 'Failed to retrieve messages' });
    }
};

module.exports = {
    sendMessage,
    getMessages,
};
