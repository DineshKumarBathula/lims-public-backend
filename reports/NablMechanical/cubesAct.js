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

const cubesAct = (parsedJdata) => {
  const { reportData, param_id, diaArray, gradeArray, creSelected, crs_bars } =
    parsedJdata[0];

  console.log(gradeArray, parsedJdata[0], "parsedJdata234");

  const { tableHeader, formData } = reportData;
  const dynamicRows = [];

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

module.exports = cubesAct;
