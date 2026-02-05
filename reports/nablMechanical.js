const PdfPrinter = require("pdfmake");
const { Jobs } = require("../models/index.js");

const path = require("path");
const {
  sign,
  RajeshwariSign,
  SanyasiRaoSign,
  RKsign,
  suhasinisign,
  vizagStamp,
} = require("./filePaths");
const { createNABLheaderwithReportInfo } = require("./header");

const { toWords } = require("number-to-words");

require("dotenv").config();
const JOB_REPORTS = process.env.JOB_REPORTS || "tb-kdm-job-reports";
const upvTable = require("./upvTable.js");
//aws
const AWS = require("aws-sdk");
const tileWaterAbsorption = require("./NablMechanical/tileWaterAbsorption");
const tileBreakingStrength = require("./NablMechanical/tileBreakingStrength");
const tileModulusOfRupture = require("./NablMechanical/tileModulusOfRupture");
const tileMohsHardness = require("./NablMechanical/tileMohsHardness");
const AcidBricksWaterAbsorption = require("./NablMechanical/acidbrickswater.js");
const AcidBricksCompressiveStrength = require("./NablMechanical/BricksComp.js");
const AcidModulusOfRupture = require("./NablMechanical/AcidModules.js");
const AcidTileWaterAbsorption = require("./NablMechanical/acidtileswater.js");
const AcidtileBreakingStrength = require("./NablMechanical/acidstrength.js");
const AcidtileDimensionsOfTiles = require("./NablMechanical/AcidtilesDimensions.js");
const tileMoistureExpansion = require("./NablMechanical/tilesexpansion.js");
const tileDimensionsOfTiles = require("./NablMechanical/tileDimensionsOfTiles");
const cAggNablMech = require("./NablMechanical/cAggNablMech.js");
const fAggMech = require("./NablMechanical/fAggMech.js");
const flyAshMech = require("./NablMechanical/flyAshMech.js");
const soilMech = require("./NablMechanical/soilMech.js");
const microSilicaMech = require("./NablMechanical/microSilicaMech.js");
const structuralStreelMech = require("./NablMechanical/structuralStreelMech.js");
const bitumenMech = require("./NablMechanical/bitumenMech.js");
const cAggNablMech2 = require("./NablMechanical/cAggNablMech2.js");
const { getTestReportBody } = require("../defs/customFunctions.js");
const genralTestTable = require("./genralTestTable.js");
const dynamicTable = require("./NablMechanical/dynamicTable.js");
const dynamicTable2 = require("./NablMechanical/concreteCubes.js");
const rSteelMech = require("./NablMechanical/rSteelMech.js");
const coarseAggStrippingValue = require("./NablMechanical/coarseAggStrippingValue.js");
const wetTransverseStrength = require("./NablMechanical/wetTransverseStrength");
const chequeredMech = require("./NablMechanical/chequeredMech");
const genericMultiTable = require("./NablMechanical/genericMultiTable.js");
const bricksMech = require("./NablMechanical/bricksMech.js");
const gSbMech = require("./NablMechanical/gSBSieveMech.js");
const wmmCommonMech = require("./NablMechanical/wmmCommonMech.js");
const wmmMech = require("./NablMechanical/wMMSieveMech.js");
const gsbRemMech = require("./NablMechanical/gsbCRemMech.js");
const concreteBlocksMech = require("./NablMechanical/concreteBlocksMech.js");
const cCoreMech = require("./NablMechanical/cCoreMech.js");
const cCoreMech2 = require("./NablMechanical/cCoreMech2.js");

const DBMmechanical = require("./NablMechanical/DBMmechanical.js");
const paverBlocks = require("./NablMechanical/paverBlocks.js");
const ballastMech = require("./NablMechanical/ballastMech.js");
const rockMech = require("./NablMechanical/rockMech.js");
const soilField = require("./NablMechanical/soilField.js");
const { SRC_PATH } = require("../defs/CONST.js");
const { createFooterWithSigns } = require("./footer.js");
const flyAshbricksMech = require("./NablMechanical/flyAshBricksMech.js");
const genralTestTableCemMech = require("./genericTableCemMech.js");
const cementMech = require("./cementMech.js");
const bitumenCoreMech = require("./NablMechanical/bitumenCore.js");
const aacBlocks = require("./NablMechanical/aacBlocks.js");
const cubesAct = require("./NablMechanical/cubesAct.js");

