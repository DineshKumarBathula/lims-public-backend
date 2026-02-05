const { col } = require("sequelize");

// Dimensions
const getRow = (finalTable) => {
  console.log(finalTable,'thn23')
  return finalTable.map((eachLine, idx) => {
    const { sno, l, b, h, tm } = eachLine;
    console.log(tm,'thn')
const middleRowIndex = Math.floor(finalTable.length / 2);

    return [
      {
        text: sno,
        fontSize: 9,
        alignment: "center",
        margin: [0, 2, 0, 2],
      },
      {
        text: l,
        fontSize: 9,
        alignment: "center",
        margin: [0, 2, 0, 2],
      },
      {
        text: b,
        fontSize: 9,
        alignment: "center",
        margin: [0, 2, 0, 2],
      },
      {
        text: h,
        fontSize: 9,
        alignment: "center",
        margin: [0, 2, 0, 2],
      },
       idx === middleRowIndex
        ?
         {
            text: tm, fontSize: 9,
             border: [false, false, true, false]
          }: idx === (finalTable.length-1) ? {text: "", border: [false, false, true, true] }
        : { text: "", border: [false, false, true, false] },
    ];
  });
};

const paverBlocks = (jdata) => {
  try {
    const parsedJdata = jdata;
    // console.log(parsedJdata, 'dimentionalAnalysis123')
    const csData = parsedJdata?.find(
      (item) => item.param_id === 'REDBRICKS_COMPRESSIVE_STRENGTH'
    );
    const waData = parsedJdata?.find(
      (item) => item.param_id === 'REDBRICKS_WATER_ABSORPTION'
    );

      const dimentionalAnalysis = (parsedJdata || []).filter(
    (eachObj) => eachObj.paramName === "REDBRICKS_DIMENTIONAL_ANALYSIS"
  );

    // console.log(dimentionalAnalysis, 'dimentionalAnalysis1233')


  

    const outputTables = [];

if (csData?.correctedCompressiveList && Array.isArray(csData.correctedCompressiveList) && csData.grade) {
  const reversedList = csData.correctedCompressiveList.slice().reverse();
  const reversedAvg = csData.averageCorrectedCompressive?.slice().reverse() || [];

  reversedList.forEach((set, setIndex) => {
    const avg = reversedAvg?.[setIndex] || "-";

    const tableHeader = [
      [
        { text: "S.No.", rowSpan: 2, style: "tableHeader", alignment: "center", fontSize: 8 },
        { text: "Test Method", rowSpan: 2, style: "tableHeader", alignment: "center", fontSize: 8 },
        ...Array.from({ length: set.length }, (_, i) => ({
          text: `${i + 1}`, style: "tableHeader", alignment: "center", fontSize: 8, rowSpan: 2
        })),
        { text: "Average", rowSpan: 2, style: "tableHeader", alignment: "center", fontSize: 8 },
      ],
      [
        {}, {}, 
        ...Array(set.length).fill({}), 
        {}
      ]
    ];

    const tableBody = [
      ...tableHeader,
      [
        { text: "Compressive Strength (N/mm²)", alignment: "left", fontSize: 8 },
        { text: "IS: 15658 (ANNEX D)", alignment: "center", fontSize: 8 },
        ...set.map((val) => ({
          text: parseFloat(val).toFixed(1), alignment: "center", fontSize: 8
        })),
        { text: parseFloat(avg).toFixed(1), alignment: "center", fontSize: 8 },
      ],
      
(() => {
  const totalCols = 2 + set.length + 1;
  const row = [];

  // ✅ Convert grade string (e.g., "M45") to numeric value (45)
  const gradeValue = Number(csData.grade.replace("M", ""));

  const individualMin = (gradeValue - 3).toFixed(0);   // e.g., 42
 const avgMin = Math.round(gradeValue + 4.125);     // e.g., 49.125

  row.push({
    text: "Specification as per Table-3 of 15658:2021",
    alignment: "center",
    fontSize: 8,
    colSpan: 2,
    margin:[0,10,0,0]
  });
  row.push({}); // placeholder for colSpan

  // 🔹 Fixed colSpan = 8 for Individual
  row.push({
    text: `Individual :${individualMin} Mpa Minimum`,
    alignment: "center",
    fontSize: 8,
    colSpan: 8, margin:[0,10,0,0]
  });
  for (let i = 1; i < 8; i++) row.push({}); // fill placeholders for colSpan

  // 🔹 Fixed colSpan = 1 for Avg
  row.push({
    text: `${avgMin} Mpa Minimum`,
    alignment: "center",
    fontSize: 8,
    colSpan: 1,
  });

  while (row.length < totalCols) row.push({});

  return row;
})(),


    ];

    outputTables.push({
      stack: [
        // { text: `Set-${setIndex + 1}`, bold: true, fontSize: 10, margin: [0, 10, 0, 4] },
            {
      text: csData?.grade ? `Compressive Strength (${csData?.grade})`: "Compressive Strength",
      fontSize: 10,
      bold: true,
      alignment: "left",
    },
        {
          table: {
            headerRows: 2,
            widths: ["28%", "19%", ...Array(set.length).fill("*"), "10%"],
            body: tableBody,
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#000",
            vLineColor: () => "#000",
          },
          margin:[0,2,0,0]
        },
      ],
    });
  });
}





    // ---------- Water Absorption Table ----------
   if (waData?.finalTable && Array.isArray(waData.finalTable)) {
  const avg = waData.finalTable[0]?.avg || "-";

  const waHeader = [
    [
      { text: "S.No.", rowSpan: 2, style: "tableHeader", alignment: "center", fontSize: 8 },
      { text: "Test Method", rowSpan: 2, style: "tableHeader", alignment: "center", fontSize: 8 },
      ...waData.finalTable.map((_, i) => ({
        text: `${i + 1}`, style: "tableHeader", alignment: "center", fontSize: 8, rowSpan: 2
      })),
      { text: "Average", rowSpan: 2, style: "tableHeader", alignment: "center", fontSize: 8 },
    ],
    [ {} , {}, ...waData.finalTable.map(() => ({})), {} ] // empty 2nd row for structure
  ];

  const waRow = [
    { text: "Water Absorption (%)", alignment: "center", fontSize: 8 },
    { text: "IS: 15658 (ANNEX C)", alignment: "center", fontSize: 8 },
    ...waData.finalTable.map((item) => ({
      text: parseFloat(item.wa).toFixed(1), alignment: "center", fontSize: 8,
    })),
    { text: parseFloat(avg).toFixed(1), alignment: "center", fontSize: 8 },
  ];

  const specRow = [
    { text: "Specification as per Table-3 of  15658:2021", colSpan: 2, alignment: "center", fontSize: 8 },
    {}, // 2nd col for colSpan
    { text: "Individual : 7 % Max", alignment: "center", fontSize: 8, colSpan:3 },
    {},{},
        // ...Array(waData.finalTable.length - 1).fill({}),

    { text: "AVG: 6% Max", alignment: "center", fontSize: 8 },
  ];

  outputTables.push({
    stack: [
      { text: "Water Absorption", bold: true, fontSize: 10, margin: [0, 10, 0, 2] },
      {
        table: {
          headerRows: 2,
          widths: ["25%", "20%", ...Array(waData.finalTable.length).fill("*"), "15%"],
          body: [ ...waHeader, waRow, specRow ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000",
          vLineColor: () => "#000",
        },
      },
    ],
  });
}


  if (dimentionalAnalysis.length > 0) {
    const dimensionalTable = [
      [
        { text: "S.No", style: "tableHeader", alignment: "center" },
        { text: "Length (mm)", style: "tableHeader", alignment: "center" },
        { text: "Width (mm)", style: "tableHeader", alignment: "center" },
        { text: "Thickness (mm)", style: "tableHeader", alignment: "center" },
        { text: "Test Method", style: "tableHeader", alignment: "center" },
      ],
      ...parsedJdata.flatMap(({ paramName }) => {
        if (paramName === 'REDBRICKS_DIMENTIONAL_ANALYSIS') {
          return getRow(dimentionalAnalysis[0].finalTable);
        }
        return [];
      }),
    ];

    outputTables.push(
      {
        text: "DIMENSIONS",
        fontSize: 10,
        bold: true,
        margin: [0, 10, 0, 2],
      },
      {
        alignment: "center",
        table: {
          headerRows: 1,
          alignment: "center",
          widths: ["*", "*", "*", "*", "*"],
          body: dimensionalTable,
          dontBreakRows: true,
          keepWithHeaderRows: 1,
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        margin: [0, 5, 0, 0],
      }
    );
  }


    return { stack: outputTables };
  } catch (err) {
    console.error("Error generating paver blocks report:", err.message);
    return null;
  }
};

module.exports = paverBlocks;
