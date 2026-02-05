const { logoBase64, logoBase65, NonNablHeaderbase } = require("./filePaths");

const { Jobs } = require("../models/index");

const createHeader = () => {
  return {
    columns: [
      {
        image: logoBase64,
        width: 70,
        margin: [2, 2, 2, 2],
      },
      {
        stack: [
          {
            text: "KDM ENGINEERS (INDIA) PRIVATE LIMITED",
            alignment: "right",
            fontSize: 21,
            margin: [2, 2, 2, 2],
            color: "#2596be",
            bold: true,
          },
          {
            text: "Complete Civil Engineering solutions",
            alignment: "right",
            fontSize: 10,
            color: "red",
            margin: [2, 2, 2, 2],
          },
        ],
      },
    ],
    margin: [40, 10, 40, 10],
  };
};

const createNABLheader = () => {
  return {
    columns: [
      {
        image: logoBase65,
        fit: [550, 150],
        alignment: "center",
        margin: [0, 0, 0, 0],
      },
    ],
    margin: [0, 0, 0, 0],
  };
};

const createNABLheaderwithReportInfo = async (
  reportFunParams,
  nabl,
  jId = "",
  toUpload,
  finalUpload,
) => {
  const {
    sampleInfo,
    urlNumber = "NA",
    reportIssueDate = "Not Issued",
    reportPlace = "",
  } = reportFunParams;
  const { sample_code } = sampleInfo;
  console.log(reportPlace, "reportPlace8392");
  // Default file URL
  // let fileUrl = '';

  // ✅ Fetch from Jobs table if urlNumber is valid
  // if (urlNumber && urlNumber !== "NA" && jId) {
  //   const job = await Jobs.findOne({
  //     where: { job_pk: jId },
  //     attributes: ["reportLocation"],
  //   });

  //   if (job && job.reportLocation) {
  //     fileUrl = job.reportLocation;
  //   }
  // }

  // console.log(fileUrl,'file76')

  const baseHeader = false
    ? {
        image: logoBase65,
        fit: [550, 150],
        alignment: "center",
        margin: [0, 0, 0, 0],
      }
    : {
        image: NonNablHeaderbase,
        fit: [560, 153],
        alignment: "center",
        margin: [0, 0, 0, 0],
      };

  // Conditionally build right-side section
  const rightSectionColumns = [];

  if (urlNumber && urlNumber !== "NA" && reportPlace && !toUpload) {
    // Show QR if urlNumber is valid
    rightSectionColumns.push({
      qr: reportPlace,
      fit: 65,
      alignment: "right",
    });
  } else if (
    urlNumber &&
    urlNumber !== "NA" &&
    reportPlace &&
    !toUpload &&
    finalUpload
  ) {
    // Show QR if urlNumber is valid
    rightSectionColumns.push({
      qr: reportPlace,
      fit: 65,
      alignment: "right",
    });
  }

  // Always show report info
  rightSectionColumns.push({
    stack: [
      {
        text: `Report Issue Date: ${reportIssueDate}`,
        fontSize: 9,
        alignment: "right",
        bold: true,
      },
      {
        text: `ULR No: ${urlNumber}`,
        fontSize: 9,
        alignment: "right",
        bold: true,
      },
    ],
    alignment: "right",
    margin: [10, 0, 0, 0],
  });

  return {
    stack: [
      baseHeader,
      {
        margin: [40, 0, 40, 0],
        columns: [
          // === Left: Sample Code ===
          {
            width: "40%",
            text:
              sample_code.length > 40
                ? sample_code.slice(0, 37) + "…"
                : sample_code,
            fontSize: 9,
            alignment: "left",
            noWrap: true,
            bold: true,
          },

          // === Right: QR (if available) + Report Info ===
          {
            width: "60%",
            columns: rightSectionColumns,
          },
        ],
      },
    ],
  };
};

const createNonNABLheader = () => {
  return {
    columns: [
      {
        image: NonNablHeaderbase,
        fit: [550, 150],
        alignment: "center",
        margin: [0, 0, 0, 0],
      },
    ],
    margin: [0, 0, 0, 0],
  };
};

module.exports = {
  createHeader,
  createNABLheader,
  createNonNABLheader,
  createNABLheaderwithReportInfo,
};
