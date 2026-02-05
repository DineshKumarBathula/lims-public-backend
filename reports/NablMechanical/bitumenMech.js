const bitumenMech = (parsedJdata) => {
  const getRow = (reportData) => {
    const { key, value, requirements, testMethod } = reportData[0];

    return [
      [
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
          text: requirements,
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
      ],
    ];
  };

  const tableBody = [
    [
      { text: "Test Conducted", style: "tableHeader", alignment: "center" },
      { text: "Results", style: "tableHeader", alignment: "center" },
      { text: "Requirements", style: "tableHeader", alignment: "center" },
      { text: "Test Method", style: "tableHeader", alignment: "center" },
    ],
    ...parsedJdata.flatMap(({ paramName, reportData }) => {
      return getRow(reportData);
    }),
  ];

  return {
    table: {
      headerRows: 1,
      widths: ["auto", "*", "*", "*"],
      body: tableBody,
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

module.exports = bitumenMech;
