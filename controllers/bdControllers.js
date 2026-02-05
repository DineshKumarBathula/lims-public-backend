const {
  Callback,
  Subscriber,
  Product,
  Params,
  Cart,
  sequelize,
  Sequelize,
  Orders,
  SampleMaterials,
  SampleParams,
  Customers,
  Jobs,
  User,
  MaterialTestingQuotation,
  db,
  TaxedOrders,
  SampleMaterialFields,
  ClubTests,
  Client,
  GstRecords,
  Ledger,
  Feedback,
} = require("../models/index");

const AWS = require("aws-sdk");

const mime = require("mime-types");

const { createMergedTaxInvoice } = require("../reports/mergeInvoices");
const { v4: uuidv4 } = require("uuid");
const { getSamplesStickerDocument } = require("../reports/OrderSticker");
const { sendWhatsAppMessage } = require("./whatsappController");
require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// const getProductsAddedByCurrentUser = async (currentUser, id) => {
//   try {
//     const cartItems = await Cart.findAll({
//       where: {
//         added_by: currentUser,
//         product_id: id,
//       },
//       attributes: ["product_id", "sample_id"],
//       group: ["product_id", "sample_id"],
//     });

//     return cartItems;
//   } catch (error) {
//     throw error;
//   }
// };
const checkDuplicateOrderPn = async (req, res) => {
  try {
    const { order_number, pn } = req.body;

    if (!order_number || !pn) {
      return res
        .status(400)
        .json({ success: false, message: "order_number and pn are required" });
    }

    const existingOrder = await Orders.findOne({
      where: {
        order_number,
        pn,
      },
    });

    if (existingOrder) {
      return res.json({ success: true, duplicate: true });
    }

    return res.json({ success: true, duplicate: false });
  } catch (error) {
    console.error("Error checking duplicate order:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while checking duplicate",
    });
  }
};

const createCallbackRequest = async (req, res) => {
  try {
    const { name, mobile, whatsapp } = req.body;
    const callbackRequest = await Callback.create({
      name,
      mobile,
      whatsapp_consent: whatsapp,
    });

    res.status(201).json({ success: true, callbackRequest });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getQuotationByIdService = async (req, res) => {
  try {
    const { data } = req.query;
    const quotation = await MaterialTestingQuotation.findOne({
      where: { qtn_id: data },
    });
    res.status(201).json({ success: true, quotation });
  } catch (err) {
    console.log("Error while fetching qtuoation with ID : ", err);
    res.status(500).json({ error: "Failed to subscribe" });
  }
};

const subscribeController = async (req, res) => {
  try {
    const { email } = req.body;
    const existingSubscriber = await Subscriber.findOne({ where: { email } });

    if (existingSubscriber) {
      return res.status(400).json({ error: "Email is already subscribed" });
    }

    const newSubscriber = await Subscriber.create({ email });

    res
      .status(200)
      .json({ message: "Successfully subscribed", subscriber: newSubscriber });
  } catch (error) {
    console.error("Error subscribing:", error);
    res.status(500).json({ error: "Failed to subscribe" });
  }
};

const uploadFileToS3 = (file) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.AWS_MATERIALS_BUCKET,
      Key: file.originalname,
      Body: file.buffer,
      // ACL: "public-read",
    };

    s3.upload(params, (err, data) => {
      if (err) {
        console.error("Error uploading file to S3:", err);
        reject(err);
      } else {
        console.log("File uploaded successfully:", data.Location);
        resolve(data);
      }
    });
  });
};

const deleteS3Obj = (bucketName, key) => {
  const params = {
    Bucket: bucketName,
    Key: key,
  };
  try {
    s3.deleteObject(params, (err, data) => {
      if (err) {
        console.error("Error deleting the file:", err);
        throw err;
      } else {
        console.log("File deleted successfully:", key, data);
      }
    });
  } catch (error) {
    throw error;
  }
};

const onAddingNewProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      rating,
      base_price,
      isOffer,
      offer,
      prefix,
      complete_pack,
      description,
      no_of_days,
      interim_report,
      interim_report_days,
      features,
      id,
      old_image,
      old_image_lg,
    } = req.body;

    let imageUrl = null;
    let imageUrlKey = null;
    let imageLgUrl = null;
    let imageLgUrlKey = null;

    let need = 0;

    if (req.files && req.files["image"]) {
      if (old_image) {
        const url = new URL(old_image);
        const key = url.pathname.substring(1); // Remove the leading

        // Define the bucket name (extracted from the URL as well)
        const bucketName = process.env.AWS_MATERIALS_BUCKET;

        // Define the parameters for the delete operation
        const params = {
          Bucket: bucketName,
          Key: key,
        };

        // Delete the file from the S3 bucket
        s3.deleteObject(params, (err, data) => {
          if (err) {
            console.error("Error deleting the file:", err);
          } else {
            console.log("File deleted successfully:", key, data);
          }
        });
      }

      const imageFile = req.files["image"][0];
      const uploadedImage = await uploadFileToS3(imageFile);
      imageUrl = uploadedImage.Location;
      // imageUrlKey = imageFile.originalname;
    }

    if (req.files && req.files["image_lg"]) {
      if (old_image_lg) {
        const url = new URL(old_image_lg);
        const key = url.pathname.substring(1);

        // Define the bucket name (extracted from the URL as well)
        const bucketName = process.env.AWS_MATERIALS_BUCKET;

        // Define the parameters for the delete operation
        const params = {
          Bucket: bucketName,
          Key: key,
        };

        // Delete the file from the S3 bucket
        s3.deleteObject(params, (err, data) => {
          if (err) {
            console.error("Error deleting the file:", err);
          } else {
            console.log("File deleted successfully:", data);
          }
        });
      }
      const imageFile = req.files["image_lg"][0];
      const uploadedImage = await uploadFileToS3(imageFile);
      imageLgUrl = uploadedImage.Location;
      // imageLgUrlKey = imageFile.originalname;
    }

    const updateData = {
      name,
      category,
      rating,
      base_price,
      isOffer,
      need,
      prefix,
      complete_pack,
      description,
      no_of_days,
      interim_report,
      interim_report_days,
      features: features ? JSON.stringify(features) : null,
    };

    if (imageUrl) {
      updateData.image = imageUrl;
    }

    if (imageLgUrl) {
      updateData.image_lg = imageLgUrl;
    }

    let newProduct;

    if (id) {
      await Product.update(updateData, {
        where: { id },
      });

      newProduct = await Product.findOne({ where: { id } });
    } else {
      newProduct = await Product.create({
        name,
        category,
        rating,
        base_price,
        isOffer,
        need,
        prefix,
        complete_pack,
        description,
        no_of_days,
        interim_report,
        interim_report_days,
        features: features ? JSON.stringify(features) : null,
        image: imageUrl,
        image_lg: imageLgUrl,
        image_key: imageUrlKey,
        image_lg_key: imageLgUrlKey,
      });
    }
    res.status(201).json({ success: true, newProduct });
  } catch (error) {
    console.error("Error uploading product:", error);
    res.status(500).send("Failed to upload product");
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    // console.log(products, 'products')
    res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "No products found" });
    }

    const params = await Params.findAll({
      where: {
        subgroup: id,
      },
    });

    const formattedParams = params.map((eachParam) => ({
      paramId: eachParam.param_id,
      price: eachParam.price,
      common_req: eachParam.common_req,
      requirement: eachParam.requirements,
      isNabl: eachParam.is_nabl,
      discipline: eachParam.discipline,
      params: JSON.parse(eachParam.params),
      popular: Boolean(Number(eachParam.popular)),
      selected: false,
    }));

    return res.status(200).json({ product, params: formattedParams });
  } catch (error) {
    console.error("Error fetching products:", error);

    return res.status(500).json({ message: "Failed to fetch products" });
  }
};

const deleteProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.destroy();

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

const editProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      rating,
      base_price,
      isOffer,
      offer,
      prefix,
      complete_pack,
      description,
      no_of_days,
      interim_report,
      interim_report_days,
      features,
    } = req.body;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.update({
      name,
      category,
      rating,
      base_price,
      isOffer,
      offer,
      prefix,
      complete_pack,
      description,
      no_of_days,
      interim_report,
      interim_report_days,
      features: features ? JSON.stringify(features) : null,
    });

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("Error editing product:", error);
    res.status(500).json({ message: "Failed to edit product" });
  }
};

const getProductPartialData = async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [["name"]],
      attributes: [
        "id",
        "image",
        "name",
        "isOffer",
        "base_price",
        "features",
        "offer",
        "prefix",
      ],
    });

    const formattedProducts = products.map((product) => ({
      id: product.id,
      image: product.image,
      name: product.name,
      offer: product.offer,
      isOffer: product.isOffer,
      base_price: product.base_price,
      prefix: product.prefix,
      features: JSON.parse(product.dataValues.features).map(
        (each) => each.short_feature,
      ),
    }));

    return res.status(200).json({ products: formattedProducts });
  } catch (error) {
    console.error("Error fetching partial product data:", error);
    res.status(500).json({ message: "Failed to fetch partial product data" });
  }
};

