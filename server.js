const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const uname =require('./utils/messages');
// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Lets Chat';

var MongoClient = require('mongodb').MongoClient;
const { format } = require('path');
var url = "mongodb://localhost:27017/";



// Run when client connects
io.on('connection', socket => {
   socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);
   
    io.to(user.room).emit('message', formatMessage(user.username,msg));
    MongoClient.connect(url, function(err, db) {
      console.log(user.text);
      console.log(msg);
      if (err) throw err;
      var dbo = db.db("aksdb");
      var myobj = {name : user.username, text: msg,date:new Date()  };
     
      dbo.collection("testchat").insertOne(myobj, function(err, res) {
        if (err) throw err;
        console.log("1 document inserted");
        db.close();
      });
    });
    
  });

  // Runs when client disconnects
  
});



const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
