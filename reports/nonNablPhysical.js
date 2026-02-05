const PdfPrinter = require("pdfmake");

const path = require("path");
const { vizagStamp } = require("./filePaths");
const {
  createNABLheader,
  createNonNABLheader,
  createNABLheaderwithReportInfo,
} = require("./header");

require("dotenv").config();
const JOB_REPORTS = process.env.JOB_REPORTS || "tb-kdm-job-reports";
const { toWords } = require("number-to-words");

//aws
const AWS = require("aws-sdk");
const { Jobs } = require("../models/index.js");

const cAggNablMech = require("./NablMechanical/cAggNablMech.js");
const cementNablMech = require("./NablMechanical/cementMech.js");
const fAggMech = require("./NablMechanical/fAggMech.js");
const flyAshMech = require("./NablMechanical/flyAshMech.js");
const rSteel = require("./NablMechanical/rSteel.js");
const soilMech = require("./NablMechanical/soilMech.js");
const genericMultiTable = require("./NablMechanical/genericMultiTable.js");
const tileWaterAbsorption = require("./NablMechanical/tileWaterAbsorption");
const tileBreakingStrength = require("./NablMechanical/tileBreakingStrength");
const tileModulusOfRupture = require("./NablMechanical/tileModulusOfRupture");
const tileMohsHardness = require("./NablMechanical/tileMohsHardness");
const AcidBricksWaterAbsorption = require("./NablMechanical/acidbrickswater.js");
const AcidBricksCompressiveStrength = require("./NablMechanical/BricksComp.js");
const AcidModulusOfRupture = require("./NablMechanical/AcidModules.js");
const AcidtileDimensionsOfTiles = require("./NablMechanical/AcidtilesDimensions.js");
const AcidtileBreakingStrength = require("./NablMechanical/acidstrength.js");
const AcidTileWaterAbsorption = require("./NablMechanical/acidtileswater.js");
const tileMoistureExpansion = require("./NablMechanical/tilesexpansion.js");
const tileDimensionsOfTiles = require("./NablMechanical/tileDimensionsOfTiles");
const microSilicaMech = require("./NablMechanical/microSilicaMech.js");
const structuralStreelMech = require("./NablMechanical/structuralStreelMech.js");
const bitumenMech = require("./NablMechanical/bitumenMech.js");
const cAggNablMech2 = require("./NablMechanical/cAggNablMech2.js");
const { getTestReportBody } = require("../defs/customFunctions.js");
const genralTestTable = require("./genralTestTable.js");
const dynamicTable = require("./NablMechanical/dynamicTable.js");
const paverBlocks = require("./NablMechanical/paverBlocks.js");
const bitumenCoreMech = require("./NablMechanical/bitumenCore.js");
const getHTWireFullWidthTable = require("./NablMechanical/htStand.js");
const cCoreMech = require("./NablMechanical/cCoreMech.js");
const cCoreMech2 = require("./NablMechanical/cCoreMech2.js");
const FixedKnotFence = require("./NablMechanical/FixedKnotFence.js");
const WireRope = require("./NablMechanical/wireRope.js");
const { convertToDDMMYYYY } = require("../defs/customFunctions.js");
const {
  // recipientDetails,
  sampReportDetails,
  AuthorizationAndSigns,
  getNotesAndDisclaimer,
  backgroundStamp,
} = require("./nablMechanical.js");
const bricksMech = require("./NablMechanical/bricksMech.js");
const upvTable = require("./upvTable.js");
const carbonationTable = require("./carbonation.js");
const concreteBlocksMech = require("./NablMechanical/concreteBlocksMech.js");
const wmmCommonMech = require("./NablMechanical/wmmCommonMech.js");
const gsbRemMech = require("./NablMechanical/gsbCRemMech.js");
const DBMmechanical = require("./NablMechanical/DBMmechanical.js");
const { createFooterWithSigns } = require("./footer.js");
const genralTestTableCemMech = require("./genericTableCemMech.js");
const cementMech = require("./cementMech.js");
const compositeMechanical = require("./compositeMechanical.js");
const createWaterMark = require("./waterMark.js");
const reboundMech = require("./NablMechanical/rebound.js");
const aacBlocks = require("./NablMechanical/aacBlocks.js");
const wmmMech = require("./NablMechanical/wMMSieveMech.js");
const gSbMech = require("./NablMechanical/gSBSieveMech.js");
const flyAshbricksMech = require("./NablMechanical/flyAshBricksMech.js");
const coarseAggStrippingValue = require("./NablMechanical/coarseAggStrippingValue.js");
const wetTransverseStrength = require("./NablMechanical/wetTransverseStrength");
const chequeredMech = require("./NablMechanical/chequeredMech");

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

  console.log(sampleInfo, "sectio2n2sectio2n2");

  const specificReportDetails = jData
    .map((each) => each.reportData?.specficReportDetails)
    .flat();

  const section2 = getTestReportBody(
    orderInfo,
    sampleInfo,
    productInfo,
    specificReportDetails,
    start_date,
    end_date,
    jData,
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
      margin: [0, 4, 0, 4],
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
            margin: [0, 0, 0, 0],
            width: "2%",
            alignment: "center",
          },
          {
            text: detail.value,
            fontSize: 9,
            margin: [0, 0, 0, 0],
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
const PARAM_ID_TABLE_MAP = {
  "20251201173637774": upvTable,
  "20250822103144805": carbonationTable,
};

const PARAM_TABLE_MAP = {
  UPV_TEST: upvTable,
  CARBONATION: carbonationTable,
};
const GENERIC_MULTI_TABLE_IDS = [
  67, 29, 64, 130, 122, 150, 112, 151, 149, 166, 167, 152, 168, 127,
];
const getResultTable = (id, jdata) => {
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
  switch (paramId) {
    case "20240806123456788":
    case "20240725182338307":
      return cubesAct(jdata);
  }
  // if (GENERIC_MULTI_TABLE_IDS.includes(id)) {
  //   return genericMultiTable(jdata);
  // }
  // ✅ PRODUCT 120 → PARAM-BASED ONLY
  if (id === 120) {
    // 1️⃣ paramId (highest priority)
    if (PARAM_ID_TABLE_MAP[paramId]) {
      return PARAM_ID_TABLE_MAP[paramId](jdata);
    }

    // 2️⃣ paramName
    if (PARAM_TABLE_MAP[paramName]) {
      return PARAM_TABLE_MAP[paramName](jdata);
    }

    return dynamicTable(jdata);
  }

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
    case 55:
      return bitumenCoreMech(jdata);
    case 162:
      return dynamicTable(jdata);
    case 163:
      return dynamicTable(jdata);
    case 17:
      return structuralStreelMech(jdata);
    case 128:
      return null;
    case 169:
      return dynamicTable(jdata);

    case 24:
      return microSilicaMech(jdata);

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

    case 54:
      return bitumenMech(jdata);

    case 59:
      return concreteBlocksMech(jdata);

    case 146:
      return concreteBlocksMech(jdata);

    case 115:
      return concreteBlocksMech(jdata);

    case 115:
      return concreteBlocksMech(jdata);

    case 147:
      return concreteBlocksMech(jdata);
    case 120:
      return dynamicTable(jdata);

    case 85:
      return dynamicTable(jdata);
    case 155:
      return upvTable(jdata);
    case 107:
      return DBMmechanical(id, jdata);

    case 119:
      return flyAshbricksMech(id, jdata);

    case 157:
      return concreteBlocksMech(jdata);

    case 142:
      return getHTWireFullWidthTable(jdata);

    case 127:
      return FixedKnotFence(jdata);

    case 167:
      return WireRope(jdata);

    // case 98:
    //   return genralTestTableCemMech(id, jdata);
    // case 91:
    //   return genralTestTableCemMech(id, jdata);
    // case 99:
    //   return genralTestTableCemMech(id, jdata);
    // case 100:
    //   return genralTestTableCemMech(id, jdata);
    // case 101:
    //   return genralTestTableCemMech(id, jdata);
    // case 102:
    //   return genralTestTableCemMech(id, jdata);

    case 163:
      return dynamicTable(jdata);

    case 57:
      return dynamicTable(jdata);
    case 118:
      return concreteBlocksMech(jdata);
    case 81:
      return paverBlocks(jdata);

    case 91: //cement
      return cementMech(id, jdata);
    case 98: //cement
      return cementMech(id, jdata);
    case 99: //cement
      return cementMech(id, jdata);
    case 100: //cement
      return cementMech(id, jdata);
    case 101: //cement
      return cementMech(id, jdata);
    case 102: //cement
      return cementMech(id, jdata);

    //composite cement
    case 121:
      return compositeMechanical(id, jdata);
    case 122:
      return compositeMechanical(id, jdata);
    case 123:
      return compositeMechanical(id, jdata);
    case 124:
      return compositeMechanical(id, jdata);
    case 125:
      return compositeMechanical(id, jdata);
    case 126:
      return compositeMechanical(id, jdata);
    case 127:
      return compositeMechanical(id, jdata);
    case 62:
      return jdata[0].isVigilenceMode ? cCoreMech2(jdata) : cCoreMech(jdata);

    case 120:
      return reboundMech(jdata);

    case 156:
      return reboundMech(jdata);

    case 157:
      return aacBlocks(jdata);

    case 77:
      return gSbMech(jdata);
    case 94:
      return wmmMech(jdata);

    default:
      return genralTestTable(id, jdata);
  }
};

