/* eslint-disable no-console */
const amqp = require("amqplib");
const express = require('express');
const cors = require('cors');
const responseTime = require('response-time');

const connectToMongo = require('./config/database');
const { calculateTime } = require("./helpers");
const TextToImage = require("./model/textToImage");

let connection, channel

require('dotenv').config();

connectToMongo();

const app = express();
app.use(cors());

app.use(express.json());
app.use(responseTime());

app.use('/api', require('./api'));

const port = process.env.PORT || 3000;

app.listen(port, async () => {
  console.log(`Server Up in Port ${port}`);

  try {
    const queue = "text_to_image";
    connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();

    await channel.assertQueue(queue, { durable: true });
    await channel.prefetch(1);
    await channel.consume(
      queue,
      async (message) => {

        const timeData = await calculateTime()

        if (timeData) {
          Object.keys(timeData).forEach((key) => {
            const data = timeData[key]

            channel.sendToQueue(key, Buffer.from(JSON.stringify({
              type: 'timeData',
              data: data.requests
            })))
          })
        }

        const data = JSON.parse(message.content.toString())
        const dbData = await TextToImage.findById(data._id)

        console.log(" [x] Received '%s'", data);
        let percentage = 0

        const interval = setInterval(() => {
          channel.sendToQueue(message.properties.replyTo, Buffer.from(JSON.stringify({
            type: 'currentProgress',
            data: {
              percentage: percentage += 10,
              result: dbData
            }
          })))
        }, 1000)

        setTimeout(async () => {

          clearInterval(interval)

          dbData.status = 'completed'
          await dbData.save()
          channel.ack(message)
          channel.sendToQueue(message.properties.replyTo, Buffer.from(JSON.stringify({
            type: 'currentProgress',
            data: {
              percentage: 100,
              result: dbData
            }
          })))
        }, 10000)
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