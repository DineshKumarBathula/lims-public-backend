// const soilMech = (jdata) => {
//   try {
//     const parsedJdata = jdata;

//     const grainSize = parsedJdata.find(
//       (item) => item.param_id === "COARSE_AGGREGATE_SIEVE_ANALYSIS",
//     )?.reportData?.[0];
//     const atterberg = parsedJdata.find(
//       (item) => item.param_id === "SOIL_ATTERBURGH_LIMITS",
//     )?.reportData?.[0];
//     const heavyCompaction = parsedJdata.find(
//       (item) => item.param_id === "SOIL_STANDARD_MODIFIED_CONPACTION_TEST",
//     )?.reportData?.[0];
//     const freeSwell = parsedJdata.find(
//       (item) => item.param_id === "SOIL_FREE_SWELL_INDEX",
//     )?.reportData?.[0];
//     const cbr = parsedJdata.find(
//       (item) => item.param_id === "SOIL_BEARING_RATIO_TEST",
//     )?.reportData?.[0];

//     console.log(
//       parsedJdata.find((item) => item.param_id === "SOIL_ATTERBURGH_LIMITS")
//         ?.reportData,
//       "atterberg",
//     );

//     const testRows = [
//       {
//         title: "Grain Size Analysis (%)",
//         method: "IS: 2720 (Part-4)",
//         values: [
//           ["Gravel", grainSize?.value1],
//           ["Sand", grainSize?.value2],
//           ["Silt & Clay", grainSize?.value3],
//         ],
//         spec: ["---", "---", "---"],
//       },
//       {
//         title: "Atterberg Limits (%)",
//         method: "IS: 2720 (Part-5)",
//         values: [
//           ["Liquid Limit", atterberg?.value1],
//           ["Plastic Limit", atterberg?.value2],
//           ["Plasticity Index", atterberg?.value3],
//         ],
//         spec: [
//           "Max.50% (Clause No.305.2.1.1)",
//           "---",
//           "Max.25% (Clause No.305.2.1.1)",
//         ],
//       },
//       {
//         title: "Heavy Compaction",
//         method: "IS: 2720 (Part-8)",
//         values: [
//           ["MDD (g/cc)", heavyCompaction?.value1],
//           ["OMC (%)", heavyCompaction?.value2],
//         ],
//         spec: ["Refer MORTH (Table No.300-1)", "---"],
//       },
//       {
//         title: "Free Swell Index (%)",
//         method: "IS: 2720 (Part-40)",
//         values: [["Free Swell Index", freeSwell?.value]],
//         spec: ["Max.50% (Clause No. 305.2.1.2)"],
//       },
//       {
//         title: "Soaked CBR (%)",
//         method: "IS: 2720 (Part-16)",
//         values: [["Soaked CBR", cbr?.value]],
//         spec: ["---"],
//       },
//     ];

//     const tableBody = [
//       [
//         { text: "Sl. No", style: "tableHeader", alignment: "center" },
//         { text: "Test Parameter", style: "tableHeader", alignment: "center" },
//         { text: "Test Method", style: "tableHeader", alignment: "center" },
//         {
//           text: "Result",
//           style: "tableHeader",
//           alignment: "center",
//           colSpan: 2,
//         },
//         {},
//         {
//           text: "Requirements As per MORTH (Rev-5)",
//           style: "tableHeader",
//           alignment: "center",
//         },
//       ],
//     ];

//     testRows.forEach((row, idx) => {
//       const getRowSpan = () => {
//         if (row.title === "Grain Size Analysis (%)") return 3;
//         if (row.title === "Atterberg Limits (%)") return 3;
//         if (row.title === "Heavy Compaction") return 2;
//         return 1;
//       };

//       const rowSpan = getRowSpan();

//       row.values.forEach((val, subIdx) => {
//         const isFirstRow = subIdx === 0;

//         const paddingNeeded =
//           row.title === "Grain Size Analysis (%)" ||
//           row.title === "Atterberg Limits (%)";
//         const paddingNeeded2 = row.title === "Heavy Compaction";

