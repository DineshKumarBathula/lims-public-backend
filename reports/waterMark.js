const { logoBase64 } = require("./filePaths");

const createWaterMark = (currentPage, pageSize) => {
  return {
    image: logoBase64,
    width: 300,
    height: 250,
    absolutePosition: {
      x: pageSize.width / 2 - 150,
      y: pageSize.height / 2 - 150,
    },
    opacity: 0.04,
  };
};

module.exports = createWaterMark;