const getAllParams = async (req, res) => {
  try {
    const params = await Params.findAll({
      attributes: [
        ["param_id", "paramId"],
        ["is_nabl", "isNabl"],
        "price",
        "subgroup",
        "params",
        "discipline",
        "requirements",
        "popular",
      ],
    });

    const updatedParams = params.map((param) => ({
      ...param.dataValues,
      qty: 1,
      newPrice: param.price,
    }));

    return res.status(200).json({ data: updatedParams });
  } catch (error) {
    console.error("Error fetching parameters:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAllProductsNameId = async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: ["id", "name"],
    });

    return res.status(200).json({ products });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const addParams = async (req, res) => {
  try {
    const {
      id,
      isNabl,
      price,
      subgroup,
      params,
      available,
      additional_info,
      discipline,
      common_req,
      requirements,
      installedParam,
    } = req.body;

    let newParams;

    if (installedParam) {
      newParams = await Params.update(
        {
          param_id: id,
          is_nabl: isNabl,
          price,
          subgroup,
          params,
          available,
          additional_info,
          discipline,
          common_req,
          requirements,
        },
        { where: { param_id: id } },
      );
    } else {
      newParams = await Params.create({
        param_id: id,
        is_nabl: isNabl,
        price,
        subgroup,
        params,
        available,
        additional_info,
        discipline,
        common_req,
        requirements,
      });
    }

    // Create a new record in the Params table

    res
      .status(201)
      .json({ message: "Params record added successfully", params: newParams });
  } catch (error) {
    console.error("Error adding Params record:", error);
    res.status(500).json({
      message: "Failed to add Params record. Please try again later.",
    });
  }
};

const getRequestCallbacks = async (req, res) => {
  try {
    const callbacks = await Callback.findAll({
      order: [["requested_at", "DESC"]],
    });
    return res.status(200).json({ data: callbacks });
  } catch (err) {
    console.log("error while fetching call back requests", err);
    res.status(500).json({ error: "internal server error" });
  }
};

const uploadAudioFileToS3 = (file, callbackId) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.AWS_CUSTOMER_CARE_BUCKET,
      Key: callbackId,
      Body: file.buffer,
    };

    s3.upload(params, (err, data) => {
      if (err) {
        console.error("Error uploading file to S3:", err);
        reject(err);
      } else {
        console.log("File uploaded successfully:", data.Location);
        resolve(callbackId);
      }
    });
  });
};

