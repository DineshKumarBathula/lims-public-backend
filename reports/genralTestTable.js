const {
  REPORT_HEADER_PARTICULARS,
  REPORT_HEADER_TEST_METHOD,
  // REPORT_HEADER_SPECIFICATIONS,
  REPORT_HEADER_RESULTS,
  REPORT_HEADER_SNO,
} = require("./consts");
const FLYASH_SPEC = require("./flyAshSpecifications");
const spec = FLYASH_SPEC.IS_3812_2013;
const flyAshSpecMap = {
  FLYASH_SiO2Al2O3Fe2O3: "OXIDES_SUM",
  GGBSSIO2: "SIO2",
  FLYASH_MAGNISIA: "MGO",
  FLYASH_SULPHURIC_ANHYDRIDE: "SO3",
  FLYASH_LOI: "LOI",
  FLYASH_ALKALI_CONTENT: "ALKALIS",
  CEMENT_CHLORIDE_CONTENT: "LIME_REACTIVITY",
};

const getCementCompressiveStrength = (
  reportData,
  counter,
  parsedJdata,
  param_id
) => {
  const ind = parsedJdata.findIndex(
    (each) =>
      (each.param_id === "CEMENT_COMPRESSIVE_STRENGTH" &&
        each.param_id === param_id) ||
      each.param_id === "FINE_AGGREGATES_CHLORIDES_SULPHATES" ||
      each.param_id === "CHLORIDES_SULPHATES" ||
      (each.param_id === "CEMENT_SETTING_TIME" && each.param_id === param_id)
  );

  return reportData.map((each, idx) => {
    return [
      idx === 0
        ? {
            text: ind + 1,
            rowSpan: reportData.length,
            fontSize: 8,
            alignment: "center",
            margin: [0, 1, 0, 1],
          }
        : "", // Leave blank for rowspan continuation
      {
        text: each.key,
        fontSize: 8,

        alignment: "center",
        margin: [0, 1, 0, 1],
      },
      {
        text: each.testMethod || "",
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },
      {
        text: each.value?.toString() || "",
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },
      {
        text: each.requirements || "",
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },
    ];
  });
};

const dontShowParams = [
  "CEMENT_SIO2",
  "CEMENT_FE2O3",
  "CEMENT_AL203",
  "GGBS_NORMAL_CONSISTENCY2",
  "GGBS_NORMAL_CONSISTENCY2",
  "CEMENT_CALCIUM",
];
const getVisibleIndex = (parsedJdata, currentParamId) => {
  let count = 0;

  for (const p of parsedJdata) {
    if (p.param_id === currentParamId) break;
    if (!dontShowParams.includes(p.param_id)) {
      count++;
    }
  }

  return count; // ✅ IMPORTANT: no +1
};

