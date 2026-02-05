const {
  getRsteelReqTable,
  getMPMtable,
  getChemicalCompositionTable,
} = require("./staticTables");

const getEachRow = (eachObject, keys) => {
  return keys.map((eachKey) => ({
    text: eachKey === "grade" ? eachObject["reportGrade"] : eachObject[eachKey],
    fontSize: 9,
    alignment: "center",
  }));
};

const dynamicTable = (parsedJdata) => {
  const { reportData, param_id, diaArray, gradeArray, creSelected, crs_bars } =
    parsedJdata[0];

  console.log(gradeArray, parsedJdata[0], "parsedJdata234");

  const { tableHeader, formData } = reportData;
  const dynamicRows = [];

  // if (param_id === "20240725180338410") {
  // if (param_id === "20240725180338406") {
  //   // console.log(formData);
  //   const { avg } = reportData;
  //   const keys = tableHeader.map((each) => each.key);

  //   // console.log(keys,'keeeys')

  //   formData?.forEach((item) => {
  //     dynamicRows.push(getEachRow(item, keys));
  //   });

  //   dynamicRows.push([
  //     {
  //       text: `Average Compressive Strength`,
  //       colSpan: keys.length - 1,
  //       alignment: "right",
  //       fontSize: 9,
  //     },
  //     ...Array(keys.length - 2).fill({}),
  //     {
  //       text: `${avg} N/mm²`,
  //       fontSize: 9,
  //     },
  //   ]);
  // }

  if (param_id === "20240919132722648" || param_id === "20240919132532508") {
    //re inforcement steel
    const keys = tableHeader.map((each) => each.key);
    formData?.forEach((item) => {
      dynamicRows.push(getEachRow(item, keys));
    });

    if (param_id === "20240919132532508") {
      const hasCr = keys.includes("cr");
      const hasCre = keys.includes("cre");

      // console.log(keys,keys.length,'1234')

      let colSpanForIS = keys.length - 3; // default
      // if (hasCr) {
      //   colSpanForIS = 8;
      // } else if (hasCre) {
      //   colSpanForIS = 5;
      // }

      const testMethodRow = [
        {
          text: "Test Method",
          colSpan: 3,
          fontSize: 9,
          alignment: "center",
        },
        {},
        {},
        {
          text: "IS: 8811 – 1998",
          colSpan: colSpanForIS,
          fontSize: 9,
          alignment: "center",
        },
        ...Array(colSpanForIS - 1).fill({}),
      ];

      dynamicRows.push(testMethodRow);
    }

    if (param_id === "20240919132722648") {
      // Create a row with first 2 cells merged and label it 'Test Method'
      const testMethodRow = [
        {
          text: "Test Method",
          colSpan: 2,
          fontSize: 9,
          alignment: "center",
        },
        {}, // dummy to satisfy colSpan
        ...tableHeader.slice(2).map(({ testMethod }) => ({
          text: testMethod,
          fontSize: 9,
          alignment: "center",
        })),
      ];

      dynamicRows.push(testMethodRow);
    }
  }
  if (
    parsedJdata[0].param_id === "20251227112902368" ||
    parsedJdata[0].paramName === "HALFCELL_TEST"
  ) {
    const node = parsedJdata[0];

    const tables = node.formData?.tables || [];
    const outputTables = [];
    // 🔹 Test Method line (simple left-right display)
    outputTables.push({
      margin: [0, 10, 0, -10],
      columns: [
        {
          width: "100%",
          text: " Test Method:IS 516 (Part 5 / Sect2)",
          fontSize: 9,
          bold: true,
          alignment: "right",
        },
      ],
    });

    tables.forEach((table, tableIndex) => {
      const rows = table.rows || [];

      const keys = [
        "sl_no",
        "location",
        "dia",
        "obs1",
        "obs2",
        "obs3",
        "avg_obs",
        "corrosion_condition",
      ];

      const tableRows = rows.map((row, index) =>
        keys.map((key) => ({
          text:
            key === "sl_no"
              ? index + 1
              : row[key] !== undefined
                ? `${row[key]}`
                : "",
          alignment: "center",
          fontSize: 8,
        }))
      );

      const widths = [25, 55, 35, 20, 20, 25, 80, "*"];

      // 🔹 ONLY DATA TABLES HERE
      outputTables.push({
        margin: tableIndex === 0 ? [0, 15, 0, 0] : [0, 25, 0, 0],
        table: {
          headerRows: 1,
          widths,
          body: [
            [
              { text: "S.No", bold: true, alignment: "center", fontSize: 9 },
              {
                text: "Location",
                bold: true,
                alignment: "center",
                fontSize: 9,
              },
              {
                text: "Dia (mm)",
                bold: true,
                alignment: "center",
                fontSize: 9,
              },
              {
                text: "Observation Results (–ve mV)",
                bold: true,
                alignment: "center",
                colSpan: 3,
                fontSize: 9,
              },
              {},
              {},
              {
                text: "Avg Observation Result (–ve mV)",
                bold: true,
                alignment: "center",
                fontSize: 9,
              },
              {
                text: "Corrosion Condition",
                bold: true,
                alignment: "center",
                fontSize: 9,
              },
            ],
            ...tableRows,
          ],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#e6e6e6" : null),
          hLineWidth: () => 0.7,
          vLineWidth: () => 0.7,
          hLineColor: () => "#000",
          vLineColor: () => "#000",
        },
      });
    });

    // 🔹 ONE SPECIFICATION TABLE AT THE END
    outputTables.push({
      margin: [0, 25, 0, 0],
      table: {
        headerRows: 1,
        widths: ["40%", "60%"],
        body: [
          [
            {
              text: "Cu/CuSO₄ Electrode",
              bold: true,
              alignment: "center",
              fontSize: 9,
            },
            {
              text: "Corrosion Condition",
              bold: true,
              alignment: "center",
              fontSize: 9,
            },
          ],
          [
            { text: "> –200 mV", alignment: "center", fontSize: 8 },
            {
              text: "Low (there is a greater than 90 percent probability that no reinforcing steel corrosion is occurring in that area at the time of measurement)",
              alignment: "left",
              fontSize: 8,
            },
          ],
          [
            { text: "–200 mV to –350 mV", alignment: "center", fontSize: 8 },
            {
              text: "Corrosion activity of the reinforcing steel in that area is uncertain",
              alignment: "left",
              fontSize: 8,
            },
          ],
          [
            { text: "< –350 mV", alignment: "center", fontSize: 8 },
            {
              text: "High (there is a greater than 90 percent probability that reinforcing steel corrosion is occurring in that area at the time of measurement)",
              alignment: "left",
              fontSize: 8,
            },
          ],
          [
            { text: "< –500 mV", alignment: "center", fontSize: 8 },
            {
              text: "Severe corrosion",
              alignment: "left",
              fontSize: 8,
            },
          ],
        ],
      },
      layout: {
        fillColor: (rowIndex) => (rowIndex === 0 ? "#e6e6e6" : null),
        hLineWidth: () => 0.7,
        vLineWidth: () => 0.7,
        hLineColor: () => "#000",
        vLineColor: () => "#000",
      },
    });

    return outputTables;
  }

  if (param_id === "20240725182338307") {
    const keys = tableHeader.map((each) => each.key);

    formData?.forEach((item, index) => {
      const newItem = { ...item };

      if (index !== 1) {
        newItem.grade = ""; // Hide grade except second row
      }

      // Date formatting: yyyy-mm-dd -> dd-mm-yyyy
      if (newItem.date_casting) {
        const [y, m, d] = newItem.date_casting.split("-");
        newItem.date_casting = `${d}-${m}-${y}`;
      }
      if (newItem.date_testing) {
        const [y, m, d] = newItem.date_testing.split("-");
        newItem.date_testing = `${d}-${m}-${y}`;
      }

      const rowCells = keys.map((eachKey) => {
        // console.log(eachKey,'eachKey')
        const cell = {
          text: newItem[eachKey],
          fontSize: 9,
          alignment: "center",
        };

        // Grade cell: hide top/bottom borders except for second row
        if (eachKey === "grade" && index === 1) {
          cell.border = [true, false, true, false]; // left, top, right, bottom
        } else if (eachKey === "grade" && index === 0) {
          cell.border = [true, true, true, false];
        } else if (eachKey === "grade" && index === 2) {
          cell.border = [true, false, true, true];
        }

        // Second row: vertically center all cells
        if (index === 1) {
          cell.verticalAlignment = "middle";
        }

        return cell;
      });

      dynamicRows.push(rowCells);
    });

    dynamicRows.push([
      {
        text: `Average Predicted 28 day compressive strength based on Accelerated curing by boiling water method`,
        colSpan: keys.length - 1,
        alignment: "right",
        fontSize: 9,
      },
      ...Array(keys.length - 2).fill({}),
      {
        text: `${reportData.avgPredicted}`,
        fontSize: 9,
        alignment: "center",
      },
    ]);
  }

  if (param_id === "20240806123456789") {
    console.log("trigerred34");
    const keys = tableHeader.map((each) => each.key);

    let firstRowData = {}; // to store first row for filling blanks

    formData?.forEach((item, index) => {
      const newItem = { ...item };

      // Format dates
      if (newItem.date_casting) {
        const [y, m, d] = newItem.date_casting.split("-");
        newItem.date_casting = `${d}.${m}.${y}`;
      }
      if (newItem.date_testing) {
        const [y, m, d] = newItem.date_testing.split("-");
        newItem.date_testing = `${d}.${m}.${y}`;
      }

      if (index === 0) {
        firstRowData = { ...newItem };
      } else {
        ["identification", "date_casting", "date_testing"].forEach((key) => {
          if (!newItem[key]) newItem[key] = firstRowData[key];
        });
      }

      const rowCells = tableHeader.map((header) => {
        let cellValue = newItem[header.key];

        // Inject avgPenetration into the second row only
        if (index === 1 && header.key === "avg") {
          cellValue = reportData.avgPenetration;
        }

        const cell = {
          text: cellValue !== undefined ? `${cellValue}` : "",
          fontSize: 9,
          alignment: "center",

          border: [true, true, true, true], // Default full border
        };

        // Show only in 2nd row (index === 1): identification and avg
        const onlySecondRowCols = ["identification", "avg"];

        // Show in all rows: grade, date_casting, date_testing
        const allRowCols = ["grade", "date_casting", "date_testing"];

        if (onlySecondRowCols.includes(header.key)) {
          if (index === 1) {
            cell.border = [false, false, true, false]; // Full border
          } else if (index === 2) {
            cell.text = "";
            cell.border = [false, false, true, true]; // Full border
          } else {
            cell.text = "";
            cell.border = [false, false, true, false]; // Bottom border only
          }
        }

        return cell;
      });

      dynamicRows.push(rowCells);
    });
  }
  // ====================== CURRENT TEST (ASTM C1202) ===========================
  // ====================== CURRENT TEST (ASTM C1202) ===========================
  if (parsedJdata[0].paramName === "CURRENT_TEST") {
    const { reportData } = parsedJdata[0];
    const { tableHeader, formData, averageCurrent } = reportData;

    const keys = tableHeader.map((e) => e.key);
    const sampleID = formData[0]?.sample_id || "";

    const currentRows = [];

    // compute middle index where average should be displayed
    const avgIndex = Math.floor(formData.length / 2);

    // Build rows, placing avg at avgIndex
    formData.forEach((item, index) => {
      const rowCells = keys.map((k) => {
        let value = item[k];

        if (k === "sample_id") {
          value = sampleID; // auto-fill sample ID for all rows
        }

        // AVG column special formatting: show average only in avgIndex
        if (k === "avg") {
          if (index === avgIndex) {
            return {
              text: `${averageCurrent}`,
              alignment: "center",
              fontSize: 9,
              border: [true, false, true, false], // hide top & bottom to appear merged
            };
          }
          // Row below the avgIndex should show bottom border true (to close the merged area)
          if (index === avgIndex + 1) {
            return {
              text: "",
              border: [true, false, true, true], // bottom border true to close box
            };
          }
          // For rows above avgIndex, show bottom hidden so visually merged
          return {
            text: "",
            border: [true, true, true, false],
          };
        }

        return {
          text: value !== undefined ? `${value}` : "",
          alignment: "center",
          fontSize: 9,
        };
      });

      currentRows.push(rowCells);
    });

    // Add the current test rows to dynamicRows
    dynamicRows.push(...currentRows);

    // And return the two tables as separate blocks (first the workbench table, then ASTM spec)
    return [
      // FIRST TABLE (Add margin-top so it doesn't stick to details above)
      {
        margin: [0, 15, 0, 0],
        table: {
          headerRows: 1,
          widths: Array(tableHeader.length).fill("*"),
          body: [
            tableHeader.map((each) => ({
              text: each.headerText,
              style: "tableHeader",
              alignment: "center",
              fontSize: 10,
            })),
            ...dynamicRows,
          ],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
      },

      // ASTM TITLE
      {
        margin: [0, 20, 0, 5],
        text: "Specifications as per ASTM C-1202",
        bold: true,
        alignment: "center",
        fontSize: 11,
      },

      // ASTM TABLE
      {
        table: {
          headerRows: 1,
          widths: ["auto", "*", "*"],
          body: [
            [
              { text: "Sl. No", bold: true, alignment: "center", fontSize: 10 },
              {
                text: "Charge Passed (Coulombs)",
                bold: true,
                alignment: "center",
                fontSize: 10,
              },
              {
                text: "Chloride Ion Penetrability",
                bold: true,
                alignment: "center",
                fontSize: 10,
              },
            ],
            [
              { text: "1", alignment: "center", fontSize: 9 },
              { text: ">4000", alignment: "center", fontSize: 9 },
              { text: "High", alignment: "center", fontSize: 9 },
            ],
            [
              { text: "2", alignment: "center", fontSize: 9 },
              { text: "2000–4000", alignment: "center", fontSize: 9 },
              { text: "Moderate", alignment: "center", fontSize: 9 },
            ],
            [
              { text: "3", alignment: "center", fontSize: 9 },
              { text: "1000–2000", alignment: "center", fontSize: 9 },
              { text: "Low", alignment: "center", fontSize: 9 },
            ],
            [
              { text: "4", alignment: "center", fontSize: 9 },
              { text: "100–1000", alignment: "center", fontSize: 9 },
              { text: "Very Low", alignment: "center", fontSize: 9 },
            ],
            [
              { text: "5", alignment: "center", fontSize: 9 },
              { text: "<100", alignment: "center", fontSize: 9 },
              { text: "Negligible", alignment: "center", fontSize: 9 },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000",
          vLineColor: () => "#000",
        },
      },
    ];
  }
  if (parsedJdata[0].paramName === "PULLOUT_TEST") {
    const node = parsedJdata[0];

    const reportData = node.reportData || {
      tableHeader: [],
      formData: node.formData?.rows || [],
    };

    let { formData } = reportData;

    // -----------------------------------------------------
    // 1️⃣ OPTIONAL COLUMN DEFINITIONS
    // -----------------------------------------------------
    const optionalColumns = [
      { key: "elevation", headerText: "Elevation", width: 35 },
      { key: "rock_condition", headerText: "Rock Conditions", width: 50 },
      { key: "displacement", headerText: "Displacement (mm)", width: 70 },
      { key: "remarks", headerText: "Remarks", width: 95 },
    ];

    // Only include optional columns that have at least one non-empty value
    const includedOptional = optionalColumns.filter((col) =>
      formData.some(
        (row) => row[col.key] && row[col.key].toString().trim() !== ""
      )
    );

    // -----------------------------------------------------
    // 2️⃣ FIXED (ALWAYS VISIBLE) COLUMNS
    // -----------------------------------------------------
    const fixedColumns = [
      { key: "sl_no", headerText: "S.No", width: 20 },
      { key: "location", headerText: "Location", width: 55 },
      {
        key: "embed_length",
        headerText: "Length of Embedded Bar (mm)",
        width: 70,
      },
      { key: "hole_dia", headerText: "Grouted Hole Dia (mm)", width: 50 },
      { key: "bar_dia", headerText: "Bar Dia (mm)", width: 50 },
      { key: "break_load", headerText: "Breaking Load (T)", width: 50 },
      {
        key: "bond_grout_rock_t",
        headerText: "Bond Strength (Grout/Rock) T/m²",
        width: 75,
      },
      {
        key: "bond_grout_steel_t",
        headerText: "Bond Strength (Grout/Steel) T/m²",
        width: 75,
      },
    ];

    // -----------------------------------------------------
    // 3️⃣ FINAL HEADER = FIXED + OPTIONAL
    // -----------------------------------------------------
    const tableHeader = [...fixedColumns, ...includedOptional];

    // Column key list
    const keys = tableHeader.map((h) => h.key);

    // -----------------------------------------------------
    // 4️⃣ DYNAMIC WIDTH LOGIC
    // -----------------------------------------------------
    // Use widths from column definitions
    const widths = tableHeader.map((col) => col.width || "*");

    // -----------------------------------------------------
    // 5️⃣ BUILD TABLE ROWS
    // -----------------------------------------------------
    const tableRows = formData.map((row, index) =>
      keys.map((key) => ({
        text:
          key === "sl_no"
            ? index + 1
            : row[key] !== undefined
              ? `${row[key]}`
              : "",
        alignment: "center",
        fontSize: 9,
      }))
    );

    // -----------------------------------------------------
    // 6️⃣ RETURN PDF TABLE BLOCK
    // -----------------------------------------------------
    return [
      {
        margin: [0, 15, 0, 0],
        table: {
          headerRows: 1,
          widths,
          body: [
            tableHeader.map((h) => ({
              text: h.headerText,
              bold: true,
              alignment: "center",
              fontSize: 8,
            })),
            ...tableRows,
          ],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#e6e6e6" : null),
          hLineWidth: () => 0.7,
          vLineWidth: () => 0.7,
          hLineColor: () => "#000",
          vLineColor: () => "#000",
        },
      },
    ];
  }

  if (param_id === "20240806123456788") {
    const keys = reportData.tableHeader.map((each) => each.key);

    formData?.forEach((item, index) => {
      const newItem = {
        sl: (index + 1).toString(),
        beam_id: reportData.commonFieldsData.beam_id,
        size: reportData.commonFieldsData.size,
        // Convert casting date to dd-mm-yyyy
        casting: reportData.commonFieldsData.casting
          ? new Date(reportData.commonFieldsData.casting)
              .toLocaleDateString("en-GB")
              .split("/")
              .join("-")
          : "",
        // Convert testing date to dd-mm-yyyy
        testing: reportData.commonFieldsData.testing
          ? new Date(reportData.commonFieldsData.testing)
              .toLocaleDateString("en-GB")
              .split("/")
              .join("-")
          : "",
        age: reportData.commonFieldsData.age,
        span: reportData.commonFieldsData.span,
        load: item.load,
        position: item.position,
        flexural: item.flexural,
        avg: reportData.avgFlexural,
      };

      const rowCells = reportData.tableHeader.map((header) => {
        let cellValue =
          newItem[header.key] !== undefined ? `${newItem[header.key]}` : "";

        // Special handling for avg column
        if (header.key === "avg") {
          if (index === 1) {
            // Display average only in the second row
            return {
              text: cellValue,
              fontSize: 9,
              alignment: "center",

              border: [true, false, true, false], // keep full borders for this cell
            };
          } else if (index === 2) {
            // Make other rows for avg cell visually merged by hiding top & side borders
            return {
              text: "",
              fontSize: 9,
              alignment: "center",

              border: [false, false, true, true], // remove all borders to appear merged
            };
          } else {
            // Make other rows for avg cell visually merged by hiding top & side borders
            return {
              text: "",
              fontSize: 9,
              alignment: "center",

              border: [false, false, true, false], // remove all borders to appear merged
            };
          }
        }

        return {
          text: cellValue,
          fontSize: 9,
          alignment: "center",

          border: [true, true, true, true], // keep borders for other cells
        };
      });

      dynamicRows.push(rowCells);
    });
  }

  const tableBody = [
    tableHeader.map((each) => ({
      text: each.headerText,
      style: "tableHeader",
      alignment: "center",
    })),
    ...dynamicRows,
  ];

  const keysOfHeader = tableHeader.map((each) => each.key);
  const hasHeatNumber = keysOfHeader.includes("h_no");
  const hasRebend = keysOfHeader.includes("rebend");

  const autoOrStar = tableHeader.length === 10 ? "auto" : "*";

  return [
    {
      table: {
        headerRows: 1,
        widths: hasRebend
          ? Array(tableHeader.length).fill("auto")
          : Array.from({ length: tableHeader.length }, (_, i) =>
              i < (hasHeatNumber ? 4 : 3) ? "auto" : "*"
            ),
        body: tableBody,
      },
      layout: {
        fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#000000",
        vLineColor: () => "#000000",
      },
    },

    ...(param_id === "20240919132722648" // only for reinforcement steel mechanical
      ? [
          {
            dontBreakRows: false,
            keepWithHeaderRows: 1,

            table: {
              headerRows: 1,
              widths: Array(5).fill("*"),
              body: getRsteelReqTable(gradeArray),
            },
            layout: {
              fillColor: (rowIndex) =>
                rowIndex === 0 || rowIndex == 1 ? "#CCCCCC" : null,
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => "#000000",
              vLineColor: () => "#000000",
            },
          },
          {
            table: {
              headerRows: 1,
              widths: Array(3).fill("*"),
              body: getMPMtable(diaArray),
            },
            layout: {
              fillColor: (rowIndex) =>
                rowIndex === 0 || rowIndex == 1 ? "#CCCCCC" : null,
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => "#000000",
              vLineColor: () => "#000000",
            },
          },
        ]
      : []),

    ...(param_id === "20240919132532508"
      ? [
          {
            table: {
              headerRows: 1,
              widths: creSelected
                ? ["30%", "*", "*", "*", "*", "*"]
                : ["30%", "*", "*", "*", "*"],
              body: getChemicalCompositionTable(gradeArray, creSelected),
            },
            layout: {
              fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => "#000000",
              vLineColor: () => "#000000",
              hLineWidth: function (i, node) {
                const row = node.table.body[i];
                if (row && row[0].text === "") return 0; // hide border for empty row
                return 0.5;
              },
            },
          },
        ]
      : []),
  ];
};

module.exports = dynamicTable;
