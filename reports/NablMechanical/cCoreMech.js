// const cCoreMech = (jdata) => {
//   try {
//     const parsedJdata = jdata;
//     const seiveData = parsedJdata.find(
//       (item) => item.param_id === "20240725182402705"
//     );

//     const seiveTableData = seiveData?.formData?.commonTemplate || [];
//     const avgCubeStrength = seiveData?.reportData?.avg || "-";
//     const seiveDescription = seiveData?.formData?.description || '';
//         const nabl = testReq.coreDetails[0].nabl || true;
//     const numCores = testReq.coreDetails[0].numCores || 1;

//     console.log(parsedJdata,'34',seiveTableData,'78',seiveDescription,'seiveDescription234')

//     if (!seiveTableData || seiveTableData.length === 0) {
//       return null;
//     }

//     // const tableHeader = [
//     //   [
//     //     { text: "Sl. No", style: "tableHeader", alignment: "center", fontSize: 8 },
//     //     { text: "Core /Structure Identification*", style: "tableHeader", alignment: "center", fontSize: 8 },
//     //     { text: "Core Weight (Kg)", style: "tableHeader", alignment: "center", fontSize: 8 },
//     //     { text: "Core length* (l) (mm)", style: "tableHeader", alignment: "center", fontSize: 8 },
//     //     { text: "Core Dia (d) (mm)", style: "tableHeader", alignment: "center", fontSize: 8 },
//     //     { text: "Core Area (Sq.mm)", style: "tableHeader", alignment: "center", fontSize: 8 },
//     //     { text: "Observed Load (kN)", style: "tableHeader", alignment: "center", fontSize: 8 },
//     //     { text: "Core comp. Strength # (N/sq.mm)", style: "tableHeader", alignment: "center", fontSize: 8 },
//     //     { text: "l/d Ratio", style: "tableHeader", alignment: "center", fontSize: 8 },
//     //     { text: "Correction factor for (l/d) ratio+", style: "tableHeader", alignment: "center", fontSize: 8 },
//     //     { text: "Corrected Cyl. Comp. Strength (N/sq.mm)", style: "tableHeader", alignment: "center", fontSize: 8 },
//     //     { text: "Equivalent Cube Comp. Strength ++ (N/sq.mm) Individual", style: "tableHeader", alignment: "center", fontSize: 8 },
//     //   ],
//     // ];

//     const tableHeader = [
//   [
//     { text: "Sl. No", style: "tableHeader", alignment: "center", fontSize: 7, noWrap: true },
//     { text: "Core / Structure\nIdentification*", style: "tableHeader", alignment: "center", fontSize: 7 },
//     { text: "Core Weight\n(Kg)", style: "tableHeader", alignment: "center", fontSize: 7 },
//     { text: "Core Length (l)\n(mm)", style: "tableHeader", alignment: "center", fontSize: 7 },
//     { text: "Core Dia (d)\n(mm)", style: "tableHeader", alignment: "center", fontSize: 7 },
//     { text: "Core Area\n(Sq.mm)", style: "tableHeader", alignment: "center", fontSize: 7 },
//     { text: "Observed Load\n(kN)", style: "tableHeader", alignment: "center", fontSize: 7 },
//     { text: "Core comp.\nStrength\n(N/sq.mm)#", style: "tableHeader", alignment: "center", fontSize: 7 },
//     { text: "l/d Ratio", style: "tableHeader", alignment: "center", fontSize: 7 },
//     { text: "Correction factor\nfor (l/d) ratio+", style: "tableHeader", alignment: "center", fontSize: 7 },
//     { text: "Corrected Cyl.\nComp. Strength\n(N/sq.mm)", style: "tableHeader", alignment: "center", fontSize: 7 },
//     { text: "Equivalent Cube\nComp. Strength ++\n(N/sq.mm) Individual", style: "tableHeader", alignment: "center", fontSize: 7 },
//   ],
// ];

//     const tableBody = [
//       ...tableHeader,

