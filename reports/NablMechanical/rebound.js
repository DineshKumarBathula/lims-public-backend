// const reboundMech = (parsedJdata) => {
//   const entry = parsedJdata?.[0] || {};

//   const tables = entry.formData?.tables || [];
//   const rows = tables[1]?.rows || [];

//   const witnesses = entry.formData?.witnesses || [];
//   const reportData = entry.reportData || [];

//   console.log(tables, "parsedJdata786");

//   // Witness line logic
//   const witnessText =
//     witnesses.length > 0
//       ? `Tests were witnessed by ${witnesses.join(", ")}`
//       : "Tests were witnessed by customer representatives.";

//   // Table Header Row
//   const headerRow = [
//     { text: "Location of the Test", style: "tableHeader", alignment: "center" },
//     { text: "R1", style: "tableHeader", alignment: "center" },
//     { text: "R2", style: "tableHeader", alignment: "center" },
//     { text: "R3", style: "tableHeader", alignment: "center" },
//     { text: "R4", style: "tableHeader", alignment: "center" },
//     { text: "R5", style: "tableHeader", alignment: "center" },
//     { text: "R6", style: "tableHeader", alignment: "center" },
//     { text: "Corrected Rebound Number", style: "tableHeader", alignment: "center" },
//     { text: "Predicted In situ strength", style: "tableHeader", alignment: "center" },
//   ];

//   // Dynamic Table Rows
//   const tableRows = rows.map((r, index) => {
//     console.log(r,'need878')
//     const reportRow = reportData[index] || {};

//     return [
//       { text: r.location || "-", alignment: "center", fontSize: 9 },
//       { text: r.r1 ?? "-", alignment: "center", fontSize: 9 },
//       { text: r.r2 ?? "-", alignment: "center", fontSize: 9 },
//       { text: r.r3 ?? "-", alignment: "center", fontSize: 9 },
//       { text: r.r4 ?? "-", alignment: "center", fontSize: 9 },
//       { text: r.r5 ?? "-", alignment: "center", fontSize: 9 },
//       { text: r.r6 ?? "-", alignment: "center", fontSize: 9 },
//       {
//         text: r.correctedReboundFactor?.toString() || "-",
//         alignment: "center",
//         fontSize: 9,
//       },
//       {
//         text: r.estnStrength?.toString() || "-",
//         alignment: "center",
//         fontSize: 9,
//       },
//     ];
//   });

//   // Table Body
//   const tableBody = [
//     [
//       {
//         text: "Rebound Hammer Test Results",
//         alignment: "center",
//         fontSize: 10,
//         colSpan: 9,
//       },
//       {}, {}, {}, {}, {}, {}, {}, {},
//     ],
//     [
//       {
//         text: "IS:516 Part 5 / Sec 4",
//         alignment: "center",
//         fontSize: 10,
//         colSpan: 9,
//       },
//       {}, {}, {}, {}, {}, {}, {}, {},
//     ],
//     headerRow,
//     ...tableRows,
//   ];

//   // ------------------------
//   // Test Observations Section
//   // ------------------------
//   const testObservations = {
//     margin: [0, 2, 0, 0],
//     stack: [
//       { text: "Test Observations :", fontSize: 10, margin: [0, 5, 0, 1] },
//       {
//         ol: [
//           "Estimated in-situ strength of the Raft by Rebound Hammer Test values are based on calculated rebound numbers.",
//           "As per clause 8.1 of IS 516 (Part 5 / Sec 4), the actual in-situ compressive strength would be ±25 % of the estimated value.",
//           "Estimated compressive strength is worked out using the calibration chart for the test instrument.",
//         ],
//         fontSize: 9,
//       },
//     ],
//   };

//   // ------------------------
//   // Notes Section
//   // ------------------------
//   const notesSection = {
//     margin: [0, 6, 0, 0],
//     stack: [
//       { text: "Note:", fontSize: 10, margin: [0, 0, 0, 1] },
//       {
//         ol: [
//           "Test was carried out as per the requirement of customer.",
//           "Test locations were shown by the customer.",
//           witnessText,
//           "Report shall not be reproduced, except in full, without written approval of the laboratory.",
//           "Any corrections invalidate this report.",
//         ],
//         fontSize: 9,
//       },
//     ],
//   };

//   return {
//     stack: [
//       {
//         table: {
//           headerRows: 3,
//           widths: ["*", 25, 25, 25, 25, 25, 25, 60, 60],
//           body: tableBody,
//         },
//         layout: {
//           fillColor: (rowIndex) => (rowIndex === 2 ? "#E5E5E5" : null),
//           hLineWidth: () => 0.6,
//           vLineWidth: () => 0.6,
//           hLineColor: () => "#000",
//           vLineColor: () => "#000",
//         },
//         margin: [0, 5, 0, 0],
//       },
//       testObservations,
//       notesSection,
//     ],
//   };
// };

// module.exports = reboundMech;


