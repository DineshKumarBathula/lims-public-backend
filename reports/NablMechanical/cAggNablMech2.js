// const cAggNablMech2 = (jdata, delteriousCondition = "") => {
//   try {
//     const parsedJdata = JSON.parse(jdata);
//     // console.log(parsedJdata, "trigerred");

//     const spgData = parsedJdata.find(
//       (item) => item.param_id === "COARSE_AGGREGATE_SPECIFIC_GRAVITY"
//     );
//     const bdData = parsedJdata.find(
//       (item) => item.param_id === "CAGG_BULKDENSITY"
//     );
//     const flakData = parsedJdata.find(
//       (item) => item.param_id === "COARSE_AGGREGATE_FLAKINESS"
//     );
//     const cvData = parsedJdata.find(
//       (item) => item.param_id === "COARSE_AGGREGATE_CRUSHING_VALUE"
//     );
//     const avData = parsedJdata.find(
//       (item) => item.param_id === "ABRASION_VALUE_TEST"
//     );
//     const ivData = parsedJdata.find(
//       (item) => item.param_id === "COARSE_AGGREGATE_IMPACTVALUE_HARDNESS"
//     );
//     const tenFinesData = parsedJdata.find(
//       (item) => item.param_id === "10_PERCENT_FINES_VALUE"
//     );
//     const soundnessData = parsedJdata.find(
//       (item) => item.param_id === "COARSE_AGGREGATE_SOUNDNESS_SODIUM"
//     );
//     const finer75Data = parsedJdata.find(
//       (item) => item.param_id === "COARSE_AGGREGATE_DELETORIOUS_MATERIAL"
//     );
//     const mechNonNablCombo = parsedJdata.find(
//       (item) => item.param_id === "MECH_NON_NABL_COMBO"
//     );
//     const resistivity = parsedJdata.find(
//       (item) => item.param_id === "ELECTRICAL_RESISTIVITY"
//     );

//     console.log(soundnessData, "soundnessData78");

//     let updatedData = [
//       ...(Array.isArray(spgData?.reportData) ? spgData.reportData : []),
//       ...(Array.isArray(bdData?.reportData) ? bdData.reportData : []),
//       ...(Array.isArray(flakData?.reportData) ? flakData.reportData : []),
//       ...(Array.isArray(soundnessData?.reportData)
//         ? soundnessData.reportData
//         : []),
//       ...(Array.isArray(cvData?.reportData) ? cvData.reportData : []),
//       ...(Array.isArray(avData?.reportData) ? avData.reportData : []),
//       ...(Array.isArray(ivData?.reportData) ? ivData.reportData : []),
//       ...(Array.isArray(tenFinesData?.reportData)
//         ? tenFinesData.reportData
//         : []),
//       ...(Array.isArray(finer75Data?.reportData) ? finer75Data.reportData : []),
//       ...(Array.isArray(mechNonNablCombo?.reportData)
//         ? mechNonNablCombo.reportData
//         : []),
//     ];

//     if (
//       delteriousCondition === "M-Sand" ||
//       delteriousCondition === "Crushed Stone Sand"
//     ) {
//       updatedData = updatedData.filter(
//         (item) => item.key !== "Materials finer than 75 microns (%)"
//       );
//     }

//     const getRow = (reportData, index) => {
//       const { key, value, specification, testMethod } = reportData;
//       return [
//         [
//           { text: index + 1 ?? "-", fontSize: 9, alignment: "center" },
//           {
//             text: key ?? "-",
//             fontSize: 9,
//             alignment: "left",
//           },
//           {
//             text: testMethod ?? "-",
//             fontSize: 9,
//             alignment: "left",
//           },
//           {
//             text: value ?? "-",
//             fontSize: 9,
//             alignment: "center",
//           },
//           {
//             text: specification ?? "-",
//             fontSize: 9,
//             alignment: "left",
//           },
//         ],
//       ];
//     };

//     // Mechanical Table
//     const mechanicalTable = {
//       table: {
//         headerRows: 1,
//         widths: ["5%", "33%", "15%", "7%", "40%"],
//         body: [
//           [
//             { text: "S.No", style: "tableHeader", alignment: "center" },
//             {
//               text: "Test Parameter",
//               style: "tableHeader",
//               alignment: "center",
//             },
//             { text: "Test Method", style: "tableHeader", alignment: "center" },
//             { text: "Result", style: "tableHeader", alignment: "center" },
//             {
//               text: "Specifications IS:383-2016",
//               style: "tableHeader",
//               alignment: "center",
//             },
//           ],
//           ...updatedData.flatMap((reportData, index) =>
//             getRow(reportData, index)
//           ),
//         ],
//       },
//       layout: {
//         fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
//         hLineWidth: () => 0.5,
//         vLineWidth: () => 0.5,
//         hLineColor: () => "#000000",
//         vLineColor: () => "#000000",
//       },
//     };

