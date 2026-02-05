const PdfPrinter = require("pdfmake");
const path = require("path");
const { createHeader } = require("./header");
const { createFooter } = require("./footer");
const createWaterMark = require("./waterMark.js");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const {
  amountInWords,
  calculateDiscountAmount,
} = require("../defs/customFunctions.js");

const { qrScanner, RKsign, vizagStamp } = require("./filePaths");

const MATERIAL_TESTING_TAX_INVOICES = process.env.MATERIAL_TESTING_TAX_INVOICES;

// AWS setup
const AWS = require("aws-sdk");
const { createPANAndBankDetailsTable } = require("./proformaInvoice.js");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const fonts = {
  Roboto: {
    normal: path.join(__dirname, "../fonts/Open/OpenSans-Regular.ttf"),
    bold: path.join(__dirname, "../fonts/Open/OpenSans-Bold.ttf"),
    italics: path.join(__dirname, "../fonts/Open/OpenSans-Italic.ttf"),
    bolditalics: path.join(__dirname, "../fonts/PlayfairDisplay-Bold.ttf"),
  },
};

const printer = new PdfPrinter(fonts);

const getDate = (d) => {
  const date = new Date(d);
  const day = "0" + `${date.getDate()}`;
  const month = "0" + `${date.getMonth() + 1}`;
  const year = date.getFullYear();
  return `${day.slice(-2)}/${month.slice(-2)}/${year}`;
};

const getVizFinancialYear = (dateInput = new Date()) => {
  const date = new Date(dateInput); // handles dor safely
  const year = date.getFullYear();
  const month = date.getMonth(); // Jan = 0, Apr = 3

  const startYear = month < 3 ? year - 1 : year;

  return String(startYear); // e.g. "2025"
};

// ------------------ Lab invoice content ------------------

// ------------------ GT invoice content ------------------

