const PdfPrinter = require("pdfmake");

const path = require("path");
const { sign } = require("./filePaths");
const { createHeader, createNonNABLheader } = require("./header");
const { createFooter } = require("./footer");

require("dotenv").config();
const JOB_REPORTS = process.env.JOB_REPORTS || "tb-kdm-job-reports";

//aws
const AWS = require("aws-sdk");

const { getTestReportBody } = require("../defs/customFunctions.js");

const CAggregatesChemNabl = require("./NonNablChemical/CAggregates.js");
const admixtureChemicalNABL = require("./NonNablChemical/Admixture.js");
const CwaterChemNABL = require("./NonNablChemical/CWater.js");
const coalNABLchemical = require("./NonNablChemical/coal.js");
const FAggregatesChemNabl = require("./NonNablChemical/FAggragates.js");
const CementNABLChem = require("./NonNablChemical/CementNABLChem.js");
const FlyAsh = require("./NonNablChemical/FlyAsh.js");
const GypsumChemNABL = require("./NonNablChemical/GypsumChemNABL.js");
const DwaterNabl = require("./NonNablChemical/DwaterNabl.js");
const soilChem = require("./NonNablChemical/soilChem.js");
const GGBSchemical = require("./NonNablChemical/GGBSchemical.js");
const SilciaChem = require("./NonNablChemical/SilciaChem.js");
const BentoniteChem = require("./NonNablChemical/BentoniteChem.js");

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

const section1 = {
  date: "30th March, 2024",
  reportNumber: "TC647023000002143",
};

const recipientDetails = (reportFunParams) => {
  const { sampleInfo, customerInfo, orderInfo, jobInfo } = reportFunParams;
  const { sample_code } = sampleInfo;
  const { reporting_name, reporting_address } = customerInfo;

  return [
    {
      columns: [
        { text: sample_code, fontSize: 10, margin: [0, 10, 0, 0] },
        {
          text: `Dated: ${section1.date}`,
          fontSize: 9,
          alignment: "right",
          margin: [0, 15, 0, 0],
        },
      ],
    },
    {
      columns: [
        {
          text: "To,",
          fontSize: 10,
          margin: [0, 0, 0, 0],
        },
        {
          width: "50%",
          text: section1.reportNumber,
          fontSize: 10,
          alignment: "right",
          margin: [0, 0, 0, 0],
        },
      ],
    },
    {
      width: "50%",
      text: `M/s. ${reporting_name},\n${reporting_address}, India.`,
      fontSize: 10,
      margin: [0, 0, 50, 0],
    },
  ];
};

const notesAndDisclaimerText = {
  customerNotes: "*As furnished by the customer",

  notes: [
    "The results relate to the samples supplied by the customer.",
    "Report shall not be reproduced, except in full, without the written approval of the laboratory.",
    "Any correction invalidates this report.",
    "Retention period of samples is 15 days from the date of issue of test report, then it will be disposed of.",
  ],

  disclaimer:
    "Disclaimer: Laboratory is not liable for the Information (data) provided by Customers.",
};

const testReportDetails = (reportFunParams) => {
  const { sampleInfo, orderInfo, productInfo } = reportFunParams;
  const section2 = getTestReportBody(orderInfo, sampleInfo, productInfo);

  return [
    {
      text: section2.title,
      fontSize: 12,
      alignment: "center",
      decoration: "underline",
      font: "Roboto",
      margin: [0, 0, 0, 10],
    },
    ...section2.details.map((detail) => ({
      columns: [
        {
          text: detail.label,
          fontSize: 10,
          margin: [20, 0, 0, 0],
          width: "40%",
        },
        {
          text: ":",
          fontSize: 10,
          margin: [0, 0, 0, 0],
          width: "5%",
          alignment: "center",
        },
        {
          text: detail.value,
          fontSize: 10,
          margin: [0, 0, 0, 0],
          width: "55%",
        },
      ],
    })),
  ];
};