const createWaterMark = require("./waterMark.js");

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
                  fontSize: 9,
                  bold: true,
                  border: [false, false, false, false],
                  margin: [0, -35, 0, 0],
                },
              ],
            ],
          },
          layout: "noBorders",
        }
      : {},
  ];
};

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

  // console.log(sampleInfo, "ki245");

  const specificReportDetails = jData
    .map((each) => each.reportData?.specficReportDetails)
    .flat();

  // console.log(specificReportDetails, "specificReportDetails76");

  const section2 = getTestReportBody(
    orderInfo,
    sampleInfo,
    productInfo,
    specificReportDetails,
    start_date,
    end_date,
  );

  // If paramName is 'FLEXURAL_TEST', update Description of the sample
  if (paramName === "FLEXURAL_TEST") {
    const descDetail = section2.details.find(
      (detail) => detail.label === "Description of the sample",
    );
    if (descDetail) {
      descDetail.value = "Concrete Beams";
    }
  } else if (paramName === "CONCRETE_CORE") {
    const gradeConcrete = jData?.[0]?.testReq?.concreteGrade || "-";
    const maxAggSize = jData?.[0]?.testReq?.maxAggSize || "-";

    // Update Description if vigilance mode
    const isVigilance = jData?.[0]?.isVigilenceMode;
    const concreteCoreDia = jData?.[0]?.formData?.concreteCoreDia;

    if (isVigilance && concreteCoreDia) {
      const descDetail = section2.details.find(
        (detail) => detail.label === "Description of the sample",
      );
      if (descDetail) {
        descDetail.value = `${concreteCoreDia}mm Dia Concrete Core Specimens`;
      }
    }

    // Find index of "No. of Cores tested" to insert after it
    const coresIndex = section2.details.findIndex(
      (detail) => detail.label === "No. of Cores tested",
    );

    if (coresIndex !== -1) {
      // Insert Grade of Concrete*
      section2.details.splice(coresIndex + 1, 0, {
        label: "Grade of Concrete*",
        value: gradeConcrete,
      });

      // Insert Maximum Size of Aggregate*
      section2.details.splice(coresIndex + 2, 0, {
        label: "Maximum Size of Aggregate*",
        value: maxAggSize,
      });
    }
  } else if (paramName === "PERMEABILITY_TEST") {
    // ✅ Update Description of the sample
    const descDetail = section2.details.find(
      (detail) => detail.label === "Description of the sample",
    );
    if (descDetail) {
      descDetail.value = "Concrete Cubes";
    }

    // ✅ Update Source of the sample
    const sourceDetail = section2.details.find(
      (detail) => detail.label === "Source of the sample",
    );
    if (sourceDetail) {
      sourceDetail.value = "Concrete Mix Design";
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
      margin: [0, 0, 0, 4],
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

const normalizeAnswer = (answer) => {
  if (answer === null || answer === undefined) return "";

  // Numbers & booleans → string
  if (typeof answer === "number" || typeof answer === "boolean") {
    return String(answer);
  }

  // Arrays → join values
  if (Array.isArray(answer)) {
    return answer
      .map((v) => (v === null || v === undefined ? "" : String(v)))
      .join(", ");
  }

  // Objects → try common patterns
  if (typeof answer === "object") {
    if ("value" in answer) return String(answer.value);
    if ("label" in answer) return String(answer.label);
    return JSON.stringify(answer);
  }

  // Strings
  return String(answer);
};

const sampReportDetails = (formattedRelayData, accessKey) => {
  const filteredDetails = formattedRelayData
    .filter((detail) => {
      const alwaysSkipLabels = [
        "Source",
        "No of samples",
        "Name of the Contractor",
        "Dimensions of specimen (mm)",
        "Section",
        "CA No",
      ];
      const conditionalSkipLabels = [
        "Sample Location/Id",
        "Brand",
        "Site Name",
        "Grade",
        "Ref Code",
        "No of samples",
        "Quantity",
        "Batch Number",
        "Lot Number",
        "Type",
        "Week Number",
        "Sample Id",
        "Due Date",
        "Name of the work",
      ];

      if (alwaysSkipLabels.includes(detail.label)) return false;

      if (
        conditionalSkipLabels.includes(detail.label) &&
        (accessKey === "KDM_HOD_TOKEN" || accessKey === "KDM_STAFF_TOKEN")
      ) {
        return false;
      }

      const safeAnswer = normalizeAnswer(detail.answer);
      console.log(safeAnswer, "safeAnswer786");

      // ❗ This line fixes the crash permanently
      if (safeAnswer.trim() === "") return false;

      // Attach normalized answer so we don’t recompute
      detail._safeAnswer = safeAnswer;
      return true;
    })
    .sort((a, b) => {
      if (a.label === "Aggregate Size") return -1;
      if (b.label === "Aggregate Size") return 1;
      return 0;
    });

  if (filteredDetails.length === 0) {
    return [];
  }

  const body = [];
  for (let i = 0; i < filteredDetails.length; i += 2) {
    if (i === filteredDetails.length - 1) {
      // ✅ Handle last odd element → full width row
      const detail = filteredDetails[i];
      body.push([
        {
          text: [
            { text: `${detail.label}: `, bold: true },
            { text: detail.answer },
          ],
          fontSize: 8,
          margin: [3, 2, 3, 2],
          // fillColor: "#ffffff",
          color: "#222",
          colSpan: 2,
        },
        {}, // required empty object for colSpan
      ]);
    } else {
      // ✅ Normal case → 2 items per row
      const row = [];
      [filteredDetails[i], filteredDetails[i + 1]].forEach((detail) => {
        row.push({
          text: [
            { text: `${detail.label}: `, bold: true },
            { text: detail.answer },
          ],
          fontSize: 8,
          margin: [3, 2, 3, 2],
          // fillColor: "#ffffff",
          color: "#222",
        });
      });
      body.push(row);
    }
  }

  return [
    {
      table: {
        widths: ["50%", "50%"],
        body,
      },
      layout: {
        hLineWidth: () => 0.4,
        vLineWidth: () => 0.4,
        hLineColor: () => "#222",
        vLineColor: () => "#222",
        paddingLeft: () => 2,
        paddingRight: () => 2,
        paddingTop: () => 1,
        paddingBottom: () => 1,
      },
    },
  ];
};
const GENERIC_MULTI_TABLE_IDS = [
  67, 29, 64, 130, 122, 150, 112, 151, 149, 166, 167, 152, 168, 127,
];
const getResultTable = (id, jdata) => {
  const paramId = jdata?.[0]?.param_id ?? null;
  // const paramName = jdata?.[0]?.paramName ?? null;
  console.log(jdata, paramId, "jdt68");
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
  switch (paramId) {
    case "20240806123456788":
    case "20240725182338307":
      return cubesAct(jdata);
  }
  // 🔥 MULTI-ID SUPPORT
  // if (GENERIC_MULTI_TABLE_IDS.includes(id)) {
  //   return genericMultiTable(jdata);
  // }

  switch (id) {
    case 92:
      return [
        ...tileWaterAbsorption(jdata),
        ...tileBreakingStrength(jdata),
        ...tileModulusOfRupture(jdata),
        ...tileMohsHardness(jdata),
        ...tileMoistureExpansion(jdata),
        ...tileDimensionsOfTiles(jdata),
      ];
    case 161:
      return [
        ...AcidTileWaterAbsorption(jdata),
        ...AcidtileBreakingStrength(jdata),
        ...AcidtileDimensionsOfTiles(jdata),
        ...AcidModulusOfRupture(jdata),
      ];
    case 158:
      return [
        ...AcidBricksCompressiveStrength(jdata),
        ...AcidBricksWaterAbsorption(jdata),
      ];
    case 106:
      return bitumenCoreMech(jdata);
    case 128:
      return [];
    case 17:
      return structuralStreelMech(jdata);

    case 163:
      return dynamicTable(jdata);

    case 24:
      return microSilicaMech(jdata);
    case 162:
      return getResultTable(jdata);
    case 80:
      return soilField(jdata);
    case 42:
      return cAggNablMech(jdata);
    case 43:
      return fAggMech(jdata);
    case 48:
      return soilMech(jdata);
    case 49:
      return flyAshMech(jdata);
    case 51:
      return bricksMech(jdata);

    case 155:
      return upvTable(jdata);
    case 119:
      return flyAshbricksMech(id, jdata);
    case 54:
      return bitumenMech(jdata);
    case 59:
      return concreteBlocksMech(jdata);
    case 146:
      return concreteBlocksMech(jdata);

    case 115:
      return concreteBlocksMech(jdata);

    case 147:
      return concreteBlocksMech(jdata);

    case 85:
      return rSteelMech(jdata);
    case 169:
      return dynamicTable(jdata);
    case 98:
      return genralTestTableCemMech(id, jdata);
    case 91:
      return genralTestTableCemMech(id, jdata);
    case 99:
      return genralTestTableCemMech(id, jdata);
    case 100:
      return genralTestTableCemMech(id, jdata);
    case 101:
      return genralTestTableCemMech(id, jdata);
    case 57:
      return dynamicTable2(jdata);

    case 63:
      return dynamicTable2(jdata);

    case 77:
      return gSbMech(jdata);
    case 94:
      return wmmMech(jdata);
    case 62:
      return jdata[0].isVigilenceMode ? cCoreMech2(jdata) : cCoreMech(jdata);

    //   case 62:
    // return  cCoreMech2(jdata);

    case 81:
      return paverBlocks(jdata);
    case 84:
      return rockMech(jdata);
    case 118:
      return concreteBlocksMech(jdata);
    case 107:
      return DBMmechanical(id, jdata);

    case 103:
      return ballastMech(jdata);

    case 157:
      return aacBlocks(jdata);

    case 120:
      return reboundMech(jdata);

    case 156:
      return reboundMech(jdata);

    // case 91: //cement
    //   return cementMech(id, jdata);
    // case 98: //cement
    //   return cementMech(id, jdata);
    // case 99: //cement
    //   return cementMech(id, jdata);
    // case 100: //cement
    //   return cementMech(id, jdata);
    // case 101: //cement
    //   return cementMech(id, jdata);
    // case 102: //cement
    //   return cementMech(id, jdata);

    default:
      return genralTestTable(id, jdata);
  }
};

const AuthorizationAndSigns = (signs) => {
  const { chemical, mechanical } = signs;

  const rows = [];

  if (chemical) {
    rows.push([
      {
        stack: [
          // {
          //   image: suhasinisign,
          //   width: 80,
          //   height: 40,
          //   margin: [0, -10, 0, -10],
          // },

          {
            stack: [
              {
                image: suhasinisign,
                width: 80,
                height: 40,
              },
              {
                text: "(Digitally Signed)",
                fontSize: 8,
                bold: true,
                alignment: "center",
                margin: [0, -14, 180, 0], // ⬅️ overlay on image
                color: "#555",
              },
            ],
          },

          { text: "Checked By", fontSize: 9 },
          { text: "Y. Suhasini", fontSize: 9 },
        ],
        border: [false, false, false, false],
      },
      {
        stack: [
          // {
          //   image: RajeshwariSign,
          //   width: 80,
          //   height: 40,
          //   alignment: "left",
          //   margin: [110, -10, 0, -3],
          // },

          {
            stack: [
              {
                image: RajeshwariSign,
                width: 80,
                height: 40,
                alignment: "left",
                margin: [110, -10, 0, -3],
              },
              {
                text: "(Digitally Signed)",
                fontSize: 8,
                bold: true,
                alignment: "center",
                margin: [0, -14, -30, 0], // ⬅️ overlay on image
                color: "#555",
              },
            ],
          },

          {
            text: "AUTHORISED SIGNATORY",
            fontSize: 9,
            alignment: "left",
            margin: [92, 0, 0, 0],
          },
          {
            text: "D. Rajeswari \n TECHNICAL MANAGER",
            fontSize: 9,
            alignment: "left",
            margin: [92, 0, 0, 0],
          },
        ],
        border: [false, false, false, false],
      },
    ]);
  }

  if (mechanical) {
    rows.push([
      {
        stack: [
          // {
          //   image: SanyasiRaoSign,
          //   width: 80,
          //   height: 40,
          //   margin: [0, -10, 0, -10],
          // },

          {
            stack: [
              {
                image: SanyasiRaoSign,
                width: 80,
                height: 40,
                alignment: "left",
                margin: [0, -10, 0, -10],
              },
              {
                text: "(Digitally Signed)",
                fontSize: 8,
                bold: true,
                alignment: "center",
                margin: [0, 0, 180, 0], // ⬅️ overlay on image
                color: "#555",
              },
            ],
          },

          { text: "Checked By", fontSize: 9 },
          { text: "P. Sanyasi Rao", fontSize: 9 },
        ],
        border: [false, false, false, false],
      },
      {
        stack: [
          // {
          //   image: RKsign,
          //   width: 80,
          //   height: 40,
          //   alignment: "left",
          //   margin: [110, -15, 0, -3],
          // },

          {
            stack: [
              {
                image: RKsign,
                width: 80,
                height: 40,
                alignment: "left",
                margin: [110, -15, 0, -3],
              },
              {
                text: "(Digitally Signed)",
                fontSize: 8,
                bold: true,
                alignment: "center",
                margin: [0, 0, -30, 0], // ⬅️ overlay on image
                color: "#555",
              },
            ],
          },

          {
            text: "AUTHORISED SIGNATORY",
            fontSize: 9,
            alignment: "left",
            margin: [92, 0, 0, 0],
          },
          {
            text: "M. Ramakrishna \n DIRECTOR TECHNICAL",
            fontSize: 9,
            alignment: "left",
            margin: [92, 0, 0, 0],
          },
        ],
        border: [false, false, false, false],
        pageBreak: "avoid",
      },
    ]);
  }

  return [
    {
      stack: [
        {
          text: "For KDM ENGINEERS (INDIA) PVT. LTD.,",
          fontSize: 9,
          alignment: "right",
          margin: [0, 35, 0, 0],
        },
        {
          table: {
            widths: ["50%", "50%"],
            body: rows,
          },
          layout: "noBorders",
        },
        {
          text: "***End of Report***",
          fontSize: 9,
          bold: true,
          alignment: "center",
          margin: [0, -20, 0, 0],
        },
      ],
      pageBreak: "avoid",
    },
  ];
};

// const getNotesAndDisclaimer = (paramName = "NO_CHANGE", parsedJdata = {}) => {
//   console.log(paramName,'paramName56')
//   if (paramName === "CONCRETE_CORE") {
//     return [];
//   }
//  let reportFormat = [];
//   let gradeArray = ["Fe550"];
//   if (Array.isArray(parsedJdata) && parsedJdata.length > 0) {
//     ({ gradeArray, specificationStatus,reportFormat } = parsedJdata[0]);
//   }

//   const failedGrades = Array.from(
//   new Set(
//     reportFormat
//       ?.filter(obj => Object.values(obj).some(val => String(val).includes('#')))
//       .map(obj => obj.grade)
//   )
// );

//   // console.log(gradeArray,reportFormat,failedGrades,'gradeArray67')

//   // let neededGrade = gradeArray?.[0] || "Fe550";
//   let neededGrade = gradeArray?.length ? gradeArray.map(g => g.replace(/_crs/g, "").replace(/d/g, "D").replace(/s/g, "S")) : ["Fe550"];

//   // console.log(neededGrade,'neededGrade345')

//   // neededGrade = neededGrade
//   //   .replace(/_crs/g, "")
//   //   .replace(/d/g, "D")
//   //   .replace(/s/g, "S");

//   const additionalCubeNote = {
//     text:
//       "28 days Compressive Strength calculated as per IS: 9013 - Method of making, curing and determining compressive strength\n" +
//       "of accelerated cured concrete test specimens. However, progressive development of strength at 3 days, 7 days and 28 days\n" +
//       "shall be the criteria for recommending the mix proportion.",
//     fontSize: 9,
//     margin: [0, 5, 0, 5],
//   };

//   const baseNotes = [...notesAndDisclaimerText.notes];

//   if (paramName === "PERMEABILITY_TEST") {
//     baseNotes.unshift(
//       "Penetration curve Acceptable",
//       "Direction application of water pressure on bottom of the specimen"
//     );
//   }

//   const content = [
//     {
//       text: notesAndDisclaimerText.customerNotes,
//       italics: true,
//       fontSize: 8,
//     },
//   ];

//   // ✅ Special note for CONCRETE_CUBES_ACT
//   if (paramName === "CONCRETE_CUBES_ACT") {
//     content.push(additionalCubeNote);
//   }

//   content.push(
//     {
//       columns: [
//         {
//           text: "Note:",
//           fontSize: 9,
//           width: 40,
//         },
//         {
//           ul: baseNotes.map((note) => ({
//             text: note,
//             fontSize: 9,

//             width: 60,
//           })),
//         },
//       ],
//     },
//     {
//       text: notesAndDisclaimerText.disclaimer,
//       fontSize: 9,
//     }
//   );

//   // ✅ Add remarks for RS_MECH
//   if (paramName === "RS_MECH") {
//     if (!specificationStatus) {
//       content.push({
//         text: `Remarks: The test parameters marked with # are not meeting the requirements of ${failedGrades?.join(', ')}`,
//         bold: true,
//         fontSize: 9,
//       });
//     } else {
//       content.push({
//         text: `Remarks: The above tested parameters are satisfying the requirements of ${neededGrade?.join(', ')}`,
//         bold: true,
//         fontSize: 9,
//       });
//     }
//   }

//   return content;
// };

const getNotesAndDisclaimer = (
  paramName = "NO_CHANGE",
  parsedJdata = {},
  witnessNames = [],
) => {
  console.log(parsedJdata, paramName, "paramName56");

  if (paramName === "CONCRETE_CORE" || paramName === "REBOUND_HAMMER") {
    return [];
  }

  let reportFormat = [];
  let gradeArray = ["Fe550"];
  let specificationStatus;

  let hasTYC = false;

  // ✅ TYC detection for BOTH GGBS & FLY ASH compressive strength
  if (Array.isArray(parsedJdata)) {
    const ttcParams = ["GGBS_COMPRESSIVE_STRENGTH", "FLY_COMPRESSIVE_STRENGTH"];

    const ttcObj = parsedJdata.find((item) =>
      ttcParams.includes(item.paramName),
    );

    if (ttcObj?.reportData?.length) {
      hasTYC = ttcObj.reportData.some(
        (row) => typeof row?.value === "string" && row.value.includes("TYC"),
      );
    }
  }

  if (
    paramName === "CEMENT_COMPRESSIVE_STRENGTH" &&
    Array.isArray(parsedJdata)
  ) {
    const cementObj = parsedJdata.find(
      (item) => item.paramName === "CEMENT_COMPRESSIVE_STRENGTH",
    );
    console.log(cementObj?.reportData, "parsedJdataparsedJdataparsedJdata");

    if (cementObj?.reportData?.length) {
      hasTYC = cementObj.reportData.some((row) => row?.value === "TYC");
    }
  }

  // 🔥 ONLY FOR FLYASH (NO EFFECT ON CEMENT)
  // ✅ FLYASH ONLY – CORRECT TYC DETECTION
  // 🔥 FLY ASH ONLY – TYC DETECTION (DO NOT TOUCH CEMENT)
  // if (
  //   paramName === "FLYASH_COMPRESSIVE_STRENGTH" &&
  //   Array.isArray(parsedJdata)
  // ) {
  //   const flyashObj = parsedJdata.find(
  //     (item) => item.paramName === "FLYASH_COMPRESSIVE_STRENGTH"
  //   );

  //   if (flyashObj?.reportData?.length) {
  //     hasTYC = flyashObj.reportData.some(
  //       (row) => typeof row?.value === "string" && row.value.includes("TYC")
  //     );
  //   }
  // }

  if (Array.isArray(parsedJdata) && parsedJdata.length > 0) {
    ({ gradeArray, specificationStatus, reportFormat } = parsedJdata[0]);
  }

  const failedGrades = Array.from(
    new Set(
      reportFormat
        ?.filter((obj) =>
          Object.values(obj).some((val) => String(val).includes("#")),
        )
        .map((obj) => obj.grade),
    ),
  );

  let neededGrade = gradeArray?.length
    ? gradeArray.map((g) =>
        g.replace(/_crs/g, "").replace(/d/g, "D").replace(/s/g, "S"),
      )
    : ["Fe550"];

  const additionalCubeNote = {
    text:
      "28 days Compressive Strength calculated as per IS: 9013 - Method of making, curing and determining compressive strength\n" +
      "of accelerated cured concrete test specimens. However, progressive development of strength at 3 days, 7 days and 28 days\n" +
      "shall be the criteria for recommending the mix proportion.",
    fontSize: 9,
    margin: [0, 5, 0, 5],
  };

  // ✅ clone base notes
  let baseNotes = [...notesAndDisclaimerText.notes];

  // ✅ remove sample retention note for specific paramNames
  const skipRetentionFor = [
    "PERMEABILITY_TEST",
    "FLEXURAL_TEST",

    "CONCRETE_CUBES",
    "UPV_TEST",
    "HALFCELL_TEST",
    "CARBONATION",
    "CONCRETE_CUBES_ACT",
  ];
  if (skipRetentionFor.includes(paramName) || hasTYC) {
    const retentionText =
      "Retention period of samples is 15 days from the date of issue of test report, then it will be disposed of.";
    const index = baseNotes.indexOf(retentionText);
    if (index !== -1) baseNotes.splice(index, 1);
  }
  const removeRetentionFor = [
    "UPV_TEST",
    "UPVTEST",
    "HALFCELL_TEST",
    "CARBONATION",
  ];

  if (removeRetentionFor.includes(paramName)) {
    baseNotes = baseNotes.filter(
      (n) => !n.startsWith("Retention period of samples"),
    );
  }

  if (paramName === "PERMEABILITY_TEST") {
    baseNotes.unshift(
      "Penetration curve Acceptable",
      "Direction application of water pressure on bottom of the specimen",
    );
  }
  let witnessNote = null;

  if (Array.isArray(witnessNames)) {
    const cleanNames = witnessNames.filter((n) => n.trim() !== "");
    if (cleanNames.length > 0) {
      const witnessLine = `That tests are witnessed by ${cleanNames.join(", ")}.`;
      baseNotes.unshift(witnessLine); // FIRST POINT
    }
  }
  const content = [
    {
      columns: [
        {
          text: notesAndDisclaimerText.customerNotes,
          italics: true,
          fontSize: 8,
          alignment: "left",
        },
        hasTYC
          ? {
              text: "#TYC - Test yet to be conducted",
              italics: true,
              fontSize: 8,
              alignment: "right",
            }
          : {},
      ],
    },
  ];

  // ✅ Special note for CONCRETE_CUBES_ACT
  if (paramName === "CONCRETE_CUBES_ACT") {
    content.push(additionalCubeNote);
  }
  if (witnessNote) {
    content.push(witnessNote);
  }
  content.push(
    {
      columns: [
        { text: "Note:", fontSize: 9, width: 40 },
        {
          ul: baseNotes.map((note) => ({
            text: note,
            fontSize: 9,
            width: 60,
          })),
        },
      ],
    },
    { text: notesAndDisclaimerText.disclaimer, fontSize: 9 },
  );

  // ✅ Remarks for RS_MECH
  if (paramName === "RS_MECH") {
    if (!specificationStatus) {
      content.push({
        text: `Remarks: The test parameters marked with # are not meeting the requirements of ${failedGrades?.join(", ")}`,
        bold: true,
        fontSize: 9,
      });
    } else {
      content.push({
        text: `Remarks: The above tested parameters are satisfying the requirements of ${neededGrade?.join(", ")}`,
        bold: true,
        fontSize: 9,
      });
    }
  }

  return content;
};

const backgroundStamp = (currentPage, pageSize) => {
  return {
    image: vizagStamp,
    width: 100,
    opacity: 1,
    absolutePosition: {
      x: 10,
      y: pageSize.height - 127,
    },
  };
};

const docDefinition = async (
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
) => {
  const { productInfo, jdata } = reportFunParams;
  const { id } = productInfo;
  let parsedJdata;

  try {
    parsedJdata = JSON.parse(jdata);
  } catch (error) {
    console.error("Error parsing jdata:", error);
    throw error;
  }

  const testTable = getResultTable(id, parsedJdata);
  console.log("isArray:", Array.isArray(testTable), "first:", testTable?.[0]);

  const targetParamIds = [
    "COARSE_AGGREGATE_SPECIFIC_GRAVITY",
    "CAGG_BULKDENSITY",
    "COARSE_AGGREGATE_FLAKINESS",
    "COARSE_AGGREGATE_CRUSHING_VALUE",
    "ABRASION_VALUE_TEST",
    "COARSE_AGGREGATE_IMPACTVALUE_HARDNESS",
    "10_PERCENT_FINES_VALUE",
    "COARSE_AGGREGATE_SOUNDNESS_SODIUM",
    "COARSE_AGGREGATE_DELETORIOUS_MATERIAL",
    "COARSE_AGGREGATE_IMPACTVALUE_HARDNESS",
    "SOIL_BEARING_RATIO_TEST",
    "COARSE_AGGREGATE_FLAKINESS",
    "SOIL_STANDARD_MODIFIED_CONPACTION_TEST",
    "SOIL_ATTERBURGH_LIMITS",
    "COARSE_AGGREGATE_WATER_ABSORPTION",
    "WMM_WATER_ABSORPTION",
    "MECH_NON_NABL_COMBO",
  ];

  const hasMatchingParamId = parsedJdata?.some((item) =>
    targetParamIds.includes(item.param_id),
  );

  const hasStrippingValue = parsedJdata?.some(
    (item) => item.param_id === "STRIPPING_VALUE",
  );
  const hasWetTransverse = parsedJdata?.some(
    (p) => p.param_id === "WET_TRANSVERSE_STRENGTH",
  );
  const hasChequeredWaterAbs = parsedJdata.some(
    (p) => p.param_id === "CHEQURED_BRICKS",
  );
  const extraTables =
    id === 128
      ? [
          ...(hasChequeredWaterAbs ? chequeredMech(parsedJdata) : []),
          ...(hasWetTransverse ? wetTransverseStrength(parsedJdata) : []),
        ]
      : id === 42 && hasStrippingValue
        ? [
            ...(hasMatchingParamId ? [cAggNablMech2(jdata)] : []),
            ...coarseAggStrippingValue(parsedJdata),
          ]
        : id === 43 && hasMatchingParamId
          ? [cAggNablMech2(jdata)]
          : id === 42 && hasMatchingParamId
            ? [cAggNablMech2(jdata)]
            : id === 94 && hasMatchingParamId
              ? [wmmCommonMech(jdata)]
              : id === 77 && hasMatchingParamId
                ? [gsbRemMech(jdata)]
                : [];

  const notedParamIds = [
    "CONCRETE_CUBES_ACT",
    "PERMEABILITY_TEST",
    "RS_MECH",
    "CONCRETE_CORE",
  ];

  const hasMatchingNotesParamId = parsedJdata?.find((item) =>
    notedParamIds.includes(item.paramName),
  );
  const paramName = hasMatchingNotesParamId?.paramName || "NO_CHANGE";
  // console.log(paramName, "pr78");
  const headerContent = await createNABLheaderwithReportInfo(
    reportFunParams,
    true,
    jId,
    toUpload,
    finalUpload,
  );

  return {
    pageMargins: [40, 140, 40, 40],
    padding: [0, 0, 0, 0],
    // header: createNABLheaderwithReportInfo(reportFunParams, (nabl = true)),
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
    styles: {
      title: {
        fontSize: 24,
        bold: true,
      },
      header: {
        fontSize: 18,
        bold: true,
      },
      tableHeader: {
        fontSize: 10,
        color: "black",
        fillColor: "#CCCCCC",
      },
      defaultStyle: {
        font: "Roboto",
      },
      listItem: {
        fontSize: 8,
      },
    },
    content: [
      ...recipientDetails(reportFunParams, accessKey, endD),
      testReportDetails(
        reportFunParams,
        parsedJdata,
        startD,
        endD,
        accessKey,
        formattedRelayData,
      ),
      ...(formattedRelayData.length > 0
        ? sampReportDetails(formattedRelayData, accessKey)
        : []),
      testTable,
      ...extraTables,
      ...getNotesAndDisclaimer(paramName, parsedJdata),
      ...(accessKey !== "KDM_HOD_TOKEN" && accessKey !== "KDM_STAFF_TOKEN"
        ? AuthorizationAndSigns(signs)
        : []),
    ],

    styles: {
      title: {
        fontSize: 14,
        bold: true,
        alignment: "center",
      },
      tableHeader: { bold: true, fontSize: 9, fillColor: "#CCCCCC" },
    },
  };
};

const nablMechanical = async (
  reportFunParams,
  jId,
  start_date,
  end_date,
  res,
  formattedRelayData,
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
      start_date,
      end_date,
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

        // === CASE 2: return buffer (to mimic bulk) ===
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
    console.error("Internal server error:", error);
    if (!bulk && res) {
      res.status(500).send("Internal server error");
    }
    throw error; // important for bulk mode
  }
};

module.exports = {
  nablMechanical,
  recipientDetails,
  AuthorizationAndSigns,
  testReportDetails,
  sampReportDetails,
  getNotesAndDisclaimer,
  backgroundStamp,
};