const renderContentGT = (
  results,
  additional_infos,
  customerInfo,
  taxNumber,
  total_transportation_charged,
  dis,
  clientInformation,
  selectedGst,
  vizYear,
  formattedDate,
  orderDetails,
) => {
  const { ref, project_name, subject } = orderDetails || {};

  const orderNumbers = additional_infos.map(({ order_number, dor }) => {
    const date = new Date(dor);
    const month = "0" + (date.getMonth() + 1);
    const year = date.getFullYear();
    return `${month.slice(-2)}/${year}/${order_number}`;
  });
  const singleString = orderNumbers.join("\n");
  // const todayDate = getDate(new Date());
  let { pan_number, gst_number, billing_address, billing_name } = customerInfo;

  if (Array.isArray(customerInfo.gst_records) && selectedGst !== gst_number) {
    const match = customerInfo.gst_records.find((g) => g.gst === selectedGst);
    if (match) {
      pan_number = match.pan_id;
      gst_number = match.gst;
      billing_address = match.bill_address;
    }
  }

  let content = [];
  content.push([
    { text: "S.No", style: "tableHeader" },
    { text: "Description", style: "tableHeader" },
    { text: "Unit", style: "tableHeader" },
    { text: "Qty", style: "tableHeader" },
    { text: "Rate", style: "tableHeader" },
    { text: "Amount", style: "tableHeader" },
  ]);

  let serialNumber = 1;
  let totalPrice = 0;
  results.forEach((item) => {
    const { description, unit, qty, rate } = item;
    const amount = Number(rate) * Number(qty);
    content.push([
      { text: serialNumber++, fontSize: 9 },
      { text: description || "N/A", fontSize: 9 },
      { text: unit || "-", fontSize: 9 },
      { text: qty || 0, fontSize: 9 },
      { text: parseFloat(Number(rate).toFixed(2)), fontSize: 9 },
      { text: amount.toFixed(2), fontSize: 9 },
    ]);
    totalPrice += amount;
  });

  const discountAmount = calculateDiscountAmount(totalPrice, dis);
  const afterDiscountPlusTransport =
    totalPrice - discountAmount + Number(total_transportation_charged);
  const totalGST = Math.round(
    calculateDiscountAmount(afterDiscountPlusTransport, 18),
  );
  const totalAgg = afterDiscountPlusTransport + totalGST;

  const pushRow = (label, amount) => {
    content.push([
      { text: label, colSpan: 5, alignment: "right", fontSize: 10, bold: true },
      {},
      {},
      {},
      {},
      { text: Number(amount).toFixed(2), fontSize: 10, bold: true },
    ]);
  };

  pushRow("Sub Total", totalPrice);
  if (total_transportation_charged > 0)
    pushRow("Transportation Charges", total_transportation_charged);
  if (dis > 0 || total_transportation_charged > 0)
    pushRow("Sub Total", afterDiscountPlusTransport);

  if (gst_number.startsWith("37")) {
    const halfGST = (totalGST / 2).toFixed(2);
    ["CGST", "SGST"].forEach((type) => {
      content.push([
        {
          text: type,
          colSpan: 5,
          alignment: "right",
          fontSize: 10,
          bold: true,
        },
        {},
        {},
        {},
        {},
        { text: halfGST, fontSize: 10, bold: true },
      ]);
    });
  } else if (gst_number.includes("NOT REGISTERED")) {
    content.push([
      { text: "GST", colSpan: 5, alignment: "right", fontSize: 10, bold: true },
      {},
      {},
      {},
      {},
      { text: totalGST.toFixed(2), fontSize: 10, bold: true },
    ]);
  } else {
    content.push([
      {
        text: "IGST",
        colSpan: 5,
        alignment: "right",
        fontSize: 10,
        bold: true,
      },
      {},
      {},
      {},
      {},
      { text: totalGST.toFixed(2), fontSize: 10, bold: true },
    ]);
  }

  pushRow("Total", totalAgg);
  content.push([
    {
      text: amountInWords(totalAgg),
      fontSize: 10,
      colSpan: 6,
      italics: true,
      alignment: "right",
    },
    {},
    {},
    {},
    {},
    {},
  ]);

  const buyerDetailsTable = {
    columns: [
      {
        width: "70%",
        table: {
          widths: [80, "*"],
          body: [
            [
              {
                text: "Buyer's Name",
                fontSize: 9,
                border: [false, false, false, false],
              },
              {
                text: billing_name,
                fontSize: 10,
                border: [false, false, false, false],
              },
            ],
            [
              {
                text: "Address",
                fontSize: 9,
                border: [false, false, false, false],
              },
              {
                text: billing_address,
                fontSize: 10,
                border: [false, false, false, false],
              },
            ],
            [
              {
                text: "PAN",
                fontSize: 9,
                border: [false, false, false, false],
              },
              {
                text: pan_number,
                fontSize: 10,
                border: [false, false, false, false],
              },
            ],
            ...(ref
              ? [
                  [
                    {
                      text: "Ref",
                      fontSize: 9,
                      border: [false, false, false, false],
                    },
                    {
                      text: ref,
                      fontSize: 10,
                      border: [false, false, false, false],
                    },
                  ],
                ]
              : []),
            [
              {
                text: "GST IN",
                fontSize: 9,
                border: [false, false, false, false],
              },
              {
                text: gst_number,
                fontSize: 10,
                border: [false, false, false, false],
              },
            ],

            ...(project_name
              ? [
                  [
                    {
                      text: "Project",
                      fontSize: 9,
                      border: [false, false, false, false],
                    },
                    {
                      text: project_name,
                      fontSize: 10,
                      border: [false, false, false, false],
                    },
                  ],
                ]
              : []),

            ...(subject
              ? [
                  [
                    {
                      text: "Subject",
                      fontSize: 9,
                      border: [false, false, false, false],
                    },
                    {
                      text: subject,
                      fontSize: 10,
                      border: [false, false, false, false],
                    },
                  ],
                ]
              : []),

            clientInformation?.reporting_name
              ? [
                  {
                    text: "Client Name",
                    fontSize: 9,
                    border: [false, false, false, false],
                  },
                  {
                    text: clientInformation.reporting_name,
                    fontSize: 10,
                    border: [false, false, false, false],
                  },
                ]
              : null,
          ].filter(Boolean),
        },
        layout: "noBorders",
      },
      {
        width: "40%",
        table: {
          widths: ["auto", "auto"],
          body: [
            [
              { text: "Invoice No:", fontSize: 10 },
              {
                text: `VIZ/${vizYear}/${taxNumber}`,
                fontSize: 10,
              },
            ],
            [
              { text: "Invoice Date:", fontSize: 10 },
              { text: formattedDate, fontSize: 10 },
            ],
            [
              { text: "Order No:", fontSize: 10 },
              { text: singleString, fontSize: 10 },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
        },
      },
    ],
  };
  console.log("GT TABLE ROWS:", content.length);

  return [
    buyerDetailsTable,
    {
      table: {
        widths: ["auto", "*", "auto", "auto", "auto", "auto"],
        body: content,
      },
    },
  ];
};

const renderContentNDT = (
  results,
  additional_infos,
  customerInfo,
  taxNumber,
  total_transportation_charged,
  dis,
  clientInformation,
  selectedGst,
  vizYear,
  formattedDate,
  orderDetails,
) => {
  const { ref, project_name, subject } = orderDetails || {};

  const orderNumbers = additional_infos.map(({ order_number, dor }) => {
    const date = new Date(dor);
    const month = "0" + (date.getMonth() + 1);
    const year = date.getFullYear();
    return `${month.slice(-2)}/${year}/${order_number}`;
  });
  const singleString = orderNumbers.join("\n");

  let { pan_number, gst_number, billing_address, billing_name } = customerInfo;

  if (Array.isArray(customerInfo.gst_records) && selectedGst) {
    const match = customerInfo.gst_records.find((g) => g.gst === selectedGst);

    if (match) {
      pan_number = match.pan_id || pan_number;
      gst_number = match.gst || gst_number;
      billing_address = match.bill_address || billing_address;
    }
  }
  gst_number = gst_number || "";

  let content = [];
  content.push([
    { text: "S.No", style: "tableHeader" },
    { text: "Description", style: "tableHeader" },
    { text: "Unit", style: "tableHeader" },
    { text: "Qty", style: "tableHeader" },
    { text: "Rate", style: "tableHeader" },
    { text: "Amount", style: "tableHeader" },
  ]);

  let serialNumber = 1;
  let totalPrice = 0;

  results.forEach((item) => {
    const { description, unit, qty, price, total } = item;
    const rate = Number(price);
    const amount = Number(total);
    content.push([
      { text: serialNumber++, fontSize: 9 },
      { text: description || "N/A", fontSize: 9 },
      { text: unit || "-", fontSize: 9 },
      { text: qty || 0, fontSize: 9 },
      { text: rate.toFixed(2), fontSize: 9 },
      { text: amount.toFixed(2), fontSize: 9 },
    ]);
    totalPrice += amount;
  });

  const discountAmount = calculateDiscountAmount(totalPrice, dis);
  const afterDiscountPlusTransport =
    totalPrice - discountAmount + Number(total_transportation_charged);
  const totalGST = Math.round(
    calculateDiscountAmount(afterDiscountPlusTransport, 18),
  );
  const totalAgg = afterDiscountPlusTransport + totalGST;

  const pushRow = (label, amount) => {
    content.push([
      { text: label, colSpan: 5, alignment: "right", fontSize: 10, bold: true },
      {},
      {},
      {},
      {},
      { text: Number(amount).toFixed(2), fontSize: 10, bold: true },
    ]);
  };

  pushRow("Sub Total", totalPrice);

  if (gst_number.startsWith("37")) {
    const halfGST = (totalGST / 2).toFixed(2);
    ["CGST (9%)", "SGST (9%)"].forEach((type) => {
      content.push([
        {
          text: type,
          colSpan: 5,
          alignment: "right",
          fontSize: 10,
          bold: true,
        },
        {},
        {},
        {},
        {},
        { text: halfGST, fontSize: 10, bold: true },
      ]);
    });
  } else if (gst_number.includes("NOT REGISTERED")) {
    content.push([
      { text: "GST", colSpan: 5, alignment: "right", fontSize: 10, bold: true },
      {},
      {},
      {},
      {},
      { text: totalGST.toFixed(2), fontSize: 10, bold: true },
    ]);
  } else {
    // 👉 IGST for other states (your case: 36Axxxx)
    content.push([
      {
        text: "IGST (18%)",
        colSpan: 5,
        alignment: "right",
        fontSize: 10,
        bold: true,
      },
      {},
      {},
      {},
      {},
      { text: totalGST.toFixed(2), fontSize: 10, bold: true },
    ]);
  }

  pushRow("Grand Total", totalAgg);

  content.push([
    {
      text: "Amount in Words: " + amountInWords(totalAgg),
      fontSize: 10,
      colSpan: 6,
      italics: true,
      alignment: "left",
    },
    {},
    {},
    {},
    {},
    {},
  ]);

  const buyerDetailsTable = {
    columns: [
      {
        width: "70%",
        table: {
          widths: [80, "*"],
          body: [
            ["Buyer's Name", billing_name],
            ["Address", billing_address],
            ["PAN", pan_number],
            ...(ref ? [["Ref", ref]] : []),

            ["GST IN", gst_number],
            ...(project_name ? [["Project", project_name]] : []),
            ...(subject ? [["Subject", subject]] : []),
          ].map(([label, val]) => [
            { text: label, fontSize: 9, border: [false, false, false, false] },
            { text: val, fontSize: 10, border: [false, false, false, false] },
          ]),
        },
        layout: "noBorders",
      },
      {
        width: "40%",
        table: {
          widths: ["auto", "auto"],
          body: [
            [
              { text: "Invoice No:", fontSize: 10 },
              {
                text: `VIZ/${vizYear}/${taxNumber}`,
                fontSize: 10,
              },
            ],
            [
              { text: "Invoice Date:", fontSize: 10 },
              { text: formattedDate, fontSize: 10 },
            ],
            [
              { text: "Order No:", fontSize: 10 },
              { text: singleString, fontSize: 10 },
            ],
          ],
        },
      },
    ],
  };

  return [
    buyerDetailsTable,
    {
      table: {
        widths: ["auto", "*", "auto", "auto", "auto", "auto"],
        body: content,
      },
    },
  ];
};
const renderContentLab = (
  results,
  additional_infos,
  customerInfo,
  taxNumber,
  total_transportation_charged,
  dis,
  clientInformation,
  discountColumn,
  selectedGst,
  formattedDate,
  vizYear,
  orderDetails,
) => {
  console.log(additional_infos, "additional_infos345");
  const { ref, project_name, subject } = orderDetails || {};

  // console.log(formattedDate, "fprmatd345");
  const orderNumbers = additional_infos.map(({ order_number, dor }) => {
    const d = new Date(dor);
    const day = ("0" + d.getDate()).slice(-2);
    const month = ("0" + (d.getMonth() + 1)).slice(-2);
    const year = d.getFullYear();
    return `${month}/${year}/${order_number}`;
  });
  // const year = formattedDate.split("/")[2];

  const singleString = orderNumbers.join("\n");
  // const todayDate = getDate(new Date());

  let { pan_number, gst_number, billing_address, billing_name } = customerInfo;

  if (Array.isArray(customerInfo.gst_records) && selectedGst !== gst_number) {
    const match = customerInfo.gst_records.find((g) => g.gst === selectedGst);
    if (match) {
      pan_number = match.pan_id;
      gst_number = match.gst;
      billing_address = match.bill_address;
    }
  }

  const content = [];

  // HEADER ROW
  const headerRow = [
    { text: "S.No", style: "tableHeader" },
    { text: "Particulars", style: "tableHeader" },
    { text: "Price", style: "tableHeader" },
    { text: "Qty", style: "tableHeader" },
  ];

  if (discountColumn)
    headerRow.push({ text: "Discount (%)", style: "tableHeader" });

  headerRow.push({ text: "Amount", style: "tableHeader" });
  content.push(headerRow);

  // PARSE RESULTS
  const parsedResults = results
    .map((r) => {
      let sampleData =
        typeof r.sample_data === "string"
          ? JSON.parse(r.sample_data)
          : r.sample_data || r;

      if (!Array.isArray(sampleData)) sampleData = [sampleData];

      return sampleData.map((s) => ({
        ...s,
        chemicalParams: (s.chemicalParams || []).map((p) => ({
          ...p,
          params:
            typeof p.params === "string" ? JSON.parse(p.params) : p.params,
          discount: Number(p.discount) || 0,
          discountedPrice: Number(p.discountedPrice || p.price) || 0,
        })),
        physicalParams: (s.physicalParams || []).map((p) => ({
          ...p,
          params:
            typeof p.params === "string" ? JSON.parse(p.params) : p.params,
          discount: Number(p.discount) || 0,
          discountedPrice: Number(p.discountedPrice || p.price) || 0,
        })),
      }));
    })
    .flat();

  let serialNumber = 1;
  let totalPrice = 0;

  // MAIN LOOP – EXACT PROFORMA FORMAT
  parsedResults.forEach((eachOrder) => {
    const {
      sampleName,
      qty,
      physicalParams = [],
      chemicalParams = [],
    } = eachOrder;

    const allParams = [...physicalParams, ...chemicalParams];

    const totalRows = allParams.length + 1; // sample row + params
    const materialHasDiscount = allParams.some((p) => Number(p.discount) > 0);

    // MATERIAL ROW (ONLY ONE ROW)
    // MATERIAL HEADER ROW
    content.push([
      {
        text: serialNumber,
        rowSpan: totalRows,
        alignment: "center",
        fontSize: 9,
        bold: true,
        valign: "middle",
      },
      {
        text: `Testing of ${sampleName || "N/A"}`,
        fontSize: 9,
        bold: true,
        margin: [0, 2, 0, 2],
      },
      { text: "", fontSize: 9 },
      { text: "", fontSize: 9 },
      // ...(materialHasDiscount ? [{ text: "", fontSize: 9 }] : []),
      ...(discountColumn ? [{ text: "", fontSize: 9 }] : []),

      { text: "", fontSize: 9 },
    ]);

    // PARAMETER ROWS
    allParams.forEach((param) => {
      const rate = Number(param.price) || 0;
      const discountPercent = Number(param.discount) || 0;
      const qtyValue = Number(qty) || 1;

      // FIXED: Real discounted rate
      const discountedRate =
        discountPercent > 0 ? rate - (rate * discountPercent) / 100 : rate;

      // FIXED: amount becomes 0 when discount is 100%
      const amount = Math.round(Math.round(discountedRate) * qtyValue);
      // const amount = (discountedRate * qtyValue);
      // console.log(discountedRate,qtyValue,'qtyValue786')
      totalPrice += amount;

      // extract inner params
      let nested = [];
      if (param.params) {
        try {
          nested = Array.isArray(param.params)
            ? param.params
            : JSON.parse(param.params);
        } catch {}
      }

      const name =
        nested.length > 0
          ? nested.map((p) => "" + (p.testName || p.paramName)).join("\n")
          : "• " + (param.paramName || param.testName || "N/A");

      content.push([
        {}, // rowSpan filler
        { text: name, fontSize: 9, margin: [10, 0, 0, 0] }, // multiline
        { text: rate.toFixed(2), fontSize: 9 },
        { text: qtyValue.toString(), fontSize: 9 },

        ...(discountColumn
          ? [{ text: discountPercent + "%", fontSize: 9 }]
          : []),

        { text: amount.toFixed(2), fontSize: 9 },
      ]);
    });

    serialNumber++;
  });

  // TOTAL CALCULATIONS
  const discountAmount = calculateDiscountAmount(totalPrice, dis);
  const afterDiscountPlusTransport =
    totalPrice - discountAmount + Number(total_transportation_charged);

  const totalGST = Math.round(
    calculateDiscountAmount(afterDiscountPlusTransport, 18),
  );

  const totalAgg = Math.round(afterDiscountPlusTransport + totalGST);

  const colSpan = discountColumn ? 3 : 2;

  const pushRow = (label, amount) => {
    content.push([
      {
        text: label,
        colSpan: colSpan,
        alignment: "right",
        bold: true,
        fontSize: 10,
      },
      ...Array(colSpan - 1).fill(""),
      "",
      "",
      { text: Number(amount).toFixed(2), bold: true, fontSize: 10 },
    ]);
  };

  pushRow("Sub Total", totalPrice);

  if (total_transportation_charged > 0)
    pushRow("Transportation Charges", total_transportation_charged);

  if (dis > 0 || total_transportation_charged > 0)
    pushRow("Sub Total", afterDiscountPlusTransport);

  // GST ROWS
  if (gst_number.startsWith("37")) {
    const half = (totalGST / 2).toFixed(2);

    ["CGST", "SGST"].forEach((type) => {
      content.push([
        {
          text: type,
          colSpan: 3,
          alignment: "right",
          bold: true,
          fontSize: 10,
        },
        "",
        "",
        { text: "9%" },
        ...(discountColumn ? [""] : []),
        { text: half, bold: true, fontSize: 10 },
      ]);
    });
  } else {
    content.push([
      {
        text: "IGST",
        colSpan: 3,
        alignment: "right",
        bold: true,
        fontSize: 10,
      },
      "",
      "",
      { text: "18%" },
      ...(discountColumn ? [""] : []),
      { text: totalGST.toFixed(2), bold: true, fontSize: 10 },
    ]);
  }

  pushRow("Total", totalAgg);

  content.push([
    {
      text: amountInWords(totalAgg),
      italics: true,
      alignment: "right",
      colSpan: discountColumn ? 6 : 5,
      fontSize: 10,
    },
    ...Array((discountColumn ? 6 : 5) - 1).fill(""),
  ]);

  // BUYER DETAILS
  const buyerDetailsTable = {
    columns: [
      {
        width: "70%",
        table: {
          widths: [80, "*"],
          body: [
            ["Buyer's Name", billing_name],
            ["Address", billing_address],
            ["PAN", pan_number],
            ["GST IN", gst_number],
            ...(ref ? [["Ref", ref]] : []),
            ...(clientInformation?.reporting_name
              ? [["Client Name", clientInformation.reporting_name]]
              : []),

            ...(project_name ? [["Project", project_name]] : []),
            ...(subject ? [["Subject", subject]] : []),
          ].map(([l, v]) => [
            { text: l, fontSize: 9, border: [false, false, false, false] },
            { text: v, fontSize: 10, border: [false, false, false, false] },
          ]),
        },
        layout: "noBorders",
      },
      {
        width: "40%",
        table: {
          widths: ["auto", "auto"],
          body: [
            [
              { text: "Invoice No:", fontSize: 10 },
              {
                // text: `VIZ/${new Date().getFullYear()}/${taxNumber}`,
                text: `VIZ/${vizYear}/${taxNumber}`,

                fontSize: 10,
              },
            ],
            [
              { text: "Invoice Date:", fontSize: 10 },
              { text: formattedDate, fontSize: 10 },
            ],
            [
              { text: "Order No:", fontSize: 10 },
              { text: singleString, fontSize: 10 },
            ],
          ],
        },
        layout: { hLineWidth: () => 1, vLineWidth: () => 1 },
      },
    ],
  };

  const widths = discountColumn
    ? ["auto", "*", "auto", "auto", "auto", "auto"]
    : ["auto", "*", "auto", "auto", "auto"];

  return [buyerDetailsTable, { table: { widths, body: content } }];
};

// ------------------ DocDefinition ------------------
const docDefinition = (
  taxNumber,
  customerInfo,
  results,
  total_transportation_charged,
  dis,
  clientInformation,
  invoiceType,
  formattedDate,
) => {
  const additional_infos = [];
  let res = [];
  let selectedGst = "";

  results.forEach((eachOrder) => {
    const { sample_data, dor, order_number, gst, order_code } = eachOrder;
    selectedGst = gst;
    // additional_infos.push({ order_number: order_code ?? order_number, dor });
    additional_infos.push({
      internal_order_id: eachOrder.order_id, // ✅ INTERNAL (NEW)
      order_number: order_code ?? order_number, // ✅ DISPLAY (UNCHANGED)
      dor,
    });

    const parsed = JSON.parse(sample_data);
    parsed.forEach((each) => {
      res.push({
        ...each,
        sampleName:
          results.length > 1
            ? `${each.sampleName} (${order_code ?? order_number})`
            : each.sampleName,
      });
    });
  });
  // 🔍 Detect if any parameter has discount > 0
  let discountColumn = false;
  res.forEach((sample) => {
    const { physicalParams = [], chemicalParams = [] } = sample;
    const allParams = [...physicalParams, ...chemicalParams];
    allParams.forEach((p) => {
      const diff = Number(p.price) - Number(p.discountedPrice);
      if (diff > 0) {
        discountColumn = true;
      }
    });
  });
  const [day, month, year] = formattedDate.split("/").map(Number);
  const invoiceDateObj = new Date(year, month - 1, day);
  const vizYear = getVizFinancialYear(invoiceDateObj);
  const orderDetails = results[0]; // contains ref, project_name, subject

  const content =
    invoiceType === "GT"
      ? renderContentGT(
          res,
          additional_infos,
          customerInfo,
          taxNumber,
          total_transportation_charged,
          dis,
          clientInformation,
          selectedGst,
          vizYear,
          formattedDate,
          orderDetails,
        )
      : invoiceType === "NDT"
        ? renderContentNDT(
            res,
            additional_infos,
            customerInfo,
            taxNumber,
            total_transportation_charged,
            dis,
            clientInformation,
            selectedGst,
            vizYear,
            formattedDate,
            orderDetails,
          )
        : renderContentLab(
            res,
            additional_infos,
            customerInfo,
            taxNumber,
            total_transportation_charged,
            dis,
            clientInformation,
            discountColumn,
            selectedGst,
            formattedDate,
            vizYear,
            orderDetails,
          );

  return {
    totalAgg: 100,
    pageMargins: [40, 70, 40, 60],
    header: createHeader,
    footer: (currentPage, pageCount) => createFooter(currentPage, pageCount),
    content: [
      {
        text: "TAX INVOICE",
        alignment: "center",
        fontSize: 15,
        margin: [0, 0, 0, 10],
        color: "red",
      },
      ...content,
      {
        // Keep this block together; move to new page if needed
        // unbreakable: true,
        margin: [0, 20, 0, 0],
        // unbreakable: true,
        columns: [
          {
            stack: [
              {
                text: "SCAN & PAY", // 👈 text above image
                fontSize: 10,
                alignment: "center",
                margin: [0, -20, 0, 0],
              },
              {
                image: qrScanner,
                width: 70,
                height: 70,
                alignment: "left",
                margin: [0, 2, 0, 15],
              },
            ],
            width: "auto",
          },
          {
            stack: [
              {
                text: "For KDM Engineers (India) Private Limited",
                alignment: "right",
                margin: [0, -15, 0, 0],
                fontSize: 10,
              },
              {
                image: RKsign,
                width: 80,
                height: 40,
                margin: [0, 0, 0, 0],
                alignment: "right",
              },
              {
                image: vizagStamp,
                width: 65,
                height: 65,
                alignment: "right",
                margin: [0, -55, 0, 0], // ✅ moves stamp *over* the sign (merged look)
              },
              {
                text: "Authorized By",
                fontSize: 9,
                alignment: "right",
                margin: [0, -5, 0, 0],
              },
              {
                text: "M.Ramakrishna",
                fontSize: 9,
                alignment: "right",
                margin: [0, 0, 0, 0],
              },
            ],
            width: "*",
          },
        ],
      },

      {
        text: "Our Bank Details",
        alignment: "right",
        fontSize: 10,
        margin: [0, -15, 60, 8],
      },
      createPANAndBankDetailsTable(),
    ],
    background: (currentPage, pageCount) =>
      createWaterMark(currentPage, pageCount),
    styles: {
      title: { fontSize: 24, bold: true },
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      tableHeader: { fontSize: 10, color: "black", fillColor: "#CCCCCC" },
      defaultStyle: { font: "Roboto" },
      listItem: { fontSize: 8 },
    },
  };
};

// ------------------ Create PDF & Upload ------------------
const createMergedTaxInvoice = async (
  taxNumber,
  formattedDate,
  customerInfo,
  results,
  total_transportation_charged,
  dis,
  clientInformation,
  uniquePrefix,
) => {
  try {
    // Determine invoice type based on div ision
    // const invoiceType = results[0]?.division === "GT" ? "GT" : "LAB";
    let invoiceType = "LAB";

    if (results[0]?.division === "GT") invoiceType = "GT";
    else if (results[0]?.division === "NDT") invoiceType = "NDT";

    console.log(taxNumber, "taxNumber886");

    const docDef = docDefinition(
      taxNumber,
      customerInfo,
      results,
      total_transportation_charged,
      dis,
      clientInformation,
      invoiceType,
      formattedDate,
    );
    console.log(uniquePrefix, "uniquePrefix8976");

    const pdfDoc = printer.createPdfKitDocument(docDef);
    const chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    return new Promise((resolve, reject) => {
      pdfDoc.on("end", async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          const uploadParams = {
            Bucket: MATERIAL_TESTING_TAX_INVOICES,
            Key: `${uniquePrefix}-Tax-invoice-${taxNumber}.pdf`,
            Body: pdfBuffer,
            ContentType: "application/pdf",
          };
          const uploadResult = await s3.upload(uploadParams).promise();
          console.log(`PDF uploaded to S3: ${uploadResult.Location}`);
          const fileName = `${uniquePrefix}-Tax-invoice-${taxNumber}.pdf`;
          resolve(fileName);
        } catch (err) {
          console.error("Error uploading PDF:", err);
          reject(err);
        }
      });
      pdfDoc.end();
    });
  } catch (err) {
    console.error("Error creating PDF:", err);
    throw err;
  }
};