//         tableBody.push([
//           {
//             text: isFirstRow ? `${idx + 1}` : "",
//             fontSize: 9,
//             alignment: "center",
//             rowSpan: isFirstRow ? rowSpan : undefined,
//             margin:
//               isFirstRow && paddingNeeded
//                 ? [0, 15, 0, 0]
//                 : paddingNeeded2
//                   ? [0, 8, 0, 0]
//                   : undefined,
//           },
//           {
//             text: isFirstRow ? row.title : "",
//             fontSize: 9,
//             rowSpan: isFirstRow ? rowSpan : undefined,
//             margin:
//               isFirstRow && paddingNeeded
//                 ? [0, 15, 0, 0]
//                 : paddingNeeded2
//                   ? [0, 8, 0, 0]
//                   : undefined,
//           },
//           {
//             text: isFirstRow ? row.method : "",
//             fontSize: 9,
//             rowSpan: isFirstRow ? rowSpan : undefined,
//             margin:
//               isFirstRow && paddingNeeded
//                 ? [0, 15, 0, 0]
//                 : paddingNeeded2
//                   ? [0, 8, 0, 0]
//                   : undefined,
//           },
//           {
//             text: `${val?.[0] ?? ""}`,
//             fontSize: 9,
//             alignment: "left",
//           },
//           {
//             text: `${val?.[1] ?? "-"}`,
//             fontSize: 9,
//             alignment: "left",
//           },
//           {
//             text: row.spec?.[subIdx] ?? "-",
//             fontSize: 9,
//           },
//         ]);
//       });
//     });

//     return {
//       table: {
//         headerRows: 1,
//         widths: ["5%", "23%", "20%", "15%", "5%", "32%"],
//         body: tableBody,
//       },
//       layout: {
//         fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
//         hLineWidth: () => 0.5,
//         vLineWidth: () => 0.5,
//         hLineColor: () => "#000000",
//         vLineColor: () => "#000000",
//       },
//       margin: [0, 5, 0, 0],
//     };
//   } catch (err) {
//     console.error("Error generating soil mech table:", err.message);
//     return null;
//   }
// };
const soilField = require("./soilField");

