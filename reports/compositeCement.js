const {
  REPORT_HEADER_PARTICULARS,
  REPORT_HEADER_TEST_METHOD,
  REPORT_HEADER_SPECIFICATIONS,
  REPORT_HEADER_RESULTS,
  REPORT_HEADER_SNO,
} = require("./consts");

const compositeCement = (id, parsedJdata) => {
  const getFormattedRow = (each, idx, l) => {
    const { key, value, testMethod, requirements } = each;

    return [
      {
        text: idx + 1,
        fontSize: 8,
        alignment: "center",
      },
      {
        text: key,
        fontSize: 8,
        alignment: "center",
      },
      idx === 0
        ? {
            text: testMethod,
            fontSize: 8,
            alignment: "center",

            rowSpan: l,
          }
        : {
            // empty but required to maintain cell structure
          },

      {
        text: value,
        fontSize: 9,
        alignment: "center",
      },
      {
        text: requirements,
        fontSize: 8,
      },
    ];
  };

  const specHeaderMap = {
    121: "Requirements IS: 5986 Table-6(ISH 330S), Grade-205 (%)",
    122: "Requirements IS: 5986 Table-6(ISH 430LA), Grade-355 (%)",
    123: "Requiements IS 1376 Part-6 Table-4(%)",
    124: "Requiements IS 1367 Part-3 Table-2(%)",
    125: "Requiements IS 2062 Table-1 (%)",
    126: "Requiements IS 2062 Table-1 (%)",
    127: "Requiements as per IS 1875 Table-1",
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
        ...reportData?.map((eachTest, i) =>
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
  };
};

module.exports = compositeCement;

// CAGG done
// Cement testing
