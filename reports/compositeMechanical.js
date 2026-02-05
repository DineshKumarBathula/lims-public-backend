const {
  REPORT_HEADER_PARTICULARS,
  REPORT_HEADER_TEST_METHOD,
  REPORT_HEADER_SPECIFICATIONS,
  REPORT_HEADER_RESULTS,
  REPORT_HEADER_SNO,
} = require("./consts");

const compositeMechanical = (id, parsedJdata) => {
  const isComposite = id === 121 || id === 122;
const ORDER_PRIORITY = [
  "Yield Strength",
  "Tensile",
  "Elongation",
  "Bend",
  "Uniformity of Coating",
  "Adhesion Test",
];

const mergedReportData = isComposite
  ? parsedJdata.flatMap(item => item.reportData || [])
  : [];

const orderedMergedReportData = isComposite
  ? mergedReportData
      .slice() // avoid mutating original array
      .sort((a, b) => {
        const aIndex = ORDER_PRIORITY.findIndex(p =>
          a.key?.toLowerCase().includes(p.toLowerCase())
        );
        const bIndex = ORDER_PRIORITY.findIndex(p =>
          b.key?.toLowerCase().includes(p.toLowerCase())
        );

        // If not found in priority list, push to bottom
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;

        return aIndex - bIndex;
      })
  : [];

  
      // console.log(orderedMergedReportData,'parsedJdata787')

  const getFormattedRow = (each, idx) => {

    const { key, value, testMethod, requirements } = each;

    return [
      {
        text: idx + 1,
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },
      {
        text: key,
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },
      {
        text: testMethod,
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },

      {
        text: value,
        fontSize: 9,
        alignment: "center",
        margin: [0, 2, 0, 2],
      },
      {
        text: requirements,
        fontSize: 8,
        margin: [0, 1, 0, 1],
      },
    ];
  };
  // console.log(id, "id654");

  const specHeaderMap = {
    121: "Specification as per IS:5986 Table-6 (ISH 330S) & IS 4759",
    122: "Specification as per IS:5986 Table-6 (ISH 430LA) & IS 4759",
  };

  //   const descriptionMap = {
  //   121: "Metal Beam Crash Barrier (W-Beam-2mm)",
  //   122: "Channel Post 150x75x4mm",
  // };

  // Default fallback if id not found
  const getSpecHeader = (id) =>
    specHeaderMap[id] || REPORT_HEADER_SPECIFICATIONS;
  let counter = 0;

  const tableBody = [
    [
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
        text: getSpecHeader(id),
        style: "tableHeader",
        alignment: "center",
      },
    ],


      ...(isComposite
    ? orderedMergedReportData.map(eachTest =>
        getFormattedRow(eachTest, counter++)
      )
    : parsedJdata.flatMap(({ reportData }) =>
        (reportData || []).map(eachTest =>
          getFormattedRow(eachTest, counter++)
        )
      )),


    // ...parsedJdata.flatMap(({ reportData }, idx) => {

    //   return [
    //     ...reportData.map((eachTest) => getFormattedRow(eachTest, counter++)),
    //   ];
    // }),
  ];


  const content = [];

  // if (descriptionMap[id]) {
  //   content.push({
  //     text: descriptionMap[id],
  //     fontSize: 9,
  //     bold: true,
  //     margin: [0, 2, 0, 0],
  //   });
  // }

  content.push({
    table: {
      headerRows: 1,
      widths: ["auto", "*", "20%", "auto", "*"],
      body: tableBody,
    },
    layout: {
      fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => "#000000",
      vLineColor: () => "#000000",
    },
    margin: [0, 0, 0, 0],
  });

  return content;
};

module.exports = compositeMechanical;