const uploadCustomerRequestAudio = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }
    const callbackId = req.body.requestId;
    if (!callbackId) {
      return res.status(400).json({ error: "No callback ID provided" });
    }

    const audioFile = req.file;
    const uploadedFile = await uploadAudioFileToS3(audioFile, callbackId);

    await Callback.update(
      { callrecording: uploadedFile },
      { where: { request_id: callbackId } },
      { transaction: t },
    );

    await t.commit();
    return res.status(200).json({
      message: "Audio uploaded successfully",
      url: uploadedFile,
      request_id: callbackId,
    });
  } catch (error) {
    await t.rollback();

    console.error("Error uploading audio file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const uploadWorkOrderFileToS3 = (file, id) => {
  return new Promise((resolve, reject) => {
    const contentType =
      mime.lookup(file.originalname) || "application/octet-stream";

    const docName = `${id}-letter`;
    const uploadParams = {
      Bucket: process.env.AWS_KDM_WORK_ORDER_LETTERS,
      Key: docName,
      Body: file.buffer,
      ContentType: contentType,
    };

    s3.upload(uploadParams, (err, data) => {
      if (err) {
        console.log("trigered324");
        console.error("Error uploading file to S3:", err);
        reject(err);
      } else {
        console.log("trigered987");
        console.log("File uploaded successfully:", data.Location);
        resolve(docName);
      }
    });
  });
};

const getCustomerInfoByID = async (customerId, t) => {
  try {
    const customer = await Customers.findByPk(customerId, {
      transaction: t,
      include: [
        {
          model: GstRecords,
          as: "gst_records", // must match the alias in your association
          attributes: ["gst", "bill_address", "pan_id"],
        },
      ],
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    const queryRes = customer.toJSON();
    const {
      reporting_name,
      reporting_address,
      pan,
      gst,
      billing_name,
      billing_address,
      discount,
      gst_records = [],
    } = queryRes;

    const res = {
      name: reporting_name,
      address: reporting_address,
      pan_number: pan,
      gst_number: gst,
      billing_name,
      billing_address,
      discount,
      gst_records, // 👉 send gst_records directly to frontend
    };

    return res;
  } catch (error) {
    console.error("Error fetching customer:", error);
    throw error;
  }
};

// const getCustomerInfoByID = async (customerId, t) => {
//   try {
//     const customer = await Customers.findByPk(customerId, { transaction: t });
//     const queryRes = customer.toJSON();
//     const {
//       reporting_name,
//       reporting_address,
//       pan,
//       gst,
//       billing_name,
//       billing_address,
//       discount,
//     } = queryRes;
//     const res = {
//       name: reporting_name,
//       address: reporting_address,
//       pan_number: pan,
//       gst_number: gst,
//       billing_name,
//       billing_address,
//       discount,
//     };
//     if (!customer) {
//       throw new Error("Customer not found");
//     }
//     return res;
//   } catch (error) {
//     console.error("Error fetching customer:", error);
//     throw error;
//   }
// };

const deleteSampleParamsByOrderId = async (orderId, transaction) => {
  try {
    const sampleMaterials = await SampleMaterials.findAll({
      where: { order_id: orderId },
      attributes: ["sample_id"],
      transaction: transaction,
    });

    // Extract the sample_ids
    const sampleIds = sampleMaterials.map((sm) => sm.sample_id);

    if (sampleIds.length > 0) {
      await SampleMaterials.destroy({
        where: {
          order_id: orderId,
        },
        transaction: transaction,
      });
    }

    if (sampleIds.length > 0) {
      await SampleParams.destroy({
        where: {
          sample_id: sampleIds,
        },
        transaction: transaction,
      });
      console.log("SampleParams records deleted successfully.");
    } else {
      console.log("No SampleParams records found for the given order_id.");
    }
  } catch (error) {
    console.error("Error deleting SampleParams records:", error);
    throw error;
  }
};

const getCustomersList = async (req, res) => {
  try {
    const customersList = await Customers.findAll({
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ data: customersList });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getSiteUsers = async (req, res) => {
  try {
    const usersList = await User.findAll({
      attributes: ["id", "email", "mobile", "registeredDate"],
      order: [["registeredDate", "DESC"]],
    });

    return res.status(200).json({ data: usersList });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getSubscribers = async (req, res) => {
  try {
    const subscribersList = await Subscriber.findAll({
      order: [["subscribed_at", "DESC"]],
    });
    return res.status(200).json({ data: subscribersList });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getSubscriberStatisticsMonthly = async (req, res) => {
  try {
    const counts = await Subscriber.findAll({
      attributes: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("subscribed_at"), "%m-%Y"),
          "month_year",
        ],
        [Sequelize.fn("COUNT", "*"), "count"],
      ],
      group: [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("subscribed_at"), "%m-%Y"),
      ],
      order: [[Sequelize.literal("month_year"), "ASC"]],
      raw: true,
    });

    const result = counts.map((count) => ({
      label: count.month_year,
      count: count.count,
    }));

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getSubscriberStatisticsLast30Days = async (req, res) => {
  try {
    const last30Records = await Subscriber.findAll({
      attributes: ["subscribed_at"],
      order: [["subscribed_at", "DESC"]],

      raw: true,
    });

    const subscribed_at = last30Records.map((user) => user.subscribed_at);

    const dailyCounts = await Subscriber.findAll({
      attributes: [
        [
          Sequelize.fn(
            "DATE_FORMAT",
            Sequelize.col("subscribed_at"),
            "%Y-%m-%d",
          ),
          "day",
        ],
        [Sequelize.fn("COUNT", "*"), "count"],
      ],
      where: {
        subscribed_at: {
          [Sequelize.Op.in]: subscribed_at,
        },
      },
      group: [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("subscribed_at"), "%Y-%m-%d"),
      ],
      order: [[Sequelize.literal("day"), "DESC"]],
      raw: true,
      limit: 30,
    });

    const result = dailyCounts.map((record) => ({
      label: record.day,
      count: record.count,
    }));

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getLast30CustomerCounts = async (req, res) => {
  try {
    const last30Records = await Customers.findAll({
      attributes: ["created_at"],
      order: [["created_at", "DESC"]],
      raw: true,
    });

    const created_at = last30Records.map((user) => user.created_at);

    const dailyCounts = await Customers.findAll({
      attributes: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m-%d"),
          "day",
        ],
        [Sequelize.fn("COUNT", "*"), "count"],
      ],
      where: {
        created_at: {
          [Sequelize.Op.in]: created_at,
        },
      },
      group: [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m-%d"),
      ],
      order: [[Sequelize.literal("day"), "DESC"]],
      raw: true,
      limit: 30,
    });

    const result = dailyCounts.map((record) => ({
      label: record.day,
      count: record.count,
    }));

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getCustomerStatisticsMonthly = async (req, res) => {
  try {
    const customerCounts = await Customers.findAll({
      attributes: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%m-%Y"),
          "month_year",
        ],
        [Sequelize.fn("COUNT", "*"), "count"],
      ],
      group: [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%m-%Y"),
      ],
      order: [[Sequelize.literal("month_year"), "ASC"]],
      raw: true,
    });

    const result = customerCounts.map((customerCount) => ({
      label: customerCount.month_year,
      count: customerCount.count,
    }));

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getLast30DaysOrderCounts = async (req, res) => {
  try {
    const last30Records = await Orders.findAll({
      attributes: ["created_at"],
      order: [["created_at", "DESC"]],
      raw: true,
    });

    const created_at = last30Records.map((order) => order.created_at);

    const dailyCounts = await Orders.findAll({
      attributes: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m-%d"),
          "day",
        ],
        [Sequelize.fn("COUNT", "*"), "count"],
      ],
      where: {
        created_at: {
          [Sequelize.Op.in]: created_at,
        },
      },
      group: [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m-%d"),
      ],
      order: [[Sequelize.literal("day"), "ASC"]],
      raw: true,
      limit: 30,
    });

    const result = dailyCounts.map((record) => ({
      label: record.day,
      count: record.count,
    }));

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getOrderStatisticsMonthly = async (req, res) => {
  try {
    const orderCounts = await Orders.findAll({
      attributes: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%m-%Y"),
          "month_year",
        ],
        [Sequelize.fn("COUNT", "*"), "count"],
      ],
      group: [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%m-%Y"),
      ],
      order: [[Sequelize.literal("month_year"), "ASC"]],
      raw: true,
    });

    const result = orderCounts.map((orderCount) => ({
      label: orderCount.month_year,
      count: orderCount.count,
    }));

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getProductSampleCounts = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.name, 
        p.image, 
        COUNT(sm.product_id) AS count
      FROM 
        products p
      JOIN 
        sample_materials sm
      ON 
        p.id = sm.product_id
      GROUP BY 
        p.id
      ORDER BY 
        count DESC
    `;

    const results = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
    });

    return res.status(200).json({ data: results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getDisciplineWise = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.discipline as name,
        COUNT(sp.param_id) AS value
      FROM 
        sample_params sp
      JOIN 
        params p ON sp.param_id = p.param_id
      GROUP BY 
        p.discipline
     
    `;

    const results = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
    });

    return res.status(200).json({ data: results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getOnlineUsersMonthly = async (req, res) => {
  try {
    const onlineUsers = await User.findAll({
      attributes: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("registeredDate"), "%m-%Y"),
          "month_year",
        ],
        [Sequelize.fn("COUNT", "*"), "count"],
      ],
      group: [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("registeredDate"), "%m-%Y"),
      ],
      order: [[Sequelize.literal("month_year"), "ASC"]],
      raw: true,
    });

    const result = onlineUsers.map((eachUser) => ({
      label: eachUser.month_year,
      count: eachUser.count,
    }));

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getOnlineUsersDaily = async (req, res) => {
  try {
    const last30Users = await User.findAll({
      attributes: ["registeredDate"],
      order: [["registeredDate", "ASC"]],
      raw: true,
    });

    const registrationDates = last30Users.map((user) => user.registeredDate);

    const dailyCounts = await User.findAll({
      attributes: [
        [
          Sequelize.fn(
            "DATE_FORMAT",
            Sequelize.col("registeredDate"),
            "%Y-%m-%d",
          ),
          "day",
        ],
        [Sequelize.fn("COUNT", "*"), "count"],
      ],
      where: {
        registeredDate: {
          [Sequelize.Op.in]: registrationDates,
        },
      },
      group: [
        Sequelize.fn(
          "DATE_FORMAT",
          Sequelize.col("registeredDate"),
          "%Y-%m-%d",
        ),
      ],
      order: [[Sequelize.literal("day"), "DESC"]],
      raw: true,
      limit: 30,
    });

    const result = dailyCounts.map((record) => ({
      label: record.day,
      count: record.count,
    }));

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//quotations
const getQuotationsDaily = async (req, res) => {
  try {
    const last30Quotations = await MaterialTestingQuotation.findAll({
      attributes: ["created_at"],
      order: [["created_at", "DESC"]],

      raw: true,
    });

    const created_at = last30Quotations.map((user) => user.created_at);

    const dailyCounts = await MaterialTestingQuotation.findAll({
      attributes: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m-%d"),
          "day",
        ],
        [Sequelize.fn("COUNT", "*"), "count"],
      ],
      where: {
        created_at: {
          [Sequelize.Op.in]: created_at,
        },
      },
      group: [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m-%d"),
      ],
      order: [[Sequelize.literal("day"), "DESC"]],
      raw: true,
      limit: 30,
    });

    const result = dailyCounts.map((record) => ({
      label: record.day,
      count: record.count,
    }));

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const quotationsMonthlyRecors = async (req, res) => {
  try {
    const quotationsCount = await MaterialTestingQuotation.findAll({
      attributes: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%m-%Y"),
          "month_year",
        ],
        [Sequelize.fn("COUNT", "*"), "count"],
      ],
      group: [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%m-%Y"),
      ],
      order: [[Sequelize.literal("month_year"), "DESC"]],
      raw: true,
    });

    const result = quotationsCount.map((customerCount) => ({
      label: customerCount.month_year,
      count: customerCount.count,
    }));
    return res.status(200).json({ data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAllQuotations = async (req, res) => {
  try {
    const quotations = await MaterialTestingQuotation.findAll({
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({ data: quotations });
  } catch (error) {
    console.error("Error fetching Quotations:", error);
    res.status(500).json({ message: "Failed to fetch Quotations" });
  }
};

//this has to be removed
const generateSampleCodes = (samples, maxNumber) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
  const sampleGroups = samples.reduce((acc, sample) => {
    if (!acc[sample.sampleId]) {
      acc[sample.sampleId] = [];
    }
    acc[sample.sampleId].push(sample);
    return acc;
  }, {});

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Create the final output array
  const finalOutput = [];

  Object.keys(sampleGroups).forEach((sampleId, sampleIndex) => {
    const samples = sampleGroups[sampleId];
    samples.forEach((sample, index) => {
      const alphabeticalSuffix = alphabet[index % alphabet.length];
      const sampleNumber = sampleIndex + 1;

      // Ensure the prefix is present in the sample object
      const prefix = sample.prefix || "AM";

      // Generate the sample_code
      const sample_code = `KDMEIPL/VSKP/${prefix}/${currentMonth}/${currentYear}-${maxNumber}/${sampleNumber}(${alphabeticalSuffix})`;

      // Add the sample_code to the sample object
      sample.sample_code = sample_code;

      // Add the sample to the final output array
      finalOutput.push(sample);
    });
  });

  return finalOutput;
};

const getAllSamples = async (req, res) => {
  try {
    const { data } = req.query;
    const orders = await db.Orders.findAll({
      where: { order_id: data },
      include: [
        {
          model: db.SampleMaterials,
          as: "samples",
          attributes: [
            "sample_id",
            "product_id",
            "source",
            "quantity",
            "grade",
            "brandName",
            "week_no",
            "ref_code",
            "sample_id_optional_field",
            "sample_code",
            "site_name",
            "doa",
            "job_assigned",
          ],
          include: [
            {
              model: db.SampleParam,
              as: "params",
              attributes: ["param_id", "params_info", "status"],
              include: [
                {
                  model: db.Params,
                  as: "param",
                  attributes: ["discipline"],
                },
              ],
            },
            {
              model: db.Product,
              as: "product",
              attributes: ["id", "name", "base_price"],
            },
          ],
        },
      ],
      attributes: [
        "order_id",
        "created_at",
        "registration_done",
        "customer_id",
        "project_name",
        "subject",
        "letter",

        "order_number",
        "lab",
        "converted_to_tax",
      ],
    });

    const formattedOrders = orders.map((order) => {
      const formattedOrder = order.toJSON();

      if (formattedOrder.samples) {
        formattedOrder.samples = formattedOrder.samples.map((sample) => {
          if (sample.params) {
            sample.params = sample.params.map((param) => {
              if (param.params_info) {
                try {
                  param.params_info = JSON.parse(param.params_info);
                } catch (error) {
                  console.error("Failed to parse params_info:", error);
                  param.params_info = null; // Handle invalid JSON case
                }
              }
              return param;
            });
          }
          return sample;
        });
      }

      return formattedOrder;
    });

    // Return the fetched order as JSON response
    res.status(200).json({ data: formattedOrders });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
};

const getScope = async (req, res) => {
  try {
    const products = await db.Product.findAll({
      include: [
        {
          model: db.Params,
          as: "params",
        },
      ],
      order: [["name", "ASC"]],
    });

    const formattedData = products.map((product) => {
      product = product.toJSON();
      return {
        ...product,
        params: product.params.map((eachParam) => {
          return {
            ...eachParam,
            params: JSON.parse(eachParam.params),
          };
        }),
      };
    });

    res.status(200).json({ data: formattedData });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

const getUnregistedController = async () => {
  try {
    const sampleMaterials = await SampleMaterials.findAll({
      where: { registered: false },
      attributes: [
        "sample_id",
        "product_id",
        "sample_code",
        "order_id",
        "registered",
      ],
      order: [["created_at", "DESC"]],

      include: [
        {
          model: SampleParams,
          as: "params",
          attributes: ["params_info", "params_info"],
        },

        {
          model: Orders,
          as: "order",
          attributes: ["order_id", "order_number"],
          order: [["created_at", "DESC"]],
        },
        {
          model: Product,
          as: "product",
          attributes: ["name"],
        },
      ],
    });

    if (!sampleMaterials || sampleMaterials.length === 0) {
      return [];
    }

    const formattedData = sampleMaterials.map((eachSample) => {
      return {
        sample_id: eachSample.sample_id,
        product_id: eachSample.product_id,
        order_id: eachSample.order_id,
        sample_code: eachSample.sample_code,
        site_name: eachSample.site_name,
        name: eachSample.product.name,

        order_number: eachSample.order.order_number.toString(),
        params_info: eachSample.params
          .map((param) => JSON.parse(param.dataValues.params_info))
          .flat()
          .map((test) => test.testName), // Extract only testName
      };
    });

    return formattedData;
  } catch (error) {
    console.error(
      "Error fetching sample materials of a particular order:",
      error,
    );
    throw error;
  }
};

const getUnregistedSamples = async (req, res) => {
  try {
    const samples = await getUnregistedController();
    // console.log(samples, 'samplessamplessamples')
    return res.status(200).json({ data: samples });
  } catch (err) {
    console.error("Error fetching samples : ", err);
    return res.status(500).json({ error: "Failed to fetch sampples" });
  }
};

const classifySampleParamsAndUpdateDB = async (sampleId, t) => {
  try {
    // Fetch all SampleParams for the given sample_id with transaction
    const sampleParams = await SampleParams.findAll({
      where: { sample_id: sampleId },
      include: [
        {
          model: Params,
          as: "param",
          attributes: ["discipline", "is_nabl"],
        },
      ],
      transaction: t, // Corrected transaction placement
    });
    console.log(sampleParams, "sampleParams345");
    // Classify sampleParams
    const classification = {
      chemical_nabl: {
        discipline: "CHEMICAL",
        params: [],
        nabl_status: true,
      },
      chemical_non_nabl: {
        discipline: "CHEMICAL",
        params: [],
        nabl_status: false,
      },
      physical_nabl: { discipline: "PHYSICAL", params: [], nabl_status: true },
      physical_non_nabl: {
        discipline: "PHYSICAL",
        params: [],
        nabl_status: false,
      },
    };

    // Classify the SampleParams
    sampleParams.forEach((sampleParam) => {
      const { param_id, param } = sampleParam.toJSON();
      const { discipline, is_nabl } = param;

      if (discipline === "CHEMICAL") {
        if (is_nabl) {
          classification.chemical_nabl.params.push(param_id);
        } else {
          classification.chemical_non_nabl.params.push(param_id);
        }
      } else if (discipline === "PHYSICAL") {
        if (is_nabl) {
          classification.physical_nabl.params.push(param_id);
        } else {
          classification.physical_non_nabl.params.push(param_id);
        }
      }
    });

    // Insert jobs for each classification
    const keys = Object.keys(classification);
    for (const key of keys) {
      const { params, nabl_status, discipline } = classification[key];
      // console.log(key,params, nabl_status, discipline,sampleId,'existingJob536')

      if (params.length > 0) {
        const newRec = {
          sample_id: sampleId,
          job_id: key,
          discipline,
          nabl: nabl_status,
          params_json: JSON.stringify(params),
        };
        await Jobs.create(newRec, { transaction: t });
        //  console.log(createCheck,'createCheck')
      }
    }

    return; // Return classification for debugging/logging
  } catch (error) {
    console.error("Error classifying sample params and creating jobs: ", error);
    throw error;
  }
};

const classifySampleParamsAndUpdateDBwithoutLosingOld = async (sampleId, t) => {
  console.log(sampleId, "sampleId8712");
  try {
    const sampleParams = await SampleParams.findAll({
      where: { sample_id: sampleId },
      include: [
        {
          model: Params,
          as: "param",
          attributes: ["discipline", "is_nabl"],
        },
      ],
      transaction: t,
    });

    const classification = {
      chemical_nabl: { discipline: "CHEMICAL", params: [], nabl_status: true },
      chemical_non_nabl: {
        discipline: "CHEMICAL",
        params: [],
        nabl_status: false,
      },
      physical_nabl: { discipline: "PHYSICAL", params: [], nabl_status: true },
      physical_non_nabl: {
        discipline: "PHYSICAL",
        params: [],
        nabl_status: false,
      },
    };

    // classify params
    sampleParams.forEach((sampleParam) => {
      const { param_id, param } = sampleParam.toJSON();
      const { discipline, is_nabl } = param;

      if (discipline === "CHEMICAL") {
        if (is_nabl) classification.chemical_nabl.params.push(param_id);
        else classification.chemical_non_nabl.params.push(param_id);
      } else if (discipline === "PHYSICAL") {
        if (is_nabl) classification.physical_nabl.params.push(param_id);
        else classification.physical_non_nabl.params.push(param_id);
      }
    });

    // create jobs if not exists
    const keys = Object.keys(classification);
    for (const key of keys) {
      const { params, nabl_status, discipline } = classification[key];

      if (params.length > 0) {
        // 🔍 check if job already exists for this sample
        const existingJob = await Jobs.findOne({
          where: {
            sample_id: sampleId,
            // discipline,
            // nabl: nabl_status,
          },
          transaction: t,
        });

        console.log(existingJob, "existingJob234");
        console.log(
          String(existingJob?.dataValues?.job_id),
          String(key),
          "ned983",
        );
        // if (!existingJob) {
        if (
          !existingJob
          // || String(existingJob?.dataValues?.job_id) !== String(key)
        ) {
          console.log("trigerred234");
          const newRec = {
            sample_id: sampleId,
            job_id: key,
            discipline,
            nabl: nabl_status,
            params_json: JSON.stringify(params),
          };
          await Jobs.create(newRec, { transaction: t });
        }
      }
    }

    return;
  } catch (error) {
    console.error("Error classifying sample params and creating jobs: ", error);
    throw error;
  }
};

// const onRegisteringSample = async (req, res) => {
//   const t = await sequelize.transaction();

//   try {
//     const {
//       sample_id,
//       source,
//       quantity,
//       grade,
//       brandName,
//       week_no,
//       ref_code,
//       sample_id_optional_field,
//       site_name,
//     } = req.body;

// const sampleDetails = {
//   sample_id,
//   source,
//   quantity,
//   grade,
//   brandName,
//   week_no,
//   ref_code,
//   sample_id_optional_field,
//   site_name,
//   registered: true,
//   dor: new Date(),
// };

// await SampleMaterials.update(
//   sampleDetails,
//   { where: { sample_id } },
//   { transaction: t }
// );

//     await classifySampleParamsAndUpdateDB(sample_id, t);
//     await t.commit();
//     return res
//       .status(200)
//       .json({ message: "Sample Registered", data: sampleDetails });
//   } catch (err) {
//     console.log(err);
//     await t.rollback();
//     return res
//       .status(500)
//       .json({ error: "Failed to Register sample, please try again" });
//   }
// };

const onRegisteringSample = async (req, res) => {
  console.log("🛬 RAW req.body:", req.body);
  const t = await sequelize.transaction();

  try {
    const {
      steelInfo,
      sandType,
      sieveSize,
      sample_id,
      coreInfo,
      gradeType,
      vgGradeType,
      product52GradeType,
      ...dynamicFields
    } = req.body;

    if (!sample_id) {
      return res.status(400).json({ error: "sample_id is required" });
    }

    /* ---------------------------------------
       1️⃣ Decide test_req (UNCHANGED LOGIC)
    ---------------------------------------- */
    let test_req = null;

    if (sieveSize) test_req = sieveSize;
    else if (sandType) test_req = sandType;
    else if (steelInfo) test_req = steelInfo;
    else if (coreInfo) test_req = coreInfo;
    else if (gradeType) test_req = gradeType;
    else if (vgGradeType) test_req = vgGradeType;
    else if (product52GradeType) test_req = product52GradeType;

    /* ---------------------------------------
       2️⃣ 🔥 DELETE OLD DATA (THIS IS THE FIX)
    ---------------------------------------- */

    // ✅ Remove old dynamic fields
    await SampleMaterialFields.destroy({
      where: { club_id: sample_id },
      transaction: t,
    });

    // ✅ Remove old test_req
    await ClubTests.destroy({
      where: { club_id: sample_id },
      transaction: t,
    });

    /* ---------------------------------------
       3️⃣ Insert NEW dynamic fields
    ---------------------------------------- */
    const fieldRecords = Object.entries(dynamicFields).map(
      ([field_name, field_value]) => ({
        club_id: sample_id,
        field_name,
        field_value: field_value?.toString() || null,
        sample_id: "none", // keep as-is
      }),
    );

    if (fieldRecords.length > 0) {
      await SampleMaterialFields.bulkCreate(fieldRecords, {
        transaction: t,
      });
    }

    /* ---------------------------------------
       4️⃣ Insert NEW test_req
    ---------------------------------------- */
    if (test_req !== null) {
      await ClubTests.create(
        {
          club_id: sample_id,
          test_requirement: test_req,
        },
        { transaction: t },
      );
    }

    await t.commit();

    return res.status(200).json({
      message: "Sample Registered (Updated)",
      data: {
        sample_id,
        test_req,
        fields: fieldRecords,
      },
    });
  } catch (err) {
    console.error("❌ onRegisteringSample error:", err);
    await t.rollback();
    return res.status(500).json({
      error: "Failed to register sample. Please try again.",
    });
  }
};

// const onRegisteringSample2ndApi = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const { data } = req.body;
//     const { sample_id, stringifiedData } = data;

//     const sampleDetails = {
//       registered: true,
//       test_req: stringifiedData,
//     };

//     await SampleMaterials.update(
//       sampleDetails,
//       { where: { sample_id } },
//       { transaction: t }
//     );

//     await classifySampleParamsAndUpdateDB(sample_id, t);
//     await t.commit();
//     return res
//       .status(200)
//       .json({ message: "Sample Registered", data: sampleDetails });
//   } catch (err) {
//     console.log(err);
//     await t.rollback();
//     return res
//       .status(500)
//       .json({ error: "Failed to Register sample, please try again" });
//   }
// };
// const onRegisteringSample2ndApi = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     console.log("📥 API Hit: onRegisteringSample2ndApi");
//     console.log("📝 req.body:", req.body);

//     const { data } = req.body;
//     if (!data) {
//       console.error("❌ Missing 'data' in req.body");
//       return res.status(400).json({ error: "Missing 'data' in request" });
//     }

//     const { sample_id, stringifiedData } = data;
//     console.log("🔍 sample_id:", sample_id);
//     console.log("🔍 stringifiedData:", stringifiedData);

//     const sampleDetails = {
//       registered: true,
//       test_req: stringifiedData,
//     };
//     console.log("📦 Updating sampleDetails:", sampleDetails);

//     const updateResult = await SampleMaterials.update(
//       sampleDetails,
//       { where: { sample_id } }, // <-- merged transaction into here
//       { transaction: t }
//     );
//     console.log("✅ Update Result:", updateResult);

//     console.log("⚙ Running classifySampleParamsAndUpdateDB...");
//     await classifySampleParamsAndUpdateDB(sample_id, t);

//     await t.commit();
//     console.log("🎯 Transaction committed successfully");

//     return res.status(200).json({
//       message: "Sample Registered",
//       data: sampleDetails
//     });
//   } catch (err) {
//     console.error("💥 Error in onRegisteringSample2ndApi:", err);
//     await t.rollback();
//     return res.status(500).json({
//       error: "Failed to Register sample, please try again"
//     });
//   }
// };
const onRegisteringSample2ndApi = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { data } = req.body;

    const { sample_id, stringifiedData } = data;

    const sampleDetails = {
      registered: true,
      test_req: stringifiedData,
    };

    await ClubTests.create(
      {
        club_id: sample_id,
        test_requirement: stringifiedData,
      },
      { transaction: t },
    );

    // await SampleMaterials.update(
    //   sampleDetails,
    //   { where: { sample_id } },
    //   { transaction: t }
    // );

    await t.commit();

    return res
      .status(200)
      .json({ message: "Sample Registered", data: sampleDetails });
  } catch (err) {
    console.error("❌ Error during registration:", err);
    await t.rollback();
    return res
      .status(500)
      .json({ error: "Failed to Register sample, please try again" });
  }
};

const getAllProductsAndParams = async () => {
  try {
    const dbResponse = await Product.findAll({
      include: {
        model: Params,
        as: "params",
      },
    });
    return dbResponse;
  } catch (error) {
    console.error("Error fetching getAllProductsAndParams: ", error);
    throw error;
  }
};

const getProductsTheirParams = async (req, res) => {
  try {
    const productsTheirParams = await getAllProductsAndParams();
    return res.status(200).json({ data: productsTheirParams });
  } catch (error) {
    console.log("Error in getProductsTheirParams", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

// const getOnlyOrderById = async (order_id) => {
//   try {
//     return await Orders.findByPk(order_id);
//   } catch (error) {
//     throw error;
//   }
// };

// const getOnlyOrderById = async (order_id) => {
//   try {
//     return await Orders.findOne({
//       where: { order_id },
//       attributes: {
//         include: [
//           [
//             Sequelize.literal(`(
//               SELECT t.file
//               FROM taxed_orders t
//               WHERE t.tax_number = Orders.tax_number
//               ORDER BY t.date DESC
//               LIMIT 1
//             )`),
//             "tax_file",
//           ],
//         ],
//       },
//     });
//   } catch (error) {
//     throw error;
//   }
// };

const getOnlyOrderById = async (order_id) => {
  try {
    return await Orders.findOne({
      where: { order_id },

      attributes: {
        include: [
          [
            Sequelize.literal(`(
              SELECT t.file
              FROM taxed_orders t
              WHERE t.tax_number = Orders.tax_number
              ORDER BY t.date DESC
              LIMIT 1
            )`),
            "tax_file",
          ],
        ],
      },

      include: [
        {
          model: Feedback,
          as: "feedback",
          required: false,
          attributes: ["fId", "feedback", "created_at"],
        },
      ],
    });
  } catch (error) {
    throw error;
  }
};

const getOrderBasicInfoByOrderId = async (req, res) => {
  const { order_id } = req.query;

  try {
    const orderInfo = await getOnlyOrderById(order_id);
    return res.status(200).json({ orderInfo });
  } catch (error) {
    console.log("Error fetching order basic information ", error);
    return res.status(500).json({ error: "Error Fetching order information" });
  }
};

const getCustomerInfoOfIthOrdercontroller = async (order_id) => {
  try {
    return await Orders.findByPk(order_id, {
      include: {
        model: Customers,
        as: "customer",
      },
    });
  } catch (error) {
    console.error(
      "Error in getCustomerInfoOfIthOrdercontroller:",
      error.message,
    );
    throw new Error("Failed to fetch customer information");
  }
};

const getCustomerInfoOfIthOrder = async (req, res) => {
  const { order_id } = req.query;

  if (!order_id) {
    return res.status(400).json({ error: "order_id is required" });
  }

  try {
    const customerInfo = await getCustomerInfoOfIthOrdercontroller(order_id);
    if (!customerInfo) {
      return res.status(404).json({ error: "Order not found" });
    }
    return res.status(200).json({ customerInfo: customerInfo.customer });
  } catch (error) {
    console.error("Error fetching customer information of ith order:", error);
    return res
      .status(500)
      .json({ error: "Error Fetching customer information" });
  }
};

const { Op } = require("sequelize");
const { createAlog, getIp } = require("./LogsController");
const { CHEMICAL, PHYSICAL, SRC_PATH } = require("../defs/CONST");
const { nablMechanical } = require("../reports/nablMechanical");
const { getNonNablChemicalReport } = require("../reports/nonNablChemical");
const { nonNablMechanical } = require("../reports/nonNablPhysical");
const { getsignFile } = require("../defs/customFunctions");
const { findEmpByID } = require("./hrControllers");
const { sign } = require("crypto");
const { where } = require("../models/Logs");

const getParamsDetails = async (params_json) => {
  try {
    // is a array of json params_json
    const paramIds = JSON.parse(params_json);

    //  Fetch param details using Sequelize with Op.in
    const paramsDetails = await Params.findAll({
      where: {
        param_id: {
          [Op.in]: paramIds,
        },
      },
      attributes: ["param_id", "params"], // Adjust attributes as needed
    });

    const testNames = paramsDetails
      .map((param) => {
        // Parse the params JSON for each param record
        const parsedParams = JSON.parse(param.params);

        // Extract and return the testName for each test object
        return parsedParams.map((test) => test.testName);
      })
      .flat(); // Flatten the nested arrays

    return testNames;
  } catch (error) {
    console.error("Error fetching param details:", error.message);
    throw new Error("Failed to fetch param details");
  }
};

const getJobsByOrderId = async (order_id) => {
  try {
    const jobs = await Orders.findByPk(order_id, {
      attributes: ["order_id"],
      include: {
        model: SampleMaterials,
        as: "samples",
        attributes: [
          "sample_code",
          "sample_id",
          "registered",
          // "test_method",
          "product_id",
        ],
        include: {
          model: Jobs,
          as: "jobs",
          attributes: [
            "job_pk",
            "emp_id",
            "report",
            "doa",
            "dos",
            "status",
            "discipline",
            "nabl",
            "params_json",
          ],
        },
      },
    });

    // Convert jobs object to plain object for manipulation
    const jobsPlain = jobs.get({ plain: true });

    // Loop through each sample and job to fetch params details
    for (const sample of jobsPlain.samples) {
      for (const job of sample.jobs) {
        if (job.params_json) {
          job.paramDetails = await getParamsDetails(job.params_json);
        }
      }
    }

    return jobsPlain;
  } catch (error) {
    console.error("Error in all jobs of ith  order:", error.message);
    throw new Error("Error in all jobs of ith  order");
  }
};

const getAllJobsOfIthOrder = async (req, res) => {
  const { order_id } = req.query;

  if (!order_id) {
    return res.status(400).json({ error: "order_id is required" });
  }

  try {
    const jobs = await getJobsByOrderId(order_id);
    return res.status(200).json({ samples: jobs.samples });
  } catch (error) {
    console.error("Error in all jobs of ith  order:", error);
    return res.status(500).json({ error: "Error in all jobs of ith  order" });
  }
};

const mergeAndCreateManulTaxInvoice = async (req, res) => {
  const t = await sequelize.transaction();
  const { ids, custId, tax_invoice_number, tax_invoice_date } = req.body;

  // Convert YYYY-MM-DD → DD/MM/YYYY
  const formattedDate = tax_invoice_date
    ? tax_invoice_date.split("-").reverse().join("/")
    : null;

  console.log(req.body, "body786");

  const results = [];
  try {
    // Finding the previous tax number to calculate a new tax invoice number
    // let previousTaxInvoice = await TaxedOrders.max("tax_number", {
    //   transaction: t,
    // });
    let previousTaxInvoice = tax_invoice_number;
    //customer details
    const customerDetails = await getCustomerInfoByID(custId, t);
    for (const eachId of ids) {
      const orderInfo = await db.Orders.findOne({
        where: { order_id: eachId },
        attributes: [
          "sample_data",
          "dor",
          "pn",
          "order_number",
          "ref",
          "project_name",
          "subject",
          "transportation_fee",
          "amount",
          "client_id",
          "gst",
          "order_code",
          "division",
        ],
        transaction: t,
      });

      if (orderInfo) {
        // 🔹 Replace your old Ledger.update() with this block
        const existingLedger = await Ledger.findOne({
          where: { order_number: orderInfo.order_code },
          transaction: t,
        });

        if (existingLedger) {
          // Parse entries safely
          const entries = existingLedger.entries || [];

          // Update ti_amount for all entries
          const updatedEntries = entries.map((entry) => ({
            ...entry,
            ti_amount: orderInfo.amount,
          }));

          await Ledger.update(
            {
              tax_number: previousTaxInvoice,
              tax_converted_date: formattedDate,
              entries: updatedEntries,
            },
            {
              where: { order_number: orderInfo.order_code },
              transaction: t,
            },
          );
        }
      }

      if (orderInfo) {
        results.push(orderInfo);
      }
    }
    // console.log(results,'rs78')
    console.log(results, "res878");

    const [firstOrder] = results;
    const { client_id } = firstOrder.dataValues;

    const dis = customerDetails.discount;
    const total_transportation_charged = results.reduce(
      (acc, order) => acc + (order.transportation_fee || 0),
      0,
    );

    let clientInformation = {};

    if (client_id) {
      const clientDetails = await Client.findOne({
        where: { client_id: client_id },
      });
      const { reporting_name, reporting_address } = clientDetails.dataValues;

      clientInformation.reporting_name = reporting_name;
      clientInformation.reporting_address = reporting_address;
    }
    const uniquePrefix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const fileName = `${uniquePrefix}-Tax-invoice-${previousTaxInvoice}.pdf`;
    await createMergedTaxInvoice(
      previousTaxInvoice,
      formattedDate,
      customerDetails,
      results,
      total_transportation_charged,
      0,
      clientInformation,
      uniquePrefix,
    );
    console.log(uniquePrefix, "uniquePrefix8976");
    // //my code is working as exected from here
    // const uniq= uuidv4();
    await TaxedOrders.create(
      {
        tax_number: tax_invoice_number,
        date: new Date(),
        converted_by: req.emp_id,
        proforma_numbers: JSON.stringify(ids),
        file: `${uniquePrefix}-Tax-invoice-${previousTaxInvoice}.pdf`,
      },
      { transaction: t },
    );

    for (let id of ids) {
      await db.Orders.update(
        {
          tax_number: tax_invoice_number,
          tax_file: fileName,
          converted_to_tax: true,
        },
        { where: { order_id: id }, transaction: t },
      );
    }

    const log = {
      lc_id: 9,
      description: `New Tax invoice is created with number - ${
        previousTaxInvoice
      }`,
      logged_by: req.emp_id,
      ip: getIp(req),
    };

    await createAlog(log, t);
    await t.commit(); // Commit transaction
    return res.status(200).json({
      message: "Converted to Tax",
      ids,
      taxNumber: previousTaxInvoice,
    });
  } catch (error) {
    await t.rollback(); // Rollback transaction on error
    console.error("Error merging tax invoice:", error);
    return res
      .status(500)
      .json({ message: "Error creating tax invoice", error: error.message });
  }
};

const FEEDBACK_BASE_URL =
  "https://lims-test.kdmengineers.com/customer-feedback";

const onRequestingFeedback = async (req, res) => {
  try {
    const { custId, orderId } = req.body;

    if (!custId || !orderId) {
      return res.status(400).json({
        error: "customer_id and order_id are required",
      });
    }

    // 1️⃣ Get customer details (for mobile number)
    const customer = await Customers.findOne({
      where: { customer_id: custId },
      attributes: ["customer_id", "mobile", "billing_name"],
    });

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    // 2️⃣ Create feedback record
    const feedback = await Feedback.create({
      customer_id: custId,
      order_id: orderId,
    });

    // 3️⃣ Generate feedback link
    const feedbackLink = `${FEEDBACK_BASE_URL}/${feedback.fId}`;

    // 4️⃣ WhatsApp message content
    const message = `Dear ${customer.billing_name || "Customer"},

We value your feedback 🙏  
Please take a moment to share your experience with us by clicking the link below:

👉 ${feedbackLink}

Thank you,
KDM Engineers`;

    // 5️⃣ Send WhatsApp message
    await sendWhatsAppMessage(customer.mobile, message);

    return res.status(201).json({
      message: "Feedback request sent successfully",
      fId: feedback.fId,
      feedbackLink,
    });
  } catch (error) {
    console.error("❌ Feedback request failed:", error);
    return res.status(500).json({
      error: "Failed to request customer feedback",
    });
  }
};

const getFeedbackRequestStatus = async (req, res) => {
  try {
    const { customer_id, order_id } = req.query;

    if (!customer_id || !order_id) {
      return res.status(400).json({
        error: "customer_id and order_id are required",
      });
    }

    const feedback = await Feedback.findOne({
      where: {
        customer_id,
        order_id,
      },
      attributes: ["fId"],
    });

    return res.status(200).json({
      requested: !!feedback, // true if feedback already exists
    });
  } catch (error) {
    console.error("❌ Feedback status check failed:", error);
    return res.status(500).json({
      error: "Failed to fetch feedback status",
    });
  }
};

const onSubmittingFeedback = async (req, res) => {
  try {
    const {
      date,
      customerDetails,
      scores,
      feedbackId,
      representativeName,
      designation,
    } = req.body;

    if (!feedbackId) {
      return res.status(400).json({
        error: "feedbackId is required",
      });
    }

    // 1️⃣ Check if feedback record exists
    const feedbackRecord = await Feedback.findOne({
      where: { fId: feedbackId },
    });

    if (!feedbackRecord) {
      return res.status(404).json({
        error: "Invalid or expired feedback link",
      });
    }

    // 2️⃣ Prevent duplicate submissions (IMPORTANT)
    if (feedbackRecord.feedback) {
      return res.status(409).json({
        error: "Feedback already submitted",
      });
    }

    // 3️⃣ Prepare feedback JSON
    const feedbackPayload = {
      date,
      customerDetails,
      scores,
      representativeName,
      designation,
      submittedAt: new Date(),
    };

    // 4️⃣ Update feedback column
    await Feedback.update(
      { feedback: feedbackPayload },
      { where: { fId: feedbackId } },
    );

    return res.status(200).json({
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    console.error("❌ Feedback Submission failed:", error);
    return res.status(500).json({
      error: "Failed to submit feedback",
    });
  }
};
// controllers/feedbackController.js

const getAllFeedbackDashboard = async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      where: {
        feedback: { [Op.ne]: null }, // only submitted feedbacks
      },
      include: [
        {
          model: Customers,
          as: "customer",
          attributes: ["customer_id", "billing_name", "mobile", "email"],
        },
        {
          model: Orders,
          as: "order",
          attributes: ["order_id", "order_number", "project_name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // 🔁 Format response for frontend
    const formatted = feedbacks.map((f) => {
      let fb = f.feedback || {};
      if (typeof fb === "string") {
        fb = JSON.parse(fb);
      }

      const scores = fb.scores || {};

      const SCORE_MAP = { A: 10, B: 8, C: 6, D: 4, E: 2 };
      let total = 0;
      let count = 0;

      Object.values(scores).forEach((g) => {
        total += SCORE_MAP[g] || 0;
        count++;
      });

      const avg = count ? (total / count).toFixed(2) : 0;

      return {
        fId: f.fId,
        date: fb.date,
        submittedAt: fb.submittedAt,
        remarks: fb.customerDetails,

        customer: f.customer,
        order: f.order,

        representativeName: fb.representativeName || null,
        designation: fb.designation || null,

        scores,
        totalScore: total,
        avgScore: Number(avg),
      };
    });

    return res.json({
      totalResponses: formatted.length,
      data: formatted,
    });
  } catch (err) {
    console.error("Feedback dashboard error:", err);
    res.status(500).json({ error: "Failed to load feedback dashboard" });
  }
};

const getFeedbackStatus = async (req, res) => {
  try {
    const { fId } = req.params;

    const record = await Feedback.findOne({
      where: { fId },
      attributes: ["feedback"],
    });

    if (!record) {
      return res.status(404).json({ error: "Invalid feedback link" });
    }

    return res.status(200).json({
      submitted: !!record.feedback,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch feedback status" });
  }
};

// const proformaToTaxConversion = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const { order_number, orderId } = req.body;
//     const previousTaxInvoice = await TaxedOrders.max("tax_number", {
//       transaction: t,
//     });

//     const bill_data = await db.Orders.findOne(
//       {
//         where: { order_id: orderId },
//         attributes: ["bill_data"],
//       },
//       {
//         transaction: t,
//       }
//     );

//     const billdata = bill_data.toJSON();

//     const pdfDetails = {
//       pdf_name: `Tax-invoice-${previousTaxInvoice + 1}.pdf`,
//       previousTaxInvoice,
//     };

//     const taxInvoiceDocumentLocation = await generateTaxInvoice(
//       billdata.bill_data,
//       pdfDetails,
//       previousTaxInvoice
//     );

//     await TaxedOrders.create(
//       {
//         tax_number: previousTaxInvoice + 1,
//         file: taxInvoiceDocumentLocation,
//         date: new Date(),
//         converted_by: req.emp_id,
//         proforma_numbers: JSON.stringify([orderId]),
//       },
//       { transaction: t }
//     );

//     await Orders.update(
//       {
//         tax_number: previousTaxInvoice + 1,
//         converted_to_tax: true,
//       },
//       {
//         where: { order_number },
//         transaction: t,
//       }
//     );
//     console.log(previousTaxInvoice + 1);
//     await t.commit();
//     res.status(200).json({ message: "converted to tax " });
//   } catch (error) {
//     console.error("Error while converting proforma to tax :", error);
//     await t.rollback();
//     res.status(500).json({ message: "Failed to fetch Quotations" });
//   }
// };

// const mergeAndCreateTaxInvoice = async (req, res) => {
//   const t = await sequelize.transaction();
//   const { ids, custId } = req.body;
//   const results = [];
//   try {
//     // Finding the previous tax number to calculate a new tax invoice number
//     const previousTaxInvoice = await TaxedOrders.max("tax_number", {
//       transaction: t,
//     });
//     // const previousTaxInvoice = 253;
//     //customer details
//     const customerDetails = await getCustomerInfoByID(custId, t);
//     for (const eachId of ids) {
//       const orderInfo = await db.Orders.findOne({
//         where: { order_id: eachId },
//         attributes: [
//           "sample_data",
//           "dor",
//           "pn",
//           "order_number",
//           "ref",
//           "project_name",
//           "subject",
//           "transportation_fee",
//           "amount",
//           "client_id",
//           "gst",
//           "order_code",
//           "division",
//         ],
//         transaction: t,
//       });

//       if (orderInfo) {
//         // 🔹 Replace your old Ledger.update() with this block
//         const existingLedger = await Ledger.findOne({
//           where: { order_number: orderInfo.order_code },
//           transaction: t,
//         });

//         if (existingLedger) {
//           // Parse entries safely
//           const entries = existingLedger.entries || [];

//           // Update ti_amount for all entries
//           const updatedEntries = entries.map((entry) => ({
//             ...entry,
//             ti_amount: orderInfo.amount,
//           }));

//           await Ledger.update(
//             {
//               tax_number: previousTaxInvoice + 1,
//               tax_converted_date: new Date().toISOString(),
//               entries: updatedEntries,
//             },
//             {
//               where: { order_number: orderInfo.order_code },
//               transaction: t,
//             }
//           );
//         }
//       }

//       if (orderInfo) {
//         results.push(orderInfo);
//       }

//       //     if (orderInfo) {
//       //        await Ledger.update({
//       //     tax_number: previousTaxInvoice + 1,
//       //     tax_converted_date: new Date().toISOString(),

//       //   },
//       // { where: { order_number: orderInfo.order_code }, transaction: t }
//       // );
//       //       results.push(orderInfo);
//       //     }
//     }
//     // console.log(results,'rs78')
//     const [firstOrder] = results;
//     const { client_id } = firstOrder.dataValues;

//     const dis = customerDetails.discount;
//     const total_transportation_charged = results.reduce(
//       (acc, order) => acc + (order.transportation_fee || 0),
//       0
//     );

//     let clientInformation = {};

//     if (client_id) {
//       const clientDetails = await Client.findOne({
//         where: { client_id: client_id },
//       });
//       const { reporting_name, reporting_address } = clientDetails.dataValues;

//       clientInformation.reporting_name = reporting_name;
//       clientInformation.reporting_address = reporting_address;
//     }

//     await createMergedTaxInvoice(
//       previousTaxInvoice + 1,
//       customerDetails,
//       results,
//       total_transportation_charged,
//       0,
//       clientInformation
//     );

//     //my code is working as exected from here

//     await TaxedOrders.create(
//       {
//         tax_number: previousTaxInvoice + 1,
//         date: new Date(),
//         converted_by: req.emp_id,
//         proforma_numbers: JSON.stringify(ids),
//         file: `Tax-invoice-${previousTaxInvoice + 1}.pdf`,
//       },
//       { transaction: t }
//     );

//     for (let id of ids) {
//       await db.Orders.update(
//         { tax_number: previousTaxInvoice + 1, converted_to_tax: true },
//         { where: { order_id: id }, transaction: t }
//       );
//     }

//     const log = {
//       lc_id: 9,
//       description: `New Tax invoice is created with number - ${
//         previousTaxInvoice + 1
//       }`,
//       logged_by: req.emp_id,
//       ip: getIp(req),
//     };

//     await createAlog(log, t);
//     await t.commit(); // Commit transaction
//     return res.status(200).json({
//       message: "Converted to Tax",
//       ids,
//       taxNumber: previousTaxInvoice + 1,
//     });
//   } catch (error) {
//     await t.rollback(); // Rollback transaction on error
//     console.error("Error merging tax invoice:", error);
//     return res
//       .status(500)
//       .json({ message: "Error creating tax invoice", error: error.message });
//   }
// };

const cancelOrder = async (req, res) => {
  const { id } = req.body;
  console.log("received98", id);

  if (!id) {
    return res.status(400).json({ error: "Order ID missing" });
  }

  const t = await sequelize.transaction();

  try {
    // ✅ 1️⃣ Find the order record
    const order = await Orders.findOne({
      where: { order_id: id },
      transaction: t,
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ error: "Order not found" });
    }

    // ✅ 2️⃣ Get order_code from the record
    const { order_code } = order;

    // ✅ 3️⃣ Delete related record in Ledger table where order_number = order_code
    if (order_code) {
      await Ledger.destroy({
        where: { order_number: order_code },
        transaction: t,
      });
    }

    // ✅ 4️⃣ Update order: amount = 0, sample_data = null
    await Orders.update(
      { amount: 0, cancel: 2 },
      {
        where: { order_id: id },
        transaction: t,
      },
    );

    // ✅ 5️⃣ Delete sample materials linked to the order

    await t.commit();

    return res.status(200).json({
      message: "Order cancelled successfully",
      order_id: id,
    });
  } catch (error) {
    await t.rollback();
    console.error("Cancel order error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// const cancelOrder = async (req, res) => {
//   const { id } = req.body;
//   console.log("received98", id);

//   if (!id) {
//     return res.status(400).json({ error: "Order ID missing" });
//   }

//   const t = await sequelize.transaction();

//   try {
//     // ✅ 1️⃣ Update order amount to 0
//     const [updatedRows] = await Orders.update(
//       { amount: 0,sample_data:null },
//       {
//         where: { order_id: id },
//         transaction: t,
//       }
//     );

//     if (!updatedRows) {
//       await t.rollback();
//       return res.status(404).json({ error: "Order not found" });
//     }

//     // ✅ 2️⃣ Delete sample materials linked to the order
//     await SampleMaterials.destroy({
//       where: { order_id: id },
//       transaction: t,
//     });

//     await t.commit();

//     return res.status(200).json({
//       message: "Order cancelled successfully",
//       order_id: id,
//     });

//   } catch (error) {
//     await t.rollback();
//     console.error("Cancel order error:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };

const getOrderSticker = async (req, res) => {
  const { data: orderId } = req.query;

  try {
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await Orders.findOne({
      where: { order_id: orderId },
      attributes: ["pn", "order_number", "order_id"],

      include: [
        {
          model: SampleMaterials,
          as: "samples",
          include: [
            {
              model: SampleParams,
              as: "params",
            },

            {
              model: Product,
              as: "product",
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const doc = await getSamplesStickerDocument(order.toJSON());

    return res.status(200).json({ doc });
  } catch (error) {
    console.error("Error generating order sticker:", error);
    return res.status(500).json({
      message: "Error generating order sticker",
      error: error.message,
    });
  }
};

const createDuplicateJobById = async (req, res) => {
  try {
    const { job_pk } = req.body;

    if (!job_pk) {
      return res.status(400).json({ message: "job_pk is required" });
    }

    const job = await Jobs.findOne({ where: { job_pk } });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const [result] = await sequelize.query(
      `
      INSERT INTO jobs (
        sample_id,
        emp_id,
        report,
        reportLocation,
        doa,
        dos,
        status,
        job_id,
        createdAt,
        updatedAt,
        discipline,
        nabl,
        params_json,
        jdata,
        job_dispatched_at,
        report_dispatched_at,
        dispatch_job,
        report_approval,
        start_date,
        end_date,
        ulrData,
        reportIssueDate,
        analyst_sign,
        manager_sign,
        bd_sign,
        remarks
      )
      SELECT
        sample_id,
        emp_id,
        report,
        NULL,                -- reportLocation → NULL
        doa,
        dos,
        status,
        job_id,
        NOW(),
        NOW(),
        discipline,
        nabl,
        params_json,
        jdata,
        job_dispatched_at,
        report_dispatched_at,
        dispatch_job,
        report_approval,
        start_date,
        end_date,
        NULL,                -- ulrData → NULL
        NULL,                -- reportIssueDate → NULL
        analyst_sign,
        manager_sign,
        bd_sign,
        remarks
      FROM jobs
      WHERE job_pk = :job_pk
      LIMIT 1
      `,
      { replacements: { job_pk } },
    );

    return res.status(200).json({
      message: "Duplicate job created successfully",
      result,
    });
  } catch (error) {
    console.error("Error duplicating job:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

const deleteJobById = async (req, res) => {
  try {
    const job_pk = req.query.data;

    if (!job_pk) {
      return res.status(400).json({ message: "job_pk is required" });
    }

    // 1. Fetch job first to get sample_id
    const job = await Jobs.findOne({ where: { job_pk } });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const sample_id = job.sample_id;

    // 2. Delete the job
    const deletedJob = await Jobs.destroy({ where: { job_pk } });

    // If job deleted successfully
    if (deletedJob) {
      // 3. CHECK if the sample exists
      const sample = await SampleMaterials.findOne({
        where: { sample_id },
      });

      if (sample) {
        // OPTIONAL: Check if there are still other jobs using this sample_id
        const jobCount = await Jobs.count({
          where: { sample_id },
        });

        if (jobCount === 0) {
          await SampleMaterials.destroy({ where: { sample_id } });
          console.log(`SampleMaterials deleted for sample_id: ${sample_id}`);
        } else {
          console.log(
            `SampleMaterials NOT deleted — still used by ${jobCount} jobs`,
          );
        }
      }

      return res.status(200).json({
        message: "Job deleted successfully",
        sampleDeleted: sample ? true : false,
      });
    }

    return res.status(500).json({ message: "Failed to delete job." });
  } catch (error) {
    console.error("Error deleting job:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const deleteParamById = async (req, res) => {
  try {
    const deleteCount = await Params.destroy({
      where: { param_id: req.query.data },
    });
    if (deleteCount) {
      return res
        .status(200)
        .json({ message: "Parameter deleted successfully." });
    } else {
      return res.status(500).json({ message: "Error Deleting parameter." });
    }
  } catch (error) {
    console.error("Error deleting parameter:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getReportFinalscreen = async (req, res) => {
  try {
    const { data } = req.query;

    const jobObj = await Jobs.findByPk(data);
    return res
      .status(200)
      .json({ message: "Job fetched successfully,", data: jobObj });
  } catch (err) {
    console.error("Error fetching report final report screen : ", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getFinalReport = async (req, res) => {
  const { jId, accessKey, values, code } = req.body;
  const { urlNumber, reportIssueDate } = values;

  try {
    const job = await Jobs.findOne({
      where: { job_pk: jId },
      include: [
        {
          model: SampleMaterials,
          as: "sampleDetails",
          include: [
            {
              model: Product,
              as: "product",
            },
            {
              model: Orders,
              as: "order",
              include: [
                {
                  model: Customers,
                  as: "customer",
                },
              ],
            },
          ],
        },
      ],
    });
    // console.log(job.jdata,'jdata569')
    if (!job) return res.status(404).json({ error: "Job not found" });
    await job.update({ ulrData: urlNumber, reportIssueDate: reportIssueDate });
    const sampleId = job.sampleDetails?.id || job.sample_id;
    const club_id = job?.sampleDetails?.dataValues?.club_id;
    let formattedRelayData = [];
    if (sampleId) {
      const sampleRelayData = await SampleMaterialFields.findAll({
        where: { sample_id: sampleId },
      });
      formattedRelayData = Array.isArray(sampleRelayData)
        ? sampleRelayData.map((item) => ({
            label: item.field_name,
            answer: item.field_value,
          }))
        : [];
    }
    const startD = job.start_date;
    const endD = job.end_date;
    const sampleInfo = job.sampleDetails;
    const productInfo = await Product.findByPk(sampleInfo.product_id, {
      attributes: ["name", "id"],
    });
    let custDetails = sampleInfo.order.customer.dataValues;
    const {
      sampleDetails: { order: orderDetails },
    } = job.dataValues;
    const clientFilter = orderDetails.client_id;

    if (clientFilter) {
      const clientDetails = await Client.findOne({
        where: { client_id: clientFilter },
      });
      const { reporting_name, reporting_address } = clientDetails.dataValues;
      custDetails.reporting_name = reporting_name;
      custDetails.reporting_address = reporting_address;
    }
    // console.log(job.jdata,'jd89')
    const reportFunParams = {
      urlNumber,
      reportIssueDate,
      jobInfo: job,
      orderInfo: sampleInfo.order,
      customerInfo: custDetails,
      sampleInfo,
      productInfo,
      jdata: job.jdata,
    };

    const {
      dataValues: {
        sampleDetails: {
          dataValues: { test_req, product_id },
        },
      },
    } = job;

    let delteriousCondition = "";
    if (product_id === 43) {
      delteriousCondition = test_req;
      productInfo.name = `${productInfo.name} (${test_req})`;
    } else if (product_id === 42) {
      // formattedRelayData.push({
      //   label: "Aggregate Size",
      //   answer: `${test_req} mm`,
      // });
      productInfo.name = `${productInfo.name} (${test_req} mm)`;
    } else if (product_id === 57) {
      let parsedSource = { source: "" };
      parsedSource = JSON.parse(test_req);
      formattedRelayData.push({
        label: "Source",
        answer: `${parsedSource?.source}`,
      });
    } else if (product_id === 48) {
      if (test_req && String(test_req).trim() !== "") {
        formattedRelayData.push({
          label: "Source ",
          answer: test_req,
        });
      }
    } else if (product_id === 26) {
      if (test_req && String(test_req).trim() !== "") {
        formattedRelayData.push({
          label: "Sample Location ",
          answer: test_req,
        });
      }
    } else if (product_id === 139 || product_id === 52) {
      formattedRelayData.push({
        label: "Grade",
        answer: test_req ? test_req : "",
      });
    }

    const signs = {
      chemical: false,
      showSigns: false,
      mechanical: false,
    };

    if (job.discipline === CHEMICAL && job.nabl) {
      signs.chemical = true;
      signs.mechanical = false;
      await getNonNablChemicalReport(
        reportFunParams,
        jId,
        startD,
        endD,
        res,
        formattedRelayData,
        accessKey,
        job,
        signs,
        false,
        true,
      );
    } else if (job.discipline === CHEMICAL && !job.nabl) {
      signs.chemical = true;
      signs.mechanical = false;
      await getNonNablChemicalReport(
        reportFunParams,
        jId,
        startD,
        endD,
        res,
        formattedRelayData,
        accessKey,
        job,
        signs,
        false,
        true,
      );
    } else if (job.discipline === PHYSICAL && job.nabl) {
      signs.mechanical = true;
      signs.chemical = false;
      return nablMechanical(
        reportFunParams,
        jId,
        startD,
        endD,
        res,
        formattedRelayData,
        accessKey,
        job,
        signs,
        false,
        true,
      );
    } else if (job.discipline === PHYSICAL && !job.nabl) {
      signs.mechanical = true;
      signs.chemical = false;
      return nonNablMechanical(
        reportFunParams,
        jId,
        startD,
        endD,
        res,
        formattedRelayData,
        accessKey,
        delteriousCondition,
        job,
        signs,
        false,
        true,
      );
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getUltraFinalReport = async (jobPk) => {
  const accessKey = "KDM_ADMIN_TOKEN";

  try {
    const job = await Jobs.findOne({
      where: { job_pk: jobPk },
      include: [
        {
          model: SampleMaterials,
          as: "sampleDetails",
          include: [
            {
              model: Product,
              as: "product",
            },
            {
              model: Orders,
              as: "order",
              include: [
                {
                  model: Customers,
                  as: "customer",
                },
              ],
            },
          ],
        },
      ],
    });
    // console.log(job.jdata,'jdata569')
    if (!job) return res.status(404).json({ error: "Job not found" });
    const sampleId = job.sampleDetails?.id || job.sample_id;
    const club_id = job?.sampleDetails?.dataValues?.club_id;
    let formattedRelayData = [];
    if (sampleId) {
      const sampleRelayData = await SampleMaterialFields.findAll({
        where: { sample_id: sampleId },
      });
      formattedRelayData = Array.isArray(sampleRelayData)
        ? sampleRelayData.map((item) => ({
            label: item.field_name,
            answer: item.field_value,
          }))
        : [];
    }
    const startD = job.start_date;
    const endD = job.end_date;
    const sampleInfo = job.sampleDetails;
    const productInfo = await Product.findByPk(sampleInfo.product_id, {
      attributes: ["name", "id"],
    });
    let custDetails = sampleInfo.order.customer.dataValues;
    const {
      sampleDetails: { order: orderDetails },
    } = job.dataValues;
    const clientFilter = orderDetails.client_id;

    if (clientFilter) {
      const clientDetails = await Client.findOne({
        where: { client_id: clientFilter },
      });
      const { reporting_name, reporting_address } = clientDetails.dataValues;
      custDetails.reporting_name = reporting_name;
      custDetails.reporting_address = reporting_address;
    }
    // console.log(job.jdata,'jd89')
    const reportFunParams = {
      urlNumber: job.ulrData,
      reportIssueDate: job.reportIssueDate,
      jobInfo: job,
      orderInfo: sampleInfo.order,
      customerInfo: custDetails,
      sampleInfo,
      productInfo,
      jdata: job.jdata,
      reportPlace: job.reportLocation,
    };

    const {
      dataValues: {
        sampleDetails: {
          dataValues: { test_req, product_id },
        },
      },
    } = job;

    let delteriousCondition = "";
    if (product_id === 43) {
      delteriousCondition = test_req;
      productInfo.name = `${productInfo.name} (${test_req})`;
    } else if (product_id === 42) {
      // formattedRelayData.push({
      //   label: "Aggregate Size",
      //   answer: `${test_req} mm`,
      // });
      productInfo.name = `${productInfo.name} (${test_req} mm)`;
    } else if (product_id === 57) {
      let parsedSource = { source: "" };
      parsedSource = JSON.parse(test_req);
      formattedRelayData.push({
        label: "Source",
        answer: `${parsedSource?.source}`,
      });
    } else if (product_id === 48) {
      if (test_req && String(test_req).trim() !== "") {
        formattedRelayData.push({
          label: "Source ",
          answer: test_req,
        });
      }
    } else if (product_id === 26) {
      if (test_req && String(test_req).trim() !== "") {
        formattedRelayData.push({
          label: "Sample Location ",
          answer: test_req,
        });
      }
    } else if (product_id === 139 || product_id === 52) {
      formattedRelayData.push({
        label: "Grade",
        answer: test_req ? test_req : "",
      });
    }

    const signs = {
      chemical: false,
      showSigns: false,
      mechanical: false,
    };

    if (job.discipline === CHEMICAL && job.nabl) {
      signs.chemical = true;
      signs.mechanical = false;
      await getNonNablChemicalReport(
        reportFunParams,
        jobPk,
        startD,
        endD,
        "res",
        formattedRelayData,
        accessKey,
        job,
        signs,
        false,
        false,
        true,
      );
    } else if (job.discipline === CHEMICAL && !job.nabl) {
      signs.chemical = true;
      signs.mechanical = false;
      await getNonNablChemicalReport(
        reportFunParams,
        jobPk,
        startD,
        endD,
        "res",
        formattedRelayData,
        accessKey,
        job,
        signs,
        false,
        false,
        true,
      );
    } else if (job.discipline === PHYSICAL && job.nabl) {
      signs.mechanical = true;
      signs.chemical = false;
      return nablMechanical(
        reportFunParams,
        jobPk,
        startD,
        endD,
        "res",
        formattedRelayData,
        accessKey,
        job,
        signs,
        false,
        false,
        true,
      );
    } else if (job.discipline === PHYSICAL && !job.nabl) {
      signs.mechanical = true;
      signs.chemical = false;
      return nonNablMechanical(
        reportFunParams,
        jobPk,
        startD,
        endD,
        "res",
        formattedRelayData,
        accessKey,
        delteriousCondition,
        job,
        signs,
        false,
        false,
        true,
      );
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createCallbackRequest,
  onRequestingFeedback,
  onSubmittingFeedback,
  getAllFeedbackDashboard,
  getFeedbackStatus,
  getFeedbackRequestStatus,
  subscribeController,
  onAddingNewProduct,

  //products
  getAllProducts,
  getProductById,
  deleteProductById,
  editProductById,
  getProductPartialData,
  getAllProductsNameId,

  //params
  addParams,
  getAllParams,

  //client-requests
  getRequestCallbacks,
  uploadCustomerRequestAudio,

  //ecommerce-orders
  createDuplicateJobById,
  getCustomersList,
  getSubscribers,
  checkDuplicateOrderPn,
  //website users
  getSiteUsers,

  // graphs
  getSubscriberStatisticsMonthly,
  getSubscriberStatisticsLast30Days,
  getCustomerStatisticsMonthly,
  getLast30CustomerCounts,
  getOrderStatisticsMonthly,
  getLast30DaysOrderCounts,
  getProductSampleCounts,
  getDisciplineWise,
  getOnlineUsersMonthly,
  getOnlineUsersDaily,

  //Quotations
  quotationsMonthlyRecors,
  getAllQuotations,
  getQuotationsDaily,

  generateSampleCodes,
  // proformaToTaxConversion,
  getAllSamples,

  getScope,
  // offlineOrderUpdation,
  cancelOrder,
  uploadWorkOrderFileToS3,
  deleteSampleParamsByOrderId,
  getUnregistedSamples,
  onRegisteringSample,

  getProductsTheirParams,
  getOrderBasicInfoByOrderId,
  getCustomerInfoOfIthOrder,
  getAllJobsOfIthOrder,
  // mergeAndCreateTaxInvoice,
  mergeAndCreateManulTaxInvoice,
  onRequestingFeedback,

  deleteS3Obj,
  getOrderSticker,
  getParamsDetails,
  onRegisteringSample2ndApi,
  deleteParamById,
  deleteJobById,
  getReportFinalscreen,
  getFinalReport,
  getUltraFinalReport,
  classifySampleParamsAndUpdateDB,
  classifySampleParamsAndUpdateDBwithoutLosingOld,
  getQuotationByIdService,
};
