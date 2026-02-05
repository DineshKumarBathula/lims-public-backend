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
      idx === 0
        ? {
            text: tm,
            fontSize: 9,
            alignment: "center",

            rowSpan: finalTable.length,
          }
        : {},

      idx === 0
        ? {
            text: req,
            fontSize: 9,
            alignment: "center",

            rowSpan: finalTable.length,
          }
        : {},
    ];
  });
};

const dryingShrinkageBody = (finalTable) => {
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
      idx === 0
        ? {
            text: tm,
            fontSize: 9,
            alignment: "center",
            rowSpan: finalTable.length,
          }
        : {},

      idx === 0
        ? {
            text: req,
            fontSize: 9,
            alignment: "center",
            rowSpan: finalTable.length,
          }
        : {},
    ];
  });
};

const getRowWaterAb = (finalTable) => {
  return finalTable.map((eachLine, idx) => {
    const { dim, wa, avg, testMethod, req } = eachLine;
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
        text: wa,
        fontSize: 9,
        alignment: "center",
      },
      idx === 0
        ? {
            text: avg,
            fontSize: 9,
            alignment: "center",

            rowSpan: finalTable.length, // set rowSpan on first row
          }
        : {},

      idx === 0
        ? {
            text: testMethod,
            fontSize: 9,
            alignment: "center",

            rowSpan: finalTable.length, // set rowSpan on first row
          }
        : {},

      idx === 0
        ? {
            text: req,
            fontSize: 9,
            alignment: "center",

            rowSpan: finalTable.length, // set rowSpan on first row
          }
        : {},
    ];
  });
};

const getRowCompressiveStrength = (finalTable) => {
  return finalTable.map((eachLine, idx) => {
    const { dim, cs, avg, testMethod, requirements } = eachLine;
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
            text: avg,
            fontSize: 9,
            alignment: "center",

            rowSpan: finalTable.length, // set rowSpan on first row
          }
        : {},

      idx === 0
        ? {
            text: testMethod,
            fontSize: 9,
            alignment: "center",

            rowSpan: finalTable.length, // set rowSpan on first row
          }
        : {},
      idx === 0
        ? {
            text: requirements,
            fontSize: 9,
            alignment: "center",

            rowSpan: finalTable.length, // set rowSpan on first row
          }
        : {},
    ];
  });
};

const getBricksDimensionAnalysis = (finalTable) => {
  return finalTable.map((eachLine, index) => {
    const { dim, res, method } = eachLine;
    return [
      {
        text: dim,
        fontSize: 9,
        alignment: "center",
      },
      {
        text: res,
        fontSize: 9,
        alignment: "center",
      },
      index === 0
        ? {
            text: method,
            fontSize: 9,
            alignment: "center",

            rowSpan: finalTable.length, // set rowSpan on first row
          }
        : {},
    ];
  });
};

const bricksMech = (parsedJdata) => {
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
    const dimensionalTable = [
      [
        {
          text: "Test Conducted for 20 bricks",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Result for 20 Bricks",
          style: "tableHeader",
          alignment: "center",
        },
        { text: "Test Method", style: "tableHeader", alignment: "center" },
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
        text: "DIMENSIONS (mm)",
        fontSize: 10,
        bold: true,
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
          hLineWidth: () => 0.5,
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
          text: "Average Compressive Strength (N/sq.mm)",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Test Method",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Requirements As Per IS:1077, clause 4.1 & 7.1.1",
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
        text: "COMPRESSIVE STRENGTH",
        fontSize: 10,
        bold: true,
      },
      {
        table: {
          headerRows: 1,
          alignment: "center",
          widths: ["auto", "*", "*", "*", "*", "auto"],
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
          text: "Test Method",
          style: "tableHeader",
          alignment: "center",
        },

        {
          text: "Requirements as per IS: 1077 Clause 7.2",
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
        text: "WATER ABSORPTION",
        fontSize: 10,
        bold: true,
      },

      {
        alignment: "center",
        table: {
          headerRows: 1,
          alignment: "center",
          widths: ["*", "*", "*", "*", "*", "auto"],
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
        { text: "Test Method", style: "tableHeader", alignment: "center" },
        {
          text: "Specifications as per clause 4.3 of IS: 3495",
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

    tables.push(
      {
        text: "EFFLORESCENCE",
        fontSize: 10,
        bold: true,
      },
      {
        alignment: "center",
        table: {
          headerRows: 1,
          alignment: "center",
          widths: ["*", "*", "*", "*", "auto"],
          body: efflotable,
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
          return dryingShrinkageBody(dryingShrinkageBricks[0].finalTable);
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
          widths: ["*", "*", "*", "*", "*"],
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

module.exports = bricksMech;
