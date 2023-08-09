const amqp = require("amqplib");

const TextToImage = require('../../model/textToImage');

const queue = "text_to_image";

const create = async (req, res) => {
  try {
    const newRequest = await TextToImage.create({ ...req.body })

    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(newRequest)), {
      persistent: true,
      replyTo: newRequest.product
    });

    console.log(" [x] Sent '%s'", newRequest);

    res.status(200).json({
      message: 'Request sent to queue'
    })
  } catch (error) {
    console.log({ error })
    res.status(400).json({ message: error.message })
  }
};

module.exports = {
  create,
};
