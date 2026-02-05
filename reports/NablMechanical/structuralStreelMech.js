const mechanicalRequirements = {
  E250A: {
    ts: "410",
    ys: { lt20: "250", bt20_40: "240", gt40: "230" },
    elongation: "23",
  },
  E250BR: {
    ts: "410",
    ys: { lt20: "250", bt20_40: "240", gt40: "230" },
    elongation: "23",
  },
  E250BO: {
    ts: "410",
    ys: { lt20: "250", bt20_40: "240", gt40: "230" },
    elongation: "23",
  },
  E250C: {
    ts: "410",
    ys: { lt20: "250", bt20_40: "240", gt40: "230" },
    elongation: "23",
  },
  E275A: {
    ts: "430",
    ys: { lt20: "275", bt20_40: "265", gt40: "255" },
    elongation: "22",
  },
  E275BR: {
    ts: "430",
    ys: { lt20: "275", bt20_40: "265", gt40: "255" },
    elongation: "22",
  },
  E275BO: {
    ts: "430",
    ys: { lt20: "275", bt20_40: "265", gt40: "255" },
    elongation: "22",
  },
  E275C: {
    ts: "430",
    ys: { lt20: "275", bt20_40: "265", gt40: "255" },
    elongation: "22",
  },
  E300A: {
    ts: "440",
    ys: { lt20: "300", bt20_40: "290", gt40: "280" },
    elongation: "22",
  },
  E300B0: {
    ts: "440",
    ys: { lt20: "300", bt20_40: "290", gt40: "280" },
    elongation: "22",
  },
  E300BR: {
    ts: "440",
    ys: { lt20: "300", bt20_40: "290", gt40: "280" },
    elongation: "22",
  },
  E300C: {
    ts: "440",
    ys: { lt20: "300", bt20_40: "290", gt40: "280" },
    elongation: "22",
  },
  E350A: {
    ts: "490",
    ys: { lt20: "350", bt20_40: "330", gt40: "320" },
    elongation: "22",
  },
  E350BR: {
    ts: "490",
    ys: { lt20: "350", bt20_40: "330", gt40: "320" },
    elongation: "22",
  },
  E350BO: {
    ts: "490",
    ys: { lt20: "350", bt20_40: "330", gt40: "320" },
    elongation: "22",
  },

  E350C: {
    ts: "490",
    ys: { lt20: "350", bt20_40: "330", gt40: "320" },
    elongation: "22",
  },
  E410C: {
    ts: "540",
    ys: { lt20: "410", bt20_40: "390", gt40: "380" },
    elongation: "20",
  },
  E410A: {
    ts: "540",
    ys: { lt20: "410", bt20_40: "390", gt40: "380" },
    elongation: "20",
  },
  E410BR: {
    ts: "540",
    ys: { lt20: "410", bt20_40: "390", gt40: "380" },
    elongation: "20",
  },
  E410BO: {
    ts: "540",
    ys: { lt20: "410", bt20_40: "390", gt40: "380" },
    elongation: "20",
  },
  E450A: {
    ts: "570",
    ys: { lt20: "450", bt20_40: "430", gt40: "420" },
    elongation: "20",
  },
  E450BR: {
    ts: "570",
    ys: { lt20: "450", bt20_40: "430", gt40: "420" },
    elongation: "20",
  },
  E550BR: {
    ts: "650",
    ys: { lt20: "550", bt20_40: "530", gt40: "520" },
    elongation: "12",
  },
  E550A: {
    ts: "650",
    ys: { lt20: "550", bt20_40: "530", gt40: "520" },
    elongation: "12",
  },
  E600BR: {
    ts: "730",
    ys: { lt20: "600", bt20_40: "580", gt40: "570" },
    elongation: "12",
  },
  E600A: {
    ts: "730",
    ys: { lt20: "600", bt20_40: "580", gt40: "570" },
    elongation: "12",
  },
  E650BR: {
    ts: "780",
    ys: { lt20: "650", bt20_40: "630", gt40: "620" },
    elongation: "12",
  },
  E650A: {
    ts: "780",
    ys: { lt20: "650", bt20_40: "630", gt40: "620" },
    elongation: "12",
  },
};

