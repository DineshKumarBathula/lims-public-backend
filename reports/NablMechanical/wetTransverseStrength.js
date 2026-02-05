const wetTransverseStrength = (parsedJdata) => {
  const data = parsedJdata.find(
    (p) => p.param_id === "WET_TRANSVERSE_STRENGTH"
  );

  if (!data?.formData?.rows?.length) return [];

  const rows = data.formData.rows;

  const values = rows
    .map((r) => parseFloat(r.strength))
    .filter((v) => !isNaN(v));

  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  const body = [
    [
      { text: "Sl. No", style: "tableHeader", alignment: "center" },
      {
        text: "Dimensions of Tiles (mm)",
        style: "tableHeader",
        alignment: "center",
      },
      {
        text: "Wet Transverse Strength (N/mm²)",
        style: "tableHeader",
        alignment: "center",
      },
      {
        text: "Average Wet Transverse Strength (N/mm²)",
        style: "tableHeader",
        alignment: "center",
      },
      {
        text: "Test Method",
        style: "tableHeader",
        alignment: "center",
      },
      {
        text: "Requirements as per clause 12.5 of IS:13801",
        style: "tableHeader",
        alignment: "center",
      },
    ],
  ];

  rows.forEach((r, i) => {
    body.push([
      { text: i + 1, fontSize: 9, alignment: "center" },
      { text: r.dimension, fontSize: 9 },
      { text: r.strength, fontSize: 9, alignment: "center" },
      i === 0
        ? {
            text: avg.toFixed(2),
            rowSpan: rows.length,
            fontSize: 9,
            alignment: "center",
            margin: [0, 20, 0, 0],
          }
        : {},
      i === 0
        ? {
            text: "IS:13801-2013 Annex F",
            rowSpan: rows.length,
            fontSize: 9,
            alignment: "center",
          }
        : {},
      i === 0
        ? {
            text: "The average wet transverse strength shall not be less than 3 N/mm²",
            rowSpan: rows.length,
            fontSize: 9,
            alignment: "center",
          }
        : {},
    ]);
  });

  return [
    {
      text: "Wet Transverse Strength",
      fontSize: 9,
      bold: true,
      alignment: "left",
    },
    {
      table: {
        headerRows: 1,
        widths: ["6%", "20%", "15%", "15%", "14%", "30%"],
        body,
      },
      layout: {
        fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#000",
        vLineColor: () => "#000",
      },
      margin: [0, 8, 0, 8],
    },
  ];
};

module.exports = wetTransverseStrength;
