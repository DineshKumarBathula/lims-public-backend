const jwt = require("jsonwebtoken");
const axios = require("axios");

const SECRET_KEY = process.env.JWT_SECRET_KEY || "tb-server-secret-key";

const renderDiscipline = (discipline) =>
  discipline === "CHEMICAL" ? "Chemical" : "Physical";

const calculateDiscountedPrice = (price, discountPercentage) => {
  const discountFactor = 1 - discountPercentage / 100;
  return Math.round(price * discountFactor, 2);
};

const amountInWords = (num) => {
  const a = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const b = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];
  const c = ["", "thousand", "lakh", "crore"];

  if (num > 999999999) return "overflow";
  if (num === 0) return "zero rupees only";

  const numStr = ("000000000" + num).slice(-9);

  const crorePart = parseInt(numStr.slice(0, 2), 10);
  const lakhPart = parseInt(numStr.slice(2, 4), 10);
  const thousandPart = parseInt(numStr.slice(4, 6), 10);
  const hundredPart = parseInt(numStr.slice(6, 7), 10);
  const remainingPart = parseInt(numStr.slice(7), 10);

  let str = "";

  if (crorePart > 0) {
    str +=
      (a[crorePart] ||
        b[Math.floor(crorePart / 10)] + " " + a[crorePart % 10]) + " crore ";
  }

  if (lakhPart > 0) {
    str +=
      (a[lakhPart] || b[Math.floor(lakhPart / 10)] + " " + a[lakhPart % 10]) +
      " lakh ";
  }

  if (thousandPart > 0) {
    str +=
      (a[thousandPart] ||
        b[Math.floor(thousandPart / 10)] + " " + a[thousandPart % 10]) +
      " thousand ";
  }

  if (hundredPart > 0) {
    str += a[hundredPart] + " hundred ";
  }

  if (remainingPart > 0) {
    str +=
      (str !== "" ? "and " : "") +
      (a[remainingPart] ||
        b[Math.floor(remainingPart / 10)] + " " + a[remainingPart % 10]);
  }

  return str.trim() + " rupees Only";
};

const calculateDiscountAmount = (totalPrice, discountPercentage) => {
  console.log(totalPrice, discountPercentage, "discountPercentage786");
  const discountAmount = totalPrice * (discountPercentage / 100);
  return Math.round(discountAmount, 2);
};

const isValidToken = (token) => {
  if (!token) {
    console.log("Token is missing");
    return null;
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded;
  } catch (error) {
    console.log("JWT verification failed:", error.message);
    return null;
  }
};

const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token is missing. Please login." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = isValidToken(token);
  const ipAddress =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  req.ip = ipAddress;
  try {
    if (decoded) {
      req.emp_id = decoded.emp_id;
      req.access = decoded.access;
      req.department = decoded.department;
      next();
    } else {
      res.status(401).json({ error: "Unauthorized access" });
    }
  } catch (err) {
    ConfigurationServicePlaceholders.log(err);
  }
};

const calculateDaysDiff = (start_date, end_date) => {
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  if (isNaN(startDate) || isNaN(endDate)) {
    throw new Error("Invalid date provided.");
  }

  // Calculate the difference in time between the two dates
  const timeDiff = endDate.getTime() - startDate.getTime();

  // Convert time difference from milliseconds to days
  const daysDiff = timeDiff / (1000 * 3600 * 24);

  // Ensure that the difference is at least 1 day
  return Math.max(daysDiff, 1);
};

const extractDateFromTimestamp = (timestamp) => {
  const date = timestamp.getDate().toString().padStart(2, "0");
  const month = (timestamp.getMonth() + 1).toString().padStart(2, "0");
  const year = timestamp.getFullYear();
  return `${date}-${month}-${year}`;
};

const convertToDDMMYYYY = (dateInput) => {
  if (!dateInput) return "";

  let dateString;

  if (typeof dateInput === "string" && dateInput.includes("-")) {
    dateString = dateInput;
  } else {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      // Invalid date object
      return "";
    }
    dateString = date.toISOString().split("T")[0];
  }

  const [year, month, day] = dateString.split("-");
  return `${day}.${month}.${year}`;
};

const getDateFromJSDate = (dateObj) => dateObj.toISOString().split("T")[0];