const SSteel = (parsedJdata) => {
  const { formData, reportData } = parsedJdata[0];
  const { commonTemplate = [] } = formData;

  if (!commonTemplate.length) {
    return {
      text: "No mechanical test results available.",
      fontSize: 9,
      color: "red",
    };
  }

  const tableHeaderSrc = reportData?.tableHeader || [];

  const hasHeatNumber = tableHeaderSrc.some((h) => h.key === "heat_no");
  const hasLotNumber = tableHeaderSrc.some((h) => h.key === "lot_no");
  const hasBrand = commonTemplate.some(
    (row) => row.brand && row.brand.trim() !== "",
  );

  /* ================= RESULT TABLE ================= */

  const resultTableHeader = [
    { text: "Sl. No.", style: "tableHeader", alignment: "center" },
    {
      text: hasBrand
        ? "Description of Sample / Identification / Brand & Grade"
        : "Description of Sample / Identification / Grade",
      style: "tableHeader",
      alignment: "center",
    },
    ...(hasHeatNumber
      ? [{ text: "Heat No", style: "tableHeader", alignment: "center" }]
      : []),
    ...(hasLotNumber
      ? [{ text: "Lot No", style: "tableHeader", alignment: "center" }]
      : []),
    {
      text: "Yield Stress (YS)\nN/mm²",
      style: "tableHeader",
      alignment: "center",
    },
    {
      text: "Tensile Strength (TS)\nN/mm²",
      style: "tableHeader",
      alignment: "center",
    },
    { text: "Elongation (%)", style: "tableHeader", alignment: "center" },
    { text: "Bend Test", style: "tableHeader", alignment: "center" },
  ];

  const resultRows = commonTemplate.map((row, idx) => [
    { text: idx + 1, fontSize: 9, alignment: "center" },
    {
      text: `${row.type}${row.size || ""}-${row.thickness}mm / ${
        hasBrand && row.brand ? row.brand + " & " : ""
      }${row.grade}`,
      fontSize: 9,
      alignment: "center",
    },
    ...(hasHeatNumber
      ? [{ text: row.heat_no || "-", fontSize: 9, alignment: "center" }]
      : []),
    ...(hasLotNumber
      ? [{ text: row.lot_no || "-", fontSize: 9, alignment: "center" }]
      : []),
    { text: row.ys ?? "-", fontSize: 9, alignment: "center" },
    { text: row.ts ?? "-", fontSize: 9, alignment: "center" },
    { text: row.elongation ?? "-", fontSize: 9, alignment: "center" },
    { text: row.bend || "-", fontSize: 9, alignment: "center" },
  ]);

  const resultTable = {
    table: {
      headerRows: 1,
      widths:
        hasHeatNumber || hasLotNumber
          ? [30, "*", 50, 50, 50, 50, 50, 50]
          : [30, "*", 60, 60, 60, 60],
      body: [resultTableHeader, ...resultRows],
    },
    layout: {
      fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => "#000000",
      vLineColor: () => "#000000",
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 3,
      paddingBottom: () => 3,
    },
    margin: [0, 5, 0, 10],
  };

  /* ================= REQUIREMENTS TABLE ================= */

  /* ================= REQUIREMENTS TABLE (COLUMNS FORMAT) ================= */

  /* ================= REQUIREMENTS TABLE (IS 2062 FORMAT) ================= */

  const grades = [
    ...new Set(
      commonTemplate.filter(Boolean).map((r) => r.grade), // E275A → E275
    ),
  ];

  const reqBody = [
    [
      { text: "Grade", rowSpan: 2, style: "tableHeader", alignment: "center" },
      {
        text: "Tensile Strength N/mm²",
        rowSpan: 2,
        style: "tableHeader",
        alignment: "center",
      },
      {
        text: "Yield Stress N/mm²",
        colSpan: 3,
        style: "tableHeader",
        alignment: "center",
      },
      {},
      {},
      {
        text: "Elongation Min(%)",
        rowSpan: 2,
        style: "tableHeader",
        alignment: "center",
      },
    ],
    [
      {},
      {},
      { text: "< 20", style: "tableHeader", alignment: "center" },
      { text: "20 – 40", style: "tableHeader", alignment: "center" },
      { text: "> 40", style: "tableHeader", alignment: "center" },
      {},
    ],
  ];

  grades.forEach((grade) => {
    const req = mechanicalRequirements[grade];
    if (!req) return;

    reqBody.push([
      { text: grade, alignment: "center", fontSize: 9 },
      { text: req.ts, alignment: "center", fontSize: 9 },
      { text: req.ys.lt20, alignment: "center", fontSize: 9 },
      { text: req.ys.bt20_40, alignment: "center", fontSize: 9 },
      { text: req.ys.gt40, alignment: "center", fontSize: 9 },
      { text: req.elongation, alignment: "center", fontSize: 9 },
    ]);
  });

  const requirementsTable = {
    table: {
      headerRows: 2,
      widths: [60, 100, 70, 70, 70, 95],
      body: reqBody,
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => "#000",
      vLineColor: () => "#000",
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 3,
      paddingBottom: () => 3,
    },
    margin: [0, 10, 0, 10],
  };

  /* ================= FINAL RETURN ================= */

  return {
    stack: [
      resultTable,
      {
        text: "Requirements as per IS 2062 Table 2",
        bold: true,
        fontSize: 10,
        margin: [0, 0, 0, 0],
      },
      requirementsTable,
    ],
  };
};

module.exports = SSteel;
