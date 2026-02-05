const REDBRICKS_DIMENTIONAL_ANALYSIS = "REDBRICKS_DIMENTIONAL_ANALYSIS";
const REDBRICKS_COMPRESSIVE_STRENGTH = "REDBRICKS_COMPRESSIVE_STRENGTH";
const REDBRICKS_WATER_ABSORPTION = "REDBRICKS_WATER_ABSORPTION";
const REDBRICKS_EFFLOROSCENCE = "REDBRICKS_EFFLOROSCENCE";
const REDBRICKS_DRYING_SHRINKAGE = "REDBRICKS_DRYING_SHRINKAGE";
const REDBRICKS_BLOCK_DENSITY = "REDBRICKS_BLOCK_DENSITY";
const COMPRESSIVE_STRENGTH_BLOCK = "COMPRESSIVE_STRENGTH_BLOCK";
const MOISTURE_CONTENT_BLOCKS = "MOISTURE_CONTENT_BLOCKS";

// Dimensions
const getRow = (finalTable) => {
  return finalTable.map((eachLine, idx) => {
    const { sno, l, b, h, tm } = eachLine;
    console.log(tm, "thn");
    const middleRowIndex = Math.floor(finalTable.length / 2);

    return [
      {
        text: sno,
        fontSize: 9,
        alignment: "center",
      },
      {
        text: l,
        fontSize: 9,
        alignment: "center",
      },
      {
        text: b,
        fontSize: 9,
        alignment: "center",
      },
      {
        text: h,
        fontSize: 9,
        alignment: "center",
      },
      idx === middleRowIndex
        ? {
            text: tm,
            fontSize: 9,
            border: [false, false, true, false],
          }
        : idx === finalTable.length - 1
          ? { text: "", border: [false, false, true, true] }
          : { text: "", border: [false, false, true, false] },
    ];
  });
};

const getCompressiveStrengthRows = (compressiveBlocks = []) => {
  const rows = [];

  rows.push([
    { text: "Block ID*", style: "tableHeader", alignment: "center" },
    { text: "Cube ID", style: "tableHeader", alignment: "center" },
    {
      text: "Size of the tested cube (mm)",
      style: "tableHeader",
      alignment: "center",
    },
    { text: "Test Method", style: "tableHeader", alignment: "center" },
    { text: "Failure Load (kN)", style: "tableHeader", alignment: "center" },
    {
      text: "Compressive Strength (N/mm2)",
      style: "tableHeader",
      alignment: "center",
    },
    {
      text: "Avg. Compressive Strength (N/mm2)",
      style: "tableHeader",
      alignment: "center",
    },
  ]);

  if (!Array.isArray(compressiveBlocks) || compressiveBlocks.length === 0) {
    rows.push([
      { text: "", fontSize: 9, alignment: "center" },
      { text: "", fontSize: 9, alignment: "center" },
      { text: "", fontSize: 9, alignment: "center" },
      { text: "", fontSize: 9, alignment: "center" },
      { text: "", fontSize: 9, alignment: "center" },
      { text: "", fontSize: 9, alignment: "center" },
      { text: "", fontSize: 9, alignment: "center" },
    ]);
    return rows;
  }

  compressiveBlocks.forEach((block, bIdx) => {
    const samples = Array.isArray(block.samples) ? block.samples : [];
    const blockRowSpan = Math.max(1, samples.length);

    let blockAvg = block.avg ?? null;
    if (!blockAvg) {
      const csVals = samples
        .map((s) => {
          const v = parseFloat(s.compStrength);
          return Number.isFinite(v) ? v : NaN;
        })
        .filter((v) => !Number.isNaN(v));
      if (csVals.length > 0) {
        const avg = csVals.reduce((a, b) => a + b, 0) / csVals.length;
        blockAvg = Math.round(avg * 100) / 100;
      }
    }

    if (samples.length === 0) {
      rows.push([
        {
          text: `Block-${bIdx + 1}`,
          fontSize: 9,
          alignment: "center",
          rowSpan: 1,
          valign: "center",
        },
        { text: "", fontSize: 9, alignment: "center" },
        { text: "", fontSize: 9, alignment: "center" },
        {
          text: "IS: 6441 (Part-5)",
          fontSize: 9,
          alignment: "center",
          rowSpan: 1,
        },
        { text: "", fontSize: 9, alignment: "center" },
        { text: "", fontSize: 9, alignment: "center" },
        {
          text: blockAvg !== null ? String(blockAvg) : "",
          fontSize: 9,
          alignment: "center",
        },
      ]);
      return;
    }

    samples.forEach((sample, sIdx) => {
      const sizeText =
        `${sample.length ?? sample.l ?? ""} x ${sample.width ?? sample.w ?? ""} x ${sample.depth ?? sample.d ?? ""}`.trim();

      const failureLoad = sample.breakingLoad ?? sample.failureLoad ?? "";
      const compStrength = sample.compStrength ?? "";

      const row = [];

      if (sIdx === 0) {
        row.push({
          text: `Block-${bIdx + 1}`,
          fontSize: 9,
          alignment: "center",
          rowSpan: blockRowSpan,
          valign: "center",
        });
      } else {
        row.push({});
      }

      row.push({ text: sample.cubeNo ?? "", fontSize: 9, alignment: "center" });
      row.push({
        text: sizeText || "150x150x150",
        fontSize: 9,
        alignment: "center",
      });

      if (sIdx === 0) {
        row.push({
          text: "IS: 6441 (Part-5)",
          fontSize: 9,
          alignment: "center",
          rowSpan: blockRowSpan,
        });
      } else {
        row.push({});
      }

      row.push({ text: String(failureLoad), fontSize: 9, alignment: "center" });
      row.push({
        text: String(compStrength),
        fontSize: 9,
        alignment: "center",
      });

      if (sIdx === 0) {
        row.push({
          text: blockAvg !== null ? String(blockAvg) : "",
          fontSize: 9,
          alignment: "center",
          rowSpan: blockRowSpan,
        });
      } else {
        row.push({});
      }

      rows.push(row);
    });
  });

  return rows;
};

