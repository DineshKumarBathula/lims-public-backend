module.exports = function tileMoistureExpansion(jdata) {
  const data = jdata.find((p) => p.param_id === "MOISTURE_EXPANSION_TILES");
  if (!data) return [];

  const rows = data.formData?.rows || [];
  if (!rows.length) return [];

  const group = data.formData?.group || "-";
  const specification = data.formData?.specification || "-";
  const requirements = `${group} - ${specification}`;

  const avg =
    data.reportData?.find((r) => r.key === "Average Moisture Expansion")
      ?.value || "-";

  const TEST_METHOD = "IS 13630 Part-10";
  const totalRows = rows.length;

  /* ================= TABLE HEADER ================= */

  const body = [
    [
      "Sl. No",
      "Size of Sample",
      "Moisture Expansion (mm/m)",
      "Test Method",
      "Requirements as per IS 15622:2017",
    ].map((h) => ({
      text: h,
      style: "tableHeader",
      alignment: "center",
      fontSize: 9,
    })),
  ];

  /* ================= DATA ROWS ================= */

  rows.forEach((r, i) => {
    body.push([
      { text: i + 1, alignment: "center", fontSize: 9 },

      // ✅ Size (ONE TIME)
      i === 0
        ? {
            text: r.size || "-",
            rowSpan: totalRows,
            alignment: "center",
            valign: "middle",
            fontSize: 9,
          }
        : {},

      { text: r.value || "-", alignment: "center", fontSize: 9 },

      // ✅ Test Method (ONE TIME)
      i === 0
        ? {
            text: TEST_METHOD,
            rowSpan: totalRows,
            alignment: "center",
            valign: "middle",
            fontSize: 9,
          }
        : {},

      // ✅ Requirements (ONE TIME – SAME AS WATER ABSORPTION)
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
      text: "Average Moisture Expansion (mm/m)",
      colSpan: 2,
      bold: true,
      alignment: "center",
      fontSize: 9,
    },
    {},
    {
      text: avg,
      bold: true,
      alignment: "center",
      fontSize: 9,
    },
    { colSpan: 2, text: "", alignment: "center" },
    {},
  ]);

  /* ================= RETURN ================= */

  return [
    {
      text: "Moisture Expansion",
      bold: true,
      fontSize: 9,
      margin: [0, 5, 0, 5],
    },
    {
      table: {
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
