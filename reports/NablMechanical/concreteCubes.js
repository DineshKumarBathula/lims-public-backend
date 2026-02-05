const {
  getRsteelReqTable,
  getMPMtable,
  getChemicalCompositionTable,
} = require("./staticTables");

const getEachRow = (eachObject, keys) => {
  console.log(eachObject, keys, "keys123");
  return keys.map((eachKey) => ({
    text: eachObject[eachKey],
    fontSize: 9,
    alignment: "center",
  }));
};

const dynamicTable2 = (parsedJdata) => {
  const { reportData, param_id, diaArray, gradeArray, creSelected, crs_bars } =
    parsedJdata[0];

  console.log(gradeArray, parsedJdata[0], "parsedJdata65");

  const { tableHeader, formData } = reportData;
  const dynamicRows = [];

  // if (param_id === "20240725180338410") {
  if (param_id === "20240725180338406") {
    // console.log(formData);
    const { avg } = reportData;
    const keys = tableHeader.map((each) => each.key);

    // console.log(keys,'keeeys')

    formData?.forEach((item) => {
      dynamicRows.push(getEachRow(item, keys));
    });

    dynamicRows.push([
      {
        text: `Average Compressive Strength`,
        colSpan: keys.length - 1,
        alignment: "right",
        fontSize: 9,
      },
      ...Array(keys.length - 2).fill({}),
      {
        text: `${avg} N/mm²`,
        fontSize: 9,
      },
    ]);
  }
  // ------------------- CURRENT TEST (RCPT Current Measurement) -------------------

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
  // const autoOrStar = "auto";
  // const
  // console.log(keysOfHeader,'tableHeader.length')
  return [
    {
      table: {
        headerRows: 1,
        widths: Array(tableHeader.length).fill("auto"),
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

module.exports = dynamicTable2;
