const {
  getRsteelReqTable,
  getMPMtable,
  getChemicalCompositionTable,
} = require("./staticTables");

const getEachRow = (eachObject, keys) => {
  console.log("Am here bro : ");
  console.log(eachObject);
  return keys.map((eachKey) => ({
    text: eachKey === "grade" ? eachObject["reportGrade"] : eachObject[eachKey],
    fontSize: 9,
    alignment: "center",
  }));
};

const rSteelMech = (parsedJdata) => {
  const { reportData, param_id, diaArray, gradeArray, creSelected, crs_bars } =
    parsedJdata[0];

  const { tableHeader, formData } = reportData;
  console.log(tableHeader,'tableHeader876')
  const dynamicRows = [];

  if (param_id === "20240919132722648" || param_id === "20240919132532508") {
    //re inforcement steel
    const keys = tableHeader.map((each) => each.key);
    formData?.forEach((item) => {
      dynamicRows.push(getEachRow(item, keys));
    });

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
  const widths = tableHeader.map((header) =>
  header.key === "h_no" ? 64 : "auto"
);

  // const autoOrStar = "auto";
  // const
  // console.log(keysOfHeader,'tableHeader.length')
  return [
    {
      table: {
        headerRows: 1,
        // widths: Array(tableHeader.length).fill("auto"),


widths:widths,

        // hasRebend
        //   ? Array(tableHeader.length).fill("auto")
        //   : Array.from(
        //       { length: tableHeader.length },
        //       (_, i) => (i < (hasHeatNumber ? 4 : 3) ? "auto" : "*")
        //     ),
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
              widths: ["auto", "auto", "*", "auto", "*"],
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
              widths: Array(diaArray.length + 1).fill("*"),
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
              widths: Array(creSelected ? 6 : 5).fill("*"),
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

module.exports = rSteelMech;
