/**
 * Coarse Aggregate – Stripping Value Table
 * IS:6241 | MORTH Table 500-8
 */

const coarseAggStrippingValue = (parsedJdata) => {
  const strippingData = parsedJdata.find(
    (item) => item.param_id === "STRIPPING_VALUE"
  );

  if (
    !strippingData ||
    !Array.isArray(strippingData.reportData) ||
    strippingData.reportData.length === 0
  ) {
    return [];
  }

  const body = [
    [
      { text: "Sl. No", style: "tableHeader", alignment: "center" },
      {
        text: "Description of Sample / Sample Location",
        style: "tableHeader",
        alignment: "center",
      },
      { text: "Test Method", style: "tableHeader", alignment: "center" },
      {
        text: "Stripping Value Retained Coating (%)",
        style: "tableHeader",
        alignment: "center",
      },
      {
        text: "Specification",
        style: "tableHeader",
        alignment: "center",
      },
    ],
  ];

  strippingData.reportData.forEach((row, index) => {
    body.push([
      { text: index + 1, fontSize: 9, alignment: "center" },
      { text: row.key || "-", fontSize: 9, alignment: "left" },
      {
        text: row.testMethod || "IS:6241",
        fontSize: 9,
        alignment: "center",
      },
      {
        text: row.value?.toString() || "-",
        fontSize: 9,
        alignment: "center",
      },
      {
        text:
          row.specification ||
          "As per MORTH Specification Min.95 (Table 500-8)",
        fontSize: 9,
        alignment: "left",
      },
    ]);
  });

  return [
    {
      table: {
        headerRows: 1,
        widths: ["7%", "38%", "15%", "15%", "25%"],
        body,
      },
      layout: {
        fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#000000",
        vLineColor: () => "#000000",
      },
      margin: [0, 8, 0, 8],
    },
  ];
};

module.exports = coarseAggStrippingValue;