module.exports = { createMergedTaxInvoice };
// const renderContentLab = (
//   results,
//   additional_infos,
//   customerInfo,
//   taxNumber,
//   total_transportation_charged,
//   dis,
//   clientInformation,
//   discountColumn,
//   selectedGst
// ) => {
//   console.log(results, "es89");

//   const orderNumbers = additional_infos.map(({ order_number, dor }) => {
//     const date = new Date(dor);
//     const day = "0" + date.getDate();
//     const month = "0" + (date.getMonth() + 1);
//     const year = date.getFullYear();
//     return `${month.slice(-2)}/${year}/${order_number}`;
//   });

//   const singleString = orderNumbers.join("\n");
//   const todayDate = getDate(new Date());
//   let { pan_number, gst_number, billing_address, billing_name } = customerInfo;

//   if (Array.isArray(customerInfo.gst_records) && selectedGst !== gst_number) {
//     const match = customerInfo.gst_records.find((g) => g.gst === selectedGst);
//     if (match) {
//       pan_number = match.pan_id;
//       gst_number = match.gst;
//       billing_address = match.bill_address;
//     }
//   }

//   let content = [];

//   // Header Row
//   const headerRow = [
//     { text: "S.No", style: "tableHeader" },
//     { text: "Particulars", style: "tableHeader" },
//     { text: "Price", style: "tableHeader" },
//     { text: "Qty", style: "tableHeader" },
//   ];