//   ...(seiveDescription && seiveDescription.trim() !== ""
//     ? [[
//         {
//           text: seiveDescription,
//           colSpan: 12,
//           alignment: "left",
//           fontSize: 8,
//           // italics: true,
//           margin: [2, 3, 2, 3],
//         },
//         ...Array(11).fill({}), // fill empty cells to match 12 cols
//       ]]
//     : []),

//       ...seiveTableData.map((item, index) => [
//         { text: String(index + 1), alignment: "center", fontSize: 8 },
//         { text: item.core_structure_id || "", alignment: "center", fontSize: 8 },
// { text: item.core_wt ? Number(item.core_wt).toFixed(3) : "-", alignment: "center", fontSize: 8 },
//         { text: item.l || "-", alignment: "center", fontSize: 8 },
//         { text: item.d || "-", alignment: "center", fontSize: 8 },
//         { text: item.area ? Math.floor(item.area) : "-", alignment: "center", fontSize: 8 },
//      { text: item.max ? Number(item.max).toFixed(1) : "-", alignment: "center", fontSize: 8 },
// { text: item.cs ? Number(item.cs).toFixed(2) : "-", alignment: "center", fontSize: 8 },
// { text: item.ld_ratio ? Number(item.ld_ratio).toFixed(2) : "-", alignment: "center", fontSize: 8 },
// { text: item.correction_factor ? Number(item.correction_factor).toFixed(3) : "-", alignment: "center", fontSize: 8 },
// { text: item.corrected_strength ? Number(item.corrected_strength).toFixed(2) : "-", alignment: "center", fontSize: 8 },
// { text: item.cube_strength ? Number(item.cube_strength).toFixed(2) : "-", alignment: "center", fontSize: 8 },
//       ]),
//       [
//         {
//           text: "AVG:",
//           colSpan: 11,
//           alignment: "right",
//           bold: true,
//           fontSize: 8,
//           margin: [0, 2, 4, 2],
//         },
//         {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
//         {
//           text: avgCubeStrength,
//           alignment: "center",
//           bold: true,
//           fontSize: 8,
//           margin: [0, 2, 4, 2],
//         },
//       ],
//     ];

//     return {
//       stack: [
//         {
//           table: {
//             headerRows: 1,
//             widths: [
//               "5%", "15%", "9%", "9%", "9%", "9%", "9%", "9%",
//               "6%", "10%", "10%", "10%",
//             ],
//             body: tableBody,
//           },
//           layout: {
//             hLineWidth: () => 0.5,
//             vLineWidth: () => 0.5,
//             hLineColor: () => "#000",
//             vLineColor: () => "#000",
//           },
//           margin: [0, 5, 30, 0],
//           alignment: "left",
//         },
//         {
//           stack: [
//             {
//               text: "Core length / weight after trimming and capping:",
//               bold: true,
//               margin: [0, 10, 0, 2],
//             },
//             {
//               text: "Core length may increase or decrease when compared to extracted core length after capping.",
//             },
//             {
//               text: "+For l/d ratio, correction factors are as per Clause 8.4.2 of IS: 516(Part-4)",
//             },
//             {
//               text: "++ Equivalent cube compressive strength = 1.25 x corrected cylinder compressive strength as per Clause 8.4.2 of IS: 516(Part-4)",
//             },
//             {
//               text: "As per Clause 8.4.1 of IS: 516(Part-4) below mentioned correction factors are applied:",
//             },
//             {
//               text: "a. For core diameter < 70mm - strength of core x 1.06",
//               margin: [20, 0, 0, 0],
//             },
//             {
//               text: "b. For core diameter between 70mm to 80mm - strength of core x 1.03",
//               margin: [20, 0, 0, 0],
//             },
//             {
//               text: "Acceptance Criteria as per IS: 456:",
//               bold: true,
//               margin: [0, 8, 0, 2],
//             },
//             {
//               text: "Concrete cores tested shall be considered acceptable if the average equivalent cube strength of the cores is equal to at least 85 percent of the cube strength of the grade of concrete specified for the corresponding age and no individual core has a strength less than 75 percent.",
//             },
//           ],
//           fontSize: 9,
//         },
//       ],
//     };
//   } catch (err) {
//     console.error("Error generating core compressive strength table:", err.message);
//     return null;
//   }
// };

