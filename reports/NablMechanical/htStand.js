const getHTWireFullWidthTable = (parsedJdata) => {
  // ✔ Safely extract first object
  const firstEntry = parsedJdata?.[0] || {};

  // ✔ Carefully destructure with default fallbacks
  const { reportData = {}, param_id = "" } = firstEntry;
  const row = reportData?.table?.[0] || {};
  const req = reportData?.requirement || {};

  return {
    stack: [
      // 🔹 LABEL + VALUE (ABOVE TABLE)
      {
        columns: [
          { width: "*", text: "" }, // ⬅ empty left space
          {
            width: "auto",
            text: [
              { text: "Test Method : ", bold: true },
              { text: "IS:1608 Part-1, IS 14268", bold: true },
            ],
            fontSize: 9,
            alignment: "right",
          },
        ],
        margin: [0, 0, 0, 6],
      },

      // 🔹 EXISTING TABLE (UNCHANGED)
      {
        table: {
          headerRows: 1,
          widths: ["6%", "25%", "10%", "10%", "10%", "10%", "10%", "10%", "9%"],
          body: [
            [
              { text: "S.No", style: "tableHeader", alignment: "center" },
              {
                text: "Sample Identification",
                style: "tableHeader",
                alignment: "center",
              },
              {
                text: "Nominal Dia (mm)",
                style: "tableHeader",
                alignment: "center",
              },
              { text: "Area (mm²)", style: "tableHeader", alignment: "center" },
              {
                text: "Lay Length (mm)",
                style: "tableHeader",
                alignment: "center",
              },
              {
                text: "Wt per meter (g)",
                style: "tableHeader",
                alignment: "center",
              },
              {
                text: "Yield Load (kN)",
                style: "tableHeader",
                alignment: "center",
              },
              {
                text: "Breaking Load (kN)",
                style: "tableHeader",
                alignment: "center",
              },
              {
                text: "Elongation (%)",
                style: "tableHeader",
                alignment: "center",
              },
            ],

            [
              { text: row.slNo || "", alignment: "center", fontSize: 9 },
              {
                text: row.sampleIdentification || "",
                alignment: "center",
                fontSize: 9,
              },
              { text: row.nominalDia || "", alignment: "center", fontSize: 9 },
              { text: row.area || "", alignment: "center", fontSize: 9 },
              { text: row.layLength || "", alignment: "center", fontSize: 9 },
              { text: row.wtPerM || "", alignment: "center", fontSize: 9 },
              { text: row.yieldLoad || "", alignment: "center", fontSize: 9 },
              {
                text: row.breakingLoad || "",
                alignment: "center",
                fontSize: 9,
              },
              { text: row.elongation || "", alignment: "center", fontSize: 9 },
            ],

            [
              { text: "", alignment: "center" },
              {
                text: req.text || "",
                alignment: "left",
                fontSize: 8,
                colSpan: 2,
                margin: [2, 2, 0, 2],
              },
              { text: "" },
              {
                text: req.nominalDiaReq || "",
                alignment: "center",
                fontSize: 9,
              },
              {
                text: req.layLengthReq || "",
                alignment: "center",
                fontSize: 9,
              },
              { text: req.wtPerMReq || "", alignment: "center", fontSize: 9 },
              {
                text: req.yieldLoadReq || "",
                alignment: "center",
                fontSize: 9,
              },
              {
                text: req.breakingLoadReq || "",
                alignment: "center",
                fontSize: 9,
              },
              {
                text: req.elongationReq || "",
                alignment: "center",
                fontSize: 9,
              },
            ],
          ],
        },
        layout: {
          fillColor: (i) => (i === 0 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000",
          vLineColor: () => "#000",
        },
        margin: [0, 0, 0, 10],
      },
    ],
  };
};

module.exports = getHTWireFullWidthTable;