//   if (discountColumn) {
//     headerRow.push({ text: "Discount (%)", style: "tableHeader" });
//   }
//   headerRow.push({ text: "Amount", style: "tableHeader" });
//   content.push(headerRow);
//   const parsedResults = results
//     .map((r) => {
//       // if this record already looks like sampleData, skip parsing
//       let sampleData = Array.isArray(r)
//         ? r
//         : typeof r.sample_data === "string"
//           ? JSON.parse(r.sample_data)
//           : r.sample_data || [r];

//       // just to be safe
//       if (!Array.isArray(sampleData)) sampleData = [sampleData];

//       sampleData = sampleData.map((s) => ({
//         ...s,
//         chemicalParams: (s.chemicalParams || []).map((p) => ({
//           ...p,
//           params:
//             typeof p.params === "string" ? JSON.parse(p.params) : p.params,
//           discount: Number(p.discount) || 0,
//           discountedPrice: Number(p.discountedPrice) || Number(p.price),
//         })),
//         physicalParams: (s.physicalParams || []).map((p) => ({
//           ...p,
//           params:
//             typeof p.params === "string" ? JSON.parse(p.params) : p.params,
//           discount: Number(p.discount) || 0,
//           discountedPrice: Number(p.discountedPrice) || Number(p.price),
//         })),
//       }));

