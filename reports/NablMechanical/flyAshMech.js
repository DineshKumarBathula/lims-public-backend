const FLY_COMPRESSIVE_STRENGTH = "FLY_COMPRESSIVE_STRENGTH";

const flyAshMech = (parsedJdata) => {
  const getRow = (
    slNo,
    testName,
    result,
    specPart1 = "",
    specPart2 = "",
    testMethod
  ) => {
    return [
      [
        { text: slNo, fontSize: 9, alignment: "center" },
        { text: testName, fontSize: 9 },
        { text: testMethod, fontSize: 9 },
        { text: result, fontSize: 9, alignment: "center" },
        { text: specPart1, fontSize: 9, alignment: "center" },
        { text: specPart2, fontSize: 9, alignment: "center" },
      ],
    ];
  };

  const getFlyashCompressiveStrength = (reportData, slNo) => {
    const testMethod = reportData[0]?.testMethod || "IS 1727, Clause 10";

    return [
      // ROW 1 – Test Sample
      [
        {
          text: slNo,
          rowSpan: 3,
          fontSize: 9,
          alignment: "center",
        },
        {
          text: "Test Sample Compressive Strength (N/mm²) ",
          fontSize: 9,
          alignment: "left",
        },
        {
          text: testMethod,
          rowSpan: 3,
          fontSize: 9,
          alignment: "center",
        },
        {
          text: reportData[0]?.value ?? "",
          fontSize: 9,
          alignment: "center",
        },
        {
          text: "Not less than 80% of the strength of corresponding plain cement mortar cubes",
          rowSpan: 3,
          fontSize: 9,
          alignment: "center",
        },
        {
          text: "-",
          rowSpan: 3,
          fontSize: 9,
          alignment: "center",
        },
      ],

      // ROW 2 – Plain Cement
      [
        "",
        {
          text: " Plain Cement Compressive Strength (N/mm²)",
          fontSize: 9,
        },
        "",
        {
          text: reportData[1]?.value ?? "",
          fontSize: 9,
          alignment: "center",
        },
        "",
        "",
      ],

      // ROW 3 – Comparative Strength %
      [
        "",
        {
          text: "Comparative Compressive Strength (%)",
          fontSize: 9,
        },
        "",
        {
          text: reportData[2]?.value ?? "",
          fontSize: 9,
          alignment: "center",
        },
        "",
        "",
      ],
    ];
  };

  const tableBody = [
    // 🔹 HEADER ROW 1 (PARENT)
    [
      {
        text: "Sl. No.",
        style: "tableHeader",
        alignment: "center",
        rowSpan: 2,
      },
      {
        text: "Test Parameter",
        style: "tableHeader",
        alignment: "center",
        rowSpan: 2,
      },
      {
        text: "Test Method",
        style: "tableHeader",
        alignment: "center",
        rowSpan: 2,
      },
      {
        text: "Result",
        style: "tableHeader",
        alignment: "center",
        rowSpan: 2,
      },
      {
        text: "Specifications IS:3812:2013 (Reaffirmed-2022)",
        style: "tableHeader",
        alignment: "center",
        colSpan: 2,
      },
      {}, // 🔴 REQUIRED placeholder
    ],

    // 🔹 HEADER ROW 2 (CHILD)
    [
      {},
      {},
      {},
      {},
      { text: "Part-1", style: "tableHeader", alignment: "center" },
      { text: "Part-2", style: "tableHeader", alignment: "center" },
    ],
  ];

  const testOrder = [
    "FLYASH_SPECIFIC_GRAVITY",
    "FLYASH_FINENESS",
    "FLYASH_LIME_REACTIVITY_MECH",
    "FLY_COMPRESSIVE_STRENGTH",
    "FLYASH_RESIDUE",
    "CEMENT_SOUND_NESS",
  ];

  const testMap = {};
  parsedJdata.forEach((item) => {
    testMap[item.param_id] = item;
  });
  const formatSoundness = (val) => {
    if (val === null || val === undefined) return "";

    // Extract numeric value from string like "0.002 mm"
    const num = parseFloat(val);

    return isNaN(num) ? val : num.toFixed(3);
  };

  let slNo = 1;
  testOrder.forEach((paramId) => {
    const data = testMap[paramId];
    if (!data) return;

    const { formData, reportData } = data;
    console.log(reportData, "reportDatareportData");

    switch (paramId) {
      case "FLYASH_SPECIFIC_GRAVITY":
        tableBody.push(
          ...getRow(
            slNo++,
            reportData[0].key,
            reportData[0].value,
            "-", // Part-1
            "-", // Part-2
            reportData[0].testMethod
          )
        );
        break;

      case "CEMENT_SOUND_NESS":
        const isAutoclave =
          typeof reportData?.[0]?.key === "string" &&
          reportData[0].key.toUpperCase().includes("AUTOCLAVE");

        tableBody.push(
          ...getRow(
            slNo++,
            reportData[0].key,
            formatSoundness(reportData[0].value),
            isAutoclave ? "Maximum 0.8%" : "Maximum 10mm",
            isAutoclave ? "Maximum 0.8%" : "Maximum 10mm",
            "IS 1727, Clause 7.2"
          )
        );
        break;

      case "FLYASH_FINENESS":
        tableBody.push(
          ...getRow(
            slNo++,
            reportData[0].key,
            reportData[0].value,
            "Min 320",
            "Min 200",
            reportData[0].testMethod
          )
        );
        break;

      case "FLYASH_LIME_REACTIVITY_MECH":
        tableBody.push(
          ...getRow(
            slNo++,
            reportData[0].key,
            reportData[0].value,
            "Min 4.5",
            "-",
            reportData[0].testMethod
          )
        );
        break;

      case FLY_COMPRESSIVE_STRENGTH:
        tableBody.push(...getFlyashCompressiveStrength(reportData, slNo++));
        break;

      case "FLYASH_RESIDUE":
        tableBody.push(
          ...getRow(
            slNo++,
            reportData[0].key,
            reportData[0].value,
            "Maximum 34", // Part-1
            "Maximum 50", // Part-2
            "IS 1727, Clause 6.2"
          )
        );
        break;
    }
  });

  return {
    table: {
      headerRows: 2,
      widths: [30, 180, 80, "auto", "*", "*"],

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

module.exports = flyAshMech;
