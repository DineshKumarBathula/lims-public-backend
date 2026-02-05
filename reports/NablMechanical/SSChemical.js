const SSChemReport = (parsedJdata) => {
  const TEST_METHOD = "IS : 8811:1998";

  const { formData, reportData, reportDataTable } = parsedJdata[0];

  // 🔥 ALWAYS prefer reportDataTable (contains #)
  const commonTemplate = reportDataTable?.formData || formData?.commonTemplate;

  if (!commonTemplate || commonTemplate.length === 0) {
    return {
      text: "No chemical test results available.",
      fontSize: 10,
      bold: true,
      color: "red",
      margin: [0, 5, 0, 5],
    };
  }

  // 🔥 reportData is ARRAY (FlyAsh style), table info is in formData
  // const tableHeaders =
  //   formData?.tableHeader || parsedJdata[0]?.tableHeader || [];
  const sourceTableHeader = reportDataTable?.tableHeader || [];

  const hasHeatNumber = sourceTableHeader.some(
    (item) => item.key === "heat_no"
  );
  const hasLotNumber = sourceTableHeader.some((item) => item.key === "lot_no");

  // ✅ Requirement Data updated with CE as last column
  const requirementData = {
    E250A: ["0.23", "1.50", "0.045", "0.045", "0.40", "0.42"],
    E250: ["0.23", "1.50", "0.045", "0.045", "0.40", "0.42"],
    E250BR: ["0.22", "1.50", "0.045", "0.045", "0.40", "0.41"],
    E250BO: ["0.22", "1.50", "0.045", "0.045", "0.40", "0.41"],
    E250C: ["0.20", "1.50", "0.040", "0.040", "0.40", "0.39"],

    E275A: ["0.23", "1.50", "0.045", "0.045", "0.40", "0.43"],
    E275: ["0.23", "1.50", "0.045", "0.045", "0.40", "0.44"],
    E275BR: ["0.22", "1.50", "0.045", "0.045", "0.40", "0.42"],
    E275BO: ["0.22", "1.50", "0.045", "0.045", "0.40", "0.42"],
    E275C: ["0.20", "1.50", "0.040", "0.040", "0.40", "0.41"],

    E300A: ["0.20", "1.50", "0.045", "0.045", "0.45", "0.45"],
    E300: ["0.20", "1.50", "0.045", "0.045", "0.45", "0.45"],
    E300BR: ["0.20", "1.50", "0.045", "0.045", "0.45", "0.45"],
    E300BO: ["0.20", "1.50", "0.045", "0.045", "0.45", "0.45"],
    E300C: ["0.20", "1.50", "0.040", "0.040", "0.45", "0.44"],

    E350A: ["0.20", "1.55", "0.045", "0.045", "0.45", "0.47"],
    E350: ["0.20", "1.55", "0.045", "0.045", "0.45", "0.47"],
    E350BR: ["0.20", "1.55", "0.045", "0.045", "0.45", "0.47"],
    E350BO: ["0.20", "1.55", "0.045", "0.045", "0.45", "0.47"],
    E350C: ["0.20", "1.55", "0.040", "0.040", "0.45", "0.45"],
  };

  const normalizeForRequirement = (grade) => {
    if (!grade) return "";
    const g = grade.toUpperCase();
    const match = g.match(/^(E\d{3})([A-Z]*)$/);
    if (match) {
      return match[2] === "" ? match[1] + "A" : g;
    }
    return g;
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return {
        text: "-",
        fontSize: 9,
        alignment: "center",
      };
    }

    const str = String(value);

    // keep # if exists
    if (str.includes("#")) {
      return {
        text: str,
        fontSize: 9,
        alignment: "center",
        // optional (recommended)
      };
    }

    return {
      text: Number(str).toFixed(3),
      fontSize: 9,
      alignment: "center",
    };
  };

  // ---------- Client Table ----------
  const tableHeader = [
    { text: "Sl. No.", style: "tableHeader", alignment: "center" },
    { text: "Sample Description", style: "tableHeader", alignment: "center" },
    { text: "Brand & Grade", style: "tableHeader", alignment: "center" },
    ...(hasHeatNumber
      ? [{ text: "Heat No.", style: "tableHeader", alignment: "center" }]
      : []),
    ...(hasLotNumber
      ? [{ text: "Lot No.", style: "tableHeader", alignment: "center" }]
      : []),
    { text: "C %", style: "tableHeader", alignment: "center" },
    { text: "Mn %", style: "tableHeader", alignment: "center" },
    { text: "S %", style: "tableHeader", alignment: "center" },
    { text: "P %", style: "tableHeader", alignment: "center" },
    { text: "Si %", style: "tableHeader", alignment: "center" },
    { text: "CE", style: "tableHeader", alignment: "center" }, // ✅ CE from client
  ];

  const tableRows = commonTemplate.map((item, idx) => {
    return [
      { text: String(idx + 1), fontSize: 9, alignment: "center" },
      {
        text: `${item.type} ${item.size}x${item.thickness}mm`,
        fontSize: 9,
        alignment: "center",
      },
      {
        text: `${item.brand || "-"} ${item.grade || "-"}`,
        fontSize: 9,
        alignment: "center",
      },
      ...(hasHeatNumber
        ? [{ text: item.heat_no || "-", fontSize: 9, alignment: "center" }]
        : []),
      ...(hasLotNumber
        ? [{ text: item.lot_no || "-", fontSize: 9, alignment: "center" }]
        : []),
      formatValue(item.ys), // C %
      formatValue(item.mn), // Mn %
      formatValue(item.ts), // S %
      formatValue(item.elongation), // P %
      formatValue(item.si), // Si %
      formatValue(item.ce), // CE
      // ✅ Trust client’s CE
    ];
  });

  let widths = [];
  if (hasHeatNumber && hasLotNumber) {
    widths = [25, 70, 60, 30, 30, 35, 35, 35, 35, 35, 35];
  } else if (hasHeatNumber || hasLotNumber) {
    widths = [25, 80, 70, 40, 40, 40, 40, 40, 40, 40, 40];
  } else {
    widths = [25, 100, 80, 40, 40, 40, 40, 40, 40, 40];
  }

  // ---------- Requirement Table ----------
  let requirementRows = [];
  let selectedGrades = [
    ...new Set(commonTemplate.map((item) => item.grade).filter(Boolean)),
  ];

  if (selectedGrades.length > 0) {
    requirementRows.push([
      {
        text: "Requirements as per IS:2062 – 2011",
        bold: true,
        colSpan: 7,
        alignment: "center",
        fontSize: 9,
      },
      {},
      {},
      {},
      {},
      {},
      {},
    ]);

    requirementRows.push([
      { text: "Grade", style: "tableHeader", alignment: "center" },
      { text: "C % (max)", style: "tableHeader", alignment: "center" },
      { text: "Mn % (max)", style: "tableHeader", alignment: "center" },
      { text: "S % (max)", style: "tableHeader", alignment: "center" },
      { text: "P % (max)", style: "tableHeader", alignment: "center" },
      { text: "Si % (max)", style: "tableHeader", alignment: "center" },
      { text: "CE (max)", style: "tableHeader", alignment: "center" },
    ]);

    selectedGrades.forEach((g) => {
      const [c, mn, s, p, si, ce] = requirementData[g] || [
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
      ];

      requirementRows.push([
        { text: g, alignment: "center", fontSize: 9 },
        { text: c, alignment: "center", fontSize: 9 },
        { text: mn, alignment: "center", fontSize: 9 },
        { text: s, alignment: "center", fontSize: 9 },
        { text: p, alignment: "center", fontSize: 9 },
        { text: si, alignment: "center", fontSize: 9 },
        { text: ce, alignment: "center", fontSize: 9 },
      ]);
    });
  }
  const headerBlock = {
    margin: [0, 0, 0, 0],
    table: {
      widths: ["*", "*"],
      body: [
        [
          { text: "", fontSize: 9 },
          {
            text: `Test Method: ${TEST_METHOD}`,
            bold: true,
            fontSize: 9,
            alignment: "right",
          },
        ],
      ],
    },
    layout: "noBorders",
  };

  return {
    stack: [
      headerBlock,
      {
        table: {
          headerRows: 1,
          widths: widths,
          body: [tableHeader, ...tableRows],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        margin: [0, 5, 0, 10],
      },
      ...(requirementRows.length > 0
        ? [
            {
              table: {
                widths: ["*", 50, 50, 50, 50, 50, 50],
                body: requirementRows,
              },
              layout: {
                fillColor: (rowIndex) => (rowIndex === 1 ? "#EEEEEE" : null),
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => "#000000",
                vLineColor: () => "#000000",
              },
              margin: [0, 10, 0, 10],
            },
          ]
        : []),
    ],
  };
};

module.exports = SSChemReport;