//       return sampleData;
//     })
//     .flat();
//   console.log("🧾 Parsed Results (after safety fix):", parsedResults);

//   let serialNumber = 1;
//   let totalPrice = 0;

//   const seenSampleIds = new Set();
//   let filteredResults = parsedResults.filter((item) => {
//     if (seenSampleIds.has(item.sampleId)) return false;
//     seenSampleIds.add(item.sampleId);
//     return true;
//   });

//   filteredResults = filteredResults.map((item) => {
//     if (Array.isArray(item.physicalParams)) {
//       const hasMainParam = item.physicalParams.some(
//         (p) => p.paramId === "20240725182402705"
//       );
//       const hasSecondParam = item.physicalParams.some(
//         (p) => p.paramId === "20240725182716784"
//       );
//       if (hasMainParam && hasSecondParam) {
//         item.physicalParams = item.physicalParams.filter(
//           (p) => p.paramId === "20240725182402705"
//         );
//       }
//     }
//     return item;
//   });

//   filteredResults.forEach((eachOrder) => {
//     const {
//       sampleName,
//       qty,
//       physicalParams = [],
//       chemicalParams = [],
//     } = eachOrder;

//     // const allParams = [...physicalParams, ...chemicalParams];
//     const allParams = [...physicalParams, ...chemicalParams];

