"use strict";

const POROSITY = "POROSITY";
const ROCK_COMPRESSIVE_STRENGTH = "ROCK_COMPRESSIVE_STRENGTH";
const SLAKE_DURABILITY = "SLAKE_DURABILITY";
const ROCK_SPECIFIC_GRAVITY = "ROCK_SPECIFIC_GRAVITY";
const TENSILE_STRENGTH = "TENSILE_STRENGTH";
const ROCK_WATER_ABSORPTION = "ROCK_WATER_ABSORPTION";
const WATER_CONTENT = "WATER_CONTENT";

const rockMech = (jdata) => {
  try {
    const parsedJdata = Array.isArray(jdata) ? jdata : [];

    // ====== PULL BLOCKS WE NEED ======
    const waterContentFound = parsedJdata.find(
      (x) => x.param_id === WATER_CONTENT
    );
    const waterAbFound = parsedJdata.find(
      (x) => x.param_id === ROCK_WATER_ABSORPTION
    );
    const porosityAndDensityFound = parsedJdata.find(
      (x) => x.param_id === POROSITY
    );
    const specificGravityFound = parsedJdata.find(
      (x) => x.param_id === ROCK_SPECIFIC_GRAVITY
    );
    const slakeDurabilityFound = parsedJdata.find(
      (x) => x.param_id === SLAKE_DURABILITY
    );
    const tensileStrengthFound = parsedJdata.find(
      (x) => x.param_id === TENSILE_STRENGTH
    );

    const compressiveStrengthFound = parsedJdata.find(
      (x) => x.param_id === ROCK_COMPRESSIVE_STRENGTH
    );

    const stack = [];

    if (compressiveStrengthFound?.formData?.specimens?.length) {
      const specimens = compressiveStrengthFound.formData.specimens || [];
      const avgStrength =
        compressiveStrengthFound?.reportData?.[0]?.value ?? "-";
      const testMethod =
        compressiveStrengthFound?.reportData?.[0]?.testMethod ?? "-";

      // ====== Headers ======
      const headerInfoRow = [
        {
          text: "Room Temperature : 28.2°C",
          style: "tableHeader",
          colSpan: 3,
          margin: [0, 2, 0, 2],
        },
        {},
        {},
        {
          text: "Type of Machine Used: DCTM",
          style: "tableHeader",
          colSpan: 4,
          margin: [0, 2, 0, 2],
        },
        {},
        {},
        {},
        {
          text: "Rate of Loading: 0.5 MPa/s to 1.0 MPa/s",
          style: "tableHeader",
          colSpan: 2,
          margin: [0, 2, 0, 2],
        },
        {},
      ];

      const groupedHeader = [
        {
          text: "S. No",
          style: "tableHeader",
          alignment: "center",
          rowSpan: 2,
        },
        {
          text: "Sample Ref",
          style: "tableHeader",
          rowSpan: 2,
          alignment: "center",
        },
        {
          text: "Size of Test Specimen",
          style: "tableHeader",
          alignment: "center",
          colSpan: 2,
          rowSpan: 1,
        },
        {},
        {
          text: "Orientation Of Loading Axis",
          style: "tableHeader",
          alignment: "center",
          rowSpan: 2,
        },
        {
          text: "Unconfined Compressive Strength (N/mm²)",
          style: "tableHeader",
          alignment: "center",
          rowSpan: 2,
        },
        {
          text: "Average Compressive Strength (N/mm²)",
          style: "tableHeader",
          alignment: "center",
          rowSpan: 2,
        },
        {
          text: "Mode of Failure",
          style: "tableHeader",
          alignment: "center",
          rowSpan: 2,
        },
        {
          text: "Test Method",
          style: "tableHeader",
          alignment: "center",
          rowSpan: 2,
        },
      ];

      const subHeader = [
        {},
        {},
        { text: "Length (mm)", style: "tableHeader", alignment: "center" },
        { text: "Dia (mm)", style: "tableHeader", alignment: "center" },
        {},
        {},
        {},
        {},
        {},
      ];

      const body = [headerInfoRow, groupedHeader, subHeader];

      // ====== Data Rows ======
      specimens.forEach((s, idx) => {
        body.push([
          { text: String(idx + 1), fontSize: 9, alignment: "center" },
          {
            text: s.sampleRef || `Sample ${idx + 1}`,
            fontSize: 9,
            alignment: "center",
          },
          { text: s.length ?? "-", fontSize: 9, alignment: "center" },
          { text: s.diameter ?? "-", fontSize: 9, alignment: "center" },
          {
            text: s.orientation || "Perpendicular",
            fontSize: 9,
            alignment: "center",
          },
          {
            text: s.correctedStrength ?? "-",
            fontSize: 9,
            alignment: "center",
          },

          // Average column
          idx === 0
            ? {
                text: avgStrength,
                fontSize: 9,
                alignment: "center",
                rowSpan: specimens.length,
                margin: [0, 2, 0, 2],
              }
            : "",

          {
            text: s.modeOfFailure || "Axial Splitting",
            fontSize: 9,
            alignment: "center",
          },

          // Test Method
          idx === 0
            ? {
                text: testMethod,
                fontSize: 9,
                alignment: "center",
                rowSpan: specimens.length,
                margin: [0, 2, 0, 2],
              }
            : "",
        ]);
      });

      const compStrengthTable = {
        table: {
          headerRows: 3,
          widths: [
            "auto",
            "*",
            "auto",
            "auto",
            "*",
            "auto",
            "auto",
            "*",
            "auto",
          ],
          body,
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex < 3 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        margin: [0, 4, 0, 6],
      };

      stack.push([
        {
          text: "Unconfined Compressive Strength",
          fontSize: 9,
          bold: true,
          margin: [0, 8, 0, 2],
        },
      ]);

      stack.push(compStrengthTable);
    }

    if (tensileStrengthFound?.formData?.samples?.length) {
      // ====== TENSILE STRENGTH TABLE (Screenshot layout) ======
      const samples = tensileStrengthFound.formData.samples || [];
      // const avgCellValue = tensileStrengthFound?.reportData?.[0]?.value ?? "-";

      // const testMethod =
      //   tensileStrengthFound?.reportData?.[0]?.testMethod ?? "-";

      const { avg } = tensileStrengthFound;

      // Helper: compute Brazilian tensile strength if load/length/diameter exist (else "-")
      const tensileValue = (s) => {
        const P = Number(s.load);
        const L = Number(s.length);
        const D = Number(s.diameter);
        if (!(P > 0 && L > 0 && D > 0)) return "-";
        const ts = (2 * P) / (Math.PI * L * D); // N/mm² (assuming P in N, L & D in mm)
        return ts.toFixed(2);
        // If your P is in kN, convert: const ts = (2 * (P*1000)) / (Math.PI * L * D);
      };

      // Header rows (3 rows): info band + grouped header + sub-header for Length/Dia
      const headerInfoRow = [
        {
          text: "Room Temperature : 30.4 Deg",
          style: "tableHeader",
          colSpan: 3,
          margin: [0, 2, 0, 2],
        },
        {},
        {},
        {
          text: "Type of Machine Used: Brazilian Testing Machine",
          style: "tableHeader",
          colSpan: 4,
          margin: [0, 2, 0, 2],
        },
        {},
        {},
        {},
        {
          text: "Rate of Loading: 0.2 kN/s",
          style: "tableHeader",
          colSpan: 2,
          margin: [0, 2, 0, 2],
        },
        {},
      ];

      const groupedHeader = [
        {
          text: "S. No",
          style: "tableHeader",
          alignment: "center",
          rowSpan: 2,
        },
        {
          text: "Sample Ref",
          style: "tableHeader",
          rowSpan: 2,
          alignment: "center",
        },
        {
          text: "Size of Test Specimen",
          style: "tableHeader",
          alignment: "center",
          colSpan: 2,
          rowSpan: 1,
        },
        {},
        {
          text: "Orientation Of Loading Axis",
          style: "tableHeader",
          alignment: "center",
          rowSpan: 2,
        },
        {
          text: "Tensile Strength (N/mm²)",
          style: "tableHeader",
          alignment: "center",
          rowSpan: 2,
        },
        {
          text: "Average Tensile Strength (N/mm²)",
          style: "tableHeader",
          alignment: "center",
          rowSpan: 2,
        },
        {
          text: "Mode of Failure",
          rowSpan: 2,
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Test Method",
          rowSpan: 2,
          style: "tableHeader",
          alignment: "center",
        },
      ];

      const subHeader = [
        {},
        {},
        { text: "Length (mm)", style: "tableHeader", alignment: "center" },
        { text: "Dia (mm)", style: "tableHeader", alignment: "center" },
        {},
        {},
        {},
        {},
        {},
      ];

      const body = [headerInfoRow, groupedHeader, subHeader];

      // Data rows with rowSpans for Average & Test Method columns
      samples.forEach((s, idx) => {
        body.push([
          { text: String(idx + 1), fontSize: 9, alignment: "center" },
          {
            text: s.sampleNo || `Sample ${idx + 1}`,
            fontSize: 9,
            alignment: "center",
          },
          { text: s.length ?? "-", fontSize: 9, alignment: "center" },
          { text: s.diameter ?? "-", fontSize: 9, alignment: "center" },
          {
            text: s.orientation || "Parallel",
            fontSize: 9,
            alignment: "center",
          },
          { text: tensileValue(s), fontSize: 9, alignment: "center" },

          // Average column: single cell spanning all sample rows
          idx === 0
            ? {
                text: avg,
                fontSize: 9,
                alignment: "center",
                rowSpan: samples.length,
                margin: [0, 2, 0, 2],
              }
            : "",

          {
            text: s.modeOfFailure || "Vertical Splitting",
            fontSize: 9,
            alignment: "center",
          },

          // Test Method column: single cell spanning all sample rows
          idx === 0
            ? {
                text: "IS 10082",
                fontSize: 9,
                alignment: "center",
                rowSpan: samples.length,
                margin: [0, 2, 0, 2],
              }
            : "",
        ]);
      });

      const tensileTable = {
        table: {
          headerRows: 3,
          // 9 columns total (matches screenshot)
          widths: [
            "auto",
            "*",
            "auto",
            "auto",
            "*",
            "auto",
            "auto",
            "*",
            "auto",
          ],
          body,
        },
        layout: {
          // Grey all header rows like screenshot banding
          fillColor: (rowIndex) => (rowIndex < 3 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        margin: [0, 4, 0, 6],
      };

      stack.push([
        {
          text: "Brazilian Tensile Strength ",
          fontSize: 9,
          bold: true,
          margin: [0, 8, 0, 2],
        },
      ]);

      stack.push(tensileTable);
    }

    // ====== SUMMARY TABLE (3rd table from your working code) ======
    // Build rows in the exact order from the screenshot.
    const summaryRows = [];

    // 1) Water Content %
    if (waterContentFound?.reportData?.[0]) {
      const rd = waterContentFound.reportData[0];
      summaryRows.push({
        label: "Water Content %",
        value: rd.value ?? "-",
        method: rd.testMethod,
      });
    }

    // 2) Dry Density kg/m³  + 3) Porosity  (both from POROSITY block)
    if (porosityAndDensityFound?.reportData?.length) {
      const porosityRD =
        porosityAndDensityFound.reportData.find((r) =>
          /porosity/i.test(r.key || "")
        ) || porosityAndDensityFound.reportData[0];

      const dryDensityRD =
        porosityAndDensityFound.reportData.find((r) =>
          /dry\s*density/i.test(r.key || "")
        ) ||
        porosityAndDensityFound.reportData[1] ||
        porosityAndDensityFound.reportData[0];

      if (dryDensityRD) {
        summaryRows.push({
          label: "Dry Density kg/m³",
          value: dryDensityRD.value ?? "-",
          method: dryDensityRD.testMethod,
        });
      }
      if (porosityRD) {
        summaryRows.push({
          label: "Porosity",
          value: porosityRD.value ?? "-",
          method: porosityRD.testMethod,
        });
      }
    }

    // 4) Specific Gravity
    if (specificGravityFound?.reportData?.[0]) {
      const rd = specificGravityFound.reportData[0];
      summaryRows.push({
        label: "Specific Gravity",
        value: rd.value ?? "-",
        method: rd.testMethod,
      });
    }

    // 5) Water Absorption %
    if (waterAbFound?.reportData?.[0]) {
      const rd = waterAbFound.reportData[0];
      summaryRows.push({
        label: "Water Absorption %",
        value: rd.value ?? "-",
        method: rd.testMethod,
      });
    }

    // 6) Slake Durability Index %
    if (slakeDurabilityFound?.reportData?.[0]) {
      const rd = slakeDurabilityFound.reportData[0];
      summaryRows.push({
        label: "Slake Durability Index %",
        value: rd.value ?? "-",
        method: rd.testMethod,
      });
    }

    if (summaryRows.length) {
      const snStart = 3; // to match screenshot numbering

      const header = [
        { text: "S.No", style: "tableHeader", alignment: "center" },
        { text: "Sample Ref", style: "tableHeader", alignment: "center" },
        { text: "Parameters", style: "tableHeader", alignment: "center" },
        { text: "Results", style: "tableHeader", alignment: "center" },
        { text: "Test Method", style: "tableHeader", alignment: "center" },
      ];

      const body = [header];

      summaryRows.forEach((r, idx) => {
        body.push([
          { text: String(snStart + idx), fontSize: 9, alignment: "center" },
          idx === 0
            ? {
                text: "Rock",
                fontSize: 9,
                alignment: "center",
                rowSpan: summaryRows.length,
                margin: [0, 2, 0, 2],
              }
            : "",
          {
            text: r.label,
            fontSize: 9,
            alignment: "left",
            margin: [0, 2, 0, 2],
          },
          { text: r.value ?? "-", fontSize: 9, alignment: "center" },
          { text: r.method ?? "-", fontSize: 9, alignment: "center" },
        ]);
      });

      const thirdTable = {
        table: {
          headerRows: 1,
          widths: ["auto", "auto", "*", "auto", "*"],
          body,
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        margin: [0, 2, 0, 2],
      };

      stack.push(thirdTable);
    }

    return { stack };
  } catch (err) {
    console.error("Error generating rocks report:", err.message);
    return null;
  }
};

module.exports = rockMech;

// v1

// "use strict";

// const POROSITY = "POROSITY";
// const ROCK_COMPRESSIVE_STRENGTH = "ROCK_COMPRESSIVE_STRENGTH";
// const SLAKE_DURABILITY = "SLAKE_DURABILITY";
// const ROCK_SPECIFIC_GRAVITY = "ROCK_SPECIFIC_GRAVITY";
// const TENSILE_STRENGTH = "TENSILE_STRENGTH";
// const ROCK_WATER_ABSORPTION = "ROCK_WATER_ABSORPTION";
// const WATER_CONTENT = "WATER_CONTENT";

// const rockMech = (jdata) => {
//   try {
//     const parsedJdata = Array.isArray(jdata) ? jdata : [];

//     // Grab the records we need for the 3rd table
//     const waterContentFound = parsedJdata.find(
//       (x) => x.param_id === WATER_CONTENT
//     );
//     const waterAbFound = parsedJdata.find(
//       (x) => x.param_id === ROCK_WATER_ABSORPTION
//     );
//     const porosityAndDensityFound = parsedJdata.find(
//       (x) => x.param_id === POROSITY
//     );
//     const specificGravityFound = parsedJdata.find(
//       (x) => x.param_id === ROCK_SPECIFIC_GRAVITY
//     );
//     const slakeDurabilityFound = parsedJdata.find(
//       (x) => x.param_id === SLAKE_DURABILITY
//     );

//     const tensileStrengthFound = parsedJdata.find(
//       (x) => x.param_id === TENSILE_STRENGTH
//     );

//     if (tensileStrengthFound?.reportData?.[0]) {
//       const rd = tensileStrengthFound.formData;
//       console.log("This is tensile strength data : ");
//       console.log(rd);
//     }

//     // Helper: extract the main IS code number if present (e.g., "IS: 13030 ..." -> "13030")
//     // const extractISCode = (methodStr = "") => {
//     //   const m = methodStr.match(/IS[:\s-]*([0-9]{3,5})/i);
//     //   return m ? m[1] : methodStr || "-";
//     // };

//     // Build rows in the exact order from the screenshot.
//     // Each entry: { label, value, method }
//     const rows = [];

//     // 1) Water Content %
//     if (waterContentFound?.reportData?.[0]) {
//       const rd = waterContentFound.reportData[0];
//       rows.push({
//         label: "Water Content %",
//         value: rd.value ?? "-",
//         method: rd.testMethod,
//       });
//     }

//     // 2) Dry Density kg/m³  (from POROSITY block)
//     // 3) Porosity          (from POROSITY block)
//     if (porosityAndDensityFound?.reportData?.length) {
//       // Try to pick by key, fallback to order
//       const porosityRD =
//         porosityAndDensityFound.reportData.find((r) =>
//           /porosity/i.test(r.key || "")
//         ) || porosityAndDensityFound.reportData[0];

//       const dryDensityRD =
//         porosityAndDensityFound.reportData.find((r) =>
//           /dry\s*density/i.test(r.key || "")
//         ) ||
//         porosityAndDensityFound.reportData[1] ||
//         porosityAndDensityFound.reportData[0];

//       // Dry Density first (as per screenshot)
//       if (dryDensityRD) {
//         rows.push({
//           label: "Dry Density kg/m³",
//           value: dryDensityRD.value ?? "-",
//           method: dryDensityRD.testMethod,
//         });
//       }
//       // Then Porosity
//       if (porosityRD) {
//         rows.push({
//           label: "Porosity",
//           value: porosityRD.value ?? "-",
//           method: porosityRD.testMethod,
//         });
//       }
//     }

//     // 4) Specific Gravity
//     if (specificGravityFound?.reportData?.[0]) {
//       const rd = specificGravityFound.reportData[0];
//       rows.push({
//         label: "Specific Gravity",
//         value: rd.value ?? "-",
//         method: rd.testMethod,
//       });
//     }

//     // 5) Water Absorption %
//     if (waterAbFound?.reportData?.[0]) {
//       const rd = waterAbFound.reportData[0];
//       rows.push({
//         label: "Water Absorption %",
//         value: rd.value ?? "-",
//         method: rd.testMethod,
//       });
//     }

//     // 6) Slake Durability Index %
//     if (slakeDurabilityFound?.reportData?.[0]) {
//       const rd = slakeDurabilityFound.reportData[0];
//       rows.push({
//         label: "Slake Durability Index %",
//         value: rd.value ?? "-",
//         method: rd.testMethod,
//       });
//     }

//     // If nothing to show, return empty stack (no table)
//     if (!rows.length) return { stack: [] };

//     // S.No must continue from previous two tables in the screenshot (3..)
//     const snStart = 3;

//     // Build the pdfmake body
//     const header = [
//       { text: "S.No", style: "tableHeader", alignment: "center" },
//       { text: "Sample Ref", style: "tableHeader", alignment: "center" },
//       { text: "Parameters", style: "tableHeader", alignment: "center" },
//       { text: "Results", style: "tableHeader", alignment: "center" },
//       { text: "Test Method", style: "tableHeader", alignment: "center" },
//     ];

//     const body = [header];

//     rows.forEach((r, idx) => {
//       const row = [
//         { text: String(snStart + idx), fontSize: 9, alignment: "center" },
//         // Rowspan "Rock" for the first data row only, to match screenshot
//         idx === 0
//           ? {
//               text: "Rock",
//               fontSize: 9,
//               alignment: "center",
//               rowSpan: rows.length,
//               margin: [0, 2, 0, 2],
//             }
//           : "",
//         { text: r.label, fontSize: 9, alignment: "left", margin: [0, 2, 0, 2] },
//         { text: r.value ?? "-", fontSize: 9, alignment: "center" },
//         { text: r.method ?? "-", fontSize: 9, alignment: "center" },
//       ];
//       body.push(row);
//     });

//     // The 3rd table only (matching the screenshot)
//     const thirdTable = {
//       table: {
//         headerRows: 1,
//         widths: ["auto", "auto", "*", "auto", "*"],
//         body,
//       },
//       layout: {
//         fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
//         hLineWidth: () => 0.5,
//         vLineWidth: () => 0.5,
//         hLineColor: () => "#000000",
//         vLineColor: () => "#000000",
//       },
//       margin: [0, 2, 0, 2],
//     };

//     // Return only the 3rd table for now
//     return { stack: [thirdTable] };
//   } catch (err) {
//     console.error("Error generating rocks report:", err.message);
//     return null;
//   }
// };

// module.exports = rockMech;
