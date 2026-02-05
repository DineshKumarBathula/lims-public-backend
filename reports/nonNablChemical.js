const PdfPrinter = require("pdfmake");

const path = require("path");

const { createNABLheaderwithReportInfo } = require("./header");

const { Jobs } = require("../models/index.js");

require("dotenv").config();
const JOB_REPORTS = process.env.JOB_REPORTS || "tb-kdm-job-reports";

//aws
const AWS = require("aws-sdk");
const { getTestReportBody } = require("../defs/customFunctions.js");
const genralTestTable = require("./genralTestTable.js");
const dynamicTable = require("./NablMechanical/dynamicTable.js");
const SSChemReport = require("./NablMechanical/SSChemical.js");
const carbonationTable = require("./carbonation.js");
const { toWords } = require("number-to-words");
const genericMultiTable = require("./NablMechanical/genericMultiTable.js");
const ggbsChem = require("./NablMechanical/ggbsChem.js");
const {
  AuthorizationAndSigns,
  sampReportDetails,
  backgroundStamp,
  // recipientDetails,
} = require("./nablMechanical.js");
const { createFooterWithSigns } = require("./footer.js");
const chemicalCement = require("./chemicalCement.js");
const compositeCement = require("./compositeCement.js");
const createWaterMark = require("./waterMark.js");
const galvanizedChem = require("./galvanizedChem.js");

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

const notesAndDisclaimerText = {
  customerNotes: "*As details furnished by the customer",

  notes: [
    "The results relate to the samples supplied by the customer.",
    "Report shall not be reproduced, except in full, without the written approval of the laboratory.",
    "Any correction invalidates this report.",
    "Retention period of samples is 15 days from the date of issue of test report, then it will be disposed of.",
  ],

  disclaimer:
    "Disclaimer: Laboratory is not liable for the Information (data) provided by Customers.",
};
// Remove retention note only for Carbonation test (id = 62)
const getNotesForTest = (productId) => {
  const defaultNotes = [...notesAndDisclaimerText.notes];

  // Remove the retention-period line for Carbonation
  if (productId === 62) {
    return defaultNotes.filter(
      (note) => !note.startsWith("Retention period of samples"),
    );
  }

  return defaultNotes;
};

const insertRelayDetails = (section2, formattedRelayData) => {
  const dimSpecLabel = "Dimensions of specimen (mm)";
  const beforeTestMethodLabel = "Test Method";
  const beforeMaterialReceivedLabel = "Material received on";

  const insertBefore = (arr, newItem, labelToFind) => {
    const index = arr.findIndex((item) => item.label === labelToFind);
    if (index !== -1) {
      arr.splice(index, 0, newItem);
    } else {
      arr.push(newItem); // fallback if label not found
    }
  };

  // Insert 'Dimensions of specimen (mm)' before 'Test Method'
  const dimItem = formattedRelayData.find(
    (item) => item.label === dimSpecLabel,
  );
  if (dimItem && !section2.details.some((d) => d.label === dimSpecLabel)) {
    insertBefore(
      section2.details,
      { label: dimSpecLabel, value: dimItem.answer },
      beforeTestMethodLabel,
    );
  }

  // Insert these 3 in order: 'CA No', 'Section', 'Name of the Contractor'
  const orderedLabels = ["CA No", "Section", "Name of the Contractor"];
  orderedLabels.forEach((label) => {
    const relayItem = formattedRelayData.find((item) => item.label === label);
    if (relayItem && !section2.details.some((d) => d.label === label)) {
      insertBefore(
        section2.details,
        { label, value: relayItem.answer },
        beforeMaterialReceivedLabel,
      );
    }
  });
};

