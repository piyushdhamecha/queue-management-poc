const express = require('express');

const cors = require('cors')
const axios = require('axios')
const amqp = require("amqplib");
const { Server } = require("socket.io")

const app = express();

app.use(express.json());
app.use(cors())

require('dotenv').config()

let connection, channel

const port = process.env.PORT || 3000;

app.post('/send-request', async (request, response) => {
  try {
    const res = await axios.post('http://localhost:3051/api/text-to-image', {
      ...request.body
    })

    response.status(200).json(res.data)
  } catch (error) {
    console.log(error)
    response.status(400).json({ message: error.message })
  }
});

const server = require('http').createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  }
})

io.on("connection", (socket) => {
  console.log('a user connected')
  socket.on('join', ({ userId, product }) => {
    socket.join(`${product}-${userId}`)
  })

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
})

server.listen(port, async () => {
  console.log("Server Listening on PORT:", port);

  try {
    const queue = "geeky"
    connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();

    await channel.assertQueue(queue, { durable: false, autoDelete: true });
    await channel.consume(
      queue,
      (message) => {
        const { type, data } = JSON.parse(message.content.toString())

        if (type === 'timeData') {
          data.forEach((item) => {
            console.log({ item })
            io.sockets
              .in(`${item.product}-${item.userId}`)
              .emit('new_msg', { type, data: item });
          })
        } else if (type === "currentProgress") {

          const { result } = data
          console.log({ result })
          io.sockets
            .in(`${result.product}-${result.userId}`)
            .emit('new_msg', { type, data });
        }

        console.log(" [x] Received from reply '%s'", data);
      },
      {
        noAck: true
      }
    );

    console.log(" [*] Waiting for messages. To exit press CTRL+C");
  } catch (err) {
    console.warn(err);
  }
});


process.on("SIGINT", async () => {
  await channel.close();
  await connection.close();
  process.exit()
});