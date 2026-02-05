const {
  REPORT_HEADER_PARTICULARS,
  REPORT_HEADER_SNO,
  REPORT_HEADER_TEST_METHOD,
  REPORT_HEADER_RESULTS,
  REPORT_HEADER_SPECIFICATIONS,
} = require("../consts");

const MECH_NON_NABL_COMBO = "MECH_NON_NABL_COMBO";
const nonNablcombo = (combo) => {
  console.log(combo);
  const arr = combo.reportData;

  const getFormattedRow = (each, idx) => {
    const { key, value, testMethod, requirements } = each;
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
        fontSize: 9,
        alignment: "center",
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

  const headerRow = [
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
    { text: REPORT_HEADER_RESULTS, style: "tableHeader", alignment: "center" },
    {
      text: REPORT_HEADER_SPECIFICATIONS,
      style: "tableHeader",
      alignment: "center",
    },
  ];

  const body = [headerRow];

  arr.forEach((ele, idx) => body.push([...getFormattedRow(ele, idx)]));

  return {
    table: {
      headerRows: 1,
      widths: ["auto", "*", "*", "auto", "*"],
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
  };
};

// const nonNablcombo = (parsedJdata) => {
//   console.log("Nabl combo triggered : ");
//   console.log(parsedJdata);

//   const getFormattedRow = (each, idx) => {
//     const { key, value, testMethod, requirements } = each;
//     return [
//       {
//         text: idx + 1,
//         fontSize: 8,
//         alignment: "center",
//         margin: [0, 1, 0, 1],
//       },
//       {
//         text: key,
//         fontSize: 8,
//         alignment: "center",
//         margin: [0, 1, 0, 1],
//       },
//       {
//         text: testMethod,
//         fontSize: 8,
//         alignment: "center",
//         margin: [0, 1, 0, 1],
//       },
//       {
//         text: value,
//         fontSize: 9,
//         alignment: "center",
//         margin: [0, 2, 0, 2],
//       },
//       {
//         text: requirements,
//         fontSize: 8,
//         alignment: "center",
//         margin: [0, 1, 0, 1],
//       },
//     ];
//   };

//   const headerRow = [
//     {
//       text: REPORT_HEADER_SNO,
//       style: "tableHeader",
//       alignment: "center",
//     },
//     {
//       text: REPORT_HEADER_PARTICULARS,
//       style: "tableHeader",
//       alignment: "center",
//     },
//     {
//       text: REPORT_HEADER_TEST_METHOD,
//       style: "tableHeader",
//       alignment: "center",
//     },
//     {
//       text: REPORT_HEADER_RESULTS,
//       style: "tableHeader",
//       alignment: "center",
//     },
//     {
//       text: REPORT_HEADER_SPECIFICATIONS,
//       style: "tableHeader",
//       alignment: "center",
//     },
//   ];
//   const body = [headerRow];
//   let counter = 0;

//   for (const { reportData } of parsedJdata) {
//     body.push(getFormattedRow(reportData, counter));
//     counter++;
//   }

//   return {
//     table: {
//       headerRows: 1,
//       widths: ["auto", "*", "*", "auto", "*"],
//       body,
//     },
//     layout: {
//       fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
//       hLineWidth: (i) => 0.5,
//       vLineWidth: (i) => 0.5, // You can customize per cell too, if needed
//       hLineColor: () => "#000000",
//       vLineColor: () => "#000000",
//     },
//     margin: [0, 5, 0, 0],
//   };
// };

const cAggNablMech = (jdata) => {
  try {
    const parsedJdata = jdata;
    const seiveData = parsedJdata.find(
      (item) => item.param_id === "COARSE_AGGREGATE_SIEVE_ANALYSIS"
    );

    // const combo = parsedJdata.find(
    //   (item) => item.param_id === MECH_NON_NABL_COMBO
    // );

    // if (combo) {
    //   return nonNablcombo(combo);
    // }

    const seiveTableData = seiveData?.formData?.commonTemplate || [];
    const sieveSize = seiveData?.formData?.sieveSize || 0;

    if (!seiveTableData || seiveTableData.length === 0) {
      return null;
    }

    if (!seiveTableData || seiveTableData.length === 0) {
      return null;
    }

    if (!seiveTableData || seiveTableData.length === 0) {
      return null;
    }

    const sieveSpecs = {
      10: ["100", "85-100", "0-20", "0-5"],
      12.5: ["100", "85-100", "0-45", "0-10"],
      16: ["100", "85-100", "0-30", "0-5"],
      20: ["100", "85-100", "0-20", "0-5"],
      40: ["100", "85-100", "0-20", "0-5"],
      63: ["100", "85-100", "0-30", "0-5", "0-5"],
    };

    const sieveSizes = {
      10: ["12.5", "10", "4.75", "2.36"],
      12.5: ["16", "12.5", "10", "4.75"],
      16: ["20", "16", "10", "4.75"],
      20: ["40", "20", "10", "4.75"],
      40: ["63", "40", "20", "10"],
      63: ["80", "63", "40", "20", "10"],
    };

    const sieveSpecification = sieveSpecs[sieveSize] || ["-", "-", "-", "-"];
    const requiredSizes = sieveSizes[sieveSize] || ["-", "-", "-", "-"];

    // Prepare table headers with merged cells for "Cumulative %"
    const sieveHeader = [
      [
        {
          text: "IS Sieve\nDesignation(mm)",
          style: "tableHeader",
          alignment: "center",
          rowSpan: 2,
        },
        {
          text: "Cumulative %",
          style: "tableHeader",
          alignment: "center",
          colSpan: 2,
        },
        {}, // spans to cover next 2 columns
        {
          text: "Test Method",
          style: "tableHeader",
          alignment: "center",
          rowSpan: 2,
        },
        {
          text: "Specifications as per\nTable 7, IS: 383-2016",
          style: "tableHeader",
          alignment: "center",
          rowSpan: 2,
        },
      ],
      [
        {}, // placeholder for IS Sieve (rowSpan)
        { text: "Retained", style: "tableHeader", alignment: "right" },
        { text: "Passing", style: "tableHeader", alignment: "right" },
        {}, // placeholder for Specifications (rowSpan)
        {}, // placeholder for Test Method (rowSpan)
      ],
    ];

    // Build table rows
    const sieveTableBody = requiredSizes.map((size, index) => {
      const rowData = seiveTableData.find((item) => item.d === size);

      const row = [
        { text: `${size} mm`, fontSize: 9, alignment: "center" },
        { text: rowData?.r ?? "-", fontSize: 9, alignment: "center" },
        { text: rowData?.p ?? "-", fontSize: 9, alignment: "center" },
        {},
        {
          text: sieveSpecification[index] ?? "-",
          fontSize: 9,
          alignment: "center",
        },
      ];

      // Set rowSpan only in first row
      if (index === 0) {
        row[3] = {
          text: "IS: 2386 (Part-I)",
          fontSize: 9,
          alignment: "center",
          rowSpan: requiredSizes.length,
          margin: [0, 24, 0, 0],
        };
      }

      return row;
    });

    // Fallback if seiveTableBody is empty
    if (sieveTableBody.length === 0) {
      sieveTableBody.push([
        { text: "No Sieve Data Found", colSpan: 5, alignment: "center" },
        {},
        {},
        {},
        {},
      ]);
    }

    // Main table content
    const tableBody = [
      // [
      //   { text: "Test Conducted", style: "tableHeader", alignment: "center" },
      //   { text: "Results", style: "tableHeader", alignment: "center" },
      //   { text: "Requirements", style: "tableHeader", alignment: "center" },
      // ],
      // ...parsedJdata.flatMap(({ reportData }) => getRow(reportData)),

      // ...sieveHeader0,

      ...sieveHeader,
      ...sieveTableBody,
    ];

    return {
      table: {
        headerRows: 1,
        widths: ["20%", "25%", "25%", "10%", "20%"],
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
    };
  } catch (err) {
    console.error("Error generating sieve table PDF:", err.message);
    return null;
  }
};

module.exports = cAggNablMech;
