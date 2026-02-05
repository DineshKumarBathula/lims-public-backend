module.exports = function AcidBricksWaterAbsorption(jdata) {
  const data = jdata.find((p) => p.param_id === "ACID_BRICK_WATER_ABSORPTION");
  if (!data) return [];

  const rows = data.formData?.rows || [];
  const group = data.formData?.group || "-";
  const specification = data.formData?.specification || "-";
  const requirements = `${specification}`;
  const TEST_METHOD = "IS 4860 - 1968 Appendix A";

  const avg =
    data.reportData?.find((r) => r.key === "Average Water Absorption")?.value ||
    "-";

  const totalRows = rows.length; // +1 for Avg row

  /* ================= TABLE HEADER ================= */

  const body = [
    [
      { text: "Sl. No", style: "tableHeader", alignment: "center" },
      {
        text: "Dimensions (mm)",
        style: "tableHeader",
        alignment: "center",
        fontSize: 9,
      },
      {
        text: "Water Absorption (%)",
        style: "tableHeader",
        alignment: "center",
        fontSize: 9,
      },
      {
        text: "Test Method",
        style: "tableHeader",
        alignment: "center",
        fontSize: 9,
      },
      {
        text: " Requirements as per IS 4860 - 1968",
        style: "tableHeader",
        alignment: "center",
        fontSize: 9,
      },
    ],
  ];

  /* ================= SAMPLE ROWS ================= */

  rows.forEach((r, i) => {
    body.push([
      { text: String(i + 1), alignment: "center", fontSize: 9 },

      // Description (centered vertically)
      i === 0
        ? {
            text: r.description || "-",
            rowSpan: totalRows,
            alignment: "center",
            valign: "middle",
            fontSize: 9,
          }
        : {},

      { text: r.absorption || "-", alignment: "center", fontSize: 9 },

      // Test Method (centered vertically)
      i === 0
        ? {
            text: TEST_METHOD,
            rowSpan: totalRows,
            alignment: "center",
            valign: "middle",
            fontSize: 9,
          }
        : {},

      // Requirements (centered vertically)
      i === 0
        ? {
            text: requirements,
            rowSpan: totalRows,
            alignment: "center",
            valign: "middle",
            fontSize: 9,
          }
        : {},
    ]);
  });

  /* ================= AVERAGE ROW ================= */

  body.push([
    {
      text: "Average Water Absorption(%)",
      colSpan: 2,
      alignment: "center",
      bold: true,
      fontSize: 9,
    },
    {},
    {
      text: avg,
      colSpan: 3,
      alignment: "center",
      bold: true,
      fontSize: 9,
    },
    {},
    {},
  ]);

  /* ================= RETURN ================= */

  return [
    {
      text: "Water Absorption",
      bold: true,
      fontSize: 9,
      margin: [0, 0, 0, 0],
    },
    {
      margin: [0, 5, 0, 5],
      table: {
        headerRows: 1,
        widths: ["7%", "30%", "15%", "20%", "28%"],
        body,
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#000",
        vLineColor: () => "#000",
      },
    },
  ];
};