//     if (allParams.length === 0) {
//       content.push([
//         { text: serialNumber++, fontSize: 9 },
//         { text: sampleName || "N/A", fontSize: 9 },
//         { text: "-", fontSize: 9 },
//         { text: qty || 1, fontSize: 9 },
//         ...(discountColumn ? [{ text: "0", fontSize: 9 }] : []),
//         { text: "0.00", fontSize: 9 },
//       ]);
//     } else {
//       // Sample name row (first line)
//       content.push([
//         { text: serialNumber++, fontSize: 9 },
//         {
//           text: `Testing of ${sampleName || "N/A"}`,
//           fontSize: 9,
//           colSpan: discountColumn ? 5 : 4,
//         },
//         ...Array(discountColumn ? 4 : 3).fill(""),
//       ]);

//       // Parameter rows (second line onward)
//       allParams.forEach((param) => {
//         const rate = Number(param.price) || 0;
//         const discountedRate = Number(param.discountedPrice || rate);
//         const discountPercent =
//           rate > discountedRate
//             ? `${(((rate - discountedRate) / rate) * 100).toFixed(0)}%`
//             : "0%";
//         const qtyValue = Number(qty) || 1;
//         const amount = discountedRate * qtyValue;

//         // Parse nested params if present
//         let nestedParams = [];
//         if (param.params) {
//           try {
//             nestedParams =
//               typeof param.params === "string"
//                 ? JSON.parse(param.params)
//                 : Array.isArray(param.params)
//                   ? param.params
//                   : [];
//           } catch (err) {
//             console.error("Error parsing param.params:", err);
//           }
//         }

