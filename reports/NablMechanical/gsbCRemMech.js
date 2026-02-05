const gsbRemMech = (jdata) => {
  console.log(jdata, 'parsedJdata21');
  try {
    const parsedJdata = typeof jdata === "string" ? JSON.parse(jdata) : jdata;

    const atterberg = parsedJdata.find(item => item.param_id === "SOIL_ATTERBURGH_LIMITS")?.reportData?.[0];
    const heavyCompaction = parsedJdata.find(item => item.param_id === "SOIL_STANDARD_MODIFIED_CONPACTION_TEST")?.reportData?.[0];
    const cbr = parsedJdata.find(item => item.param_id === "SOIL_BEARING_RATIO_TEST")?.reportData?.[0];
    const iv = parsedJdata.find(item => item.param_id === 'COARSE_AGGREGATE_IMPACTVALUE_HARDNESS')?.reportData?.[0];
    const flakiness = parsedJdata.find(item => item.param_id === 'COARSE_AGGREGATE_FLAKINESS')?.reportData?.[0];
    const elongation = parsedJdata.find(item => item.param_id === 'COARSE_AGGREGATE_FLAKINESS')?.reportData?.[1];
    const combined = parsedJdata.find(item => item.param_id === 'COARSE_AGGREGATE_FLAKINESS')?.reportData?.[2];
    const waterAbsorption = parsedJdata.find(item => item.param_id === "COARSE_AGGREGATE_WATER_ABSORPTION")?.reportData?.[0];
    const abrasionValue = parsedJdata.find(item => item.param_id === "ABRASION_VALUE_TEST")?.reportData?.[0];

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
        spec: ["Maximum 25(Table-400-2)", "---", "Maximum 6(Table-400-2)"]
      });
    }

    if (heavyCompaction) {
      testRows.push({
        title: "Heavy Compaction",
        method: "IS: 2720 (Part-8)",
        values: [
          ["MDD (g/cc)", heavyCompaction?.value1],
          ["OMC (%)", heavyCompaction?.value2]
        ],
        spec: ["---", "---"]
      });
    }

    if (cbr) {
      testRows.push({
        title: "Soaked CBR (%)",
        method: "IS: 2720 (Part-I6)",
        values: [["Soaked CBR", cbr?.value]],
        spec: ["Min. 30.0 (Table 400-2)"]
      });
    }

    if (iv) {
      testRows.push({
        title: "Aggregate Impact Value (%)",
        method: "IS: 2386 (Part-IV)",
        values: [["Impact Value", iv?.value]],
        spec: ["Maximum40 (Table-400-2)"]
      });
    }

    if (waterAbsorption) {
      testRows.push({
        title: "Water Absorption (%)",
        method:  "IS: 2386 (Part-III)",
        values: [["Absorption (%)", waterAbsorption?.value]],
        spec: [ "Max. 2.0 (Clause 401.2.2)"]
      });
    }

    if (abrasionValue) {
      testRows.push({
        title: "Los Angeles Abrasion Value (%)",
        method: abrasionValue?.testMethod ?? "-",
        values: [["Abrasion Value (%)", abrasionValue?.value]],
        spec: ["---"]
      });
    }

    if (combined) {
      testRows.push({
        title: "Flakiness & Elongation Index (%)",
        method: "IS:2386 (Part I)",
        values: [["Combined Flakiness & Elongation Index", combined?.value ?? "-"]],
        spec: ["Maximum 30% (MORTH(Rev-5))\nTable 400-12"]
      });
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
          text: "Requirements As per MORTH (Rev-5)",
          style: "tableHeader",
          alignment: "center",
        }
      ]
    ];

    testRows.forEach((row, idx) => {
      const getRowSpan = () => {
        if (row.title === "Atterberg Limits (%)") return 3;
        if (row.title === "Heavy Compaction") return 2;
        return 1;
      };

      const rowSpan = getRowSpan();

      row.values?.forEach((val, subIdx) => {
        if (!Array.isArray(val) || val.length < 2) return;

        const isFirstRow = subIdx === 0;
        const marginTop = (row.title === "Atterberg Limits (%)" || row.title === "Heavy Compaction") ? [0, 10, 0, 0] : undefined;

        tableBody.push([
          {
            text: isFirstRow ? `${idx + 1}` : "",
            fontSize: 9,
            alignment: "center",
            rowSpan: isFirstRow ? rowSpan : undefined,
            margin: isFirstRow ? marginTop : undefined
          },
          {
            text: isFirstRow ? row.title : "",
            fontSize: 9,
            rowSpan: isFirstRow ? rowSpan : undefined,
            margin: isFirstRow ? marginTop : undefined
          },
          {
            text: isFirstRow ? row.method : "",
            fontSize: 9,
            rowSpan: isFirstRow ? rowSpan : undefined,
            margin: isFirstRow ? marginTop : undefined
          },
          {
            text: `${val?.[0] ?? ""}`,
            fontSize: 9,
            alignment: "left"
          },
          {
            text: `${val?.[1] ?? "-"}`,
            fontSize: 9,
            alignment: "left"
          },
          {
            text: row.spec?.[subIdx] ?? "-",
            fontSize: 9
          }
        ]);
      });
    });

    return {
      table: {
        headerRows: 1,
        widths: ["5%", "23%", "15%", "20%", "7%", "32%"],
        body: tableBody
      },
      layout: {
        fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#000000",
        vLineColor: () => "#000000"
      },
      margin: [0, 5, 0, 0]
    };
  } catch (err) {
    console.error("Error generating soil mech table:", err.message);
    return null;
  }
};

module.exports = gsbRemMech;