const testReportDetails = (
  reportFunParams,
  jData,
  start_date,
  end_date,
  accessKey,
  formattedRelayData,
) => {
  const { sampleInfo, orderInfo, productInfo } = reportFunParams;
  const paramName = jData?.[0]?.paramName || "";

  console.log(jData[0].reportData, "specificReportDetails7679");

  // const specificReportDetails = jData
  //   .map((each) => each.reportData?.specficReportDetails)
  //   .flat();

  const specificReportDetails = jData
    .map((each) => {
      // 1️⃣ Preferred (new structure)
      if (
        Array.isArray(each.specficReportDetails) &&
        each.specficReportDetails.length > 0
      ) {
        return each.specficReportDetails;
      }

      // 2️⃣ Fallback (older structure)
      if (
        Array.isArray(each.reportData?.specficReportDetails) &&
        each.reportData.specficReportDetails.length > 0
      ) {
        return each.reportData.specficReportDetails;
      }

      // 3️⃣ Nothing found
      return [];
    })
    .flat();

  console.log(specificReportDetails, "specificReportDetails7679");

  const section2 = getTestReportBody(
    orderInfo,
    sampleInfo,
    productInfo,
    specificReportDetails,
    start_date,
    end_date,
    jData,
  );

  console.log(section2, "specificReportDetails7679");

  // If paramName is 'FLEXURAL_TEST', update Description of the sample
  if (paramName === "FLEXURAL_TEST") {
    const descDetail = section2.details.find(
      (detail) => detail.label === "Description of the sample",
    );
    if (descDetail) {
      descDetail.value = "Flexural Beam Specimens";
    }
  }

  // 👇 Insert relay details before formatting
  insertRelayDetails(section2, formattedRelayData);

  const sourceEntry = formattedRelayData?.find(
    (item) => item.label === "Source",
  );
  if (sourceEntry) {
    const sourceDetail = section2.details.find(
      (detail) => detail.label === "Source of the sample",
    );
    if (sourceDetail) {
      sourceDetail.value = `Sample supplied by the customer\n${sourceEntry.answer}`;
    }
  }

  const NumSamEntry = formattedRelayData?.find(
    (item) => item.label === "No of samples",
  );

  const validLabels = [
    "No. of samples tested",
    "No of specimens tested",
    "No. of Cores tested",
    "No. of Cubes tested",
    "No of specimen tested",
  ];

  const sourceDetail = section2.details.find((detail) =>
    validLabels.includes(detail.label),
  );

  let noOfSamFiner = {};

  if (sourceDetail) {
    const num =
      typeof sourceDetail.value === "number"
        ? sourceDetail.value
        : parseInt(sourceDetail.value);

    if (!isNaN(num)) {
      const numStr = num.toString().padStart(2, "0");
      const numInWords = toWords(num).replace(/\b\w/g, (l) => l.toUpperCase());
      sourceDetail.value = `${numStr} (${numInWords} Only)`;
    }
  } else if (!sourceDetail && NumSamEntry) {
    const num = parseInt(NumSamEntry.answer);
    if (!isNaN(num)) {
      const numStr = num.toString().padStart(2, "0");
      const numInWords = toWords(num).replace(/\b\w/g, (l) => l.toUpperCase());
      noOfSamFiner = {
        label: "No. of samples",
        value: `${numStr} (${numInWords} Only)`,
      };
    }
  }

  const alreadyHasSamplesTested = section2.details.some(
    (item) => item.label === "No. of samples tested",
  );

  const isNoOfSamFinerValid =
    noOfSamFiner && Object.keys(noOfSamFiner).length > 0;

  if (!alreadyHasSamplesTested && isNoOfSamFinerValid) {
    const sourceIndex = section2.details.findIndex(
      (item) => item.label === "Source of the sample",
    );
    if (sourceIndex !== -1) {
      section2.details.splice(sourceIndex + 1, 0, noOfSamFiner);
    }
  }

  return [
    {
      text: section2.title,
      fontSize: 12,
      alignment: "center",
      decoration: "underline",
      font: "Roboto",
    },
    ...section2.details
      .filter((detail) => {
        const excludedForKDM = [
          "Subject *",
          "Sample Location",
          // "Material received on",
          "Condition of sample",
          "Source of the sample",
          "Project Name *",
          "Customer's Reference*",
        ];
        if (
          (accessKey === "KDM_HOD_TOKEN" || accessKey === "KDM_STAFF_TOKEN") &&
          excludedForKDM.includes(detail.label)
        )
          return false;

        if (detail.label === "Project Name *" && detail.value.trim() === "")
          return false;

        if (detail.label === "Subject *" && detail.value.trim() === "")
          return false;

        if (detail.label === "Source of material*") return false;

        return true;
      })
      .sort((a, b) => {
        if (a.label === "Product/Material Type*") return 1;
        if (b.label === "Product/Material Type*") return -1;
        return 0;
      })
      .map((detail) => ({
        columns: [
          {
            text: detail.label,
            fontSize: 9,
            width: "25%",
          },
          {
            text: ":",
            fontSize: 9,
            width: "2%",
            alignment: "center",
          },
          {
            text: detail.value,
            fontSize: 9,
            width: "73%",
          },
        ],
      })),
  ];
};

