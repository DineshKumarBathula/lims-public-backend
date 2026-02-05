module.exports = function tileDimensionsOfTiles(jdata) {
  const data = jdata.find((p) => p.param_id === "DIMENSIONS_OF_TILES");
  if (!data) return [];

  const rows = data.formData?.rows || [];
  if (!rows.length) return [];

  const description = data.formData?.description || "-";
  const group = data.formData?.group || "-";
  const specs = data.formData?.specifications || {};

  const TEST_NAME = "Dimensions";
  const TEST_METHOD = "IS 13630 Part-1";

  /* ================= READ AVERAGES ================= */

  const avgMap = Object.fromEntries(
    (data.reportData || []).map((r) => [r.key, r.value])
  );

  /* ================= HEADER ================= */

  const headerBlock = {
    margin: [0, 6, 0, 6],
    table: {
      widths: ["*", "*"],
      body: [
        [
          { text: TEST_NAME, bold: true, fontSize: 9, alignment: "left" },
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

  /* ================= TABLE BODY ================= */

  const body = [
    /* ---------- HEADER ROW 1 ---------- */
    [
      {
        text: "Sl. No",
        rowSpan: 2,
        style: "tableHeader",
        fontSize: 9,
        alignment: "center",
      },
      {
        text: "Description of Tiles (mm)",
        rowSpan: 2,
        style: "tableHeader",
        fontSize: 9,
        alignment: "center",
      },
      {
        text: "DIMENSIONS",
        colSpan: 3,
        style: "tableHeader",
        fontSize: 9,
        alignment: "center",
      },
      {},
      {},
      {
        text: "SHAPE",
        colSpan: 2,
        style: "tableHeader",
        fontSize: 9,
        alignment: "center",
      },
      {},
      {
        text: "FLATNESS (a=b=c)",
        colSpan: 3,
        style: "tableHeader",
        fontSize: 9,
        alignment: "center",
      },
      {},
      {},
    ],

    /* ---------- HEADER ROW 2 ---------- */
    [
      {},
      {},
      { text: "Length", fontSize: 9, alignment: "center" },
      { text: "Width", fontSize: 9, alignment: "center" },
      { text: "Thickness", fontSize: 9, alignment: "center" },
      { text: "Rectangularity", fontSize: 9, alignment: "center" },
      { text: "Straightness", fontSize: 9, alignment: "center" },
      { text: "Edge Curvature", fontSize: 9, alignment: "center" },
      { text: "Warpage", fontSize: 9, alignment: "center" },
      { text: "Centre Curvature", fontSize: 9, alignment: "center" },
    ],
  ];

  /* ================= DATA ROWS ================= */

  rows.forEach((r, i) => {
    body.push([
      { text: i + 1, fontSize: 9, alignment: "center" },

      i === 0
        ? {
            text: description,
            rowSpan: rows.length,
            fontSize: 9,
            alignment: "center",
            valign: "middle",
          }
        : {},

      { text: r.length || "-", fontSize: 9, alignment: "center" },
      { text: r.width || "-", fontSize: 9, alignment: "center" },
      { text: r.thickness || "-", fontSize: 9, alignment: "center" },
      { text: r.rectangularity || "-", fontSize: 9, alignment: "center" },
      { text: r.straightness || "-", fontSize: 9, alignment: "center" },
      { text: r.edgeCurvature || "-", fontSize: 9, alignment: "center" },
      { text: r.warpage || "-", fontSize: 9, alignment: "center" },
      { text: r.centreCurvature || "-", fontSize: 9, alignment: "center" },
    ]);
  });

  /* ================= AVERAGE ROW ================= */

  body.push([
    {
      text: "Average",
      colSpan: 2,
      bold: true,
      fontSize: 9,
      alignment: "center",
    },
    {},
    { text: avgMap["Average length"] || "-", fontSize: 9, alignment: "center" },
    { text: avgMap["Average width"] || "-", fontSize: 9, alignment: "center" },
    {
      text: avgMap["Average thickness"] || "-",
      fontSize: 9,
      alignment: "center",
    },
    {
      text: avgMap["Average rectangularity"] || "-",
      fontSize: 9,
      alignment: "center",
    },
    {
      text: avgMap["Average straightness"] || "-",
      fontSize: 9,
      alignment: "center",
    },
    {
      text: avgMap["Average edge Curvature"] || "-",
      fontSize: 9,
      alignment: "center",
    },
    {
      text: avgMap["Average warpage"] || "-",
      fontSize: 9,
      alignment: "center",
    },
    {
      text: avgMap["Average centre Curvature"] || "-",
      fontSize: 9,
      alignment: "center",
    },
  ]);

  /* ================= REQUIREMENTS ROW ================= */

  body.push([
    {
      text: `Requirements as per IS 15622:2017 (${group})`,
      colSpan: 2,
      italics: true,
      fontSize: 9,
      alignment: "center",
    },
    {},
    { text: specs.length || "-", fontSize: 9, alignment: "center" },
    { text: specs.width || "-", fontSize: 9, alignment: "center" },
    { text: specs.thickness || "-", fontSize: 9, alignment: "center" },
    { text: specs.rectangularity || "-", fontSize: 9, alignment: "center" },
    { text: specs.straightness || "-", fontSize: 9, alignment: "center" },
    { text: specs.edgeCurvature || "-", fontSize: 9, alignment: "center" },
    { text: specs.warpage || "-", fontSize: 9, alignment: "center" },
    { text: specs.centreCurvature || "-", fontSize: 9, alignment: "center" },
  ]);

  /* ================= RETURN ================= */

  return [
    headerBlock,
    {
      margin: [0, 6, 0, 12],
      table: {
        headerRows: 2,
        widths: [
          "5%",
          "15%",
          "8%",
          "8%",
          "8%",
          "11%",
          "11%",
          "11%",
          "11%",
          "11%",
        ],
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
