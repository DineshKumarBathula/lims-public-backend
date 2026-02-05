const {
  REPORT_HEADER_SNO,
  REPORT_HEADER_PARTICULARS,
  REPORT_HEADER_RESULTS,
  REPORT_HEADER_TEST_METHOD,
} = require("../consts");

const DBM_SIEVE_ANALYSIS = "DBM_SIEVE_ANALYSIS";
const COARSE_AGGREGATE_FLAKINESS = "COARSE_AGGREGATE_FLAKINESS";

// Helper to build default test rows (non-sieve)
const getFormattedRow = (each) => {
  const { key, value, testMethod, specification } = each;
  return [
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
      fontSize: 9,
      alignment: "center",
      margin: [0, 2, 0, 2],
    },
    {
      text: specification,
      fontSize: 8,
      alignment: "center",
      margin: [0, 1, 0, 1],
    },
  ];
};

// Define parameters you want to exclude
const dontShowParams = [
  "CEMENT_SIO2",
  "CEMENT_FE2O3",
  "CEMENT_AL203",
  "CEMENT_CALCIUM",
  DBM_SIEVE_ANALYSIS,
];

// NEW: Function to build the sieve analysis table
// const buildSieveAnalysisTable = (sieveData = []) => {
//   console.log("This is sieve data");

//   console.log(sieveData.commonTemplate);
//   const headers = [
//     {
//       text: "IS Sieve Size (mm)",
//       alignment: "center",
//       style: "tableHeader",
//     },
//     { text: "37.5", alignment: "center", style: "tableHeader" },
//     { text: "26.5", alignment: "center", style: "tableHeader" },
//     { text: "19.0", alignment: "center", style: "tableHeader" },
//     { text: "13.2", alignment: "center", style: "tableHeader" },
//     { text: "4.75", alignment: "center", style: "tableHeader" },
//     { text: "2.36", alignment: "center", style: "tableHeader" },
//     { text: "0.300", alignment: "center", style: "tableHeader" },
//     { text: "0.075", alignment: "center", style: "tableHeader" },
//   ];

//   // Dummy values: Replace these with values from sieveData[0].reportData if needed
//   const rowLabels = [
//     "Cumulative (%)",
//     "Passing (%)",
//     "Retained (%)",
//     "Specification Limits",
//   ];

//   // const dummyValues = [
//   //   ["100.0", "100.0", "93.4", "70.1", "54.9", "35.1", "21.2", "7.2", "2.4"],
//   //   ["100", "93.4", "70.1", "54.9", "35.1", "21.2", "7.2", "2.4", "0.1"],
//   //   ["0", "6.6", "29.9", "15.2", "19.8", "13.9", "14.0", "4.8", "2.3"],
//   //   ["-", "-", "-", "-", "-", "-", "-", "Max 5%", "Max 2%"],
//   // ];

//   const tableRows = [headers];

//   // rowLabels.forEach((label, idx) => {
//   //   tableRows.push([
//   //     idx === 0
//   //       ? { text: "Sample 1", rowSpan: rowLabels.length, alignment: "center" }
//   //       : "",
//   //     { text: label, alignment: "center" },
//   //     ...dummyValues[idx].map((v) => ({ text: v, alignment: "center" })),
//   //   ]);
//   // });

//   return {
//     style: "tableExample",
//     table: {
//       headerRows: 1,
//       widths: [...Array(headers.length).fill("auto")],
//       body: tableRows,
//     },
//     layout: {
//       fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
//       hLineWidth: () => 0.5,
//       vLineWidth: () => 0.5,
//       hLineColor: () => "#000",
//       vLineColor: () => "#000",
//     },
//     margin: [0, 10, 0, 10],
//   };
// };

const buildSieveAnalysisTable = (sieveData = {}) => {
  const { commonTemplate = [] } = sieveData;

  const sieves = commonTemplate.filter((sieve) => sieve.d !== "PAN");

  const headers = [
    {
      text: "IS Sieve Size (mm)",
      alignment: "left",
      style: "tableHeader",
      margin: [0, 1, 0, 1],
    },
    ...sieves.map((s) => ({
      text: s.d,
      alignment: "center",
      style: "tableHeader",
      margin: [0, 1, 0, 1],
    })),
  ];

  const preHeader = [
    {
      text: "Mix Grading: ",
      alignment: "left",
      style: "tableHeader",
      colSpan: headers.length,
      margin: [0, 1, 0, 1],
    },
    ...sieves.map((s) => ({})),
  ];

  const header = [
    {
      text: "DRY MIX TEST RESULTS",
      alignment: "center",
      style: "tableHeader",
      colSpan: headers.length,
      margin: [0, 1, 0, 1],
    },
    ...sieves.map((s) => ({})),
  ];

  // Prepare rows
  const cumulativeRow = [
    { text: "Cumulative Retained (%)", alignment: "left", fontSize: 8 },
    ...sieves.map((s) => ({
      text: s.r.toFixed(1),
      alignment: "center",
      fontSize: 8,
      margin: [0, 1, 0, 1],
    })),
  ];

  const passingRow = [
    { text: "Cumulative Passing (%)", alignment: "left", fontSize: 8 },
    ...sieves.map((s) => ({
      text: s.p.toFixed(1),
      alignment: "center",
      fontSize: 8,
      margin: [0, 1, 0, 1],
    })),
  ];

  const retainedRow = [
    { text: "Morth Spec's Table 500-10", alignment: "left", fontSize: 8 },
    ...["100", "90-100", "71-95", "56-80", "38-54", "28-42", "7-21", "2-8"].map(
      (s) => ({
        text: s,
        alignment: "center",
        fontSize: 8,
        margin: [0, 1, 0, 1],
      })
    ),
  ];

  const postTable = [
    {
      text: "Test Method ",
      alignment: "left",
      margin: [0, 1, 0, 1],
      fontSize: 8,
    },
    {
      text: "IS 2386 (Part-1) ",
      alignment: "center",
      colSpan: headers.length - 1,
      margin: [0, 1, 0, 1],
      fontSize: 8,
    },
    ...[1, 2, 3, 4, 5, 6, 7].map((s) => ({})),
  ];

  const tableRows = [
    header,
    preHeader,
    headers,
    cumulativeRow,
    passingRow,
    retainedRow,
    postTable,
  ];

  return {
    style: "tableExample",
    table: {
      headerRows: 1,
      widths: ["*", ...Array(sieves.length).fill("auto")],
      body: tableRows,
    },
    layout: {
      fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => "#000",
      vLineColor: () => "#000",
    },
    margin: [0, 10, 0, 10],
  };
};

