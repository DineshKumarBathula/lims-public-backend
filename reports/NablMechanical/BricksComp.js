module.exports = function AcidBricksCompressiveStrength(jdata) {
  const data = jdata.find(
    (p) => p.param_id === "ACIDBRICKS_COMPRESSIVE_STRENGTH"
  );
  if (!data) return [];

  const rows = data.formData?.commonTemplate || [];
  if (!rows.length) return [];

  const brickClass = data.formData?.brickClass || "";

  /* ================= REQUIREMENT RESOLUTION ================= */

  const getRequirementText = () => {
    if (brickClass === "CLASS_I") return " Class I – 700(Min) Kg/cm²";
    if (brickClass === "CLASS_II") return " Class II  – 500(Min) Kg/cm²";
    return "-";
  };

  const REQUIREMENTS = getRequirementText();

  const TEST_NAME = "Compressive Strength";
  const TEST_METHOD = "IS 4860 - 1968 Appendix C";

  /* ================= CALCULATIONS ================= */

  const calculateArea = (l, b) => (l > 0 && b > 0 ? l * b * 0.01 : 0);

  const calculateCS = (l, b, ml) => {
    const area = calculateArea(l, b);
    return area > 0 ? ((ml / area) * 101.97).toFixed(3) : "-";
  };

  const csValues = rows
    .map((r) => parseFloat(calculateCS(r.l, r.b, r.ml)))
    .filter((v) => !isNaN(v));

  const avgCSValue = csValues.length
    ? csValues.reduce((a, b) => a + b, 0) / csValues.length
    : null;

  const avgCS = avgCSValue !== null ? avgCSValue.toFixed(3) : "-"; // UI precision
  const avgCSRounded =
    avgCSValue !== null ? Math.round(avgCSValue).toString() : "-"; // 🔥 report value

  /* ================= TITLE ================= */

  const content = [
    {
      text: TEST_NAME,
      bold: true,
      fontSize: 9,
      margin: [0, 8, 0, 6],
    },
  ];

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
        text: "Compressive Strength (Kg/cm²)",
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
        text: "Requirements as per IS 4860 - 1968",
        style: "tableHeader",
        alignment: "center",
        fontSize: 9,
      },
    ],
  ];

  /* ================= DATA ROWS ================= */

  rows.forEach((r, i) => {
    body.push([
      { text: i + 1, alignment: "center", fontSize: 9 },

      {
        text: `${r.l} × ${r.b} × ${r.h}`,
        alignment: "center",
        fontSize: 9,
      },

      {
        text: calculateCS(r.l, r.b, r.ml),
        alignment: "center",
        fontSize: 9,
      },

      /* Test Method (merged) */
      i === 0
        ? {
            text: TEST_METHOD,
            rowSpan: rows.length,
            alignment: "center",
            valign: "middle",
            fontSize: 9,
          }
        : {},

      /* Requirements (merged) */
      i === 0
        ? {
            text: REQUIREMENTS,
            rowSpan: rows.length,
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
      text: "Avg Compressive Strength(Kg/cm²)",
      colSpan: 2,
      bold: true,
      alignment: "left",
      fontSize: 9,
    },
    {},
    {
      text: avgCSRounded,
      colSpan: 3,
      bold: true,
      alignment: "center",
      fontSize: 9,
    },
    {},
    {},
  ]);

  /* ================= TABLE ================= */

  content.push({
    margin: [0, 0, 0, 10],
    table: {
      headerRows: 1,
      widths: ["8%", "24%", "22%", "20%", "26%"],
      body,
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => "#000",
      vLineColor: () => "#000",
    },
  });

  return content;
};
