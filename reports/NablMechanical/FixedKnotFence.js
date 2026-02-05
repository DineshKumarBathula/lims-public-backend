// FixedKnotFence.js
// Builds a pdfmake-style table for "Fixed Knot Fence" with vertical-centering workaround
const FixedKnotFence = (parsedJdata = []) => {
  // Safe extract of first entry
  const firstEntry = parsedJdata?.[0] || {};
  const { finalTable = [] } = firstEntry;

  // rows: array of objects like { dia, tensile, remarks }
  const rows = Array.isArray(finalTable) ? finalTable : [];

  // Estimates for computing top margin to center the text inside the rowSpan cell.
  // Tweak these if the resulting vertical-centering is off in your environment.
  const rowHeightEstimate = 18; // approximate height (in pdf units) of a single table data row
  const textHeightEstimate = 10; // approximate height of the description text block

  // compute top margin so that the description appears vertically centered when rowSpan is used
  const computeTopMargin = (numRows) => {
    if (!numRows || numRows <= 0) return 0;
    const totalHeight = (numRows * rowHeightEstimate)-(numRows*2);
    const top = Math.max(0, Math.round((totalHeight - textHeightEstimate) / 2));
    return top;
  };

  // Build table body
  const tableBody = [];

  // Header row
  tableBody.push([
    { text: "S.No", style: "tableHeader", alignment: "center" },
    { text: "Description of Sample", style: "tableHeader", alignment: "center" },
    { text: "Dia (mm)", style: "tableHeader", alignment: "center" },
    { text: "Tensile Strength (N/mm²)", style: "tableHeader", alignment: "center" },
    { text: "Remarks", style: "tableHeader", alignment: "center" },
  ]);

  // If there are zero data rows, still show an empty single data row to keep table shape
  if (rows.length === 0) {
    tableBody.push([
      { text: "1", alignment: "center", fontSize: 9 },
      {
        text: "Fixed Knot fence",
        rowSpan: 1,
        alignment: "center",
        fontSize: 9,
        margin: [0, computeTopMargin(1), 0, 0],
      },
      { text: "", alignment: "center", fontSize: 9 },
      { text: "", alignment: "center", fontSize: 9 },
      { text: "", alignment: "left", fontSize: 9 },
    ]);
  } else {
    // Add real data rows
    rows.forEach((item, index) => {
      const isFirst = index === 0;
      const dataRow = [
        { text: index + 1, alignment: "center", fontSize: 9 },
        // description cell only present on first row and spans the rest
        isFirst
          ? {
              text: "Fixed Knot fence",
              rowSpan: rows.length,
              alignment: "center",
              fontSize: 9,
              // top margin centers the text vertically across the spanned rows
              margin: [0, computeTopMargin(rows.length), 0, 0],
            }
          : {},
        { text: item.dia ?? "", alignment: "center", fontSize: 9 },
        { text: item.tensile ?? "", alignment: "center", fontSize: 9 },
        { text: item.remarks ?? "", alignment: "left", fontSize: 9 },
      ];

      tableBody.push(dataRow);
    });
  }

  // Test method / footer row (matches the image layout)
  // We set colSpan:2 on first cell and then include an empty placeholder cell as pdfmake requires
  tableBody.push([
    { text: "Test Method", colSpan: 2, alignment: "center", fontSize: 9 },
    {},
    { text: "---", alignment: "center", fontSize: 9 },
    { text: "IS 1608 Part-1", alignment: "center", fontSize: 9 },
    { text: "", alignment: "center", fontSize: 9 },
  ]);

  return {
    table: {
      headerRows: 1,
      widths: ["6%", "25%", "10%", "15%", "44%"], // last width expanded to accomodate remarks (tweak if required)
      body: tableBody,
    },

    layout: {
      fillColor: (rowIndex) => (rowIndex === 0 ? "#e8e8e8" : null),
      hLineWidth: () => 0.7,
      vLineWidth: () => 0.7,
      hLineColor: () => "#000",
      vLineColor: () => "#000",
    },

    margin: [0, 10, 0, 10],
  };
};

module.exports = FixedKnotFence;