const soilMech = (jdata) => {
  try {
    const parsedJdata = jdata;

    const grainSize = parsedJdata.find(
      (item) => item.param_id === "COARSE_AGGREGATE_SIEVE_ANALYSIS"
    )?.reportData?.[0];
    const atterberg = parsedJdata.find(
      (item) => item.param_id === "SOIL_ATTERBURGH_LIMITS"
    )?.reportData?.[0];
    const heavyCompaction = parsedJdata.find(
      (item) => item.param_id === "SOIL_STANDARD_MODIFIED_CONPACTION_TEST"
    )?.reportData?.[0];
    const freeSwell = parsedJdata.find(
      (item) => item.param_id === "SOIL_FREE_SWELL_INDEX"
    )?.reportData?.[0];
    const cbr = parsedJdata.find(
      (item) => item.param_id === "SOIL_BEARING_RATIO_TEST"
    )?.reportData?.[0];

    const testRows = [];

    // console.log(heavyCompaction,'heavyCompaction245')

    if (grainSize) {
      testRows.push({
        title: "Grain Size Analysis (%)",
        method: "IS: 2720 (Part-4)",
        values: [
          ["Gravel", grainSize?.value1],
          ["Sand", grainSize?.value2],
          ["Silt & Clay", grainSize?.value3],
        ],
        spec: ["---", "---", "---"],
      });
    }

    if (atterberg) {
      testRows.push({
        title: "Atterberg Limits (%)",
        method: "IS: 2720 (Part-5)",
        values: [
          ["Liquid Limit", atterberg?.value1],
          ["Plastic Limit", atterberg?.value2],
          ["Plasticity Index", atterberg?.value3],
        ],
        spec: [
          "Max.50% (Clause No.305.2.1.1)",
          "---",
          "Max.25% (Clause No.305.2.1.1)",
        ],
      });
    }

    if (heavyCompaction) {
      const compactionTitle =
        heavyCompaction.key === "Heavy Compaction"
          ? "Heavy Compaction"
          : "Light Compaction";

      const compactionMethod =
        heavyCompaction.key === "Heavy Compaction"
          ? "IS: 2720 (Part-8)"
          : "IS: 2720 (Part-7)";

      testRows.push({
        title: compactionTitle,
        method: compactionMethod,
        values: [
          ["MDD (g/cc)", heavyCompaction?.value1],
          ["OMC (%)", heavyCompaction?.value2],
        ],
        spec: ["Refer MORTH (Table No.300-1)", "---"],
      });
    }

    if (freeSwell) {
      testRows.push({
        title: "Free Swell Index (%)",
        method: "IS: 2720 (Part-40)",
        values: [["Free Swell Index", freeSwell?.value]],
        spec: ["Max.50% (Clause No. 305.2.1.2)"],
      });
    }

    if (cbr) {
      testRows.push({
        title: "Soaked CBR (%)",
        method: "IS: 2720 (Part-16)",
        values: [["Soaked CBR", cbr?.value]],
        spec: ["---"],
      });
    }

    const tableBody = [
      [
        { text: "Sl. No", style: "tableHeader", alignment: "center" },
        { text: "Test Parameter", style: "tableHeader", alignment: "center" },
        { text: "Test Method", style: "tableHeader", alignment: "center" },
        {
          text: "Result",
          style: "tableHeader",
          alignment: "center",
          colSpan: 2,
        },
        {},
        {
          text: "Requirements As per MORTH (Rev-5)",
          style: "tableHeader",
          alignment: "center",
        },
      ],
    ];

    testRows.forEach((row, idx) => {
      const getRowSpan = () => {
        if (row.title === "Grain Size Analysis (%)") return 3;
        if (row.title === "Atterberg Limits (%)") return 3;
        // if (row.title === "Heavy Compaction") return 2;
        if (
          row.title === "Heavy Compaction" ||
          row.title === "Light Compaction"
        )
          return 2;

        return 1;
      };

      const rowSpan = getRowSpan();

      row.values.forEach((val, subIdx) => {
        const isFirstRow = subIdx === 0;

        const paddingNeeded =
          row.title === "Grain Size Analysis (%)" ||
          row.title === "Atterberg Limits (%)";
        const paddingNeeded2 =
          row.title === "Heavy Compaction" || row.title === "Light Compaction";

        tableBody.push([
          {
            text: isFirstRow ? `${idx + 1}` : "",
            fontSize: 9,
            alignment: "center",
            rowSpan: isFirstRow ? rowSpan : undefined,
            margin:
              isFirstRow && paddingNeeded
                ? [0, 15, 0, 0]
                : paddingNeeded2
                  ? [0, 8, 0, 0]
                  : undefined,
          },
          {
            text: isFirstRow ? row.title : "",
            fontSize: 9,
            rowSpan: isFirstRow ? rowSpan : undefined,
            margin:
              isFirstRow && paddingNeeded
                ? [0, 15, 0, 0]
                : paddingNeeded2
                  ? [0, 8, 0, 0]
                  : undefined,
          },
          {
            text: isFirstRow ? row.method : "",
            fontSize: 9,
            rowSpan: isFirstRow ? rowSpan : undefined,
            margin:
              isFirstRow && paddingNeeded
                ? [0, 15, 0, 0]
                : paddingNeeded2
                  ? [0, 8, 0, 0]
                  : undefined,
          },
          {
            text: `${val?.[0] ?? ""}`,
            fontSize: 9,
            alignment: "left",
          },
          {
            text: `${val?.[1] ?? "-"}`,
            fontSize: 9,
            alignment: "left",
          },
          {
            text: row.spec?.[subIdx] ?? "-",
            fontSize: 9,
          },
        ]);
      });
    });

    // ✅ Soil Mechanical Table
    const soilMechTable =
      tableBody.length > 1
        ? {
            table: {
              headerRows: 1,
              widths: ["5%", "23%", "20%", "15%", "5%", "32%"],
              body: tableBody,
            },
            layout: {
              fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => "#000000",
              vLineColor: () => "#000000",
            },
            margin: [0, 5, 0, 0],
          }
        : null;

    // ✅ Field Dry Density Table (Core Cutter / Sand Replacement)
    const fieldDensityTable = soilField(parsedJdata);
    const content = [];

    if (soilMechTable) content.push(soilMechTable);

    if (Array.isArray(fieldDensityTable)) {
      content.push(...fieldDensityTable);
    } else if (fieldDensityTable) {
      content.push(fieldDensityTable);
    }

    // 🔥 IMPORTANT: return ARRAY
    return content;
  } catch (err) {
    console.error("Error generating soil mech table:", err.message);
    return [];
  }
};

module.exports = soilMech;