const reboundMech = (parsedJdata) => {
  const entry = parsedJdata?.[0] || {};

  const tables = entry.formData?.tables || [];
  const witnesses = entry.formData?.witnesses || [];
  const reportData = entry.reportData || [];

  // Witness line logic
  const witnessText =
    witnesses.length > 0
      ? `Tests were witnessed by ${witnesses.join(", ")}`
      : "Tests were witnessed by customer representatives.";

  // Table Header Row (common for all tables)
  const headerRow = [
    { text: "Location of the Test", style: "tableHeader", alignment: "center",fontSize: 8, },
    { text: "R1", style: "tableHeader", alignment: "center",fontSize: 8, },
    { text: "R2", style: "tableHeader", alignment: "center",fontSize: 8, },
    { text: "R3", style: "tableHeader", alignment: "center",fontSize: 8, },
    { text: "R4", style: "tableHeader", alignment: "center",fontSize: 8, },
    { text: "R5", style: "tableHeader", alignment: "center",fontSize: 8, },
    { text: "R6", style: "tableHeader", alignment: "center" ,fontSize: 8,},
    { text: "Corrected Rebound Number", style: "tableHeader", alignment: "center",fontSize: 8, },
    { text: "Predicted In situ strength", style: "tableHeader", alignment: "center",fontSize: 8, },
  ];

  // ------------------------
  // Build tables dynamically
  // ------------------------
  const tablesStack = tables.flatMap((tbl, tableIndex) => {
    const rows = tbl.rows || [];

    const tableRows = rows.map((r, rowIndex) => {
      const reportRow = reportData[rowIndex] || {};

      return [
        { text: r.location || "-", alignment: "center", fontSize: 9 },
        { text: r.r1 ?? "-", alignment: "center", fontSize: 9 },
        { text: r.r2 ?? "-", alignment: "center", fontSize: 9 },
        { text: r.r3 ?? "-", alignment: "center", fontSize: 9 },
        { text: r.r4 ?? "-", alignment: "center", fontSize: 9 },
        { text: r.r5 ?? "-", alignment: "center", fontSize: 9 },
        { text: r.r6 ?? "-", alignment: "center", fontSize: 9 },
        {
          text: r.correctedReboundFactor?.toString() || "-",
          alignment: "center",
          fontSize: 9,
        },
        {
          text: r.estnStrength?.toString() || "-",
          alignment: "center",
          fontSize: 9,
        },
      ];
    });

    const tableBody = [
      [
        {
          text: "Rebound Hammer Test Results",
          alignment: "center",
          fontSize: 9,
          colSpan: 9,
        },
        {}, {}, {}, {}, {}, {}, {}, {},
      ],
      [
        {
          text: "IS:516 Part 5 / Sec 4",
          alignment: "center",
          fontSize: 9,
          colSpan: 9,
        },
        {}, {}, {}, {}, {}, {}, {}, {},
      ],
      // headerRow,
        headerRow.map(cell => ({ ...cell })),

      ...tableRows,
    ];

    return [
      // ✅ Table Description
tbl.description?.trim()
  ? {
      text: tbl.description.trim(),
      fontSize: 10,
      bold: true,
      margin: [0, tableIndex === 0 ? 5 : 7, 0, 3],
    }
  : null,


      // ✅ Actual Table
      {
        table: {
          headerRows: 3,
          widths: ["*", 25, 25, 25, 25, 25, 25, 60, 60],
          body: tableBody,
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 2 ? "#E5E5E5" : null),
          hLineWidth: () => 0.6,
          vLineWidth: () => 0.6,
          hLineColor: () => "#000",
          vLineColor: () => "#000",
        },
        margin: [0, 0, 0, 5],
      },
    ];
  });

  // ------------------------
  // Test Observations Section
  // ------------------------
  const testObservations = {
    margin: [0, 5, 0, 0],
    stack: [
      { text: "Test Observations :", fontSize: 10, margin: [0, 5, 0, 1] },
      {
        ol: [
          "Estimated in-situ strength of the Rebound Hammer Test values are based on calculated rebound numbers.",
          "As per clause 8.1 of IS 516 (Part 5 / Sec 4), the actual in-situ compressive strength would be ±25 % of the estimated value.",
          "Estimated compressive strength is worked out using the calibration chart for the test instrument.",
        ],
        fontSize: 9,
      },
    ],
  };

  // ------------------------
  // Notes Section
  // ------------------------
  const notesSection = {
    margin: [0, 6, 0, 0],
    stack: [
      { text: "Note:", fontSize: 10, margin: [0, 0, 0, 1] },
      {
        ol: [
          "Test was carried out as per the requirement of customer.",
          "Test locations were shown by the customer.",
          witnessText,
          "Report shall not be reproduced, except in full, without written approval of the laboratory.",
          "Any corrections invalidate this report.",
        ],
        fontSize: 9,
      },
    ],
  };

  return {
    stack: [
      ...tablesStack,
      testObservations,
      notesSection,
    ],
  };
};

module.exports = reboundMech;
