const { mongoose } = require('mongoose');

const TextToImageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  product: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'pending'
  },
}, { timestamps: true });

const TextToImage = mongoose.model('TextToImage', TextToImageSchema);
TextToImage.createIndexes();
module.exports = TextToImage;