const getResultTable = (id, jdata) => {
  // all these are non nabl, please make a note of it
  switch (id) {
    case 24:
      return SilciaChem(jdata);

    case 27:
      return DwaterNabl(jdata);

    case 42:
      return CAggregatesChemNabl(jdata);

    case 43:
      return FAggregatesChemNabl(jdata);

    case 33:
      return admixtureChemicalNABL(jdata);

    case 26:
      return CwaterChemNABL(jdata);

    case 44:
      return coalNABLchemical(jdata);

    case 48:
      return soilChem(jdata);

    case 49:
      return FlyAsh(jdata);

    case 50:
      return BentoniteChem(jdata);

    case 76:
      return GGBSchemical(jdata);
    // return BentoniteChem(jdata);

    case 78:
      return GypsumChemNABL(jdata);

    case 91:
      return CementNABLChem(jdata);
  }
};

const AuthorizationAndSigns = () => {
  return [
    {
      columns: [
        {
          stack: [
            {
              image: sign,

              width: 50,
              height: 25,
              alignment: "left",
              margin: [0, 13, 0, 0],
            },
            {
              text: "Checked By",
              fontSize: 9,
              italics: true,
              alignment: "left",
              margin: [0, 2, 0, 0],
            },
          ],
          margin: [0, 0, 0, 0],
        },
        {
          stack: [
            {
              text: "For KDM ENGINEERS (INDIA) PVT. LTD.",
              fontSize: 10,
              bold: true,
              alignment: "right",
              margin: [0, 13, 0, 0],
            },
            {
              image: sign,

              width: 50,
              height: 25,
              alignment: "right",
              margin: [0, 2, 0, 0],
            },
          ],
          margin: [0, 0, 0, 0],
        },
      ],
      margin: [0, 0, 0, 0],
    },
    {
      stack: [
        {
          text: "AUTHORISIED SIGNATORY",
          fontSize: 9,
          bold: true,
          margin: [0, 10, 0, 0],
          alignment: "right",
        },
        {
          text: "Operational Head",
          fontSize: 9,
          italics: true,
          margin: [300, 0, 0, 0],
          alignment: "center",
        },
      ],
    },

    {
      text: "***End of Report***",
      fontSize: 9,
      bold: true,
      alignment: "center",
    },
  ];
};

const notesAndDisclaimer = [
  {
    text: notesAndDisclaimerText.customerNotes,
    italics: true,
    fontSize: 9,
    margin: [0, 5, 0, 0],
  },
  {
    columns: [
      {
        text: "Note:",
        fontSize: 9,
        margin: [0, 0, 0, 0],
        width: 40,
      },
      {
        ul: notesAndDisclaimerText.notes.map((note) => ({
          text: note,
          fontSize: 9,
          margin: [0, 0, 0, 0],
          // alignment: "center",
          width: 60,
        })),
      },
    ],
  },
  {
    text: notesAndDisclaimerText.disclaimer,
    fontSize: 9,
    margin: [0, 0, 0, 0],
  },
];

const docDefinition = (reportFunParams) => {
  const { productInfo, jdata } = reportFunParams;
  const { id } = productInfo;
  const testTable = getResultTable(id, jdata);

  return {
    pageMargins: [40, 100, 40, 50],
    header: createNonNABLheader,
    footer: (currentPage, pageCount) => createFooter(currentPage, pageCount),
    content: [
      ...recipientDetails(reportFunParams),
      ...testReportDetails(reportFunParams),
      testTable,
      ...notesAndDisclaimer,
      ...AuthorizationAndSigns(),
    ],
    styles: {
      title: {
        fontSize: 14,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 0],
      },
      tableHeader: { bold: true, fontSize: 9, fillColor: "#CCCCCC" },
    },
  };
};

const genralChemicalTestReport = async (reportFunParams, jId) => {
  try {
    const pdfDoc = printer.createPdfKitDocument(docDefinition(reportFunParams));
    const chunks = [];
    pdfDoc.on("error", (err) => console.error("PDF generation error:", err));
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        const reportName = `${jId}.pdf`;
        const uploadParams = {
          Bucket: JOB_REPORTS,
          Key: reportName,
          Body: pdfBuffer,
          ContentType: "application/pdf",
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        console.log("Upload successful:", uploadResult.Location);
        return uploadResult.Location;
      } catch (error) {
        pdfDoc.end();
        console.log("here is error - 1");
        throw error;
      }
    });
    pdfDoc.end();
  } catch (error) {
    console.log("here is error - 2");
    console.log(error);
    throw error;
  }
};

module.exports = { genralChemicalTestReport };
