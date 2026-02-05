const WireRope = (parsedJdata = []) => {
  const firstEntry = parsedJdata?.[0] || {};
  const { formData = {} } = firstEntry;

  const rows = Array.isArray(formData.wires) ? formData.wires : [];

  // Prepare table body
  const tableBody = [];

  // ----------- HEADER -----------
  tableBody.push([
    { text: "Sl. No.", alignment: "center", style: "tableHeader" },
    { text: "Sample Identification", alignment: "center", style: "tableHeader" },
    { text: "Ultimate Tensile Strength\n(N/mm²)", alignment: "center", style: "tableHeader" },
    { text: "Breaking Force\n(KN)", alignment: "center", style: "tableHeader" },
  ]);

  // ----------- DATA ROWS -----------
  rows.forEach((item, index) => {
    tableBody.push([
      { text: index + 1, alignment: "center", fontSize: 10 },
      { text: item.sampleId || "", alignment: "center", fontSize: 10 },
      { text: item.tensile || "", alignment: "center", fontSize: 10 },
      { text: item.breaking || "", alignment: "center", fontSize: 10 },
    ]);
  });

  // ----------- TEST METHOD ROW -----------
  tableBody.push([
    { text: "Test method", colSpan: 2, alignment: "center", fontSize: 10 },
    {},
    { text: "IS:1608 Part-1:2022", alignment: "center", fontSize: 10 },
    { text: "IS:1608 Part-1:2022", alignment: "center", fontSize: 10 },
  ]);

  return {
    table: {
      headerRows: 1,
      widths: ["10%", "40%", "25%", "25%"],
      body: tableBody,
    },

    layout: {
      fillColor: (rowIndex) => (rowIndex === 0 ? "#e8e8e8" : null),
      hLineWidth: () => 0.7,
      vLineWidth: () => 0.7,
      hLineColor: () => "#000",
      vLineColor: () => "#000",
      paddingTop: () => 6,
      paddingBottom: () => 6,
    },

    margin: [0, 10, 0, 10],
  };
};

module.exports = WireRope;
