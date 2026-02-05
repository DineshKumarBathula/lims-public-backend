// carbonationTable.js
const carbonationTable = (parsedJdata) => {
  console.log(
    "🔥 Carbonation Parsed JDATA:",
    JSON.stringify(parsedJdata, null, 2)
  );
  const node = parsedJdata[0];
  const { reportFormat, witnessNames = [] } = node;

  if (!Array.isArray(reportFormat) || reportFormat.length === 0) {
    return {
      text: "No Carbonation / WorkBench data available.",
      fontSize: 9,
      bold: true,
      color: "red",
      margin: [0, 5, 0, 5],
    };
  }

  const tables = [];

  reportFormat.forEach((block) => {
    const FIXED_TEST_METHOD = "IS 516(Part-5/Sec-3)2021";

    const tableHeader = [
      { text: "Sl. No", style: "tableHeader", alignment: "center" },
      {
        text: "Member ID / Location",
        style: "tableHeader",
        alignment: "center",
      },
      { text: "Grade", style: "tableHeader", alignment: "center" },
      { text: "Observation", style: "tableHeader", alignment: "center" },
      { text: "Result", style: "tableHeader", alignment: "center" },
      { text: "Test Method", style: "tableHeader", alignment: "center" }, // NEW COLUMN
    ];

    // create rows
    const rows = block.rows.map((row, i) => [
      { text: row.sl_no || i + 1, alignment: "center", fontSize: 8 },
      { text: row.member_id || "-", alignment: "center", fontSize: 8 },
      { text: row.type_of_probing || "-", alignment: "center", fontSize: 8 },
      { text: row.path_length || "-", alignment: "center", fontSize: 8 },
      { text: row.pulse_velocity || "-", alignment: "center", fontSize: 8 },
      { text: FIXED_TEST_METHOD, alignment: "center", fontSize: 8 }, // NEW DATA
    ]);

    tables.push(
      {
        text: `Block: ${block.blockName}`,
        bold: true,
        fontSize: 9,
        margin: [0, 6, 0, 6],
      },
      {
        table: {
          headerRows: 1,
          widths: [28, 120, "*", "*", "*", 70], // UPDATED WIDTH for NEW COLUMN
          body: [tableHeader, ...rows],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#E0E0E0" : null),
          hLineWidth: () => 0.4,
          vLineWidth: () => 0.4,
          hLineColor: () => "#000",
          vLineColor: () => "#000",
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
        margin: [0, 0, 0, 10],
      }
    );
  });

  // Witness Section

  return { stack: tables };
};

module.exports = carbonationTable;