//         const paramNames =
//           nestedParams.length > 0
//             ? nestedParams.map((p) => p.testName || p.paramName).join(", ")
//             : param.paramName || param.testName || "N/A";

//         totalPrice += amount;

//         content.push([
//           { text: "", fontSize: 9 }, // Empty under serial no.
//           { text: paramNames, fontSize: 9 },
//           { text: rate.toFixed(2), fontSize: 9 },
//           { text: qtyValue, fontSize: 9 },
//           ...(discountColumn ? [{ text: discountPercent, fontSize: 9 }] : []),
//           { text: amount.toFixed(2), fontSize: 9 },
//         ]);
//       });
//     }
//   });

//   const discountAmount = calculateDiscountAmount(totalPrice, dis);
//   const afterDiscountPlusTransport =
//     totalPrice - discountAmount + Number(total_transportation_charged);
//   const totalGST = Math.round(
//     calculateDiscountAmount(afterDiscountPlusTransport, 18)
//   );
//   const totalAgg = afterDiscountPlusTransport + totalGST;

//   const colSpan = discountColumn ? 3 : 2;
//   const pushRow = (label, amount) => {
//     content.push([
//       {
//         text: label,
//         colSpan: colSpan,
//         alignment: "right",
//         fontSize: 10,
//         bold: true,
//       },
//       ...Array(colSpan - 1).fill(""),
//       "",
//       "",
//       { text: Number(amount).toFixed(2), fontSize: 10, bold: true },
//     ]);
//   };

