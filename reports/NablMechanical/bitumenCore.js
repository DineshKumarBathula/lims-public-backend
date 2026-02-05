// const bitumenCoreMech = (jdata) => {
//   try {
//     const parsedJdata = jdata;
//     console.log(parsedJdata, "parsedJdata335");

//     // Extract Marshall and Compaction data
//     const marshalData = parsedJdata.find(
//       (item) => item.param_id === "BITUMEN_DUCTILITY"
//     );
//     const compactionData = parsedJdata.find(
//       (item) => item.param_id === "CORE_DENSITY_TEST"
//     );

//         const specificGravity = parsedJdata.find(
//       (item) => item.param_id === "FLASK_DETERMINATION"
//     );

// const specificGravityData= specificGravity?.reportData || [];
//     const marshalTable = marshalData?.reportData || [];
//     const compactLabDensity= compactionData?.formData?.labDensity || "2.555"
//     const compactionTable = compactionData?.reportData || [];

//     console.log(specificGravityData, "compactionTable");
//     // console.log(marshalTable, "marshalTable");

//     const content = [];

//     // ========== MARSHALL TABLES ==========
//     if (marshalTable && marshalTable.length > 0) {
//       marshalTable.forEach((set) => {
//         const avg = set.average || {};

//         const tableHeader = [
//           [
//             {
//               text: `Marshall Test Results (Set ${set.setIndex})`,
//               colSpan: 4,
//               style: "tableHeader",
//               alignment: "center",
//               fontSize: 11,
//               bold: true,
//             },
//             {},
//             {},
//             {},
//           ],
//           [
//             {
//               text: "Test Parameters",
//               style: "tableHeader",
//               alignment: "center",
//             },
//             { text: "Test Method", style: "tableHeader", alignment: "center" },
//             { text: "Results", style: "tableHeader", alignment: "center" },
//             {
//               text: "Requirements As per MORTH (Rev-5)",
//               style: "tableHeader",
//               alignment: "center",
//             },
//           ],
//         ];

//         const tableBody = [
//           [
//             { text: "Marshall Lab Density", alignment: "left", fontSize: 9 },
//             { text: "ASTM D2726", alignment: "center", fontSize: 9 },
//             { text: avg.correctGmb || "-", alignment: "center", fontSize: 9 },
//             { text: "-", alignment: "center", fontSize: 9 },
//           ],
//           [
//             { text: "Marshall Stability (kN)", alignment: "left", fontSize: 9 },
//             { text: "ASTM D6927", alignment: "center", fontSize: 9 },
//             {
//               text: avg.correctedStability || "-",
//               alignment: "center",
//               fontSize: 9,
//             },
//             {
//               text: "Min. 9.0 (Table 500-11)",
//               alignment: "center",
//               fontSize: 9,
//             },
//           ],
//           [
//             { text: "Flow (mm)", alignment: "left", fontSize: 9 },
//             { text: "ASTM D6927", alignment: "center", fontSize: 9 },
//             { text: avg.flow || "-", alignment: "center", fontSize: 9 },
//             { text: "2 - 4 (Table 500-11)", alignment: "center", fontSize: 9 },
//           ],
//         ];

//         const marshalTableObj = {
//           table: {
//             headerRows: 2,
//             widths: ["35%", "20%", "15%", "30%"],
//             body: [...tableHeader, ...tableBody],
//           },
//           layout: {
//             fillColor: (rowIndex) => (rowIndex < 2 ? "#CCCCCC" : null),
//             hLineWidth: () => 0.5,
//             vLineWidth: () => 0.5,
//             hLineColor: () => "#000000",
//             vLineColor: () => "#000000",
//           },
//           margin: [0, 5, 0, 10],
//         };

//         content.push(marshalTableObj);
//       });
//     }

//     // ========== COMPACTION TABLE ==========
//     if (compactionTable && compactionTable.length > 0) {

//       const compactionHeader = [
//         [
//           {
//             text: `Lab Density: ${compactLabDensity} g/cc`,
//             colSpan: 5,
//             alignment: "right",
//             fontSize: 9,
//             bold: true,
//             margin: [0, 0, 10, 0],
//           },
//           {},
//           {},
//           {},
//           {},
//         ],
//         [
//           { text: "S. No", style: "tableHeader", alignment: "center" },
//           {
//             text: "Chainage / Offset*",
//             style: "tableHeader",
//             alignment: "center",
//           },
//           {
//             text: "Thickness of Core (mm)",
//             style: "tableHeader",
//             alignment: "center",
//           },
//           {
//             text: "Field Density (g/cc)",
//             style: "tableHeader",
//             alignment: "center",
//           },
//           {
//             text: "Degree of Compaction (%)",
//             style: "tableHeader",
//             alignment: "center",
//           },
//         ],
//       ];

