module.exports = function tileBreakingStrength(jdata) {
  const data = jdata.find((p) => p.param_id === "BREAKING_STRENGTH");
  if (!data) return [];

  const {
    description = "-",
    samples = [],
    group = "",
    specification = "",
  } = data.formData || {};

  const avg =
    data.reportData?.find((r) => r.key === "Average Breaking Strength")
      ?.value || "-";

  const TEST_METHOD = "IS 13630 Part-6";
  const requirements =
    group || specification
      ? `${group} ${group && specification ? " – " : ""}${specification}`
      : "-";

  const totalRows = samples.length; // +1 for average row

  /* ================= TABLE BODY ================= */

  const body = [
    [
      { text: "Sl. No", style: "tableHeader", alignment: "center" },
      {
        text: "Description of the Tiles (mm)",
        style: "tableHeader",
        alignment: "center",
        fontSize: 9,
      },
      {
        text: "Breaking Strength (N)",
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
        text: "Requirements as per IS 15622:2017",
        style: "tableHeader",
        alignment: "center",
        fontSize: 9,
      },
    ],
  ];

  /* ================= SAMPLE ROWS ================= */

  samples.forEach((val, i) => {
    body.push([
      { text: String(i + 1), alignment: "center", fontSize: 9 },

      // Description (rowSpan)
      i === 0
        ? {
            text: description,
            rowSpan: totalRows,
            alignment: "center",
            valign: "middle",
            fontSize: 9,
          }
        : {},

      { text: val ?? "-", alignment: "center", fontSize: 9 },

      // Test Method (rowSpan)
      i === 0
        ? {
            text: TEST_METHOD,
            rowSpan: totalRows,
            alignment: "center",
            valign: "middle",
            fontSize: 9,
          }
        : {},

      // Requirements (rowSpan)
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
      text: "Average Breaking Strength(N)",
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
      text: "Breaking Strength – Tiles",
      bold: true,
      fontSize: 9,
      margin: [0, 5, 0, 0],
    },
    {
      margin: [0, 5, 0, 10],
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
