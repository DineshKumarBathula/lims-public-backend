// aacBlocks.js
const DENSITY_BLOCK_AAC = "DENSITY_BLOCK_AAC";
const COMPRESSIVE_STRENGTH_BLOCK = "COMPRESSIVE_STRENGTH_BLOCK";

// const getDensityRows = (densityRows = []) => {
//   const rows = [];
// console.log(densityRows,'densityRows876')
//   // Header Row
//   rows.push([
//     { text: "Sl. No.", style: "tableHeader", alignment: "center" },
//     { text: "Size of the Specimen (mm)", style: "tableHeader", alignment: "center" },
//     { text: "Test Method", style: "tableHeader", alignment: "center" },
//     { text: "Block Dry Density (kg/cu.m)", style: "tableHeader", alignment: "center" },
//     { text: "Average Block Dry Density (kg/cu.m)", style: "tableHeader", alignment: "center" }
//   ]);

//   if (!densityRows.length) return rows;

//   for (let i = 0; i < densityRows.length; i += 3) {
//     const group = densityRows.slice(i, i + 3);
//     const groupSize = group.length;

//     const avg =
//   Math.round(
//     group.reduce((sum, r) => sum + Number(r.density), 0) / groupSize
//   );


//     group.forEach((r, idx) => {
//       const sizeText = `${r.length} x ${r.width} x ${r.height}`;
//       const densityVal = r.density;

//       rows.push([
//         { text: i + idx + 1, fontSize: 9, alignment: "center" },

//         idx === 0
//           ? {
//               text: sizeText,
//               fontSize: 9,
//               alignment: "center",
//               rowSpan: groupSize
//             }
//           : {},

//         idx === 0
//           ? {
//               text: "IS: 6441 (Part-1)",
//               fontSize: 9,
//               alignment: "center",
//               rowSpan: groupSize
//             }
//           : {},

//         { text: densityVal, fontSize: 9, alignment: "center" },

//         idx === 0
//           ? {
//               text: avg.toString(),
//               fontSize: 9,
//               alignment: "center",
//               rowSpan: groupSize
//             }
//           : {}
//       ]);
//     });
//   }
//   return rows;
// };


const getDensityRows = (densityRows = []) => {
  const rows = [];

  // Header Row
  rows.push([
    { text: "Sl. No.", style: "tableHeader", alignment: "center" },
    { text: "Size of the Specimen (mm)", style: "tableHeader", alignment: "center" },
    { text: "Test Method", style: "tableHeader", alignment: "center" },
    { text: "Block Density (kg/cu.m)", style: "tableHeader", alignment: "center" },
    { text: "Average Block Dry Density (kg/cu.m)", style: "tableHeader", alignment: "center" }
  ]);

  if (!densityRows.length) return rows;

  let blockNo = 1; // ✅ Block counter

  for (let i = 0; i < densityRows.length; i += 3) {
    const group = densityRows.slice(i, i + 3);
    const groupSize = group.length;

    const avg = Math.round(
      group.reduce((sum, r) => sum + Number(r.density), 0) / groupSize
    );

    group.forEach((r, idx) => {
      const sizeText = `${r.length} x ${r.width} x ${r.height}`;

      rows.push([
        // ✅ ONE serial number for 3 rows
        idx === 0
          ? {
              text: `Block-${blockNo}`,
              fontSize: 9,
              alignment: "center",
              rowSpan: groupSize
            }
          : {},

        idx === 0
          ? {
              text: sizeText,
              fontSize: 9,
              alignment: "center",
              rowSpan: groupSize
            }
          : {},

        idx === 0
          ? {
              text: "IS: 6441 (Part-1)",
              fontSize: 9,
              alignment: "center",
              rowSpan: groupSize
            }
          : {},

        { text: r.density, fontSize: 9, alignment: "center" },

        idx === 0
          ? {
              text: avg.toString(),
              fontSize: 9,
              alignment: "center",
              rowSpan: groupSize
            }
          : {}
      ]);
    });

    blockNo++; // ✅ increment after every 3 rows
  }

  return rows;
};