const genralTestTable = (id, parsedJdata) => {
  const body = [];
  console.log(parsedJdata,id, "parsedJdata734");

  const BITUMEN_ORDER_139 = [
  "BITUMEN_PENITRATION",
  "BITUMEN_ABSOLUTE_VISCOCITY",
  "BITUMEN_KINEMATIC_VISCOCITY",
  "BITUMEN_FLASH_POINT",
  "BITUMEN_SOLUBILITY",
  "BITUMEN_SP",
  "BITUMEN_VISC",
  "BITUMEN_DUCTILITY",
];


  const compressiveRowIndexes = new Set();
  const getFormattedRow = (each, idx, param_id) => {
    const { key, value, testMethod, requirements } = each;
    console.log(each, "requirements453");
    return [
      {
        text: idx + 1,
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },
      {
        text: key,
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },
      {
        text: testMethod,
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },
      {
        text: value,
        fontSize: 8,
        alignment: param_id === "ORGANIC_IMPURITIES" ? "left" : "center",
        margin: [0, 2, 0, 2],
      },
      {
        text: requirements,
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },
    ];
  };

  const coarseFineFormattedRow = (each, idx) => {
    const { key, value, testMethod, requirements } = each;

    // Updated parameter and result formatting as per image
    return [
      {
        text: idx + 1,
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },
      {
        text: [
          { text: "Alkali aggregate Reactivity :\n", bold: true },
          {
            text:
              "a) Reduction in Alkalinity of 1.0 N NaOH (Millimoles/Ltr)\n" +
              "b) NaOH Dissolved Silica as SiO₂ (Millimoles/Ltr)",
          },
        ],
        fontSize: 8,
        alignment: "left",
        margin: [0, 1, 0, 1],
      },
      {
        text: "2386 (Part VII)",
        fontSize: 8,
        alignment: "center",
        margin: [0, 23, 0, 1],
      },
      {
        text: [
          { text: `a) ${value.avg_alkali}\n\n` },
          {
            text: `b) ${value.silica_avg}`,
          },
        ],
        fontSize: 8,
        alignment: "center",
        margin: [0, 15, 0, 1],
      },
      {
        text: requirements,
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },
    ];
  };

  const soilSulphatesRow = (each, idx) => {
    const { key, value, testMethod, requirements } = each;
    console.log(value, "va87");
    // Updated parameter and result formatting as per image
    return [
      {
        text: idx + 1,
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },
      {
        text: [
          { text: "Total Soluble Sulphate :\n", alignment: "center" },
          {
            text: "a) as SO4\n" + "b) as Na2SO4",
            alignment: "center",
          },
        ],
        fontSize: 8,
        alignment: "left",
        margin: [0, 1, 0, 1],
      },
      {
        text: testMethod,
        fontSize: 8,
        alignment: "center",
        margin: [0, 8, 0, 1],
      },
      {
        text: [
          { text: `a) ${value.avgSo4}\n` },
          {
            text: `b) ${value.avgNa2So4}`,
          },
        ],
        fontSize: 8,
        alignment: "center",
        margin: [0, 11, 0, 1],
      },
      {
        text: requirements,
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },
    ];
  };

  const distillation = (each, idx) => {
    const { key, value, testMethod, requirements } = each;
    console.log(value, requirements, "va87");
    // Updated parameter and result formatting as per image
    return [
      {
        text: idx + 1,
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },
      {
        text: [
          { text: "Distillation (%) Volume at \n", alignment: "center" },
          {
            text: "a) 190°C\n\n" + "b) 225°C\n\n" + "c) 260°C\n\n" + "d) 316°C\n\n" + "e) Residue at 360°C",
            alignment: "center",
          },
        ],
        fontSize: 8,
        alignment: "left",
        margin: [0, 1, 0, 1],
      },
      {
        text: testMethod,
        fontSize: 8,
        alignment: "center",
        margin: [0, 33, 0, 1],
      },
      {
        text: [
          { text: `${value.v190}\n\n` },
          {
            text: `${value.v225}\n\n`,
          },
          {
            text: `${value.v260}\n\n`,
          },
          {
            text: `${value.v316}\n\n`,
          }, 
          {
            text: `${value.res}`,
          },
        ],
        fontSize: 8,
        alignment: "center",
        margin: [0, 11, 0, 1],
      },
      {
        text: [
          { text: `${requirements.v190}\n\n` },
          {
            text: `${requirements.v225}\n\n`,
          },
          {
            text: `${requirements.v260}\n\n`,
          },
          {
            text: `${requirements.v316}\n\n`,
          },
            {
            text: `${requirements.res}`,
          },
        ],
        fontSize: 8,
        alignment: "center",
        margin: [0, 11, 0, 1],
      },
    ];
  };

  const reorderBitumenParamsFor139 = (parsedJdata) => {
  const orderMap = new Map(
    BITUMEN_ORDER_139.map((p, i) => [p, i])
  );

  const ordered = [];
  const rest = [];

  parsedJdata.forEach((item) => {
    if (orderMap.has(item.param_id)) {
      ordered.push(item);
    } else {
      rest.push(item);
    }
  });

  // sort only the known bitumen params
  ordered.sort(
    (a, b) => orderMap.get(a.param_id) - orderMap.get(b.param_id)
  );

  return [...ordered, ...rest];
};

if (id == 139 && Array.isArray(parsedJdata)) {
  parsedJdata = reorderBitumenParamsFor139(parsedJdata);
}



  let REPORT_HEADER_SPECIFICATIONS = "Specifications";
  if (id === 99) {
    REPORT_HEADER_SPECIFICATIONS =
      "Requirements as per IS:455-2015(Reaffirmed 2020)";
  } else if (id === 98) {
    REPORT_HEADER_SPECIFICATIONS =
      "Requirements as per Table I IS:1489(Part-1):2015,(Reaffirmed 2020)";
  } else if (id === 49) {
    REPORT_HEADER_SPECIFICATIONS =
      "Requirements as per IS:3812(Part-1):2013 (RA-2022) Table-1";
  } else if (id === 101) {
    REPORT_HEADER_SPECIFICATIONS =
      "Requirements as per IS:269-2015(Reaffirmed 2020)";
  } else if (id === 24) {
    REPORT_HEADER_SPECIFICATIONS =
      "Requirements as per IS:15388:2003(RA 2022)Table -1 Clause-4";
  } else if (id === 158) {
    REPORT_HEADER_SPECIFICATIONS =
      "Requirements as per IS:4860 1968 RA 2022 Table 3";
  } else if (id === 26) {
    REPORT_HEADER_SPECIFICATIONS =
      "Requirements as per IS:456-2000(Permissible Limit)";
  } else if (id === 27) {
    REPORT_HEADER_SPECIFICATIONS =
      "Requirements as per IS:10500-2012 Acceptable Limits(Max)";
  } else if (id === 76) {
    REPORT_HEADER_SPECIFICATIONS = "Requirements as per IS:16714-2018";
  } else if (id === 33) {
    REPORT_HEADER_SPECIFICATIONS = "Requiements as IS 9103:1999(Table-2)";
  }

  let headerRow = [];

  if (id === 49) {
    headerRow = [
      {
        text: REPORT_HEADER_SNO,
        style: "tableHeader",
        alignment: "center",
        rowSpan: 3,
      },
      {
        text: REPORT_HEADER_PARTICULARS,
        style: "tableHeader",
        alignment: "center",
        rowSpan: 3,
      },
      {
        text: REPORT_HEADER_TEST_METHOD,
        style: "tableHeader",
        alignment: "center",
        rowSpan: 3,
      },
      {
        text: REPORT_HEADER_RESULTS,
        style: "tableHeader",
        alignment: "center",
        rowSpan: 3,
      },

      {
        text: "Requirements as per",
        style: "tableHeader",
        alignment: "center",
        colSpan: 4,
      },
      {},
      {},
      {},
    ];

    body.push(headerRow);

    // Part headers
    body.push([
      {},
      {},
      {},
      {},
      {
        text: "IS:3812:2013 Part 1-Table 1",
        style: "tableHeader",
        alignment: "center",
        colSpan: 2,
      },
      {},
      {
        text: "IS:3812:2013 Part 2- Table 1",
        style: "tableHeader",
        alignment: "center",
        colSpan: 2,
      },
      {},
    ]);

    // Sub headers
    body.push([
      {},
      {},
      {},
      {},
      {
        text: "Siliceous Pulverized Fuel Ash",
        style: "tableHeader",
        alignment: "center",
      },
      {
        text: "Calcareous Pulverized Fuel Ash",
        style: "tableHeader",
        alignment: "center",
      },
      {
        text: "Siliceous Pulverized Fuel Ash",
        style: "tableHeader",
        alignment: "center",
      },
      {
        text: "Calcareous Pulverized Fuel Ash",
        style: "tableHeader",
        alignment: "center",
      },
    ]);
  } else {
    headerRow = [
      { text: REPORT_HEADER_SNO, style: "tableHeader", alignment: "center" },
      {
        text: REPORT_HEADER_PARTICULARS,
        style: "tableHeader",
        alignment: "center",
      },
      {
        text: REPORT_HEADER_TEST_METHOD,
        style: "tableHeader",
        alignment: "center",
      },
      {
        text: REPORT_HEADER_RESULTS,
        style: "tableHeader",
        alignment: "center",
      },
      {
        text: REPORT_HEADER_SPECIFICATIONS,
        style: "tableHeader",
        alignment: "center",
      },
    ];

    body.push(headerRow);
  }


  const isZeroValue = (val) => {
  if (val === null || val === undefined) return false;

  // Case 1: primitive (number / string)
  if (typeof val !== "object") {
    const num = Number(val);
    return !Number.isNaN(num) && num === 0;
  }

  // Case 2: object → check all numeric values inside
  const values = Object.values(val);

  if (values.length === 0) return false;

  return values.every((v) => {
    const num = Number(v);
    return !Number.isNaN(num) && num === 0;
  });
};

 

// 🔥 FILTER ZERO VALUES FOR ID 52 & 139
if ((id === 52 || id === 139) && Array.isArray(parsedJdata)) {
  parsedJdata = parsedJdata
    .map((param) => {
      const filteredReportData = param.reportData?.filter(
        (row) => !isZeroValue(row?.value)
      );

      // drop param completely if no rows left
      if (!filteredReportData || filteredReportData.length === 0) {
        return null;
      }

      return {
        ...param,
        reportData: filteredReportData,
      };
    })
    .filter(Boolean);
}



  let counter = 0;
  let flyAshSno = 1;
  let sno = body.length;
  for (const { reportData, param_id } of parsedJdata) {
    if (
      id === 49 &&
      !flyAshSpecMap[param_id] &&
      !param_id.startsWith("FLYASH_")
    ) {
      continue;
    }
    if (dontShowParams.includes(param_id)) {
      continue;
    }
    // ✅ FLY ASH – IS:3812 (ID = 49)
    if (id === 49 && flyAshSpecMap[param_id]) {
      const specKey = flyAshSpecMap[param_id];

      reportData.forEach((each) => {
        const safe = (v) => (v === undefined || v === null ? "-" : v);

        body.push([
          { text: flyAshSno++, fontSize: 8, alignment: "center" },
          { text: each.key || "-", fontSize: 8, alignment: "left" },
          { text: each.testMethod || "-", fontSize: 8, alignment: "center" },
          {
            text: each.value?.toString() || "-",
            fontSize: 8,
            alignment: "center",
          },
          {
            text: safe(spec.PART_1.SILICEOUS[specKey]),
            fontSize: 8,
            alignment: "center",
          },
          {
            text: safe(spec.PART_1.CALCAREOUS[specKey]),
            fontSize: 8,
            alignment: "center",
          },
          {
            text: safe(spec.PART_2.SILICEOUS[specKey]),
            fontSize: 8,
            alignment: "center",
          },
          {
            text: safe(spec.PART_2.CALCAREOUS[specKey]),
            fontSize: 8,
            alignment: "center",
          },
        ]);
      });

      counter++;
      continue; // 🔴 IMPORTANT: stop further formatting
    }
    if (param_id === "GGBS_COMPRESSIVE_STRENGTH") {
      const baseSno = getVisibleIndex(parsedJdata, param_id);

      reportData.forEach((each, idx) => {
        const currentSno = baseSno + idx; // ✅ 4, 5 (UNCHANGED)

        const values = (each.value || "").split("\n");
        const testSample = values[0] || "-";
        const plainCement = values[1] || "-";
        const activityIndex = values[2] || "-";

        const title = each.key.split(",")[0];

        // ROW 1 – Comparative Strength + Test Sample
        body.push([
          {
            text: currentSno,
            rowSpan: 3,
            alignment: "center",
            fontSize: 8,
          },
          {
            text: [{ text: title + ":\n" }, { text: "i)Test Sample(N/mm²)" }],
            alignment: "left",
            fontSize: 8,
          },
          {
            text: each.testMethod,
            rowSpan: 3,
            alignment: "center",
            fontSize: 8,
          },
          {
            text: testSample,
            alignment: "center",
            fontSize: 8,
          },
          {
            text: each.requirements,
            rowSpan: 3,
            alignment: "center",
            fontSize: 8,
          },
        ]);

        // ROW 2 – Plain Cement
        body.push([
          "",
          { text: "ii)Plain Cement mortar cube(N/mm²)", fontSize: 8 },
          "",
          { text: plainCement, alignment: "center", fontSize: 8 },
          "",
        ]);

        // ROW 3 – Activity Index
        body.push([
          "",
          { text: "iii)Activity Index (%)", fontSize: 8 },
          "",
          { text: activityIndex, alignment: "center", fontSize: 8 },
          "",
        ]);
      });

      continue;
    }

    if (
      param_id === "CEMENT_COMPRESSIVE_STRENGTH" ||
      param_id === "FINE_AGGREGATES_CHLORIDES_SULPHATES" ||
      param_id === "CHLORIDES_SULPHATES" ||
      param_id === "CEMENT_SETTING_TIME"
    ) {
      const rows = getCementCompressiveStrength(
        reportData,
        counter,
        parsedJdata,
        param_id
      );
      rows.forEach((row) => {
        compressiveRowIndexes.add(body.length);
        body.push(row);
      });
    } else {
      reportData?.forEach((test, idx) => {
        console.log(param_id, "ALL IS WELL");
        if (param_id === "20240418112228524") {
          body.push(getFormattedRow(test, idx));
        } else if (
          (param_id === "MAJOR_OXIDES") |
          (param_id === "MECHANICAL_COMPOSITION")
        ) {
          // console.log(test,'ALL IS WELL222')
          body.push(getFormattedRow(test, idx));
        } else if (param_id === "20240603153036976") {
          body.push(coarseFineFormattedRow(test, counter));
        } else if (param_id === "SOIL_SOLUABLE_SULPHATES") {
          body.push(soilSulphatesRow(test, counter));
        } else if (param_id === "EMULSION_DISTILLATION") {
          body.push(distillation(test, counter));
        } else {
          body.push(getFormattedRow(test, counter, param_id));
        }
      });
    }

    counter++;
  }
  const widths =
    id === 49
      ? ["5%", "26%", "12%", "12%", "11%", "11%", "11%", "12%"]
      : ["5%", "31%", "15%", "19%", "35%"];

  return {
    table: {
      headerRows: id === 49 ? 3 : 1,
      // widths: ["auto", "*", "*", "auto", "*"],
      widths,
      body,
    },
    layout: {
      fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
      hLineWidth: (i) => 0.5,
      vLineWidth: (i) => 0.5, // You can customize per cell too, if needed
      hLineColor: () => "#000000",
      vLineColor: () => "#000000",
    },
    margin: [0, 5, 0, 0],
  };
};

module.exports = genralTestTable;
