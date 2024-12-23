const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Import database and routes
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const groupRoutes = require('./routes/groupRoutes');
const mediaRoutes = require('./routes/mediaRoutes');

// Load environment variables
dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploads folder as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create HTTP server and Socket.IO server
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

// Set up call signaling using Socket.IO
let activeCalls = {};  // Store active calls to track users and calls

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins a room (we use user ID as room ID for simplicity)
    socket.on('joinRoom', (userId) => {
        socket.join(userId);
        console.log(`${userId} joined the room`);
    });

    // Handle offer message (User initiates call)
    socket.on('callOffer', (data) => {
        const { offer, receiverId } = data;
        console.log(`Sending call offer to ${receiverId}`);
        socket.to(receiverId).emit('callOffer', offer);
    });

    // Handle answer message (Receiver answers the call)
    socket.on('callAnswer', (data) => {
        const { answer, receiverId } = data;
        console.log(`Sending call answer to ${receiverId}`);
        socket.to(receiverId).emit('callAnswer', answer);
    });

    // Handle ICE candidate (Handling peer-to-peer connection)
    socket.on('sendIceCandidate', (data) => {
        const { candidate, receiverId } = data;
        console.log(`Sending ICE candidate to ${receiverId}`);
        socket.to(receiverId).emit('receiveIceCandidate', candidate);
    });

    // Handle call end (User ends the call)
    socket.on('endCall', (data) => {
        const { userId, receiverId } = data;
        console.log(`Ending call with ${receiverId}`);
        socket.to(receiverId).emit('callEnded', userId);
    });

    // Handle real-time messaging events (Private chat and group chat)
    socket.on('sendMessage', async (data) => {
        const { sender, receiver, message } = data;
        console.log('Message received:', data);

        try {
            // Save the chat to the database (you can replace this with your own logic)
            const chat = await Chat.create({ sender, receiver, message });
            io.emit('receiveMessage', chat); // Broadcast to all connected clients
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    // Handle typing indicator
    socket.on('typing', ({ sender, receiver, group }) => {
        if (group) {
            io.to(group).emit('userTyping', { sender, group });
        } else {
            io.to(receiver).emit('userTyping', { sender });
        }
    });

    socket.on('stopTyping', ({ sender, receiver, group }) => {
        if (group) {
            io.to(group).emit('userStoppedTyping', { sender, group });
        } else {
            io.to(receiver).emit('userStoppedTyping', { sender });
        }
    });

    // Handle group messages
    socket.on('sendGroupMessage', async (data) => {
        const { groupId, sender, message } = data;

        try {
            const group = await Group.findById(groupId);
            if (!group) {
                console.error('Group not found');
                return;
            }

            const newMessage = { sender, message };
            group.messages.push(newMessage);
            await group.save();

            io.to(groupId).emit('receiveGroupMessage', newMessage); // Broadcast to group members
        } catch (error) {
            console.error('Error sending group message:', error);
        }
    });

    // Handle real-time media sharing
    socket.on('sendMedia', (data) => {
        const { fileUrl, sender, receiver, group, fileType } = data;

        if (group) {
            io.to(group).emit('receiveMedia', { fileUrl, sender, group, fileType });
        } else {
            io.to(receiver).emit('receiveMedia', { fileUrl, sender, receiver, fileType });
        }
    });

    // Handle message delivery status
    socket.on('messageDelivered', async ({ messageId, receiver }) => {
        try {
            const message = await Media.findById(messageId);
            if (message) {
                message.status = 'delivered';
                await message.save();

                io.to(receiver).emit('messageDelivered', { messageId });
            }
        } catch (error) {
            console.error('Error marking message as delivered:', error);
        }
    });

    // Handle message read status
    socket.on('messageRead', async ({ messageId, receiver }) => {
        try {
            const message = await Media.findById(messageId);
            if (message) {
                message.status = 'read';
                await message.save();

                io.to(receiver).emit('messageRead', { messageId });
            }
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    });

    // Handle message reactions
    socket.on('reactToMessage', (data) => {
        const { messageId, emoji, senderId } = data;

        // Broadcast the reaction to other users in the room (chat or group)
        io.emit('messageReaction', { messageId, emoji, senderId }); // Adjust the event as per your logic
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/media', mediaRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