const getCompressiveStrengthRows = (compressiveBlocks = []) => {
  const rows = [];

  rows.push([
    { text: "Block ID*", style: "tableHeader", alignment: "center" },
    { text: "Cube ID", style: "tableHeader", alignment: "center" },
    { text: "Size of the tested cube (mm)", style: "tableHeader", alignment: "center" },
    { text: "Test Method", style: "tableHeader", alignment: "center" },
    { text: "Failure Load (kN)", style: "tableHeader", alignment: "center" },
    { text: "Compressive Strength (N/mm2)", style: "tableHeader", alignment: "center" },
    { text: "Avg. Compressive Strength (N/mm2)", style: "tableHeader", alignment: "center" }
  ]);

  if (!Array.isArray(compressiveBlocks) || compressiveBlocks.length === 0) {
    rows.push([
      { text: "", fontSize: 9, alignment: "center" },
      { text: "", fontSize: 9, alignment: "center" },
      { text: "", fontSize: 9, alignment: "center" },
      { text: "", fontSize: 9, alignment: "center" },
      { text: "", fontSize: 9, alignment: "center" },
      { text: "", fontSize: 9, alignment: "center" },
      { text: "", fontSize: 9, alignment: "center" }
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
        { text: `Block-${bIdx + 1}`, fontSize: 9, alignment: "center", rowSpan: 1, valign: "center" },
        { text: "", fontSize: 9, alignment: "center" },
        { text: "", fontSize: 9, alignment: "center" },
        { text: "IS: 6441 (Part-5)", fontSize: 9, alignment: "center", rowSpan: 1 },
        { text: "", fontSize: 9, alignment: "center" },
        { text: "", fontSize: 9, alignment: "center" },
        { text: blockAvg !== null ? String(blockAvg) : "", fontSize: 9, alignment: "center" }
      ]);
      return;
    }

    samples.forEach((sample, sIdx) => {
      const sizeText = `${sample.length ?? sample.l ?? ""} x ${sample.width ?? sample.w ?? ""} x ${sample.depth ?? sample.d ?? ""}`
        .trim();

      const failureLoad = sample.breakingLoad ?? sample.failureLoad ?? "";
      const compStrength = sample.compStrength ?? "";

      const row = [];

      if (sIdx === 0) {
        row.push({
          text: `Block-${bIdx + 1}`,
          fontSize: 9,
          alignment: "center",
          rowSpan: blockRowSpan,
          valign: "center"
        });
      } else {
        row.push({});
      }

      row.push({ text: sample.cubeNo ?? "", fontSize: 9, alignment: "center" });
      row.push({ text: sizeText || "150x150x150", fontSize: 9, alignment: "center" });

      if (sIdx === 0) {
        row.push({
          text: "IS: 6441 (Part-5)",
          fontSize: 9,
          alignment: "center",
          rowSpan: blockRowSpan
        });
      } else {
        row.push({});
      }

      row.push({ text: String(failureLoad), fontSize: 9, alignment: "center" });
      row.push({ text: String(compStrength), fontSize: 9, alignment: "center" });

      if (sIdx === 0) {
        row.push({
          text: blockAvg !== null ? String(blockAvg) : "",
          fontSize: 9,
          alignment: "center",
          rowSpan: blockRowSpan
        });
      } else {
        row.push({});
      }

      rows.push(row);
    });
  });

  return rows;
};

// MAIN FUNCTION -----------------------------------------------------------

const aacBlocks = (parsedJdata = []) => {
  const densityEntry = parsedJdata.find((x) => x.paramName === DENSITY_BLOCK_AAC) || null;
  const compressiveEntry = parsedJdata.find((x) => x.paramName === COMPRESSIVE_STRENGTH_BLOCK) || null;
console.log(compressiveEntry,'compressiveEntry765')
// console.log(densityEntry,'densityEntry67')
  const tables = [];

  // RULE 1: If Density present → ONLY show this
  if (densityEntry) {
    const densityRows = Array.isArray(densityEntry.formData?.rows)
      ? densityEntry.formData.rows
      : [];

      const densitySize = densityEntry.formData?.blockSize;

    const densityBody = getDensityRows(densityRows);

    tables.push(
      {
        text: `DENSITY (${densitySize})`,
        fontSize: 10,
        bold: true,
        margin: [0, 3, 0, 2],
      },
      {
        alignment: "center",
        table: {
          headerRows: 1,
          widths: ["auto", "*", "auto", "auto", "auto"],
          body: densityBody,

        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
         margin: [0, 0, 0, 2],
      }
    );

    // return tables; // ← ONLY RETURN DENSITY TABLE
  }

  // RULE 2: If Compressive present → ONLY show this
  if (compressiveEntry) {
    // console.log('entrd786')
    const compressiveBlocks = Array.isArray(compressiveEntry.formData?.blocks)
      ? compressiveEntry.formData.blocks
      : [];
          const cbSize = compressiveEntry.formData?.blockSize;
  
    const compBody = getCompressiveStrengthRows(compressiveBlocks);

    tables.push(
      {
        columns: [
          { text: `COMPRESSIVE STRENGTH (${cbSize})`, fontSize: 10, bold: true, alignment: "left", },
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

    // return tables; // ← ONLY RETURN COMPRESSIVE TABLE
  }

  // If neither is present → return nothing
  return tables;
};

module.exports = aacBlocks;