//       const compactionBody = compactionTable.map((row, index) => [
//         { text: String(index + 1), alignment: "center", fontSize: 9 },
//         { text: `Common Road Ch.${row.Location || "-"}`, alignment: "left", fontSize: 9 },
//         {
//           text: row.Thickness?.toFixed?.(1) ?? row.Thickness ?? "-",
//           alignment: "center",
//           fontSize: 9,
//         },
//         {
//           text: row["Corrected Density"] ?? "-",
//           alignment: "center",
//           fontSize: 9,
//         },
//         {
//           text: row["% Compaction w.r.t Lab Density"] ?? "-",
//           alignment: "center",
//           fontSize: 9,
//         },
//       ]);

//       const compactionTableObj = {
//         table: {
//           headerRows: 2,
//           widths: ["10%", "35%", "20%", "15%", "20%"],
//           body: [...compactionHeader, ...compactionBody],
//         },
//         layout: {
//           fillColor: (rowIndex) => (rowIndex < 2 ? "#CCCCCC" : null),
//           hLineWidth: () => 0.5,
//           vLineWidth: () => 0.5,
//           hLineColor: () => "#000000",
//           vLineColor: () => "#000000",
//         },
//         margin: [0, 10, 0, 10],
//       };

//       content.push(compactionTableObj);
//     }

//     if (content.length === 0) {
//       return null;
//     }

//     return content;
//   } catch (err) {
//     console.error("Error generating Marshall/Compaction tables:", err.message);
//     return null;
//   }
// };

// module.exports = bitumenCoreMech;

