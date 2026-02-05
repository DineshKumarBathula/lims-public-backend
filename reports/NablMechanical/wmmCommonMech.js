const wmmCommonMech = (jdata) => {
  try {
    const parsedJdata = typeof jdata === "string" ? JSON.parse(jdata) : jdata;

    const getReportData = (paramId) => {
      return (
        parsedJdata.find((item) => item.param_id === paramId)?.reportData || []
      );
    };

    console.log(getReportData, "getReportData453");

    const atterberg = getReportData("SOIL_ATTERBURGH_LIMITS")[0];
    const heavyCompaction = getReportData(
      "SOIL_STANDARD_MODIFIED_CONPACTION_TEST"
    )[0];
    const cbr = getReportData("SOIL_BEARING_RATIO_TEST")[0];
    const impactValue = getReportData(
      "COARSE_AGGREGATE_IMPACTVALUE_HARDNESS"
    )[0];
    const flakinessData = getReportData("COARSE_AGGREGATE_FLAKINESS");
    // const waterAbsorption = getReportData(
    //   "COARSE_AGGREGATE_WATER_ABSORPTION"
    // )[0];
    const waterAbsorption = getReportData("WMM_WATER_ABSORPTION")[0];

    const abrasionValue = getReportData("ABRASION_VALUE_TEST")[0];

    const flakiness = flakinessData[0];
    const elongation = flakinessData[1];
    const combined = flakinessData[2];

    console.log(combined, impactValue, "abrasionValue23");

    const testRows = [];

    if (atterberg) {
      testRows.push({
        title: "Atterberg Limits (%)",
        method: "IS: 2720 (Part-5)",
        values: [
          ["Liquid Limit", atterberg?.value1],
          ["Plastic Limit", atterberg?.value2],
          ["Plasticity Index", atterberg?.value3],
        ],
        spec: ["---", "---", "Maximum 6% (MORTH(Rev-5))\nClause No.406.2.1.2"],
      });
    }

    if (heavyCompaction) {
      testRows.push({
        title: "Heavy Compaction",
        method: "IS: 2720 (Part-8)",
        values: [
          ["MDD (g/cc)", heavyCompaction?.value1],
          ["OMC (%)", heavyCompaction?.value2],
        ],
        spec: ["---", "---"],
      });
    }

    if (cbr) {
      testRows.push({
        title: "Soaked CBR (%)",
        method: "IS: 2720 (Part-16)",
        values: [["Soaked CBR", cbr?.value]],
        spec: ["---"],
      });
    }

    if (impactValue) {
      testRows.push({
        title: "Aggregate Impact Value (%)",
        method: impactValue?.testMethod ?? "-",
        values: [["Impact Value", impactValue?.value]],
        spec:
          impactValue?.specification ??
          "Maximum 30% (MORTH(Rev-5))\nTable 400-12",
      });
    }

    if (waterAbsorption) {
      testRows.push({
        title: "Water Absorption (%)",
        method: "IS: 2720 (Part-III)",
        values: [["Absorption (%)", waterAbsorption?.value]],
        spec: ["2.0% (MORTH (Rev-5) Clause No.406.2.1.1"],
      });
    }

    if (abrasionValue) {
      testRows.push({
        title: "Los Angeles Abrasion Value (%)",
        method: "IS: 2386 (Part-IV)",
        values: [["Abrasion Value (%)", abrasionValue?.value]],
        spec: "Maximum 40% (MORTH (Rev-5) Table-12",
      });
    }

    if (combined) {
      testRows.push({
        title: "Flakiness & Elongation Index (%)",
        method: "IS: 2720 (Part-I)",
        values: [
          ["Combined Flakiness & Elongation Index", combined?.value ?? "-"],
        ],
        spec:
          combined?.specification ?? "Maximum 30% (MORTH(Rev-5))\nTable 400-12",
      });
    }

    // Decide header text dynamically
    let specificationHeader = "Specifications";
    if (
      impactValue?.specChoice === "IRC" ||
      combined?.specChoice === "IRC" ||
      abrasionValue?.specChoice === "IRC"
    ) {
      specificationHeader = "Specifications  As per IRC 109-2015 Table-1";
    }

    const tableBody = [
      [
        { text: "Sl. No", style: "tableHeader", alignment: "center" },
        { text: "Test Parameter", style: "tableHeader", alignment: "center" },
        { text: "Test Method", style: "tableHeader", alignment: "center" },
        {
          text: "Result",
          style: "tableHeader",
          alignment: "center",
          colSpan: 2,
        },
        {},
        {
          text: specificationHeader,
          style: "tableHeader",
          alignment: "center",
        },
      ],
    ];

    testRows.forEach((row, idx) => {
      const getRowSpan = () => {
        if (row.values?.length > 1) return row.values.length;
        return 1;
      };

      const rowSpan = getRowSpan();

      row.values?.forEach((val, subIdx) => {
        const isFirstRow = subIdx === 0;
        const spec = Array.isArray(row.spec) ? row.spec[subIdx] : row.spec;

        tableBody.push([
          {
            text: isFirstRow ? `${idx + 1}` : "",
            fontSize: 9,
            alignment: "center",
            rowSpan: isFirstRow ? rowSpan : undefined,
            margin: isFirstRow && rowSpan > 1 ? [0, 10, 0, 0] : undefined,
          },
          {
            text: isFirstRow ? row.title : "",
            fontSize: 9,
            rowSpan: isFirstRow ? rowSpan : undefined,
            margin: isFirstRow && rowSpan > 1 ? [0, 10, 0, 0] : undefined,
          },
          {
            text: isFirstRow ? row.method : "",
            fontSize: 9,
            rowSpan: isFirstRow ? rowSpan : undefined,
            margin: isFirstRow && rowSpan > 1 ? [0, 10, 0, 0] : undefined,
          },
          {
            text: `${val?.[0] ?? ""}`,
            fontSize: 9,
            alignment: "left",
          },
          {
            text: `${val?.[1] ?? "-"}`,
            fontSize: 9,
            alignment: "left",
          },
          {
            text: spec ?? "-",
            fontSize: 9,
          },
        ]);
      });
    });

    return {
      table: {
        headerRows: 1,
        widths: ["5%", "23%", "15%", "20%", "7%", "32%"],
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
  } catch (err) {
    console.error("Error generating soil mech table:", err.message);
    return null;
  }
};

module.exports = wmmCommonMech;
