const CHEQURED_BRICKS = "CHEQURED_BRICKS";

const getRowWaterAb = (finalTable = []) => {
  const rows = [];

  finalTable.forEach((row, index) => {
    rows.push([
      { text: index + 1, fontSize: 9, alignment: "center" },
      { text: row.dim || "-", fontSize: 9, alignment: "center" },
      { text: row.wa || "-", fontSize: 9, alignment: "center" },
      index === 0
        ? {
            text: row.avg || "-",
            rowSpan: finalTable.length,
            fontSize: 9,
            alignment: "center",
            margin: [0, 12, 0, 0],
          }
        : {},
      index === 0
        ? {
            text: row.testMethod || "-",
            rowSpan: finalTable.length,
            fontSize: 9,
            alignment: "center",
          }
        : {},
      index === 0
        ? {
            text: row.req || "-",
            rowSpan: finalTable.length,
            fontSize: 9,
            alignment: "center",
          }
        : {},
    ]);
  });

  return rows;
};

const chequeredMech = (parsedJdata) => {
  const data = parsedJdata.find((p) => p.paramName === CHEQURED_BRICKS);

  if (!data?.finalTable?.length) return [];

  const body = [
    [
      { text: "Sl.No", style: "tableHeader", alignment: "center" },
      { text: "Dimensions (mm)", style: "tableHeader", alignment: "center" },
      {
        text: "Water Absorption (%)",
        style: "tableHeader",
        alignment: "center",
      },
      {
        text: "Average Water Absorption (%)",
        style: "tableHeader",
        alignment: "center",
      },
      { text: "Test Method", style: "tableHeader", alignment: "center" },
      {
        text: "Requirements as per clause 12.5 of IS: 13801 ",
        style: "tableHeader",
        alignment: "center",
      },
    ],
    ...getRowWaterAb(data.finalTable),
  ];

  return [
    {
      text: "Water Absorption",
      fontSize: 10,
      bold: true,
      margin: [0, 6, 0, 4],
    },
    {
      table: {
        headerRows: 1,
        widths: ["6%", "22%", "18%", "18%", "16%", "20%"],
        body,
      },
      layout: {
        fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
      },
    },
  ];
};

module.exports = chequeredMech;