// const buildSieveAnalysisReportTable = (sieveData = {}) => {
//   const { commonTemplate = [] } = sieveData;

//   // Filter to only the desired sieves (excluding PAN)
//   const sieves = commonTemplate.filter((s) => s.d !== "PAN");
//   console.log(sieves);

//   // Sort sieves in expected order
//   const desiredOrder = [
//     "37.5",
//     "26.5",
//     "19.0",
//     "13.2",
//     "4.75",
//     "2.36",
//     "0.300",
//     "0.075",
//   ];
//   const orderedSieves = desiredOrder.map(
//     (size) =>
//       sieves.find((s) => s.d === size) || { d: size, wr: 0, cwr: 0, r: 0, p: 0 }
//   );

//   const headerRow = [
//     {
//       text: "Mix Grading:\nIS Sieve Size (mm)",
//       alignment: "center",
//       style: "tableHeader",
//     },
//     ...orderedSieves.map((s) => ({
//       text: s.d,
//       alignment: "center",
//       style: "tableHeader",
//     })),
//   ];

//   const cumulativeRow = [
//     { text: "Cumulative Retained %", alignment: "center" },
//     ...orderedSieves.map((s) => ({
//       text: s.r,
//       alignment: "center",
//     })),
//   ];

//   const passingRow = [
//     { text: "Cumulative Passing (%)", alignment: "center" },
//     ...orderedSieves.map((s) => ({
//       text: s.p,
//       alignment: "center",
//     })),
//   ];

//   const morthRow = [
//     { text: "MORTH Spec's\nTable 500-10", alignment: "center" },
//     ...orderedSieves.map((s) => {
//       switch (s.d) {
//         case "37.5":
//           return { text: "100", alignment: "center" };
//         case "26.5":
//           return { text: "90-100", alignment: "center" };
//         case "19.0":
//           return { text: "71-95", alignment: "center" };
//         case "13.2":
//           return { text: "56-80", alignment: "center" };
//         case "4.75":
//           return { text: "38-54", alignment: "center" };
//         case "2.36":
//           return { text: "28-42", alignment: "center" };
//         case "0.300":
//           return { text: "7-21", alignment: "center" };
//         case "0.075":
//           return { text: "2-8", alignment: "center" };
//         default:
//           return { text: "-", alignment: "center" };
//       }
//     }),
//   ];

//   return {
//     layout: {
//       fillColor: (rowIndex) => (rowIndex === 0 ? "#e6e6e6" : null),
//       hLineWidth: () => 0.5,
//       vLineWidth: () => 0.5,
//       hLineColor: () => "#aaa",
//       vLineColor: () => "#aaa",
//     },
//     table: {
//       headerRows: 1,
//       widths: [120, ...Array(orderedSieves.length).fill("auto")],
//       body: [headerRow, cumulativeRow, passingRow, morthRow],
//     },
//     margin: [0, 10, 0, 10],
//     style: "tableExample",
//   };
// };

const DBMmechanical = (id, parsedJdata) => {
  const sieveAnalysis = (parsedJdata || []).filter(
    (eachObj) => eachObj.paramName === DBM_SIEVE_ANALYSIS
  );

  let sieveTable;
  if (sieveAnalysis.length) {
    sieveTable = sieveAnalysis[0].reportData;
  }

  const body = [
    [
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
        text: "Requirements as per MORTH (Rev-5)",
        style: "tableHeader",
        alignment: "center",
      },
    ],
  ];

  let counter = 0;

  for (const { reportData, param_id } of parsedJdata) {
    if (dontShowParams.includes(param_id)) continue;

    reportData.forEach((test, idx) => {
      if (param_id === "20240418112228524") {
        body.push(getFormattedRow(test, idx));
      } else {
        body.push(getFormattedRow(test, counter));
      }
    });

    counter++;
  }

  const isThereSieveAnalysis = sieveAnalysis.length > 0;

  if (isThereSieveAnalysis.length) {
    return [
      {
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto"],
          body,
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
          hLineWidth: (i) => 0.5,
          vLineWidth: (i) => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        margin: [0, 5, 0, 0],
      },
      buildSieveAnalysisTable(sieveTable),
    ];
  } else {
    return [
      {
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto"],
          body,
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
          hLineWidth: (i) => 0.5,
          vLineWidth: (i) => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        margin: [0, 5, 0, 0],
      },
    ];
  }
};

module.exports = DBMmechanical;