const docDefinition = async (
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
    "MECH_NON_NABL_COMBO",
    "WMM_WATER_ABSORPTION",
    "ELECTRICAL_RESISTIVITY",
  ];

  const hasMatchingParamId = parsedJdata?.some((item) =>
    targetParamIds.includes(item.param_id),
  );

  const notedParamIds = [
    "CONCRETE_CUBES_ACT",
    "PERMEABILITY_TEST",
    "RS_MECH",
    "UPV_TEST",
    "CARBONATION",
    "HALFCELL_TEST",
    "CONCRETE_CORE",
    "REBOUND_HAMMER",
    "CEMENT_COMPRESSIVE_STRENGTH",
  ];

  const hasMatchingNotesParamId = parsedJdata?.find((item) =>
    notedParamIds.includes(item.paramName),
  );

  const paramName = hasMatchingNotesParamId?.paramName || "NO_CHANGE";

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

  const headerContent = await createNABLheaderwithReportInfo(
    reportFunParams,
    false,
    jId,
    toUpload,
    finalUpload,
  );

  return {
    pageMargins: [40, 150, 40, 50],
    // header: createNABLheaderwithReportInfo(reportFunParams, (nabl = false)),
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
      ...getNotesAndDisclaimer(
        // parsedJdata[0]?.paramName,
        paramName,
        parsedJdata,
        parsedJdata[0]?.witnessNames || [],
      ),

      ...(accessKey !== "KDM_HOD_TOKEN" && accessKey !== "KDM_STAFF_TOKEN"
        ? AuthorizationAndSigns(signs)
        : []),
    ],

    styles: {
      title: {
        fontSize: 24,
        bold: true,
      },
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 0],
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
  };
};

const nonNablMechanical = async (
  reportFunParams,
  jId,
  start_date,
  end_date,
  res,
  formattedRelayData,
  accessKey,
  delteriousCondition,
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
      delteriousCondition,
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
    console.error("Error generating PDF:", error);
    if (!bulk && res) {
      res.status(500).send("Internal server error");
    }
    throw error; // important for bulk mode
  }
};

module.exports = { nonNablMechanical };

//fixme