// module.exports = cCoreMech;

const cCoreMech = (jdata) => {
  try {
    const parsedJdata = jdata;
    const seiveData = parsedJdata.find(
      (item) => item.param_id === "20240725182402705"
    );

    const seiveTableData = seiveData?.formData?.commonTemplate || [];
    const seiveDescription = seiveData?.formData?.description || [];
    const nabl = seiveData?.formData?.nabl; // or fetch dynamically: testReq.coreDetails[0].nabl
    const numCores = 6; // or fetch dynamically: testReq.coreDetails[0].numCores
    const hideAvg = jdata[0].showAverage;
    console.log(seiveTableData,nabl,'seiveTableData876')

    if (!seiveTableData || seiveTableData.length === 0) {
      return null;
    }

    // Split data into multiple tables if NABL is true
    const tableCount = nabl ? Math.ceil(seiveTableData.length / 3) : 1;
    const tablesData = [];
  
    if(nabl){
    for (let t = 0; t < tableCount; t++) {
      const start = t * 3;
      const end = start + 3;
      tablesData.push(seiveTableData.slice(start, end));
    }
    }else{
      tablesData.push(seiveTableData);
    }



    const generateTableBody = (tableData,tableIndex) => {
      const tableDescription = seiveDescription[tableIndex] || "";
console.log(tableIndex,tableData,'tableDescription897')
      const avgCubeStrength = tableData.length
        ? (
            tableData.reduce(
              (sum, item) => sum + Number(item.cube_strength || 0),
              0
            ) / tableData.length
          ).toFixed(2)
        : "-";

      const tableHeader = [
        [
          {
            text: "Sl. No",
            style: "tableHeader",
            alignment: "center",
            fontSize: 7,
            noWrap: true,
          },
          {
            text: "Core / Structure\nIdentification*",
            style: "tableHeader",
            alignment: "center",
            fontSize: 7,
          },
          {
            text: "Core Weight\n(Kg)",
            style: "tableHeader",
            alignment: "center",
            fontSize: 7,
          },
          {
            text: "Core Length (l)\n(mm)",
            style: "tableHeader",
            alignment: "center",
            fontSize: 7,
          },
          {
            text: "Core Dia (d)\n(mm)",
            style: "tableHeader",
            alignment: "center",
            fontSize: 7,
          },
          {
            text: "Core Area\n(Sq.mm)",
            style: "tableHeader",
            alignment: "center",
            fontSize: 7,
          },
          {
            text: "Observed Load\n(kN)",
            style: "tableHeader",
            alignment: "center",
            fontSize: 7,
          },
          {
            text: "Core comp.\nStrength\n(N/sq.mm)#",
            style: "tableHeader",
            alignment: "center",
            fontSize: 7,
          },
          {
            text: "l/d Ratio",
            style: "tableHeader",
            alignment: "center",
            fontSize: 7,
          },
          {
            text: "Correction factor\nfor (l/d) ratio+",
            style: "tableHeader",
            alignment: "center",
            fontSize: 7,
          },
          {
            text: "Corrected Cyl.\nComp. Strength\n(N/sq.mm)",
            style: "tableHeader",
            alignment: "center",
            fontSize: 7,
          },
          {
            text: "Equivalent Cube\nComp. Strength ++\n(N/sq.mm) Individual",
            style: "tableHeader",
            alignment: "center",
            fontSize: 7,
          },
        ],
      ];

      const avgRow = [
        {
          text: "AVG:",
          colSpan: 11,
          alignment: "right",
          bold: true,
          fontSize: 8,
          margin: [0, 2, 4, 2],
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {
          text: avgCubeStrength,
          alignment: "center",
          bold: true,
          fontSize: 8,
          margin: [0, 2, 4, 2],
        },
      ];

      const tableBody = [
        ...tableHeader,
      
        ...(tableDescription
  ? [
      [
        {
          text: tableDescription,
          colSpan: 12,
          alignment: "left",
          bold: true,
          fontSize: 9,
          margin: [2, 4, 2, 4],
        },
        ...Array(11).fill({}),
      ],
    ]
  : []),

        ...tableData.map((item, index) => [
          { text: String(index + 1), alignment: "center", fontSize: 8 },
          {
            text: item.core_structure_id || "",
            alignment: "center",
            fontSize: 8,
          },
          {
            text: item.core_wt ? Number(item.core_wt).toFixed(3) : "-",
            alignment: "center",
            fontSize: 8,
          },
          { text: item.l || "-", alignment: "center", fontSize: 8 },
          { text: item.d || "-", alignment: "center", fontSize: 8 },
          {
            text: item.area ? Math.floor(item.area) : "-",
            alignment: "center",
            fontSize: 8,
          },
          {
            text: item.max ? Number(item.max).toFixed(1) : "-",
            alignment: "center",
            fontSize: 8,
          },
          {
            text: item.cs ? Number(item.cs).toFixed(2) : "-",
            alignment: "center",
            fontSize: 8,
          },
          {
            text: item.ld_ratio ? Number(item.ld_ratio).toFixed(2) : "-",
            alignment: "center",
            fontSize: 8,
          },
          {
            text: item.correction_factor
              ? Number(item.correction_factor).toFixed(3)
              : "-",
            alignment: "center",
            fontSize: 8,
          },
          {
            text: item.corrected_strength
              ? Number(item.corrected_strength).toFixed(2)
              : "-",
            alignment: "center",
            fontSize: 8,
          },
          {
            text: item.cube_strength
              ? Number(item.cube_strength).toFixed(2)
              : "-",
            alignment: "center",
            fontSize: 8,
          },
        ]),
        ...(hideAvg ? [avgRow] : []),
      ];

      return tableBody;
    };

        console.log(tablesData,'tablesData78')

    // Generate stack of tables
    const tableStack = tablesData.map((tableData,tableIndex) => ({
      table: {
        headerRows: 1,
        widths: [
          "5%",
          "15%",
          "9%",
          "9%",
          "9%",
          "9%",
          "9%",
          "9%",
          "6%",
          "10%",
          "10%",
          "10%",
        ],
        body: generateTableBody(tableData,tableIndex),
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#000",
        vLineColor: () => "#000",
      },
      margin: [0, 5, 30, 0],
      alignment: "left",
    }));

    // Add footnotes after tables
    tableStack.push({
      stack: [
        {
          text: "Core length / weight after trimming and capping:",
          bold: true,
          margin: [0, 10, 0, 2],
        },
        {
          text: "Core length may increase or decrease when compared to extracted core length after capping.",
        },
        {
          text: "+For l/d ratio, correction factors are as per Clause 8.4.2 of IS: 516(Part-4)",
        },
        {
          text: "++ Equivalent cube compressive strength = 1.25 x corrected cylinder compressive strength as per Clause 8.4.2 of IS: 516(Part-4)",
        },
        {
          text: "As per Clause 8.4.1 of IS: 516(Part-4) below mentioned correction factors are applied:",
        },
        {
          text: "a. For core diameter < 70mm - strength of core x 1.06",
          margin: [20, 0, 0, 0],
        },
        {
          text: "b. For core diameter between 70mm to 80mm - strength of core x 1.03",
          margin: [20, 0, 0, 0],
        },
        {
          text: "Acceptance Criteria as per IS: 456:",
          bold: true,
          margin: [0, 8, 0, 2],
        },
        {
          text: "Concrete cores tested shall be considered acceptable if the average equivalent cube strength of the cores is equal to at least 85 percent of the cube strength of the grade of concrete specified for the corresponding age and no individual core has a strength less than 75 percent.",
        },
      ],
      fontSize: 9,
    });

    return { stack: tableStack };
  } catch (err) {
    console.error(
      "Error generating core compressive strength table:",
      err.message
    );
    return null;
  }
};

module.exports = cCoreMech;
