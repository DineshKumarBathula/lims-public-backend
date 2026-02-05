const BRICKS_WATER_ABSORPTION = "BRICKS_WATER_ABSORPTION";
const BRICKS_COMPRESSIVE_STRENGTH = "BRICKS_COMPRESSIVE_STRENGTH";
const BRICKS_EFFLOROSCENCE = "BRICKS_EFFLOROSCENCE";
const BRICKS_DIMENTIONAL_ANALYSIS_BRICKS = "BRICKS_DIMENTIONAL_ANALYSIS_BRICKS";
const BRICKS_DRYING_SHRINKAGE = "BRICKS_DRYING_SHRINKAGE";

const getRowEffloroscence = (finalTable) => {
  return finalTable.map((eachLine, idx) => {
    const { dim, e, tm, req } = eachLine;

    return [
      {
        text: idx + 1,
        fontSize: 9,
        alignment: "center",
      },
      {
        text: dim,
        fontSize: 9,
        alignment: "center",
      },
      {
        text: e,
        fontSize: 9,
        alignment: "center",
      },
      {
            text: req, // show for row 0 & 1 separately
            fontSize: 9,
            alignment: "center",
            valign: "center",
            rowSpan: finalTable.length,
            margin:[0,0,0,0]
          }
      
    ];
  });
};

const getRowWaterAb = (finalTable) => {
  const borderless = { text: "", border: [false, false, false, false] };
  return finalTable.map((eachLine, idx) => {
    const { dim, wa, avg, testMethod, req } = eachLine;
    return [
      { text: idx + 1, fontSize: 9, alignment: "center" },
      { text: dim, fontSize: 9, alignment: "center" },
      { text: wa, fontSize: 9, alignment: "center" },
      idx === 0
        ? {
            text: avg,
            fontSize: 9,
            alignment: "center",
            valign: "center",

            rowSpan: finalTable.length,
          }
        : borderless,

      idx === 0
        ? {
            text: req,
            fontSize: 9,
            alignment: "center",
            valign: "center",

            rowSpan: finalTable.length,
          }
        : borderless,
    ];
  });
};

const getRowCompressiveStrength = (finalTable) => {
  return finalTable.map((eachLine, idx) => {
    console.log(finalTable);
    const { dim, cs, avg, requirements } = eachLine;
    // Build rows as needed for each table structure
    return [
      {
        text: idx + 1,
        fontSize: 9,
        alignment: "center",
      },
      {
        text: dim,
        fontSize: 9,
        alignment: "center",
      },
      {
        text: cs,
        fontSize: 9,
        alignment: "center",
      },
      idx === 0
        ? {
            text: avg + " (N/sq.mm)",
            fontSize: 9,
            alignment: "center",
            valign: "center",
            rowSpan: finalTable.length, // set rowSpan on first row
          }
        : {},

      idx === 0
        ? {
            text: requirements,
            fontSize: 9,
            alignment: "center",
            // valign: "middle",
            valign: "center",

            rowSpan: finalTable.length, // set rowSpan on first row
          }
        : {},
    ];
  });
};

const getBricksDimensionAnalysis = (finalTable = []) => {
  const length = finalTable.find(r => r.dim === "Length")?.res ?? "";
  const width  = finalTable.find(r => r.dim === "Width")?.res ?? "";
  const height = finalTable.find(r => r.dim === "Height")?.res ?? "";

  return [
    [
      { text: length, fontSize: 9, alignment: "center" },
      { text: width,  fontSize: 9, alignment: "center" },
      { text: height, fontSize: 9, alignment: "center" },
    ],
  ];
};


// const getBricksDimensionAnalysis = (finalTable) => {
//   console.log(finalTable,'finalTable787')
//   return finalTable.map((eachLine, index) => {
//     const { dim, res, method } = eachLine;
//     return [
//       {
//         text: dim,
//         fontSize: 9,
//         alignment: "center",
//       },
//       {
//         text: res,
//         fontSize: 9,
//         alignment: "center",
//       },
//       index === 0
//         ? {
//             text: method,
//             fontSize: 9,
//             alignment: "center",
//             valign: "middle",

//             rowSpan: finalTable.length, // set rowSpan on first row
//           }
//         : {},
//     ];
//   });
// };