const recipientDetails = (reportFunParams, accessKey, endD) => {
  const { customerInfo } = reportFunParams;
  return [
    accessKey !== "KDM_HOD_TOKEN" && accessKey !== "KDM_STAFF_TOKEN"
      ? {
          table: {
            widths: ["50%", "50%"],
            body: [
              [
                {
                  text: `To,\n${customerInfo.reporting_address}, India.`,
                  fontSize: 10,
                  border: [false, false, false, false],
                  margin: [0, -45, 0, 0],
                  bold: true,
                },
              ],
            ],
          },
          layout: "noBorders",
        }
      : {},
  ];
};

const getResultTable = (id, jdata) => {
  console.log(jdata, "jdata786");
  const paramId = jdata?.[0]?.param_id ?? null;
  const paramName = jdata?.[0]?.paramName;
  const hasFourFieldMultiTable = jdata?.some(
    (p) => p.param_id === "FOUR_FIELD_MULTI_TABLE",
  );

  if (hasFourFieldMultiTable) {
    console.warn("⚠️ [PDF FALLBACK] No specific table mapping found.", {
      productId: id,
      paramId,
      // paramName,
      reason: "FOUR_FIELD_MULTI_TABLE detected → using genericMultiTable",
    });
    return genericMultiTable(jdata);
  }
  // all these are non nabl, please make a note of it
  switch (id) {
    case [91, 101, 98, 99, 100, 102].includes(id):
      return chemicalCement(id, jdata);

    case 129:
      return compositeCement(id, jdata);

    case 24: //silica fume
      return genralTestTable(id, jdata);

    case 27: //Dwater
      return genralTestTable(id, jdata);

    case 42: //Cagg
      return genralTestTable(id, jdata);

    case 43: //Fagg
      return genralTestTable(id, jdata);

    case 33: //Admixture
      return genralTestTable(id, jdata);

    case 26: //cwater
      return genralTestTable(id, jdata);

    case 44: //coal
      return genralTestTable(id, jdata);

    case 48: //soil
      return genralTestTable(id, jdata);

    case 49: //flyash
      return genralTestTable(id, jdata);

    case 50: //bentonite
      return genralTestTable(id, jdata);

    case 76: //ggbs
      return ggbsChem(id, jdata);

    case 78: //gypsum
      return genralTestTable(id, jdata);

    case 85: // I think it's r-steel
      return dynamicTable(jdata);

    case 17: // I think it's s-steel
      return SSChemReport(jdata);
    // case 62: // <-- Use actual product ID for Carbonation test
    //   return carbonationTable(jdata);
    case 91: //cement
      return chemicalCement(id, jdata);
    case 98: //cement
      return chemicalCement(id, jdata);
    case 99: //cement
      return chemicalCement(id, jdata);
    case 100: //cement
      return chemicalCement(id, jdata);
    case 101: //cement
      return chemicalCement(id, jdata);
    case 102: //cement
      return chemicalCement(id, jdata);

    case 141: //MS ANGLER
      return galvanizedChem(id, jdata);

    case 142: //HT STRAND WIRE
      return galvanizedChem(id, jdata);

    case 124: //Bolt
      return galvanizedChem(id, jdata);

    case 123: //Nut
      return galvanizedChem(id, jdata);

    case 126: //Splice Washer
      return galvanizedChem(id, jdata);

    case 125: //Spring Washer
      return galvanizedChem(id, jdata);

    case 127: //Fixed Knot Fence
      return galvanizedChem(id, jdata);

    case 122: //Vertical Post
      return galvanizedChem(id, jdata);

    case 121: //Metal Bean Crash Barrier
      return galvanizedChem(id, jdata);

    case 64: //Crash Barrier
      return galvanizedChem(id, jdata);
    case 155:

    default:
      return genralTestTable(id, jdata);
  }
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

const renderDescrimerAndRemarks = (reportFunParams) => {
  const { jobInfo } = reportFunParams;
  const { remarks } = jobInfo;
  // const remarks = parsedJdata?.[0]?.remarks || jobInfo?.remarks || "";

  console.log("This is remark : ", remarks);
  const updated = [
    {
      text: notesAndDisclaimerText.customerNotes,
      italics: true,
      fontSize: 9,
      margin: [0, 5, 0, 0],
    },

    {
      columns: [
        {
          text: `${remarks && remarks.trim("") !== "" ? remarks : ""}`,
          fontSize: 9,
        },
      ],
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

  return updated;
};
const carbonationRemarks = (parsedJdata, jobInfo) => {
  const witnessNames = parsedJdata?.[0]?.witnessNames || [];
  const cleanWitness = witnessNames.filter((w) => w.trim() !== "");

  // Remarks from job
  const remarksFromJob = jobInfo?.remarks?.trim() || "";

  // ✅ Use notes WITHOUT retention-period
  let notes = getNotesForTest(62);

  // Add witness info if available
  if (cleanWitness.length > 0) {
    notes.unshift(`That tests are witnessed by ${cleanWitness.join(", ")}.`);
  }

  // Add remarks (on top)
  if (remarksFromJob) {
    notes.unshift(`Remarks: ${remarksFromJob}`);
  }

  return [
    {
      text: notesAndDisclaimerText.customerNotes,
      italics: true,
      fontSize: 9,
      margin: [0, 5, 0, 5],
    },
    {
      columns: [
        { text: "Note:", fontSize: 9, width: 40 },
        {
          ul: notes.map((n) => ({
            text: n,
            fontSize: 9,
          })),
        },
      ],
    },
    {
      text: notesAndDisclaimerText.disclaimer,
      fontSize: 9,
      margin: [0, 5, 0, 0],
    },
  ];
};

const docDefinition = async (
  reportFunParams,
  jId,
  start_date,
  end_date,
  res,
  formattedRelayData,
  accessKey,
  job,
  signs,
  toUpload,
  finalUpload,
) => {
  const { productInfo, jdata } = reportFunParams;
  const { id } = productInfo;

  let parsedJdata;
  // console.log(parsedJdata, "day78");
  try {
    parsedJdata = JSON.parse(jdata);
  } catch (error) {
    console.error("Error parsing jdata:", error);
    throw error;
  }

  const testTable = getResultTable(id, parsedJdata);

  const headerContent = await createNABLheaderwithReportInfo(
    reportFunParams,
    false,
    jId,
    toUpload,
    finalUpload,
  );

  return {
    pageMargins: [40, 150, 40, 50],
    // header: createNABLheaderwithReportInfo(reportFunParams, (nabl = false),jId),
    header: headerContent,
    footer: (currentPage, pageCount, pageSize) => {
      const res = createFooterWithSigns(
        currentPage,
        pageCount,
        pageSize,
        signs,
      );

      return res;
    },
    background: (currentPage, pageSize, pageCount) => {
      return [
        backgroundStamp(currentPage, pageSize),
        createWaterMark(currentPage, pageSize),
      ];
    },
    content: [
      ...recipientDetails(reportFunParams, accessKey, end_date),
      testReportDetails(
        reportFunParams,
        parsedJdata,
        start_date,
        end_date,
        accessKey,
        formattedRelayData,
      ),
      ...(formattedRelayData.length > 0
        ? sampReportDetails(formattedRelayData, accessKey)
        : []),
      testTable,
      // ⭐ Use special remarks ONLY for Carbonation (product_id = 62)
      ...(id === 62
        ? carbonationRemarks(parsedJdata, reportFunParams.jobInfo)
        : renderDescrimerAndRemarks(reportFunParams)),
      ...(accessKey !== "KDM_HOD_TOKEN" && accessKey !== "KDM_STAFF_TOKEN"
        ? AuthorizationAndSigns(signs)
        : []),
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

const getNonNablChemicalReport = async (
  reportFunParams,
  jId,
  startD,
  endD,
  res,
  formattedRelayData = [],
  accessKey,
  job,
  signs,
  bulk = false,
  toUpload = false,
  finalUpload = false,
) => {
  try {
    const def = await docDefinition(
      reportFunParams,
      jId,
      startD,
      endD,
      res,
      formattedRelayData,
      accessKey,
      job,
      signs,
      toUpload,
      finalUpload,
    );

    const pdfDoc = printer.createPdfKitDocument(def);

    const chunks = [];
    return await new Promise((resolve, reject) => {
      pdfDoc.on("data", (chunk) => chunks.push(chunk));

      pdfDoc.on("end", async () => {
        const buffer = Buffer.concat(chunks);

        // === CASE 1: Upload to S3 if toUpload ===
        if (toUpload) {
          try {
            const fileName = `job-reports/${jId}-${Date.now()}.pdf`;
            const s3Params = {
              Bucket: JOB_REPORTS,
              Key: fileName,
              Body: buffer,
              ContentType: "application/pdf",
            };

            const uploadResult = await s3.upload(s3Params).promise();
            const s3Url = uploadResult.Location;

            const [updatedCount] = await Jobs.update(
              { reportLocation: s3Url },
              { where: { job_pk: jId } },
            );

            if (updatedCount === 0) {
              console.warn(`No job found with job_pk = ${jId}`);
            }

            return resolve(
              res.json({
                success: true,
                message: "Report uploaded successfully",
                reportLocation: s3Url,
              }),
            );
          } catch (err) {
            console.error("S3 upload error:", err);
            if (res) res.status(500).send("S3 upload failed");
            return reject(err);
          }
        } else if (finalUpload) {
          try {
            const fileName = `job-reports/${jId}-${Date.now()}.pdf`;
            const s3Params = {
              Bucket: JOB_REPORTS,
              Key: fileName,
              Body: buffer,
              ContentType: "application/pdf",
            };

            const uploadResult = await s3.upload(s3Params).promise();
            const s3Url = uploadResult.Location;
            // console.log(s3Url,'url92')

            const [updatedCount] = await Jobs.update(
              { reportLocation: s3Url, report_approval: true },
              { where: { job_pk: jId } },
            );

            if (updatedCount === 0) {
              console.warn(`No job found with job_pk = ${jId}`);
            }

            return resolve({
              success: true,
              reportLocation: s3Url,
            });
          } catch (err) {
            console.error("S3 upload error:", err);
            if (res) res.status(500).send("S3 upload failed");
            return reject(err);
          }
        }

        // === CASE 2 : return buffer (to mimic bulk) ===
        if (!toUpload && bulk) {
          return resolve(buffer);
        }

        // === CASE 3: stream PDF directly ===
        if (!toUpload && !bulk) {
          res?.setHeader("Content-Type", "application/pdf");
          res?.setHeader(
            "Content-Disposition",
            `attachment; filename=${jId}.pdf`,
          );
          res.end(buffer);
          return resolve();
        }
      });

      pdfDoc.on("error", (err) => {
        console.error("PDF generation error:", err);
        if (!bulk && res) {
          res.status(500).send("PDF generation failed");
        }
        reject(err);
      });

      pdfDoc.end();
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    if (!bulk && res) {
      res.status(500).send("Internal server error");
    }
    throw error; // important for bulk mode
  }
};

module.exports = { getNonNablChemicalReport, renderDescrimerAndRemarks };