const getMoistureContentRows = (mcBlocks = []) => {
  const rows = [];

  // HEADER
  rows.push([
    { text: "Sl. No.", style: "tableHeader", alignment: "center" },
    {
      text: "Size of the Specimen (mm)",
      style: "tableHeader",
      alignment: "center",
    },
    { text: "Test Method", style: "tableHeader", alignment: "center" },
    { text: "Moisture Content (%)", style: "tableHeader", alignment: "center" },
    {
      text: "Average Moisture Content (%)",
      style: "tableHeader",
      alignment: "center",
    },
  ]);

  if (!Array.isArray(mcBlocks) || mcBlocks.length === 0) return rows;

  let blockNo = 1; // ✅ block counter

  mcBlocks.forEach((block) => {
    const samples = block.samples || [];
    const rowSpan = samples.length;

    const specimenSize = `${block.length} x ${block.breadth} x ${block.height}`;

    // Compute block average
    const avg =
      Math.round(
        (samples.reduce((sum, s) => sum + Number(s.moisture), 0) / rowSpan) *
          100
      ) / 100;

    samples.forEach((sample, idx) => {
      rows.push([
        // ✅ ONE serial no per block
        idx === 0
          ? {
              text: `Block-${blockNo}`,
              fontSize: 9,
              alignment: "center",
              rowSpan,
              valign: "middle",
            }
          : {},

        // Size of specimen
        idx === 0
          ? { text: specimenSize, fontSize: 9, alignment: "center", rowSpan }
          : {},

        // Test Method
        idx === 0
          ? {
              text: "IS: 6441 (Part-1)",
              fontSize: 9,
              alignment: "center",
              rowSpan,
            }
          : {},

        // Moisture per sample
        { text: sample.moisture.toString(), fontSize: 9, alignment: "center" },

        // Average moisture
        idx === 0
          ? { text: avg.toString(), fontSize: 9, alignment: "center", rowSpan }
          : {},
      ]);
    });

    blockNo++; // ✅ increment once per block
  });

  return rows;
};

