const TextToImage = require("./model/textToImage")

const calculateTime = async () => {
  const pendingRequests = await TextToImage.find({ status: 'pending' }).sort({ createdAt: 1 }).lean()

  if (!pendingRequests && !pendingRequests.length) {
    return null
  }

  const formattedPendingRequests = pendingRequests.reduce((result, item, index) => {

    const newItem = {
      ...result,
      [item.product]: {
        requests: result[item.product]
          ?
          [
            ...result[item.product].requests,
            {
              ...item,
              estimatedTime: index === 0 ? 0 : (index * 10000)
            }
          ]
          : [{
            ...item,
            estimatedTime: index === 0 ? 0 : (index * 10000)
          }]
      }
    }

    return newItem
  }, {})

  return formattedPendingRequests
}

module.exports = {
  calculateTime
}