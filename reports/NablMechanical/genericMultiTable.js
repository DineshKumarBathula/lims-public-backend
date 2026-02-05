const DEFAULT_HEADERS = [
  "Test Parameters",
  "Result",
  "Test Method",
  "Specifications",
];

module.exports = function genericMultiTable(jdata) {
  if (!Array.isArray(jdata)) return null;

  const matched = jdata.filter((p) => p?.param_id === "FOUR_FIELD_MULTI_TABLE");

  if (!matched.length) return null;

  const tables = matched
    .map((m) => m?.formData?.tables)
    .filter(Array.isArray)
    .flat();

  if (!tables.length) return null;

  const content = [];

  tables.forEach((tbl) => {
    const rows = Array.isArray(tbl?.rows) ? tbl.rows : [];
    if (!rows.length) return;

    const headers =
      Array.isArray(tbl?.headers) && tbl.headers.length === 4
        ? tbl.headers
        : DEFAULT_HEADERS;

    const body = [
      [
        { text: "Sl. No", style: "tableHeader", alignment: "center" },
        { text: headers[0], style: "tableHeader", alignment: "center" },
        { text: headers[2], style: "tableHeader", alignment: "center" },
        { text: headers[1], style: "tableHeader", alignment: "center" },
        { text: headers[3], style: "tableHeader", alignment: "center" },
      ],
    ];

    rows.forEach((row, idx) => {
      body.push([
        { text: String(idx + 1), alignment: "center", fontSize: 9 },
        { text: row?.paramName || "-", fontSize: 9 },
        { text: row?.testMethod || "-", fontSize: 9 },
        { text: row?.result || "-", fontSize: 9 },
        { text: row?.specification || "-", fontSize: 9 },
      ]);
    });

    if (tbl?.tableName?.trim()) {
      content.push({
        text: tbl.tableName,
        bold: true,
        fontSize: 10,
        margin: [0, 6, 0, 4],
      });
    }

    content.push({
      table: {
        headerRows: 1,
        widths: ["8%", "28%", "22%", "14%", "28%"],
        body,
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#000",
        vLineColor: () => "#000",
      },
      margin: [0, 0, 0, 8],
    });
  });

  return content;
};