//in progress efflorecense and drying shrinkage(Done)
const getRowEffloroscence = (finalTable) => {
  console.log(finalTable, "finalTable78");
  return finalTable.map((eachLine, idx) => {
    const { dim, e, tm } = eachLine;

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
            valign: "middle",

            rowSpan: finalTable.length,
          }
        : {},
    ];
  });
};

//REVIEWED
const getRowWaterAb = (finalTable) => {
  return finalTable.map((eachLine, idx) => {
    const { dim, wa, avg, testMethod } = eachLine;
    // Build rows as needed for each table structure
    return [
      {
        text: idx + 1,
        fontSize: 9,
        alignment: "center",

        dontBreakRows: true,
        keepWithHeaderRows: 1,
      },
      {
        text: dim,
        fontSize: 9,
        alignment: "center",

        dontBreakRows: true,
        keepWithHeaderRows: 1,
      },
      {
        text: wa,
        fontSize: 9,
        alignment: "center",

        dontBreakRows: true,
        keepWithHeaderRows: 1,
      },
      idx === 0
        ? {
            text: testMethod,
            fontSize: 9,
            alignment: "center",
            valign: "center",

            rowSpan: finalTable.length, // set rowSpan on first row
            dontBreakRows: true,
            keepWithHeaderRows: 1,
          }
        : {},

      idx === 0
        ? {
            text: avg,
            fontSize: 9,
            alignment: "center",
            valign: "center",

            rowSpan: finalTable.length, // set rowSpan on first row
            dontBreakRows: true,
            keepWithHeaderRows: 1,
          }
        : {},
    ];
  });
};

const getRowCompressiveStrength = (finalTable) => {
  // console.log(finalTable,'finalTable23')
  let blockType = finalTable[0]?.blockType || "";
  return finalTable.map((eachLine, idx) => {
    const { dim, cs, avg, testMethod } = eachLine;

    const commonCellStyle = {
      fontSize: 9,
      alignment: "center",
    };

    const middleRowIndex = 0;
    const row = [
      { text: idx + 1, ...commonCellStyle },
      { text: dim, ...commonCellStyle },
      { text: cs, ...commonCellStyle },

      idx === middleRowIndex
        ? {
            text: avg,
            ...commonCellStyle,
            border: [false, false, true, false],
          }
        : idx === finalTable.length - 1
          ? { text: "", border: [false, false, true, true] }
          : { text: "", border: [false, false, true, false] },

      idx === middleRowIndex
        ? {
            text: testMethod,
            ...commonCellStyle,
            border: [false, false, false, false],
          }
        : idx === finalTable.length - 1
          ? { text: "", border: [false, false, false, true] }
          : { text: "", border: [false, false, false, false] },
    ];

    // Existing grade table (no change here)
    if (idx === 0) {
      row.push({
        table: {
          fillColor: "#eeeeee",
          widths: ["*", "*", "*"],
          body: [
            [
              {
                text: "Grade",
                alignment: "center",
                ...commonCellStyle,
              },
              {
                text: "Minimum Avg compressive strength of 8 Units, N/mm2",
                alignment: "center",
                ...commonCellStyle,
              },
              {
                text: "Minimum  compressive strength of Individual Units, N/mm2 ",
                alignment: "center",
                ...commonCellStyle,
              },
            ],
          ],
        },
        layout: "lightHorizontalLines",

        alignment: "center",
      });
    } else if (idx === 1) {
      row.push({
        table: {
          widths: ["*", "*", "*"],
          layout: "lightHorizontalLines",
          body: [
            [
              {
                text:
                  blockType === "LIGHT" ? "Grade A (12.5)" : "Grade C (5.0)",
                alignment: "center",
                ...commonCellStyle,
              },
              {
                text: blockType === "LIGHT" ? "12.5" : "5.0",
                alignment: "center",
                ...commonCellStyle,
              },
              {
                text: blockType === "LIGHT" ? "8.0" : "4.0",
                alignment: "center",
                ...commonCellStyle,
              },
            ],
          ],
        },
        layout: "lightHorizontalLines",
        alignment: "center",
      });
    } else if (idx === 2) {
      row.push({
        table: {
          widths: ["*", "*", "*"],
          body: [
            [
              {
                text: blockType === "LIGHT" ? "Grade B (8.5)" : "Grade C (4.0)",
                alignment: "center",
                ...commonCellStyle,
              },
              {
                text: blockType === "LIGHT" ? "8.5" : "4.0",
                alignment: "center",
                ...commonCellStyle,
              },
              {
                text: blockType === "LIGHT" ? "7.0" : "3.2",
                alignment: "center",
                ...commonCellStyle,
              },
            ],
          ],
        },
        layout: "lightHorizontalLines",
        alignment: "center",
      });
    } else {
      row.push({ text: "", rowSpan: finalTable.length - 3 });
    }

    return row;
  });
};

