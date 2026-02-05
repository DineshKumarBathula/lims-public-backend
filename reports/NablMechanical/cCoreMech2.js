const { text } = require("express");

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const [yyyy, mm, dd] = dateStr.split("-");
  return `${dd}.${mm}.${yyyy}`;
};

const cCoreMech2 = (jdata) => {
  try {
    const parsedJdata = jdata;
    const seiveData = parsedJdata.find(
      (item) => item.param_id === "20240725182402705"
    );

    const seiveTableData = seiveData?.formData?.commonTemplate || [];
    const siteWitness = seiveData?.formData?.witnessesSite || [];
    const labWitness = seiveData?.formData?.witnessesLab || [];
    let coresReceivedDate = seiveData?.formData?.coresReceivedDate || "";
    let coresTestedDate = seiveData?.formData?.coresTestedDate || "";
    const receivedDateFormatted = formatDate(coresReceivedDate);
    const testedDateFormatted = formatDate(coresTestedDate);

    const avgCubeStrength = seiveData?.reportData?.avg || "-";
    const seiveDescription = seiveData?.formData?.description || [];
    console.log(seiveDescription,'seiveTableData876')

    const testReq = seiveData?.testReq || {};

    if (!seiveTableData || seiveTableData.length === 0) return null;

    const concreteGrade = testReq.concreteGrade || "M25";
// SAFE ACCESS
const coreDetails = testReq?.coreDetails?.[0] || {};

const nabl = coreDetails.nabl ?? true;
const numCores = coreDetails.numCores ?? seiveTableData.length ?? 1;

    const gradeStrength = parseFloat(concreteGrade.replace("M", "")) || 25;
    const minimum75Percent = (gradeStrength * 0.75).toFixed(2);
    const minimum85Percent = (gradeStrength * 0.85).toFixed(2);

    const tableCount = Math.ceil(numCores / 3);
    let dividedData = [];

    if (nabl) {
      const chunkSize = Math.ceil(seiveTableData.length / tableCount);
      for (let i = 0; i < seiveTableData.length; i += chunkSize) {
        dividedData.push(seiveTableData.slice(i, i + chunkSize));
      }
    } else {
      dividedData = [seiveTableData];
    }

    // ✅ MODIFIED: helper to get per-iteration description
    const getIterationDescription = (index) =>
      seiveData?.formData?.[`description_${index}`] ||
      seiveDescription ||
      "";

    const generateTable1 = (data, index) => {
      const iterationDescription = getIterationDescription(index); // ✅ MODIFIED

      const cubeStrengthValues = data
        .map((item) => Number(item.cube_strength))
        .filter((val) => !isNaN(val));

      const avgCubeStrength =
        cubeStrengthValues.length > 0
          ? (
              cubeStrengthValues.reduce((sum, val) => sum + val, 0) /
              cubeStrengthValues.length
            ).toFixed(2)
          : "-";

      const header = [
        [
          {
            text: "Core Location",
            style: "tableHeader",
            alignment: "center",
            fontSize: 8,
          },
          {
            text: "Core Identification",
            style: "tableHeader",
            alignment: "center",
            fontSize: 8,
          },
          {
            text: "Equivalent Cube Compressive Strength (N/mm²)",
            style: "tableHeader",
            alignment: "center",
            fontSize: 8,
          },
          {
            text: `Minimum 75% of the Equivalent cube compressive strength of the grade of concrete specified\n(Specifications as per IS:456, Clause No.17.4.3)`,
            style: "tableHeader",
            alignment: "center",
            fontSize: 8,
          },
        ],
      ];

      const body = [
        ...header,
        iterationDescription && iterationDescription.trim() !== ""
          ? [
              {
                text: iterationDescription, // ✅ MODIFIED
                colSpan: 4,
                alignment: "left",
                fontSize: 9,
                fillColor: "#f0f0f0",
                margin: [2, 3, 2, 3],
              },
              ...Array(3).fill({}),
            ]
          : [],
        ...data.map((item) => [
          {
            text: item.core_location || "-",
            alignment: "left",
            fontSize: 9,
            margin: [2, 0, 0, 0],
          },
          { text: item.core_structure_id || "-", alignment: "center", fontSize: 9 },
          {
            text: Number(item.cube_strength).toFixed(2) || "-",
            alignment: "center",
            fontSize: 9,
          },
          { text: `${minimum75Percent} N/mm²`, alignment: "center", fontSize: 9 },
        ]),
        [
          {
            text: "Average",
            colSpan: 2,
            alignment: "center",
            bold: true,
            fontSize: 9,
            margin: [0, 25, 0, 2],
            fillColor: "#f0f0f0",
          },
          {},
          {
            text: avgCubeStrength,
            alignment: "center",
            bold: true,
            fontSize: 8,
            margin: [0, 25, 0, 2],
            fillColor: "#f0f0f0",
          },
          {
            stack: [
              {
                text: `${minimum85Percent} N/mm²`,
                bold: true,
                fontSize: 9,
                alignment: "center",
              },
              {
                text: `Minimum 85% of the equivalent cube compressive strength of the grade of concrete specified. (Specifications as per IS:456, Clause No.17.4.3)`,
                bold: true,
                fontSize: 8,
                alignment: "center",
              },
            ],
            alignment: "center",
            fillColor: "#f0f0f0",
            margin: [0, 2, 0, 2],
          },
        ],
      ];

      return [
        {
          table: {
            headerRows: 1,
            widths: ["35%", "15%", "20%", "30%"],
            body: body.filter((row) => row.length > 0),
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#000",
            vLineColor: () => "#000",
            paddingTop: () => 3,
            paddingBottom: () => 3,
            paddingLeft: () => 4,
            paddingRight: () => 4,
          },
          margin: [0, 10, 0, 0],
        },
        {
          text: "*Details as furnished by the customer",
          bold: true,
          fontSize: 9,
          margin: [0, 4, 0, 10],
        },
      ];
    };

    const generateTable2 = (data, tableIndex) => {
      const iterationDescription = getIterationDescription(tableIndex); // ✅ MODIFIED

      const kValues = data.map((item) => Number(item.k)).filter((val) => !isNaN(val));
      const avgK =
        kValues.length > 0
          ? (
              kValues.reduce((sum, val) => sum + val, 0) / kValues.length
            ).toFixed(2)
          : "-";

      const header = [
        [
          { text: "Core No", style: "tableHeader", alignment: "center", fontSize: 7, rowSpan: 2 },
          { text: "Core Location", style: "tableHeader", alignment: "center", fontSize: 7, rowSpan: 2 },
          { text: "Core Length (l) (mm)", style: "tableHeader", alignment: "center", fontSize: 7, rowSpan: 2 },
          { text: "Core Dia (d) (mm)", style: "tableHeader", alignment: "center", fontSize: 7, rowSpan: 2 },
          { text: "Area (mm²)", style: "tableHeader", alignment: "center", fontSize: 7, rowSpan: 2 },
          { text: "Failure Load (kN)", style: "tableHeader", alignment: "center", fontSize: 7, rowSpan: 2 },
          { text: "Core Compressive Strength (N/mm²)", style: "tableHeader", alignment: "center", fontSize: 7, rowSpan: 2 },
          { text: "l/d ratio", style: "tableHeader", alignment: "center", fontSize: 7, rowSpan: 2 },
          { text: "Correction factor for (l/d) ratio", style: "tableHeader", alignment: "center", fontSize: 7, rowSpan: 2 },
          { text: "Corrected Cyl. Comp. Strength (N/mm²)", style: "tableHeader", alignment: "center", fontSize: 7, rowSpan: 2 },
          { text: "Equivalent Cube Comp. Strength ++ (N/mm²)", style: "tableHeader", alignment: "center", fontSize: 7, rowSpan: 2 },
        ],
        Array(11).fill({}),
      ];

      const body = [
        [
          {
            text: `Annexure A - Table ${tableIndex + 1}`,
            colSpan: 11,
            alignment: "center",
            bold: true,
            fontSize: 10,
          },
          ...Array(10).fill({}),
        ],
        [
          {
            text: "Concrete Core Specimens Compressive Strength",
            colSpan: 11,
            alignment: "center",
            bold: true,
            fontSize: 9,
            margin: [0, 2, 0, 2],
          },
          ...Array(10).fill({}),
        ],
        [
          {
            text: `Date of Cores received on :`,
            alignment: "left",
            fontSize: 8,
            colSpan: 2,
            border: [true, true, false, true],
            margin: [16, 0, 0, 0],
          },
          {},
          {
            text: `${receivedDateFormatted}`,
            alignment: "left",
            fontSize: 8,
            colSpan: 3,
            border: [false, true, true, true],
          },
          {},
          {},
          {
            text: `Date of Cores Tested on:`,
            alignment: "left",
            fontSize: 8,
            colSpan: 3,
            border: [false, true, false, true],
            margin: [18, 0, 0, 0],
          },
          {},
          {},
          {
            text: `${testedDateFormatted}`,
            alignment: "left",
            fontSize: 8,
            colSpan: 3,
            border: [false, true, true, true],
          },
          {},
          {},
        ],
        ...header,
        [
          { text: "a", alignment: "center", fontSize: 7, fillColor: "#f0f0f0" },
          { text: "b", alignment: "center", fontSize: 7, fillColor: "#f0f0f0" },
          { text: "c", alignment: "center", fontSize: 7, fillColor: "#f0f0f0" },
          { text: "d", alignment: "center", fontSize: 7, fillColor: "#f0f0f0" },
          { text: "e=(πxd²)/4", alignment: "center", fontSize: 7, fillColor: "#f0f0f0" },
          { text: "f", alignment: "center", fontSize: 7, fillColor: "#f0f0f0" },
          { text: "g=(f/e)x1000", alignment: "center", fontSize: 7, fillColor: "#f0f0f0" },
          { text: "h=(c/d)", alignment: "center", fontSize: 7, fillColor: "#f0f0f0" },
          { text: "i", alignment: "center", fontSize: 7, fillColor: "#f0f0f0" },
          { text: "j=(gxi)", alignment: "center", fontSize: 7, fillColor: "#f0f0f0" },
          { text: "k=(jx1.25)", alignment: "center", fontSize: 7, fillColor: "#f0f0f0" },
        ],

        // ✅ MODIFIED — iteration-based description row
        ...(iterationDescription && iterationDescription.trim() !== ""
          ? [
              [
                {
                  text: iterationDescription,
                  colSpan: 11,
                  alignment: "left",
                  fontSize: 9,
                  fillColor: "#f0f0f0",
                  margin: [2, 3, 2, 3],
                },
                ...Array(10).fill({}),
              ],
            ]
          : []),

        ...data.map((item) => [
          { text: item.core_no || "-", alignment: "center", fontSize: 9 },
          { text: item.core_location || "-", alignment: "left", fontSize: 9 },
          { text: Number(item.l).toFixed(0) || "-", alignment: "center", fontSize: 9 },
          { text: Number(item.d).toFixed(0) || "-", alignment: "center", fontSize: 9 },
          { text: Number(item.e).toFixed(0) || "-", alignment: "center", fontSize: 9 },
          { text: Number(item.f).toFixed(1) || "-", alignment: "center", fontSize: 9 },
          { text: Number(item.g).toFixed(2) || "-", alignment: "center", fontSize: 9 },
          { text: Number(item.h).toFixed(2) || "-", alignment: "center", fontSize: 9 },
          { text: Number(item.i).toFixed(3) || "-", alignment: "center", fontSize: 9 },
          { text: Number(item.j).toFixed(1) || "-", alignment: "center", fontSize: 9 },
          { text: Number(item.k).toFixed(2) || "-", alignment: "center", fontSize: 9 },
        ]),

        [
          {
            text: "Average:",
            colSpan: 10,
            alignment: "right",
            bold: true,
            fontSize: 9,
            margin: [0, 2, 4, 2],
          },
          {},
          {},
          {},
          {},
          {},
          {},
          {},
          {},
          {},
          {
            text: avgK,
            alignment: "center",
            bold: true,
            fontSize: 9,
            margin: [0, 2, 4, 2],
          },
        ],
      ];

      return {
        table: {
          headerRows: 2,
          widths: [
            "9%",
            "20%",
            "7%",
            "7%",
            "9%",
            "8%",
            "9%",
            "7%",
            "9%",
            "8%",
            "8%",
          ],
          body,
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000",
          vLineColor: () => "#000",
          paddingTop: () => 2,
          paddingBottom: () => 2,
          paddingLeft: () => 3,
          paddingRight: () => 3,
        },
        margin: [0, 0, 0, 20],
      };
    };

    // 🧾 Page Sequence
    const pages = [];

    dividedData.forEach((data, index) => {
      pages.push(generateTable1(data, index));
      pages.push({ text: "", pageBreak: "after" });
    });

    // Remarks section
    pages.push({
      stack: [
        {
          text: "Remarks:",
          bold: true,
          fontSize: 10,
          margin: [0, 30, 0, 5],
        },
        {
          ul: [
            {
              text: "Trimming, capping, curing and testing was carried out by KDMEIPL as per IS: 516 Part-IV",
              margin: [0, 0, 0, 2],
              fontSize: 10,
            },
            {
              text: "Core length / weight after trimming and capping: Core length may increase or decrease when compared to extracted core length after capping.",
              margin: [0, 0, 0, 2],
              fontSize: 10,
            },
            {
              text: "For l/d ratio, correction factors are as per clause 8.4.2 of IS: 516 Part-IV",
              margin: [0, 0, 0, 2],
              fontSize: 10,
            },
            {
              text: "As per Clause 8.4.1 of IS: 516 Part-IV, below mentioned correction factors are applied:",
              margin: [0, 0, 0, 2],
              fontSize: 10,
            },
            {
              ul: [
                {
                  text: "For core diameter < 70mm - strength of core x 1.06",
                  margin: [10, 1, 0, 1],
                  fontSize: 10,
                },
                {
                  text: "For core diameter between 70mm to 80mm - strength of core x 1.03",
                  margin: [10, 1, 0, 1],
                  fontSize: 10,
                },
              ],
              margin: [10, 0, 0, 2],
            },
            {
              text: "Equivalent cube compressive strength = 1.25 x corrected cylinder compressive strength as per clause 8.4.2 of IS: 516 Part-IV",
              margin: [0, 0, 0, 2],
              fontSize: 10,
            },
            {
              text: "Report shall not be reproduced except in full without the written approval of the laboratory.",
              margin: [0, 0, 0, 2],
              fontSize: 10,
            },
          ],
          fontSize: 9,
          lineHeight: 1.5,
          margin: [0, 0, 0, 10],
        },
        {
          text: "Note:",
          bold: true,
          margin: [0, 20, 0, 5],
          fontSize: 10,
        },
        {
          text: [
            `The above concrete core specimens were extracted on ${receivedDateFormatted} in the presence of\n`,
            ...siteWitness.map((name, idx) => ({
              text: `${name}${idx < siteWitness.length - 1 ? "\n" : ""}`,
              bold: true,
            })),
            `\n\nand tested on ${testedDateFormatted} in the presence of\n`,
            ...labWitness.map((name, idx) => ({
              text: `${name}${idx < labWitness.length - 1 ? "\n" : ""}`,
              bold: true,
            })),
          ],
          fontSize: 10,
        },
      ],
      margin: [0, 0, 0, 0],
      pageBreak: "after",
    });

    dividedData.forEach((data, index) => {
      pages.push(generateTable2(data, index));
      if (index < dividedData.length - 1)
        pages.push({ text: "", pageBreak: "after" });
    });

    return { stack: pages.flat() };
  } catch (err) {
    console.error("Error generating core compressive strength table:", err.message);
    return null;
  }
};

module.exports = cCoreMech2;