const flyAshbricksMech = (id,parsedJdata) => {
console.log(typeof id,'id898')

  const dimensionAnalysisBricks = (parsedJdata || []).filter(
    (eachObj) => eachObj.paramName === BRICKS_DIMENTIONAL_ANALYSIS_BRICKS
  );

  const dryingShrinkageBricks = (parsedJdata || []).filter(
    (eachObj) => eachObj.paramName === BRICKS_DRYING_SHRINKAGE
  );

  const compressiveStrengthBricks = (parsedJdata || []).filter(
    (eachObj) => eachObj.paramName === BRICKS_COMPRESSIVE_STRENGTH
  );

  const bricksWaterAbAnalysis = (parsedJdata || []).filter(
    (eachObj) => eachObj.paramName === BRICKS_WATER_ABSORPTION
  );

  const bricksEffloroscence = (parsedJdata || []).filter(
    (eachObj) => eachObj.paramName === BRICKS_EFFLOROSCENCE
  );

  const tables = [];

  //bricks
  if (dimensionAnalysisBricks.length > 0) {
    // const dimensionalTable = [
    //   [
    //     {
    //       text: "Test Conducted for 20 bricks",
    //       style: "tableHeader",
    //       alignment: "center",
    //     },
    //     {
    //       text: "Result for 20 Bricks",
    //       style: "tableHeader",
    //       alignment: "center",
    //     },
    //     { text: "Test Method", style: "tableHeader", alignment: "center" },
    //   ],
    //   ...parsedJdata.flatMap(({ paramName }) => {
    //     if (paramName === BRICKS_DIMENTIONAL_ANALYSIS_BRICKS) {
    //       return getBricksDimensionAnalysis(
    //         dimensionAnalysisBricks[0].finalTable
    //       );
    //     }
    //     return [];
    //   }),
    // ];

    const dimensionalTable = [
  [
    { text: "Length (mm)", style: "tableHeader", alignment: "center" },
    { text: "Width (mm)", style: "tableHeader", alignment: "center" },
    { text: "Height (mm)", style: "tableHeader", alignment: "center" },
  ],

  ...parsedJdata.flatMap(({ paramName }) => {
    if (paramName === BRICKS_DIMENTIONAL_ANALYSIS_BRICKS) {
      return getBricksDimensionAnalysis(
        dimensionAnalysisBricks[0].finalTable
      );
    }
    return [];
  }),
];


    tables.push(
{
  columns: [
    {
      text: "DIMENSIONS (For 20 Bricks)",
      fontSize: 10,
      bold: true,
      alignment: "left",
    },
    {
      text: id ==119? "Test Method: IS: 12894": "Test Method: IS: 1077", // ← dynamic if needed
      fontSize: 9,
      alignment: "right",
    },
  ],
  margin: [0, 0, 0, 0],
},


      {
        alignment: "center",
        table: {
          headerRows: 1,
          alignment: "center",
          widths: ["*", "*", "*"],
          body: dimensionalTable,
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
          hLineWidth: function (i, node) {
            return i === 0 || i === node.table.body.length ? 0.5 : 0.5;
          },
          // draw a line where pdfmake splits a rowSpan across pages
          hLineWhenBroken: true,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
      }
    );
  }

  if (compressiveStrengthBricks.length > 0) {
    const compressiveStrengthTable = [
      [
        { text: "Sl.No", style: "tableHeader", alignment: "center" },
        {
          text: "Measured Dimensions (mm)",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Compressive Strength (N/sq.mm)",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Average Compressive Strength",
          style: "tableHeader",
          alignment: "center",
        },

        {
          text: "Requirements as per IS:12894 Clause 4.1 & 7.1",
          style: "tableHeader",
          alignment: "center",
        },
      ],
      ...parsedJdata.flatMap(({ paramName }) => {
        if (paramName === BRICKS_COMPRESSIVE_STRENGTH) {
          return getRowCompressiveStrength(
            compressiveStrengthBricks[0].finalTable
          );
        }
        return [];
      }),
    ];

    tables.push(
      {
        columns: [
          {
            text: "COMPRESSIVE STRENGTH",
            fontSize: 10,
            bold: true,
            alignment: "left",
          },
          {
            text: "Test Method: IS: 3495 Part-1",
            fontSize: 9,
            alignment: "right",
          },
        ],
      },
      {
        table: {
          headerRows: 1,
          alignment: "center",
          widths: ["auto", "*", "*", "*", "auto"],
          body: compressiveStrengthTable,
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
      }
    );
  }

  if (bricksWaterAbAnalysis.length > 0) {
    const waterAbsorptionTable = [
      [
        { text: "Sl.No", style: "tableHeader", alignment: "center" },
        {
          text: "Measured Dimensions (mm)",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Water Absorption (%)",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Average Water Absorption (%)",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Requirements as per clause 7.4 of IS:12894",
          style: "tableHeader",
          alignment: "center",
        },
      ],
      ...parsedJdata.flatMap(({ paramName }) => {
        if (paramName === BRICKS_WATER_ABSORPTION) {
          return getRowWaterAb(bricksWaterAbAnalysis[0].finalTable);
        }
        return [];
      }),
    ];

    tables.push(
      {
  columns: [
    {
      text: "WATER ABSORPTION",
      fontSize: 10,
      bold: true,
      alignment: "left",
    },
    {
      text: "Test Method: IS: 3495 Part-2", // ← dynamic if needed
      fontSize: 9,
      alignment: "right",
    },
  ],
},


      {
        alignment: "center",
        table: {
          headerRows: 1,
          alignment: "center",
          widths: ["auto", "*", "*", "*", "auto"],
          body: waterAbsorptionTable,
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
      }
    );
  }

  if (bricksEffloroscence.length > 0) {
    const efflotable = [
      [
        { text: "S.No", style: "tableHeader", alignment: "center" },
        {
          text: "Measured Size (mm)",
          style: "tableHeader",
          alignment: "center",
        },
        { text: "Efflorescence", style: "tableHeader", alignment: "center" },

        {
          text: "Requirements as per clause 7.3 of IS:12894-2002",
          style: "tableHeader",
          alignment: "center",
        },
      ],
      ...parsedJdata.flatMap(({ paramName }) => {
        if (paramName === BRICKS_EFFLOROSCENCE) {
          return getRowEffloroscence(bricksEffloroscence[0].finalTable);
        }
        return [];
      }),
    ];

    tables.push({
      stack: [
        {
          columns: [
            {
              text: "EFFLORESCENCE",
              fontSize: 10,
              bold: true,
              alignment: "left",
            },
            {
              text: "Test Method:  IS: 3495 part-3",
              fontSize: 9,
              alignment: "right",
            },
          ],
        },
        {
          table: {
            headerRows: 1,
            widths: ["auto", "*", "*", "auto"],
            body: efflotable, // with your rowspan cells
          },
          layout: {
            fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#000000",
            vLineColor: () => "#000000",
          },
          dontBreakRows: true, // ✅ prevents row split across pages
        },
      ],
      keepTogether: true, // ✅ ensures heading + table stay together
    });

    // tables.push({
    //   stack: [
    //     {
    //       text: "EFFLORESCENCE",
    //       fontSize: 10,
    //       bold: true,
    //     },
    //     {
    //       alignment: "center",
    //       table: {
    //         headerRows: 1,
    //         keepWithHeaderRows: 1,
    //         widths: ["auto", "*", "*", "*", "auto"],
    //         body: efflotable,
    //       },
    //       layout: {
    //         fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
    //         hLineWidth: () => 0.5,
    //         vLineWidth: () => 0.5,
    //         hLineColor: () => "#000000",
    //         vLineColor: () => "#000000",
    //       },
    //     },
    //   ],
    //   // 👇 ensures heading & table don't split across pages
    //   keepTogether: true,
    //   dontBreakRows: true,
    //   // dontBreakRows: true,
    //   keepWithHeaderRows: 1,
    // });
    // tables.push({
    //   stack: [
    //     {
    //       text: "EFFLORESCENCE",
    //       fontSize: 10,
    //       bold: true,
    //       margin: [0, 5, 0, 3],
    //     },
    //     {
    //       alignment: "center",
    //       table: {
    //         keepWithHeaderRows: 1,
    //         headerRows: 1,
    //         widths: ["auto", "*", "*", "*", "auto"],
    //         body: efflotable,
    //       },
    //       layout: {
    //         fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
    //         hLineWidth: () => 0.5,
    //         vLineWidth: () => 0.5,
    //         hLineColor: () => "#000000",
    //         vLineColor: () => "#000000",
    //       },
    //     },
    //   ],
    //   // 👇 ensures heading & table don't split across pages
    //   keepTogether: true,
    // });

    // tables.push(
    //   {
    //     text: "EFFLORESCENCE",
    //     fontSize: 10,
    //     bold: true,
    //   },
    //   {
    //     alignment: "center",
    //     table: {
    //       headerRows: 1,

    //       keepWithHeaderRows: 1,

    //       alignment: "center",
    //       widths: ["auto", "*", "*", "*", "auto"],
    //       body: efflotable,
    //     },
    //     layout: {
    //       fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
    //       hLineWidth: () => 0.5,
    //       vLineWidth: () => 0.5,
    //       hLineColor: () => "#000000",
    //       vLineColor: () => "#000000",
    //     },

    //     // dontBreakRows: true,
    //     // keepWithHeaderRows: 1,
    //   }
    // );
  }

  if (dryingShrinkageBricks.length > 0) {
    const dsTable = [
      [
        { text: "S.No", style: "tableHeader", alignment: "center" },
        {
          text: "Sample Descriptions Class",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Drying Shrinkage (%)",
          style: "tableHeader",
          alignment: "center",
        },

        {
          text: "Test Method",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Requirements as per Requirements as per Clause 7.2 of Clause 7.2 of IS: 12894",
          style: "tableHeader",
          alignment: "center",
        },
      ],
      ...parsedJdata.flatMap(({ paramName }) => {
        if (paramName === BRICKS_DRYING_SHRINKAGE) {
          return getRowEffloroscence(dryingShrinkageBricks[0].finalTable);
        }
        return [];
      }),
    ];

    tables.push(
      {
        text: "Drying Shrinkage",
        fontSize: 10,
        bold: true,
      },
      {
        alignment: "center",
        table: {
          headerRows: 1,
          alignment: "center",
          widths: ["auto", "*", "*", "*", "auto"],
          body: dsTable,
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
      }
    );
  }

  return tables;
};

module.exports = flyAshbricksMech;