//     // Resistivity Table (if present)
//     let resistivityTable = null;
//     if (
//       resistivity &&
//       Array.isArray(resistivity.reportData) &&
//       resistivity.reportData.length > 0
//     ) {
//       const resistivityRow = resistivity.reportData.map((item, idx) => [
//         {
//           text: idx + 1,
//           fontSize: 9,
//           alignment: "center",
//         },
//         {
//           text: `${item.key}\n(Tested in SSD Condition)` ?? "-",
//           fontSize: 9,
//           alignment: "left",
//         },
//         {
//           text: item.value ?? "-",
//           fontSize: 9,
//           alignment: "center",
//         },
//       ]);

//       resistivityTable = {
//         table: {
//           headerRows: 1,
//           widths: ["10%", "60%", "30%"],
//           body: [
//             [
//               { text: "SI. No", style: "tableHeader", alignment: "center" },
//               {
//                 text: "Description of Sample",
//                 style: "tableHeader",
//                 alignment: "center",
//               },
//               {
//                 text: "Results\nElectrical Resistivity (Ω-m)",
//                 style: "tableHeader",
//                 alignment: "center",
//               },
//             ],
//             ...resistivityRow,
//           ],
//         },
//         layout: {
//           fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
//           hLineWidth: () => 0.5,
//           vLineWidth: () => 0.5,
//           hLineColor: () => "#000000",
//           vLineColor: () => "#000000",
//         },
//       };
//     }

//     // Return array of tables (so pdfmake can consume it properly)
//     return resistivityTable ? [resistivityTable] : mechanicalTable;
//   } catch (err) {
//     console.error("Error generating tables:", err.message);
//     return null;
//   }
// };

// module.exports = cAggNablMech2;


