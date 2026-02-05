const {
  REPORT_HEADER_PARTICULARS,
  REPORT_HEADER_TEST_METHOD,
  // REPORT_HEADER_SPECIFICATIONS,
  REPORT_HEADER_RESULTS,
  REPORT_HEADER_SNO,
} = require("../consts");

const ggbsChem = (id, parsedJdata) => {
  const compressiveRowIndexes = new Set();
  const getFormattedRow = (each, idx) => {
    const { key, value, testMethod, requirements } = each;
    return [
      {
        text: idx + 1,
        fontSize: 8,
        alignment: "center",
      },
      {
        text: key,
        fontSize: 8,
        alignment: "center",
      },
      {
        text: testMethod,
        fontSize: 8,
        alignment: "center",
      },
      {
        text: value,
        fontSize: 9,
        alignment: "center",
      },
      {
        text: requirements,
        fontSize: 8,
        alignment: "center",
      },
    ];
  };

  const getFormattedRow781 = (each, idx) => {
    const { key, value, testMethod, requirements } = each;

    // Extract ratio values safely
    const ratio1 = value?.ratio1 ?? "";
    const ratio2 = value?.ratio2 ?? "";

    return [
      {
        text: idx + 1,
        fontSize: 8,
        alignment: "center",
      },
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                text: "Major oxides (As Formula)",
                fontSize: 7,
                alignment: "center",
                //    border:[false,false,false,true]
              },
            ],
            [
              {
                text: "1) CaO+MgO+1/2 Al2O3/SiO2+2/3 Al2O3",
                fontSize: 7,
                alignment: "center",
                //    border:[false,false,false,true]
              },
            ],
            [
              {
                text: "2) CaO+MgO+Al2O3/SiO2",
                fontSize: 7,
                alignment: "center",
              },
            ],
          ],
        },
        layout: "noBorders",
      },
      {
        text: testMethod,
        fontSize: 8,
        alignment: "center",
      },
      {
        // Result column with ratio1 & ratio2 (unchanged)
        table: {
          widths: ["*"],
          body: [
            [
              {
                text: ratio1,
                fontSize: 8,
                alignment: "center",
                border: [false, false, false, false],
              },
            ],
            [
              {
                text: ratio2,
                fontSize: 8,
                alignment: "center",
                border: [false, false, false, false],
              },
            ],
          ],
        },
        //   layout: {
        //     hLineWidth: (i, node) => (i === 1 ? 0.5 : 0), // border between ratio1 & ratio2
        //     vLineWidth: () => 0
        //   }
      },
      {
        text: requirements,
        fontSize: 8,
        alignment: "center",
      },
    ];
  };

  let REPORT_HEADER_SPECIFICATIONS = "Specifications";
  if (id === 76) {
    REPORT_HEADER_SPECIFICATIONS = "Requirements as per IS: 16714 : 2018 Table-1";
  }

  const headerRow = [
    {
      text: REPORT_HEADER_SNO,
      style: "tableHeader",
      alignment: "center",
    },
    {
      text: REPORT_HEADER_PARTICULARS,
      style: "tableHeader",
      alignment: "center",
    },
    {
      text: REPORT_HEADER_TEST_METHOD,
      style: "tableHeader",
      alignment: "center",
    },
    {
      text: REPORT_HEADER_RESULTS,
      style: "tableHeader",
      alignment: "center",
    },
    {
      text: REPORT_HEADER_SPECIFICATIONS,
      style: "tableHeader",
      alignment: "center",
    },
  ];
  const body = [headerRow];
  let counter = 0;

  for (const { reportData, param_id } of parsedJdata) {
    reportData.forEach((test, idx) => {
      if (param_id === "MAJOR_OXIDES") {
        // console.log(test,'ALL IS WELL222')
        body.push(getFormattedRow781(test, counter)); // Major Oxides case
      } else {
        body.push(getFormattedRow(test, counter));
      }
    });
    counter++; // after each block
  }
  return {
    table: {
      headerRows: 1,
      widths: ["auto", "*", "*", "auto", "*"],
      body,
    },
    layout: {
      fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
      hLineWidth: (i) => 0.5,
      vLineWidth: (i) => 0.5, // You can customize per cell too, if needed
      hLineColor: () => "#000000",
      vLineColor: () => "#000000",
    },
  };
};

module.exports = ggbsChem;
