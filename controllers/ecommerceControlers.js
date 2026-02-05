// imports
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
const {
  User,
  Cart,
  sequelize,
  Product,
  Params,
  Orders,
  SampleMaterials,
  SampleParams,
} = require("../models/index");
const { KDM_ECOMMERCE_TOKEN } = require("../static/tokens");
const { v4: uuidv4 } = require("uuid");
// const crypto = require("crypto");

require("dotenv").config();

const registerUser = async (request, response) => {
  const { email, mobile, password } = request.body;
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return response.status(400).send({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email: email,
      mobile: mobile,
      password: hashedPassword,
    });

    const payload = {
      email: newUser.email,
    };
    const token = jwt.sign(payload, KDM_ECOMMERCE_TOKEN);

    return response.status(200).send({
      message: "You have registered successfully",
      jwt_token: token,
      userDetails: { email, mobile },
    });
  } catch (err) {
    // console.error(err);
    return response
      .status(401)
      .send({ message: "Failed to register, Try again" });
  }
};

const getUserDetailsByEmail = async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    // console.error("Error fetching user details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const checkUserExistsByEmail = async (email) => {
  try {
    const user = await User.findOne({ where: { email } });
    return !!user;
  } catch (error) {
    throw error;
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  // console.log(email, password, 'trigerred')
  try {
    const user = await User.findOne({ where: { email } });
    // console.log(user, 'user logged')
    if (!user) {
      return res.status(404).json({ message: "Invalid User" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    // console.log(passwordMatch, 'pm')
    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }
    // console.log('passed');
    const payload = { email: user.email };
    const jwt_token = jwt.sign(payload, KDM_ECOMMERCE_TOKEN);
    // console.log(jwt_token, user, 'got data from db');

    res.status(200).json({ jwt_token, userDetails: user });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// const addToCart = async (req, res) => {
//   const { data } = req.body;
//   const sample_id = uuidv4();

//   const t = await sequelize.transaction();

//   try {
//     const currentUser = await getUserEmailFromToken(req);

//     for (const item of data) {
//       const { subgroup, paramId } = item;
//       console.log(subgroup, paramId);

//       await Cart.create(
//         {
//           sample_id: sample_id,
//           product_id: parseInt(subgroup),
//           param_id: BigInt(paramId),
//           added_by: currentUser,
//         },
//         { transaction: t }
//       );
//     }

//     await t.commit();
//     return res.status(200).json({
//       message: "Selected added to cart successfully",
//       cartItem: req.body,
//     });
//   } catch (error) {
//     console.error("Error adding items to cart:", error);
//     await t.rollback();
//     return res
//       .status(500)
//       .json({ message: "Internal server error, Please try again later" });
//   }
// };

// const deleteCartItem = async (req, res) => {
//   const { data } = req.headers;
//   const userEmail = getUserEmailFromToken(req);

//   try {
//     await Cart.destroy({
//       where: {
//         sample_id: data,
//         added_by: userEmail,
//       },
//     });
//     return res
//       .status(200)
//       .json({ message: "Sample item deleted successfully", data });
//   } catch (error) {
//     console.error("Error deleting sample from cart:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

// const cartCheckout = async (req, res) => {
//   try {
//     const options = req.body;

//     const razorpay = new Razorpay({
//       key_id: process.env.RAZORPAY_SECRET_KEY,
//       key_secret: process.env.RAZORPAY_SECRET_ID,
//     });
//     const order = await razorpay.orders.create({
//       ...options,
//       currency: "INR",
//       receipt: uuidv4(),
//     });

//     if (!order) {
//       console.log("Error encountered in creating order on server");
//       return res
//         .status(500)
//         .json({ message: "Error encountered in creating order on server" });
//     }

//     return res.status(200).json(order);
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

// const validatePayment = async (req, res) => {
//   try {
//     const { order_id, razorpay_payment_id, razorpay_signature } = req.body;
//     const key_secret = process.env.RAZORPAY_SECRET_KEY;
//     const hmac = crypto.createHmac("sha256", key_secret);
//     hmac.update(`${order_id}|${razorpay_payment_id}`);
//     const generated_signature = hmac.digest("hex");

//     if (generated_signature === razorpay_signature) {
//       return res.status(200).json({ msg: "Payment is successful" });
//     }
//     return res.status(400).json({ msg: "Transaction is not legit!" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Internal Server error" });
//   }
// };

// const fetchCartItems = async (req, res) => {
//   try {
//     const currentUser = await getUserEmailFromToken(req);
//     const cartItems = await Cart.findAll({
//       where: {
//         added_by: currentUser,
//       },
//     });

//     const formattedCartItems = {};
//     for (const item of cartItems) {
//       const { sample_id, product_id, param_id } = item;
//       const param = await Params.findByPk(param_id);
//       if (!formattedCartItems[sample_id]) {
//         const product = await Product.findByPk(product_id);
//         formattedCartItems[sample_id] = {
//           sampleId: sample_id,
//           productId: product_id,
//           productName: product.name,
//           productCategory: product.category,
//           img: product.image,
//           isOffer: product.isOffer,
//           offer: product.offer,
//           parameters: [param],
//         };
//       } else {
//         formattedCartItems[sample_id].parameters.push(param);
//       }
//     }

//     const data = Object.values(formattedCartItems);
//     return res.status(200).json({ data });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

// const clearCart = async (currentUser, t) => {
//   try {
//     await Cart.destroy(
//       {
//         where: {
//           added_by: currentUser,
//         },
//       },
//       { transaction: t }
//     );
//   } catch (err) {
//     throw new Error("Something went wrong in clearning cart");
//   }
// };

// const getCartItems = async (currentUser) => {
//   try {
//     const cartItems = await Cart.findAll({
//       where: {
//         added_by: currentUser,
//       },
//     });

//     const formattedCartItems = {};
//     for (const item of cartItems) {
//       const { sample_id, product_id, param_id } = item;
//       const param = await Params.findByPk(param_id);
//       if (!formattedCartItems[sample_id]) {
//         const product = await Product.findByPk(product_id);
//         formattedCartItems[sample_id] = {
//           sampleId: sample_id,
//           productId: product_id,
//           img: product.image,
//           offer: product.offer,
//           isOffer: product.isOffer,
//           parameters: [param],
//         };
//       } else {
//         formattedCartItems[sample_id].parameters.push(param);
//       }
//     }

//     const data = Object.values(formattedCartItems);
//     return data;
//   } catch (error) {
//     throw new Error("Something went wrong in fetching cart items");
//   }
// };

// const createOrder = async (req, res) => {
//   const t = await sequelize.transaction();

//   try {
//     const currentUser = await getUserEmailFromToken(req);
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       amount,
//     } = req.body;

//     const cart = await getCartItems(currentUser);
//     const insertOrder = await Orders.create(
//       {
//         razorpay_order_id: razorpay_order_id,
//         razorpay_payment_id,
//         razorpay_signature,
//         added_by: currentUser,
//         amount: amount,
//         mode: "ONLINE",
//         bill_data: "",
//       },
//       { transaction: t }
//     );

//     for (const each of cart) {
//       const sampleRecord = {
//         sample_id: each.sampleId,
//         order_id: insertOrder.order_id,
//         product_id: each.productId,
//         isOffer: each.isOffer,
//         offer: each.offer,
//       };

//       const insertSample = await SampleMaterials.create(sampleRecord, {
//         transaction: t,
//       });
//       const sample_id = insertSample.sample_id;

//       for (let eachParam of each.parameters) {
//         const newParam = {
//           sample_id: sample_id,
//           param_id: BigInt(eachParam.param_id),
//           params_info: eachParam.params,
//           param_price: eachParam.price,
//         };

//         await SampleParams.create(newParam, { transaction: t });
//       }
//     }
//     await clearCart(currentUser, t);
//     await t.commit();
//     return res.status(200).json({
//       message: "Order created successfully",
//       cartItem: req.body,
//     });
//   } catch (err) {
//     await t.rollback();
//     console.log(err);
//     return res.status(500).send({ message: "Internal server Error" });
//   }
// };

// const fetchMyOrders = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const result = [];
//     const currentUser = await getUserEmailFromToken(req);
//     const ordersList = await Orders.findAll(
//       {
//         where: { added_by: currentUser },
//         order: [["created_at", "DESC"]],
//       },
//       { transaction: t }
//     );

//     for (let eachOrder of ordersList) {
//       const orderObj = {
//         placedOn: eachOrder.created_at,
//         order_id: eachOrder.order_id,
//         due_date: eachOrder.due_date,

//         //you want any thing other than this ? add
//         samplesList: [],
//       };

//       const samplesList = await SampleMaterials.findAll(
//         {
//           where: {
//             order_id: eachOrder.order_id,
//           },
//         },
//         { transaction: t }
//       );

//       for (let eachSampleOfIthOrder of samplesList) {
//         const sample = {
//           //Hey Pav.. you want any additional thing freel free to add
//           sample_id: eachSampleOfIthOrder.sample_id,
//           product_id: eachSampleOfIthOrder.product_id,
//           isOffer: eachSampleOfIthOrder.isOffer,
//           offer: eachSampleOfIthOrder.offer,
//           chemicalParams: [],
//           physicalParams: [],
//         };

//         const productAdditionalInfo = await Product.findByPk(
//           eachSampleOfIthOrder.product_id,
//           { transaction: t }
//         );

//         sample.name = productAdditionalInfo.name;
//         sample.image = productAdditionalInfo.image;

//         const paramsList = await SampleParams.findAll(
//           {
//             where: {
//               sample_id: eachSampleOfIthOrder.sample_id,
//             },
//           },
//           { transaction: t }
//         );

//         for (let eachParamOfTotalSamples of paramsList) {
//           const param = {
//             param_id: eachParamOfTotalSamples.param_id,
//             orderedPrice: eachParamOfTotalSamples.param_price,
//           };

//           const paramInfo = await Params.findByPk(
//             eachParamOfTotalSamples.param_id,
//             { transaction: t }
//           );

//           param.selectedParams = JSON.parse(paramInfo.params);
//           if (paramInfo.discipline === "CHEMICAL") {
//             sample.chemicalParams.push(param);
//           } else {
//             sample.physicalParams.push(param);
//           }
//         }

//         orderObj.samplesList.push(sample);
//       }
//       result.push(orderObj);
//     }

//     await t.commit();
//     return res.status(200).json({ data: result });
//   } catch (error) {
//     await t.rollback();
//     console.log(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

module.exports = {
  // getUserEmailFromToken,
  registerUser,
  getUserDetailsByEmail,
  checkUserExistsByEmail,
  loginUser,

  //cart related controllers
  // addToCart,
  // fetchCartItems,
  // deleteCartItem,
  // cartCheckout,
  // validatePayment,
  // cartCheckout,

  //orders
  // createOrder,
  // fetchMyOrders,
};
