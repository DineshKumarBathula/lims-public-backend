const { Logs } = require("../models/index");

const createAlog = async (logObj, t) => {
  try {
    await Logs.create(logObj, { transaction: t });
    return;
  } catch (error) {
    throw error;
  }
};

const getIp = (req) => {
  try {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    console.log(ip);
    return ip;
  } catch (err) {
    console.log("error getting ip of request : ", err);
    throw err;
  }
};

module.exports = {
  createAlog,
  getIp,
};