const cAggNablMech2 = (jdata, delteriousCondition = "") => {
  try {
    const parsedJdata = JSON.parse(jdata);

    const spgData = parsedJdata.find(
      (item) => item.param_id === "COARSE_AGGREGATE_SPECIFIC_GRAVITY"
    );
    const bdData = parsedJdata.find(
      (item) => item.param_id === "CAGG_BULKDENSITY"
    );
    const flakData = parsedJdata.find(
      (item) => item.param_id === "COARSE_AGGREGATE_FLAKINESS"
    );
    const cvData = parsedJdata.find(
      (item) => item.param_id === "COARSE_AGGREGATE_CRUSHING_VALUE"
    );
    const avData = parsedJdata.find(
      (item) => item.param_id === "ABRASION_VALUE_TEST"
    );
    const ivData = parsedJdata.find(
      (item) => item.param_id === "COARSE_AGGREGATE_IMPACTVALUE_HARDNESS"
    );
    const tenFinesData = parsedJdata.find(
      (item) => item.param_id === "10_PERCENT_FINES_VALUE"
    );
    const soundnessData = parsedJdata.find(
      (item) => item.param_id === "COARSE_AGGREGATE_SOUNDNESS_SODIUM"
    );
    const finer75Data = parsedJdata.find(
      (item) => item.param_id === "COARSE_AGGREGATE_DELETORIOUS_MATERIAL"
    );
    const mechNonNablCombo = parsedJdata.find(
      (item) => item.param_id === "MECH_NON_NABL_COMBO"
    );
    const resistivity = parsedJdata.find(
      (item) => item.param_id === "ELECTRICAL_RESISTIVITY"
    );

    // 🧩 Prepare all other test rows except Soundness
    let updatedData = [
      ...(Array.isArray(spgData?.reportData) ? spgData.reportData : []),
      ...(Array.isArray(bdData?.reportData) ? bdData.reportData : []),
      ...(Array.isArray(flakData?.reportData) ? flakData.reportData : []),
      ...(Array.isArray(cvData?.reportData) ? cvData.reportData : []),
      ...(Array.isArray(avData?.reportData) ? avData.reportData : []),
      ...(Array.isArray(ivData?.reportData) ? ivData.reportData : []),
      ...(Array.isArray(tenFinesData?.reportData)
        ? tenFinesData.reportData
        : []),
      ...(Array.isArray(finer75Data?.reportData)
        ? finer75Data.reportData
        : []),
      ...(Array.isArray(mechNonNablCombo?.reportData)
        ? mechNonNablCombo.reportData
        : []),
    ];

    // Filter M-Sand unnecessary field
    if (
      delteriousCondition === "M-Sand" ||
      delteriousCondition === "Crushed Stone Sand"
    ) {
      updatedData = updatedData.filter(
        (item) => item.key !== "Materials finer than 75 microns (%)"
      );
    }

    // 🧱 Function for normal mechanical rows
    const getRow = (reportData, index) => {
      const { key, value, specification, testMethod } = reportData;
      return [
        [
          { text: index + 1 ?? "-", fontSize: 9, alignment: "center" },
          { text: key ?? "-", fontSize: 9, alignment: "left" },
          { text: testMethod ?? "-", fontSize: 9, alignment: "left" },
          { text: value ?? "-", fontSize: 9, alignment: "center" },
          { text: specification ?? "-", fontSize: 9, alignment: "left" },
        ],
      ];
    };

    // 🧩 Function to handle Soundness (custom layout)
   const getSoundnessRow = (soundnessData, index) => {
  const sodium = soundnessData?.reportData?.find((r) =>
    r.key.includes("Sodium Sulphate")
  );
  const magnesium = soundnessData?.reportData?.find((r) =>
    r.key.includes("Magnesium Sulphate")
  );

  return [
    [
      {
        text: index + 1 ?? "-",
        fontSize: 9,
        alignment: "center",
        rowSpan: 2, // serial number merged for both
        margin: [0, 12, 0, 0],
      },
      {
        text: "Sodium Sulphate(Na2SO4)",
        fontSize: 9,
        alignment: "left",
      },
      {
        text: sodium?.testMethod ?? "IS:2386 (Part-V)",
        fontSize: 9,
        alignment: "center",
        rowSpan: 2, // test method merged for both
        margin: [0, 12, 0, 0],
      },
      {
        text: sodium?.value ?? "-",
        fontSize: 9,
        alignment: "center",
      },
      {
        text: sodium?.specification ?? "Max 12%",
        fontSize: 9,
        alignment: "left",
      },
    ],
    [
      {},
      {
        text: "Magnesium Sulphate(MgSO4)",
        fontSize: 9,
        alignment: "left",
      },
      {},
      {
        text: magnesium?.value ?? "-",
        fontSize: 9,
        alignment: "center",
      },
      {
        text: magnesium?.specification ?? "Max 18%",
        fontSize: 9,
        alignment: "left",
      },
    ],
  ];
};


    // 🧾 Build Mechanical Table
    const mechanicalTable = {
      table: {
        headerRows: 1,
        widths: ["5%", "30%", "15%", "10%", "40%"],
        body: [
          [
            { text: "S.No", style: "tableHeader", alignment: "center" },
            { text: "Test Parameter", style: "tableHeader", alignment: "center" },
            { text: "Test Method", style: "tableHeader", alignment: "center" },
            { text: "Result", style: "tableHeader", alignment: "center" },
            {
              text: "Specifications IS:383-2016",
              style: "tableHeader",
              alignment: "center",
            },
          ],
          ...updatedData.flatMap((reportData, index) =>
            getRow(reportData, index)
          ),
          ...(soundnessData ? getSoundnessRow(soundnessData, updatedData.length ) : []),
        ],
      },
      layout: {
        fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#000000",
        vLineColor: () => "#000000",
      },
    };

    // ⚡ Resistivity Table (optional)
    let resistivityTable = null;
    if (
      resistivity &&
      Array.isArray(resistivity.reportData) &&
      resistivity.reportData.length > 0
    ) {
      const resistivityRow = resistivity.reportData.map((item, idx) => [
        { text: idx + 1, fontSize: 9, alignment: "center" },
        {
          text: `${item.key}\n(Tested in SSD Condition)` ?? "-",
          fontSize: 9,
          alignment: "left",
        },
        { text: item.value ?? "-", fontSize: 9, alignment: "center" },
      ]);

      resistivityTable = {
        table: {
          headerRows: 1,
          widths: ["10%", "60%", "30%"],
          body: [
            [
              { text: "SI. No", style: "tableHeader", alignment: "center" },
              {
                text: "Description of Sample",
                style: "tableHeader",
                alignment: "center",
              },
              {
                text: "Results\nElectrical Resistivity (Ω-m)",
                style: "tableHeader",
                alignment: "center",
              },
            ],
            ...resistivityRow,
          ],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
      };
    }

    return resistivityTable ? [resistivityTable] : mechanicalTable;
  } catch (err) {
    console.error("Error generating tables:", err.message);
    return null;
  }
};

module.exports = cAggNablMech2;