const getTestReportBody = (
  orderInfo,
  sampleInfo,
  productInfo,
  specificColumns,
  start_date,
  end_date,
  parsedJdata
) => {
  const { name, id } = productInfo;
  console.log("name673", specificColumns);
  const { project_name, dor, subject } = orderInfo;
  const { source } = sampleInfo;
  // console.log(specificColumns,'sss')
  const words = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
    "Twenty",
  ];

  if (
    id === 59 ||
    id === 51 ||
    id === 81 ||
    id === 119 ||
    id === 146 ||
    id === 147 ||
    id === 157
  ) {
    // bricks, blocks

    let total;

    // if (dimensionsRow) {
    //   // ✅ Case 1: show only dimensions value
    //   total = dimensionsRow.value;
    // } 
    
  
      total = (specificColumns || []).reduce((sum, row) => {
        return sum + (Number(row.value) || 0);
      }, 0);

      total = total > 20 ? 20 : total;

    specificColumns = [
      {
        label: "No. of samples tested",
        value:
          typeof total === "number"
            ? `${total < 10 ? "0" + total : total} (${words[total]} Only)`
            : total, // 🔹 dimensions case (string or number)
      },
    ];
  } else if (id === 17) {
    //cubes and steel
  }
  // 1. Try reading paramName from JDATA or test_req
  let paramName =
    parsedJdata?.[0]?.paramName ||
    sampleInfo?.test_req?.paramName ||
    productInfo?.paramName ||
    "";

  // 2. Fallback: detect test type from product name
  const pname = (productInfo?.name || "").toLowerCase();

  if (!paramName) {
    if (pname.includes("rebound")) paramName = "REBOUND HAMMER";
    else if (pname.includes("upv") || pname.includes("pulse"))
      paramName = "UPV";
    else if (pname.includes("carbonation")) paramName = "CARBONATION";
  }

  // 3. Normalize parameter
  const normalizedParam = paramName.replace(/[_\s]/g, "").toUpperCase();

  // 4. Tests that should hide sample description + source
  const hideSampleFields = [
    "CARBONATION",
    "UPVTEST",
    "REBOUNDHAMMER",
    "HALFCELL",
    "HALFCELLTEST",
  ].includes(normalizedParam);

  console.log("🔥 FINAL PARAM =", paramName, "→", normalizedParam);

  // Param names that require custom title format
  const specialParams = {
    UPV_TEST: "Ultrasonic Pulse Velocity Test",
    CARBONATION: "Carbonation Test",
    REBOUND_HAMMER: "Rebound Hammer Test",
    HALFCELL_TEST: "Halfcell Potential",
  };

  // Default title
  let reportTitle = "TEST REPORT";

  const sampleName = (productInfo?.name || "").trim().toLowerCase();

  // List of tests that need custom title
  // const specialTests = [
  //   "ultra sonic pulse velocity",
  //   "upv",
  //   "CARBONATION",

  //   "rebound hammer",
  // ];

  // if (specialTests.some((t) => sampleName.includes(t))) {
  //   // Capitalize properly
  //   const formattedName = sampleName.replace(/\b\w/g, (c) => c.toUpperCase());

  //   reportTitle = `Test Report for ${formattedName}`;
  // }
  // if (paramName === "CARBONATION") {
  //   reportTitle = "Test Report for Carbonation Test";
  // }

  if (specialParams[paramName]) {
    reportTitle = `Test Report for ${specialParams[paramName]}`;
  }

  return {
    title: reportTitle,
    details: [
      ...(hideSampleFields
        ? [] // 🚫 hide description + source
        : [
            { label: "Description of the sample", value: `${name}` },
            {
              label: "Source of the sample",
              value: "Sample supplied by the customer.",
            },
          ]),
      ...(specificColumns || []),

      {
        label: "Customer's Reference*",
        value: `${orderInfo.ref}`,
      },

      project_name !== null && {
        label: "Project Name *",
        value: `${project_name}`,
      },
      subject !== null && {
        label: "Subject *",
        value: `${subject}`,
      },

      source !== null && {
        label: "Source of material*",
        value: `${source}`,
      },

      {
        label: "Material received on",
        value: convertToDDMMYYYY(dor),
      },
      start_date &&
        end_date && {
          label: "Period of Test",
          value: `${convertToDDMMYYYY(start_date)} to ${convertToDDMMYYYY(
            end_date
          )}`,
        },

      {
        label: "Condition of sample",
        value: "Satisfactory when received",
      },
      {
        label: "Deviation if any",
        value: "Not Applicable",
      },
    ].filter(Boolean),
  };
};

async function getsignFile(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data, "binary").toString("base64");
}

module.exports = {
  renderDiscipline,
  calculateDiscountedPrice,
  amountInWords,
  calculateDiscountAmount,
  validateToken,
  calculateDaysDiff,
  extractDateFromTimestamp,
  getDateFromJSDate,
  getTestReportBody,
  convertToDDMMYYYY,
  getsignFile,
};
