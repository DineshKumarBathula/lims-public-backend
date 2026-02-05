const {
  REPORT_HEADER_PARTICULARS,
  REPORT_HEADER_TEST_METHOD,
  REPORT_HEADER_SPECIFICATIONS,
  REPORT_HEADER_RESULTS,
  REPORT_HEADER_SNO,
} = require("./consts");

const mechanicalComposition = (id, parsedJdata) => {
  const getFormattedRow = (each, idx, l) => {
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
        rowSpan: l,
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
        margin: [0, 1, 0, 1],
      },
    ];
  };

  const specHeaderMap = {
    121: "Specifications as per IS: 5986 Table-6 (ISH 330 S) & IS 4759",
    122: "Specifications as per IS: 5986 Table-6 (ISH 430 LA) & IS 4759",
    127: "Requiements IS 1376 Part-6 Table-4(%)",
  };

  // Default fallback if id not found
  const getSpecHeader = (id) =>
    specHeaderMap[id] || REPORT_HEADER_SPECIFICATIONS;

  const tableBody = [
    [
      {
        text: REPORT_HEADER_SNO,
        style: "tableHeader",
        alignment: "center",
      },
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
        text: getSpecHeader(id),
        style: "tableHeader",
        alignment: "center",
      },
    ],
    ...parsedJdata.flatMap(({ reportData }, idx) => {
      // param id of compressive strength
      return [
        ...reportData.map((eachTest, i) =>
          getFormattedRow(eachTest, i, reportData.length)
        ),
      ];
    }),
  ];

  return {
    table: {
      headerRows: 1,
      widths: ["auto", "*", "*", "auto", "*"],
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
};

module.exports = mechanicalComposition;

// CAGG done
// Cement testing
