const {
  REPORT_HEADER_PARTICULARS,
  REPORT_HEADER_TEST_METHOD,
  REPORT_HEADER_SPECIFICATIONS,
  REPORT_HEADER_RESULTS,
  REPORT_HEADER_SNO,
} = require("./consts");

const chemicalCement = (id, parsedJdata) => {
  const skipKeysFor91 = [
    "Silicon dioxide (SiO₂)",
    "Calcium Oxide as CaO",
    "Iron Oxide (Fe2O3)",
    "Aluminum Oxide (Al2O3)",
  ];
  // Format a row for the table
  const getFormattedRow = (each, idx) => {
    const { key, value, testMethod, requirements } = each;

    return [
      {
        text: idx + 1, // continuous numbering
        fontSize: 8,
        alignment: "center",
      },
      {
        text: key,
        fontSize: 8,
        alignment: "center",
      },
      {
        text: testMethod,
        fontSize: 8,
        alignment: "center",
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
    98: "Requirements as Is 1489 (Part-1):2015(Clause-6)",
    99: "Requirements as Is 455 : 2015 RA 2020 (Table-1)",
    101: "Requiements as per IS 269_2015_Reff2020(Table-2)",
    91: "Requiements as per IS 269_2015_Reff2020(Table-2)",
    100: "Requiements as per IS 12330_1988_RA2019(Table-1)",
  };

  const getSpecHeader = (id) =>
    specHeaderMap[id] || REPORT_HEADER_SPECIFICATIONS;

  let allRows = parsedJdata.flatMap(({ reportData }) => reportData);

  if (id === 91 || id === 101) {
    allRows = allRows.filter((row) => !skipKeysFor91.includes(row.key));
  }

  const tableRows = allRows.map((row, idx) => getFormattedRow(row, idx));

  const tableBody = [
    [
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
      { text: getSpecHeader(id), style: "tableHeader", alignment: "center" },
    ],
    ...tableRows,
  ];

  return {
    table: {
      headerRows: 1,
      widths: ["auto", "auto", "*", "auto", "*"],
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

module.exports = chemicalCement;

// CAGG done
// Cement testing