const bitumenCoreMech = (jdata) => {
  try {
    const parsedJdata = jdata;
    console.log(parsedJdata, "parsedJdata335");
    const binderContent = parsedJdata.find(
      (item) => item.param_id === "BITUMEN_EXTRACTION"
    );

    const binderReportData = binderContent?.reportData || [];

    // Extract Marshall, Compaction, and Specific Gravity data
    const marshalData = parsedJdata.find(
      (item) => item.param_id === "BITUMEN_DUCTILITY"
    );
    const compactionData = parsedJdata.find(
      (item) => item.param_id === "CORE_DENSITY_TEST"
    );
    const specificGravity = parsedJdata.find(
      (item) => item.param_id === "FLASK_DETERMINATION"
    );

    const specificGravityData = specificGravity?.reportData || [];
    const marshalTable = marshalData?.reportData || [];
    const compactLabDensity = compactionData?.formData?.labDensity || "2.555";
    const compactionTable = compactionData?.reportData || [];

    console.log(specificGravityData, "specificGravityData");

    const content = [];

    // ========== MARSHALL TABLES ==========
    if (marshalTable && marshalTable.length > 0) {
      marshalTable.forEach((set) => {
        const avg = set.average || {};

        const tableHeader = [
          [
            {
              text: `Marshall Test Results (Set ${set.setIndex})`,
              colSpan: 4,
              style: "tableHeader",
              alignment: "center",
              fontSize: 11,
              bold: true,
            },
            {},
            {},
            {},
          ],
          [
            {
              text: "Test Parameters",
              style: "tableHeader",
              alignment: "center",
            },
            { text: "Test Method", style: "tableHeader", alignment: "center" },
            { text: "Results", style: "tableHeader", alignment: "center" },
            {
              text: "Requirements As per MORTH (Rev-5)",
              style: "tableHeader",
              alignment: "center",
            },
          ],
        ];

        const tableBody = [
          [
            { text: "Marshall Lab Density", alignment: "left", fontSize: 9 },
            { text: "ASTM D2726", alignment: "center", fontSize: 9 },
            { text: avg.correctGmb || "-", alignment: "center", fontSize: 9 },
            { text: "-", alignment: "center", fontSize: 9 },
          ],
          [
            { text: "Marshall Stability (kN)", alignment: "left", fontSize: 9 },
            { text: "ASTM D6927", alignment: "center", fontSize: 9 },
            {
              text: avg.correctedStability || "-",
              alignment: "center",
              fontSize: 9,
            },
            {
              text: "Min. 9.0 (Table 500-11)",
              alignment: "center",
              fontSize: 9,
            },
          ],
          [
            { text: "Flow (mm)", alignment: "left", fontSize: 9 },
            { text: "ASTM D6927", alignment: "center", fontSize: 9 },
            { text: avg.flow || "-", alignment: "center", fontSize: 9 },
            { text: "2 - 4 (Table 500-11)", alignment: "center", fontSize: 9 },
          ],
        ];

        const marshalTableObj = {
          table: {
            headerRows: 2,
            widths: ["35%", "20%", "15%", "30%"],
            body: [...tableHeader, ...tableBody],
          },
          layout: {
            fillColor: (rowIndex) => (rowIndex < 2 ? "#CCCCCC" : null),
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#000000",
            vLineColor: () => "#000000",
          },
          margin: [0, 5, 0, 10],
        };

        content.push(marshalTableObj);
      });
    }

    // ========== COMPACTION TABLE ==========
    if (compactionTable && compactionTable.length > 0) {
      const compactionHeader = [
        [
          {
            text: `Lab Density: ${compactLabDensity} g/cc`,
            colSpan: 5,
            alignment: "right",
            fontSize: 9,
            bold: true,
            margin: [0, 0, 10, 0],
          },
          {},
          {},
          {},
          {},
        ],
        [
          { text: "S. No", style: "tableHeader", alignment: "center" },
          {
            text: "Chainage / Offset*",
            style: "tableHeader",
            alignment: "center",
          },
          {
            text: "Thickness of Core (mm)",
            style: "tableHeader",
            alignment: "center",
          },
          {
            text: "Field Density (g/cc)",
            style: "tableHeader",
            alignment: "center",
          },
          {
            text: "Degree of Compaction (%)",
            style: "tableHeader",
            alignment: "center",
          },
        ],
      ];

      const compactionBody = compactionTable.map((row, index) => [
        { text: String(index + 1), alignment: "center", fontSize: 9 },
        {
          text: `Common Road Ch.${row.Location || "-"}`,
          alignment: "left",
          fontSize: 9,
        },
        {
          text: row.Thickness?.toFixed?.(1) ?? row.Thickness ?? "-",
          alignment: "center",
          fontSize: 9,
        },
        {
          text: row["Corrected Density"] ?? "-",
          alignment: "center",
          fontSize: 9,
        },
        {
          text: row["% Compaction w.r.t Lab Density"] ?? "-",
          alignment: "center",
          fontSize: 9,
        },
      ]);

      const compactionTableObj = {
        table: {
          headerRows: 2,
          widths: ["10%", "35%", "20%", "15%", "20%"],
          body: [...compactionHeader, ...compactionBody],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex < 2 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        margin: [0, 10, 0, 10],
      };

      content.push(compactionTableObj);
    }

    // ========== SPECIFIC GRAVITY TABLE ==========
    if (specificGravityData && specificGravityData.length > 0) {
      const sgHeader = [
        [
          {
            text: "Test Parameters",
            style: "tableHeader",
            alignment: "center",
          },
          { text: "Test Method", style: "tableHeader", alignment: "center" },
          { text: "Results", style: "tableHeader", alignment: "center" },
          {
            text: "Requirements As per MORTH (Rev-5)",
            style: "tableHeader",
            alignment: "center",
          },
        ],
      ];

      const sgBody = specificGravityData.map((row) => [
        { text: row.key || "-", alignment: "left", fontSize: 9 },
        { text: row.testMethod || "-", alignment: "center", fontSize: 9 },
        { text: row.value || "-", alignment: "center", fontSize: 9 },
        { text: row.specification || "-", alignment: "center", fontSize: 9 },
      ]);

      const sgTableObj = {
        table: {
          headerRows: 1,
          widths: ["35%", "20%", "15%", "30%"],
          body: [...sgHeader, ...sgBody],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        margin: [0, 5, 0, 10],
      };

      content.push(sgTableObj);
    }
    // ========== BINDER CONTENT TABLE ==========
    // ========== BINDER CONTENT ==========
    if (binderReportData && binderReportData.length > 0) {
      const binderHeader = [
        [
          {
            text: "Test Parameters",
            style: "tableHeader",
            alignment: "center",
          },
          { text: "Test Method", style: "tableHeader", alignment: "center" },
          { text: "Results", style: "tableHeader", alignment: "center" },
          {
            text: "Requirements As per MORTH (Rev-5)",
            style: "tableHeader",
            alignment: "center",
          },
        ],
      ];

      const binderBody = binderReportData.map((row) => [
        { text: row.key || "-", alignment: "left", fontSize: 9 },
        { text: row.testMethod || "-", alignment: "center", fontSize: 9 },
        { text: row.value || "-", alignment: "center", fontSize: 9 },
        { text: row.specification || "-", alignment: "center", fontSize: 9 },
      ]);

      const binderTableObj = {
        table: {
          headerRows: 1,
          widths: ["35%", "20%", "15%", "30%"],
          body: [...binderHeader, ...binderBody],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        margin: [0, 5, 0, 10],
      };

      content.push(binderTableObj);
    }

    if (content.length === 0) {
      return null;
    }

    return content;
  } catch (err) {
    console.error("Error generating tables:", err.message);
    return null;
  }
};

module.exports = bitumenCoreMech;
