const rSteel = (parsedJdata) => {
  const getRow = (reportData) => {
    const d = reportData.map((eachLine) => {
      const { key, value, testMethod } = eachLine;
      return [
        {
          text: key,
          fontSize: 9,
          alignment: "center",
          margin: [0, 2, 0, 2],
        },
        {
          text: value,
          fontSize: 9,
          alignment: "center",
          margin: [0, 2, 0, 2],
        },
        {
          text: testMethod,
          fontSize: 9,
          alignment: "center",
          margin: [0, 2, 0, 2],
        },
      ];
    });

    return d;
  };

  const tableBody = [
    [
      { text: "Test Conducted", style: "tableHeader", alignment: "center" },
      { text: "Results", style: "tableHeader", alignment: "center" },
      { text: "Requirements", style: "tableHeader", alignment: "center" },
    ],
    ...parsedJdata.flatMap(({ paramName, reportData }) => {
      if (paramName === RSTEEL_MECH) {
        return getRow(reportData);
      }
    }),
  ];

  return {
    table: {
      headerRows: 1,
      widths: ["*", "*", "*"],
      body: tableBody,
    },

    table: {
      headerRows: 1,
      widths: ["*", "*", "*"],
      body: tablebody2,
    },

    layout: {
      fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => "#000000",
      vLineColor: () => "#000000",
    },

    margin: [0, 5, 0, 0],
  };
};

module.exports = rSteel;