const getRowDenstiy = (finalTable) => {
  return finalTable.map((eachLine, idx) => {
    const { dim, d, tm, avg } = eachLine;

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
        text: d,
        fontSize: 9,
        alignment: "center",
      },

      idx === 0
        ? {
            text: tm,
            fontSize: 9,
            alignment: "center",
            valign: "center",
            rowSpan: finalTable.length,
          }
        : {},

      idx === 0
        ? {
            text: avg,
            fontSize: 9,
            alignment: "center",
            valign: "center",
            rowSpan: finalTable.length,
          }
        : {},
    ];
  });
};

const getDrying = (finalTable = []) => {
  const rows = [];
  const groupSize = 3;

  for (let i = 0; i < finalTable.length; i += groupSize) {
    const group = finalTable.slice(i, i + groupSize);
    const blockNo = Math.floor(i / groupSize) + 1;

    // Since values are constant ("Nill"), average is same
    const avgShrinkage = group[0]?.e || "Nill";

    group.forEach((eachLine, idx) => {
      const { dim, e, tm } = eachLine;

      rows.push([
        // ✅ ONE serial no per 3 rows
        idx === 0
          ? {
              text: `Block-${blockNo}`,
              fontSize: 9,
              alignment: "center",
              rowSpan: group.length,
              valign: "middle",
            }
          : {},

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

        // ✅ Average Drying Shrinkage column
        idx === 0
          ? {
              text: avgShrinkage,
              fontSize: 9,
              alignment: "center",
              rowSpan: group.length,
              valign: "middle",
            }
          : {},

        // ✅ Test Method (already rowspan)
        idx === 0
          ? {
              text: tm,
              fontSize: 9,
              alignment: "center",
              rowSpan: group.length,
              valign: "middle",
            }
          : {},
      ]);
    });
  }

  return rows;
};

