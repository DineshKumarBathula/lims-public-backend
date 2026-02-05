module.exports = function AcidModulusOfRupture(jdata) {
  const data = jdata.find((p) => p.param_id === "ACID_MODULUS_OF_RUPTURE");
  if (!data) return [];
  const note = data.reportData?.find((r) => r.key === "Note")?.value || null;

  const rows = data.formData?.rows || [];
  const group = data.formData?.group || "-";
  const specification = data.formData?.specification || "-";
  const requirements = `${specification}`;

  const avg =
    data.reportData?.find((r) => r.key === "Average Modulus of Rupture")
      ?.value || "-";

  const TEST_METHOD = "IS:4457 Annex-D"; // change if required
  const totalRows = rows.length; // +1 for Avg row

  /* ================= TEST NAME ================= */

  const content = [
    {
      text: "Modulus of Rupture",
      bold: true,
      fontSize: 9,
      margin: [0, 5, 0, 6],
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
        text: "Modulus of Rupture (N/sq.mm)",
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
        text: " Requirements as per IS 4457:2007 Table 1",
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

      // Description (merged + vertically centered)
      i === 0
        ? {
            text: r.description || "-",
            rowSpan: totalRows,
            alignment: "center",
            valign: "middle",
            fontSize: 9,
          }
        : {},

      { text: r.rupture || "-", alignment: "center", fontSize: 9 },

      // Test Method (merged)
      i === 0
        ? {
            text: TEST_METHOD,
            rowSpan: totalRows,
            alignment: "center",
            valign: "middle",
            fontSize: 9,
          }
        : {},

      // Requirements (merged)
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

  if (note) {
    // 🔥 NOT APPLICABLE ROW (inside same table)
    body.push([
      {
        text: note,
        colSpan: 5,
        alignment: "center",
        bold: true,
        fontSize: 9,
      },
      {},
      {},
      {},
      {},
    ]);
  } else {
    // ✅ NORMAL AVERAGE ROW
    body.push([
      {
        text: "Average Modulus of Rupture (N/sq.mm)",
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
  }

  /* ================= TABLE ================= */

  content.push({
    margin: [0, 0, 0, 10],
    table: {
      headerRows: 1,
      widths: ["7%", "30%", "18%", "20%", "25%"],
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
