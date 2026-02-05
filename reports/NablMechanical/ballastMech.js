const ballastMech = (jdata) => {
  try {
    const parsedJdata = jdata;

    const waterAbsData = parsedJdata.find(
      (item) => item.param_id === 'COARSE_AGGREGATE_WATER_ABSORPTION'
    );
    const impactValData = parsedJdata.find(
      (item) => item.param_id === 'COARSE_AGGREGATE_IMPACTVALUE_HARDNESS'
    );
    const abValData = parsedJdata.find(
      (item) => item.param_id === 'ABRASION_VALUE_TEST'
    );

    const seiveData = parsedJdata.find(
      (item) => item.param_id === "COARSE_AGGREGATE_SIEVE_ANALYSIS"
    );
    const seiveTableData = seiveData?.formData?.commonTemplate || [];

    // Even if no data, we'll still create the table with "-" values
    const fixedSieveOrder = ["65", "40", "20"];
    const specificationMap = {
      "65": "Max.5.0%",
      "40": "40%-60%",
      "20": "Not Less than 98%",
    };

    const tableRows = fixedSieveOrder.map((size, index) => {
      const rowData = seiveTableData.find((item) => item.d === size);
      const cwrValue = rowData?.r !== undefined && rowData?.r !== null ? rowData.r : "-";

      const row = [
        { text: `${size}.0 mm`, fontSize: 9, alignment: "center" },
        { text: cwrValue, fontSize: 9, alignment: "center" },
        {},
        { text: specificationMap[size], fontSize: 9, alignment: "center" },
      ];

      if (index === 0) {
        row[2] = {
          text: "IS: 2386 (Part-I)",
          fontSize: 9,
          alignment: "center",
          rowSpan: fixedSieveOrder.length,
          margin: [0, 12, 0, 0],
        };
      }

      return row;
    });

    const tableHeader1 = [
      [
        { text: "IS Sieve Designation(mm)", style: "tableHeader", alignment: "center" },
        { text: "Cumulative Retained Percent", style: "tableHeader", alignment: "center" },
        { text: "Test Method", style: "tableHeader", alignment: "center" },
        { text: "Specifications as per Track Ballast IRS: GE-1-2004", style: "tableHeader", alignment: "center" },
      ],
    ];

    // Second Table Header
    const tableHeader2 = [
      [
        { text: "Sl. No", style: "tableHeader", alignment: "center" },
        { text: "Test Parameters", style: "tableHeader", alignment: "center" },
        { text: "Test Method", style: "tableHeader", alignment: "center" },
        { text: "Results", style: "tableHeader", alignment: "center" },
        { text: "Specifications as per Track Ballast IRS: GE-1-2004", style: "tableHeader", alignment: "center" },
      ],
    ];

    // Construct extra test data table
    const extraTestData = [];
    let sl = 1;

    if (waterAbsData?.reportData?.length) {
      const rd = waterAbsData.reportData[0];
      extraTestData.push([
        { text: `${sl++}`, fontSize: 9, alignment: "center" },
        { text: "Water Absorption (%)", fontSize: 9 },
        { text: "IS: 2386 (Part-III)", fontSize: 9, alignment: "center" },
        { text: rd.value || "-", fontSize: 9, alignment: "center" },
        { text: "Max.1.0% (Clause No. 2.2.2)", fontSize: 9 },
      ]);
    }

    if (impactValData?.reportData?.length) {
      const rd = impactValData.reportData[0];
      extraTestData.push([
        { text: `${sl++}`, fontSize: 9, alignment: "center" },
        { text: "Aggregate Impact Value (%)", fontSize: 9 },
        { text: "IS: 2386 (Part-IV)", fontSize: 9, alignment: "center" },
        { text: rd.value || "-", fontSize: 9, alignment: "center" },
        { text: "Max.20.0% (Clause No. 2.2.1)", fontSize: 9 },
      ]);
    }

    if (abValData?.reportData?.length) {
      const rd = abValData.reportData[0];
      extraTestData.push([
        { text: `${sl++}`, fontSize: 9, alignment: "center" },
        { text: "Los Angeles Abrasion Test (%)", fontSize: 9 },
        { text: "IS: 2386 (Part-IV)", fontSize: 9, alignment: "center" },
        { text: rd.value || "-", fontSize: 9, alignment: "center" },
        { text: "Max.30.0% (Clause No. 2.2.1)", fontSize: 9 },
      ]);
    }

    // Main output
    const output = [
      {
        text: "SIEVE ANALYSIS:",
        fontSize: 10,
        margin: [0, 4, 0, 0],
      },
      {
        table: {
          headerRows: 1,
          widths: ["25%", "25%", "20%", "30%"],
          body: [...tableHeader1, ...tableRows],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        margin: [0, 5, 0, 10],
      },
    ];

    if (extraTestData.length > 0) {
      output.push({
        table: {
          headerRows: 1,
          widths: ["10%", "30%", "20%", "10%", "30%"],
          body: [...tableHeader2, ...extraTestData],
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
    }

    return output;
  } catch (err) {
    console.error("Error generating ballast PDF:", err.message);
    return null;
  }
};

module.exports = ballastMech;