const concreteBlocksMech = (parsedJdata) => {
  const compressiveEntry =
    parsedJdata.find((x) => x.paramName === COMPRESSIVE_STRENGTH_BLOCK) || null;

  const moistureContentBlocks =
    parsedJdata.find((x) => x.paramName === MOISTURE_CONTENT_BLOCKS) || null;
  console.log(moistureContentBlocks,'moistureContentBlocks765')

  const densityAnalysis = (parsedJdata || [])?.filter(
    (eachObj) => eachObj.paramName === REDBRICKS_BLOCK_DENSITY
  );

  const dryingShrinkage = (parsedJdata || [])?.filter(
    (eachObj) => eachObj.paramName === REDBRICKS_DRYING_SHRINKAGE
  );

  const dimentionalAnalysis = (parsedJdata || [])?.filter(
    (eachObj) => eachObj.paramName === REDBRICKS_DIMENTIONAL_ANALYSIS
  );

  const efflorosenceAnalysis = (parsedJdata || [])?.filter(
    (eachObj) => eachObj.paramName === REDBRICKS_EFFLOROSCENCE
  );

  const compressiveStrength = (parsedJdata || [])?.filter(
    (eachObj) => eachObj.paramName === REDBRICKS_COMPRESSIVE_STRENGTH
  );
  // console.log(compressiveStrength,'compressiveStrength34')
  const waterAbsorption = (parsedJdata || [])?.filter(
    (eachObj) => eachObj.paramName === REDBRICKS_WATER_ABSORPTION
  );

  const tables = [];

  //concrete bricks - reviewed
  if (dimentionalAnalysis.length > 0) {
    const dimensionalTable = [
      [
        { text: "S.No", style: "tableHeader", alignment: "center" },
        { text: "Length (mm)", style: "tableHeader", alignment: "center" },
        { text: "Width (mm)", style: "tableHeader", alignment: "center" },
        { text: "Thickness (mm)", style: "tableHeader", alignment: "center" },
        { text: "Test Method", style: "tableHeader", alignment: "center" },
      ],
      ...parsedJdata.flatMap(({ paramName }) => {
        if (paramName === REDBRICKS_DIMENTIONAL_ANALYSIS) {
          return getRow(dimentionalAnalysis[0].finalTable);
        }
        return [];
      }),
    ];

    let daSize = "";
    daSize = dimentionalAnalysis[0].formData?.blockSize;

    tables.push(
      {
        text:
          daSize && daSize.trim() !== ""
            ? `DIMENSIONS (${daSize.trim()})`
            : "DIMENSIONS",
        fontSize: 10,
        bold: true,
      },
      {
        alignment: "center",
        table: {
          headerRows: 1,
          alignment: "center",
          widths: ["auto", "*", "*", "*", "auto"],
          body: dimensionalTable,
          dontBreakRows: true,
          keepWithHeaderRows: 1,
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        // margin: [0, 0, 0, 75]
        margin: [0, 3, 0, 5],
      }
    );
  }

  if (compressiveEntry) {
    // console.log('entrd786')
    const compressiveBlocks = Array.isArray(compressiveEntry.formData?.blocks)
      ? compressiveEntry.formData.blocks
      : [];

    let cbSize = "";
    cbSize = compressiveEntry.formData?.blockSize;

    const compBody = getCompressiveStrengthRows(compressiveBlocks);

    tables.push(
      {
        columns: [
          {
            text:
              cbSize && cbSize.trim() !== ""
                ? `COMPRESSIVE STRENGTH (${cbSize.trim()})`
                : "COMPRESSIVE STRENGTH",
            fontSize: 10,
            bold: true,
            alignment: "left",
          },
          //   { text: "Test Method: IS: 6441 (Part-5)", fontSize: 9, alignment: "right" },
        ],
      },
      {
        table: {
          headerRows: 1,
          widths: ["auto", "auto", "*", "auto", "auto", "auto", "auto"],
          body: compBody,
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

  if (moistureContentBlocks) {
    const mcBlocks = Array.isArray(moistureContentBlocks.formData?.blocks)
      ? moistureContentBlocks.formData.blocks
      : [];

    let mcSize = "";
    mcSize = moistureContentBlocks.formData?.sizeOfBlock;

    const mcBody = getMoistureContentRows(mcBlocks);

    tables.push(
      {
        columns: [
          {
            text:
              mcSize && mcSize.trim() !== ""
                ? `Moisture Content (${mcSize.trim()})`
                : "Moisture Content",
            fontSize: 10,
            bold: true,
            alignment: "left",
          },
        ],
        margin: [0, 6, 0, 4],
      },
      {
        table: {
          headerRows: 1,
          widths: ["auto", "*", "auto", "auto", "auto"],
          body: mcBody,
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

  if (densityAnalysis.length > 0) {
    const compressiveStrengthTable = [
      [
        { text: "S.No", style: "tableHeader", alignment: "center" },
        {
          text: "Dimensions (mm)",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Block Density (kg/cu.m)",
          style: "tableHeader",
          alignment: "center",
        },

        {
          text: "Test Method",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Avg Block Dry Density (Kg/cu.m)",
          style: "tableHeader",
          alignment: "center",
        },
      ],
      ...parsedJdata.flatMap(({ paramName }) => {
        if (paramName === REDBRICKS_BLOCK_DENSITY) {
          return getRowDenstiy(densityAnalysis[0].finalTable);
        }
        return [];
      }),
    ];

    tables.push(
      {
        text: "BLOCK DRY DENSITY",
        fontSize: 10,
        bold: true,
      },
      {
        alignment: "center",
        table: {
          headerRows: 1,
          alignment: "center",
          widths: ["*", "*", "*", "*", "*"],
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

  if (dryingShrinkage.length > 0) {
    const dsTable = [
      [
        { text: "S.No", style: "tableHeader", alignment: "center" },
        {
          text: "Size of the Specimen (mm)",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Drying Shrinkage (%)",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Average Drying Shrinkage (%)",
          style: "tableHeader",
          alignment: "center",
        }, // ✅ NEW
        {
          text: "Test Method",
          style: "tableHeader",
          alignment: "center",
        },
      ],
      ...parsedJdata.flatMap(({ paramName }) => {
        if (paramName === REDBRICKS_DRYING_SHRINKAGE) {
          return getDrying(dryingShrinkage[0].finalTable);
        }
        return [];
      }),
    ];

    let dySize = "";
    dySize = dryingShrinkage[0].formData?.sizeOfBlock;

    tables.push(
      {
        text:
          dySize && dySize.trim() !== ""
            ? `Drying Shrinkage (${dySize})`
            : "Drying Shrinkage",
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

  if (waterAbsorption.length > 0) {
    const waterAbsorptionTable = [
      [
        { text: "Sl.No", style: "tableHeader", alignment: "center" },
        {
          text: "Dimensions (mm)",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Water Absorption (%)",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Test Method",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Average Water Absorption (%)",
          style: "tableHeader",
          alignment: "center",
        },
      ],
      ...parsedJdata.flatMap(({ paramName }) => {
        if (paramName === REDBRICKS_WATER_ABSORPTION) {
          return getRowWaterAb(waterAbsorption[0].finalTable);
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
          widths: ["*", "*", "*", "*", "*"],
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

  if (compressiveStrength.length > 0) {
    let blockType = compressiveStrength[0]?.finalTable[0]?.blockType || "";
    const compressiveStrengthTable = [
      [
        { text: "Sl.No", style: "tableHeader", alignment: "center" },
        {
          text: "Dimensions (mm)",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Compressive Strength (N/sq.mm)",
          style: "tableHeader",
          alignment: "center",
        },

        {
          text: "Average Compressive strength (N/sq.mm)",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Test Method",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text:
            blockType === "LIGHT"
              ? "Specifications as per Table-1 of 2185 Part 2"
              : "Specifications as per Table-2 of 2185 Part 1",
          style: "tableHeader",
          alignment: "center",
        },
      ],
      ...parsedJdata.flatMap(({ paramName }) => {
        if (paramName === REDBRICKS_COMPRESSIVE_STRENGTH) {
          return getRowCompressiveStrength(compressiveStrength[0]?.finalTable);
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
        alignment: "center",
        table: {
          headerRows: 1,
          alignment: "center",
          widths: ["auto", "20%", "*", "auto", "auto", "auto"],
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

  if (efflorosenceAnalysis.length > 0) {
    const efflotable = [
      [
        { text: "S.No", style: "tableHeader", alignment: "center" },
        {
          text: "Sample DescriptionsClass",
          style: "tableHeader",
          alignment: "center",
        },
        { text: "Efflorescence", style: "tableHeader", alignment: "center" },
        { text: "Test Method", style: "tableHeader", alignment: "center" },
      ],
      ...parsedJdata.flatMap(({ paramName }) => {
        if (paramName === REDBRICKS_EFFLOROSCENCE) {
          return getRowEffloroscence(efflorosenceAnalysis[0].finalTable);
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
          widths: ["*", "*", "*", "*"],
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

  return tables;
};

module.exports = concreteBlocksMech;