//   pushRow("Sub Total", totalPrice);
//   if (total_transportation_charged > 0)
//     pushRow("Transportation Charges", total_transportation_charged);
//   if (dis > 0 || total_transportation_charged > 0)
//     pushRow("Sub Total", afterDiscountPlusTransport);

//   // GST rows
//   if (gst_number.startsWith("37")) {
//     const halfGST = (totalGST / 2).toFixed(2);
//     ["CGST", "SGST"].forEach((type) => {
//       content.push([
//         {
//           text: type,
//           colSpan: 3,
//           alignment: "right",
//           fontSize: 10,
//           bold: true,
//         },
//         "",
//         "",
//         { text: "9%" },
//         ...(discountColumn ? [""] : []),
//         { text: halfGST, fontSize: 10, bold: true },
//       ]);
//     });
//   } else if (gst_number.includes("NOT REGISTERED")) {
//     content.push([
//       { text: "GST", colSpan: 3, alignment: "right", fontSize: 10, bold: true },
//       "",
//       "",
//       { text: "18%" },
//       ...(discountColumn ? [""] : []),
//       { text: totalGST.toFixed(2), fontSize: 10, bold: true },
//     ]);
//   } else {
//     content.push([
//       {
//         text: "IGST",
//         colSpan: 3,
//         alignment: "right",
//         fontSize: 10,
//         bold: true,
//       },
//       "",
//       "",
//       { text: "18%" },
//       ...(discountColumn ? [""] : []),
//       { text: totalGST.toFixed(2), fontSize: 10, bold: true },
//     ]);
//   }

//   pushRow("Total", totalAgg);

//   content.push([
//     {
//       text: amountInWords(totalAgg),
//       fontSize: 10,
//       colSpan: discountColumn ? 6 : 5,
//       italics: true,
//       alignment: "right",
//     },
//     ...Array((discountColumn ? 6 : 5) - 1).fill(""),
//   ]);

//   const buyerDetailsTable = {
//     columns: [
//       {
//         width: "70%",
//         table: {
//           widths: [80, "*"],
//           body: [
//             [
//               {
//                 text: "Buyer's Name",
//                 fontSize: 9,
//                 border: [false, false, false, false],
//               },
//               {
//                 text: billing_name,
//                 fontSize: 10,
//                 border: [false, false, false, false],
//               },
//             ],
//             [
//               {
//                 text: "Address",
//                 fontSize: 9,
//                 border: [false, false, false, false],
//               },
//               {
//                 text: billing_address,
//                 fontSize: 10,
//                 border: [false, false, false, false],
//               },
//             ],
//             [
//               {
//                 text: "PAN",
//                 fontSize: 9,
//                 border: [false, false, false, false],
//               },
//               {
//                 text: pan_number,
//                 fontSize: 10,
//                 border: [false, false, false, false],
//               },
//             ],
//             [
//               {
//                 text: "GST IN",
//                 fontSize: 9,
//                 border: [false, false, false, false],
//               },
//               {
//                 text: gst_number,
//                 fontSize: 10,
//                 border: [false, false, false, false],
//               },
//             ],
//             clientInformation?.reporting_name
//               ? [
//                   {
//                     text: "Client Name",
//                     fontSize: 9,
//                     border: [false, false, false, false],
//                   },
//                   {
//                     text: clientInformation.reporting_name,
//                     fontSize: 10,
//                     border: [false, false, false, false],
//                   },
//                 ]
//               : null,
//           ].filter(Boolean),
//         },
//         layout: "noBorders",
//       },
//       {
//         width: "40%",
//         table: {
//           widths: ["auto", "auto"],
//           body: [
//             [
//               { text: "Invoice No:", fontSize: 10 },
//               {
//                 text: `VIZ/${new Date().getFullYear()}/${taxNumber}`,
//                 fontSize: 10,
//               },
//             ],
//             [
//               { text: "Invoice Date:", fontSize: 10 },
//               { text: todayDate, fontSize: 10 },
//             ],
//             [
//               { text: "Order No:", fontSize: 10 },
//               { text: singleString, fontSize: 10 },
//             ],
//           ],
//         },
//         layout: {
//           hLineWidth: () => 1,
//           vLineWidth: () => 1,
//         },
//       },
//     ],
//   };

//   const widths = discountColumn
//     ? ["auto", "*", "auto", "auto", "auto", "auto"]
//     : ["auto", "*", "auto", "auto", "auto"];

//   return [
//     buyerDetailsTable,
//     {
//       table: {
//         widths: widths,
//         body: content,
//       },
//     },
//   ];
// };
