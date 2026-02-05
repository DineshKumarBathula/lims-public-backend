const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
const { User, Cart, sequelize, Product, Params } = require("../models/index");
const { KDM_ECOMMERCE_TOKEN } = require("../static/tokens");
const { v4: uuidv4 } = require("uuid");

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Invalid User" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }
    const payload = { email: user.email };
    const jwt_token = jwt.sign(payload, KDM_ECOMMERCE_TOKEN);
    res.status(200).json({ jwt_token, userDetails: user });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { loginUser };
