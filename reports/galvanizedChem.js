const {
  REPORT_HEADER_SNO,
} = require("./consts");

const galvanizedChem = (id, parsedJdata) => {
  // console.log(id, "parsedJdata768");

  const reportData = parsedJdata[0]?.reportData || {};
  const sampleName = parsedJdata[0]?.sampleDesc || "MS Angler";
  // console.log(reportData, "reportData765");

  const getRequirementHeaderById = (id) => {
  switch (id) {
    case 64:
      return "Requirement IS:5986 Table-3 (ISH 330S), Grade-205 (%)";

    case 122:
      return "Requirement IS:5986 Table-3 (ISH 430LA), Grade-355 (%)";

    case 124:
      return "Requirement as per IS:1367 Part-3 Table-2(%)";

    case 125:
      return "Requirement as per IS:2062 Table-1(%)";

          case 126:
      return "Requirement as per IS:2062 Table-1(%)";

                case 123:
      return "Requirement as per IS:1367 Part-6 Table-4(%)";

                      case 127:
      return "Requirement as per IS:1875 Table-1(%)";

                           case 142:
      return "Requirement as per EN 42";

    default:
      return "Requirement";
  }
};
  const requirementHeader = getRequirementHeaderById(id);


  const hasElements =
    reportData.elements &&
    typeof reportData.elements === "object" &&
    Object.keys(reportData.elements).length > 0;

    // console.log(hasElements,'haele89')

  const availableItems = [
    reportData.sheet && { key: "sheet", label: sampleName, data: reportData.sheet },
    reportData.wire && { key: "wire", label: sampleName, data: reportData.wire },
    reportData.article && {
      key: "article",
      label: sampleName,
      data: reportData.article,
    },
  ].filter(Boolean);


//COMBO CASE
// CASE: BOTH availableItems AND chemical elements exist
if (availableItems.length > 0 && hasElements) {

  const elementEntries = Object.entries(reportData.elements);
    // console.log("elementEntries89",elementEntries);


  const tableBody = [
    [
      { text: "Sl. No.", style: "tableHeader", alignment: "center" },
      { text: "Sample Description", style: "tableHeader", alignment: "center" },
      { text: "Test", style: "tableHeader", alignment: "center" },
      { text: "Result", style: "tableHeader", alignment: "center" },
      { text: "Test Method", style: "tableHeader", alignment: "center" },
      { text: requirementHeader, style: "tableHeader", alignment: "center" },
    ],

    // Add galvanized items
    ...availableItems.map((item, index) => [
      { text: index + 1, fontSize: 8, alignment: "center" },
      { text: item.label, fontSize: 8, alignment: "center" },
      { text: "Mass of Zinc Coating\nThickness", fontSize: 8, alignment: "center" },
      { text: `${item.data?.rows[0].finalValue23 ?? ""}`, fontSize: 8, alignment: "center" },
      { text: `${item.data?.testMethod ?? ""}`, fontSize: 8, alignment: "center" },
      { text: `${item.data?.requirement ?? ""}`, fontSize: 8, alignment: "center" },
    ]),

    // Add chemical elements below it
    ...elementEntries.map(([elementName, obj], index) => {
      return [
        { text: availableItems.length + index + 1, fontSize: 8, alignment: "center" },
        { text: sampleName, fontSize: 8, alignment: "center" },
        { text: `${elementName} (%)`, fontSize: 8, alignment: "center" },
        { text: obj?.value ?? "", fontSize: 8, alignment: "center" },
        { text: obj?.testMethod ?? "", fontSize: 8, alignment: "center" },
        { text: obj?.requirement ?? "", fontSize: 8, alignment: "center" },
      ];
    }),
  ];

  return {
    table: {
      headerRows: 1,
      widths: ["7%", "25%", "25%", "10%", "18%", "15%"],
      body: tableBody,
    },
    layout: {
      fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => "#000000",
      vLineColor: () => "#000000",
    },
    margin: [0, 5, 0, 5],
  };
}



  // ================================
  //  CASE 1: Galvanized Forms (sheet, wire, article)
  // ================================
  if (availableItems.length > 0) {
    // console.log(availableItems, "availableItems765");

    const tableBody = [
      [
        { text: "Sl. No.", style: "tableHeader", alignment: "center" },
        { text: "Sample Description", style: "tableHeader", alignment: "center" },
        { text: "Test", style: "tableHeader", alignment: "center" },
        { text: "Result", style: "tableHeader", alignment: "center" },
        { text: "Test Method", style: "tableHeader", alignment: "center" },
        { text: "Requirement", style: "tableHeader", alignment: "center" },
      ],
      ...availableItems.map((item, index) => [
        { text: (index + 1).toString(), fontSize: 8, alignment: "center" },
        { text: item.label, fontSize: 8, alignment: "center" },
        { text: "Mass of Zinc Coating\nThickness", fontSize: 8, alignment: "center" },
        { text: `${item.data?.rows[0].finalValue23 ?? ""}`, fontSize: 8, alignment: "center", margin: [0, 5, 0, 0] },
        { text: `${item.data?.testMethod ?? ""}`, fontSize: 8, alignment: "center", margin: [0, 5, 0, 0] },
        { text: `${item.data?.requirement ?? ""}`, fontSize: 8, alignment: "center", margin: [0, 5, 0, 0] },
      ]),
    ];

    return {
      table: {
        headerRows: 1,
        widths: ["7%", "25%", "25%", "10%", "18%", "15%"],
        body: tableBody,
      },
      layout: {
        fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#000000",
        vLineColor: () => "#000000",
      },
      margin: [0, 5, 0, 5],
    };
  }

  // ================================
  //  CASE 2: NEW FORMAT (Chemical Elements)
  // ================================
  if (hasElements) {
    // console.log(reportData,'elementEntries879')

    const elementEntries = Object.entries(reportData.elements);
// console.log(elementEntries,'elementEntries879')
    const tableBody = [
      [
        { text: "Sl. No.", style: "tableHeader", alignment: "center" },
        { text: "Sample Description", style: "tableHeader", alignment: "center" },
        { text: "Test", style: "tableHeader", alignment: "center" },
        { text: "Result", style: "tableHeader", alignment: "center" },
        { text: "Test Method", style: "tableHeader", alignment: "center" },
        { text: "Requirement", style: "tableHeader", alignment: "center" },
      ],

      ...elementEntries.map(([elementName, obj], index) => {

        return [
          { text: index + 1, fontSize: 8, alignment: "center" },

          // Sample Description
          { text:sampleName, fontSize: 8, alignment: "center" },

          // Test
          { text: `${elementName} (%)`, fontSize: 8, alignment: "center" },

          // Result
          { text: obj?.value ?? "", fontSize: 8, alignment: "center" },

          // Test Method
          { text: obj?.testMethod ?? "", fontSize: 8, alignment: "center" },

          // Requirement
          { text: obj?.requirement ?? "", fontSize: 8, alignment: "center" },
        ];
      }),
    ];

    return {
      table: {
        headerRows: 1,
        widths: ["7%", "25%", "25%", "10%", "18%", "15%"],
        body: tableBody,
      },
      layout: {
        fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#000000",
        vLineColor: () => "#000000",
      },
      margin: [0, 5, 0, 5],
    };
  }

  // ================================
  //  FALLBACK HANDLER
  // ================================
  let allRows = parsedJdata.flatMap(({ reportData }) => reportData);

  const getFormattedRow = (each, idx) => {
    const { key, value, testMethod, requirements } = each;
    return [
      { text: idx + 1, fontSize: 8, alignment: "center" },
      { text: key, fontSize: 8, alignment: "center" },
      { text: testMethod, fontSize: 8, alignment: "center" },
      { text: value, fontSize: 8, alignment: "center" },
      { text: requirements, fontSize: 8 },
    ];
  };

  const tableRows = allRows.map((row, idx) => getFormattedRow(row, idx));

  const tableBody = [
    [
      { text: REPORT_HEADER_SNO, style: "tableHeader", alignment: "center" },
      { text: "Sample Description", style: "tableHeader", alignment: "center" },
      { text: "Test", style: "tableHeader", alignment: "center" },
      { text: "Result", style: "tableHeader", alignment: "center" },
      { text: "Requirement", style: "tableHeader", alignment: "center" },
    ],
    ...tableRows,
  ];

  return {
    table: {
      headerRows: 1,
      widths: ["auto", "auto", "*", "auto", "*"],
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

module.exports = galvanizedChem;
