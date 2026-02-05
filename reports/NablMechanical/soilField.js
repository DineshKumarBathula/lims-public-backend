const soilField = (jdata) => {
  try {
    const parsedJdata = jdata;

    // Check if seiveData exists
    const seiveData = parsedJdata.find(
      (item) => item.param_id === "FIELD_DRY_DENSITY_CORE_CUTTER"
    );

    // Check if sandData exists
    const sandData = parsedJdata.find(
      (item) => item.param_id === "FIELD_DRY_DENSITY_SAND_REPLACEMENT"
    );

    // Pick correct data
    const seiveTableData = seiveData?.formData?.tests || [];
    const sandTableData = sandData?.formData?.tests || [];

    // Determine which dataset is active
    const isSeive = seiveTableData && seiveTableData.length > 0;
    const isSand = sandTableData && sandTableData.length > 0;

    if (!isSeive && !isSand) {
      return null; // nothing to display
    }

    // Fetch MDD and OMC from header (depending on which dataset exists)
    const mdd =
      seiveData?.formData?.header?.mdd ??
      sandData?.formData?.header?.mdd ??
      "-";
    const omc =
      seiveData?.formData?.header?.omc ??
      sandData?.formData?.header?.omc ??
      "-";

    // Table header rows
    const tableHeader0 = [
      [
        {
          text: isSeive
            ? "Field Dry Density by Core Cutter Method"
            : "Field Dry Density by Sand Replacement Method",
          colSpan: 6,
          style: "tableHeader",
          alignment: "center",
          fontSize: 11,
          bold: true,
        },
        {},
        {},
        {},
        {},
        {},
      ],
      [
        {
          text: `MDD* (g/cc)=${mdd}`,
          colSpan: 3,
          style: "tableHeader",
          alignment: "center",
          fontSize: 9,
        },
        {},
        {},
        {
          text: `OMC* (%)=${omc}`,
          colSpan: 3,
          style: "tableHeader",
          alignment: "center",
          fontSize: 9,
        },
        {},
        {},
      ],
      [
        {
          text: "Pit. No",
          style: "tableHeader",
          alignment: "center",
          margin: [0, 10, 0, 0],
        },
        {
          text: "Location/Offset*",
          style: "tableHeader",
          alignment: "center",
          margin: [0, 10, 0, 0],
        },
        {
          text: "Field wet Density (g/cc)",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Moisture content (%)",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Field Dry Density (g/cc)",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Degree of Compaction (%)",
          style: "tableHeader",
          alignment: "center",
        },
      ],
    ];

    // Build table body depending on dataset

    const content = [];
    const getColumnHeaderRow = () => [
      {
        text: "Pit. No",
        style: "tableHeader",
        alignment: "center",
        margin: [0, 10, 0, 0],
      },
      {
        text: "Location/Offset*",
        style: "tableHeader",
        alignment: "center",
        margin: [0, 10, 0, 0],
      },
      {
        text: "Field wet Density (g/cc)",
        style: "tableHeader",
        alignment: "center",
      },
      {
        text: "Moisture content (%)",
        style: "tableHeader",
        alignment: "center",
      },
      {
        text: "Field Dry Density (g/cc)",
        style: "tableHeader",
        alignment: "center",
      },
      {
        text: "Degree of Compaction (%)",
        style: "tableHeader",
        alignment: "center",
      },
    ];

    if (isSeive) {
      const coreTableBody = seiveTableData.map((row, index) => [
        { text: String(index + 1), alignment: "center", fontSize: 9 },
        { text: row.location ?? "-", alignment: "left", fontSize: 9 },
        {
          text: row.bulkDensity?.toFixed(3) ?? "-",
          alignment: "center",
          fontSize: 9,
        },
        { text: row.mc?.toFixed(1) ?? "-", alignment: "center", fontSize: 9 },
        {
          text: row.dryDensity?.toFixed(3) ?? "-",
          alignment: "center",
          fontSize: 9,
        },
        {
          text: row.degreeCompaction?.toFixed(1) ?? "-",
          alignment: "center",
          fontSize: 9,
        },
      ]);

      content.push({
        table: {
          headerRows: 3,
          widths: ["10%", "30%", "15%", "15%", "15%", "15%"],
          body: [
            // 🔹 Core Cutter Header
            [
              {
                text: "Field Dry Density by Core Cutter Method",
                colSpan: 6,
                style: "tableHeader",
                alignment: "center",
                fontSize: 11,
                bold: true,
              },
              {},
              {},
              {},
              {},
              {},
            ],
            [
              {
                text: `MDD* (g/cc)=${seiveData?.formData?.header?.mdd ?? "-"}`,
                colSpan: 3,
                style: "tableHeader",
                alignment: "center",
                fontSize: 9,
              },
              {},
              {},
              {
                text: `OMC* (%)=${seiveData?.formData?.header?.omc ?? "-"}`,
                colSpan: 3,
                style: "tableHeader",
                alignment: "center",
                fontSize: 9,
              },
              {},
              {},
            ],
            getColumnHeaderRow(),

            ...coreTableBody,
          ],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex < 3 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        margin: [0, 5, 0, 0],
      });
    }

    if (isSand) {
      const sandTableBody = sandTableData.map((row, index) => [
        { text: String(index + 1), alignment: "center", fontSize: 9 },
        { text: row.location ?? "-", alignment: "left", fontSize: 9 },
        {
          text: row.wetDensity?.toFixed(3) ?? "-",
          alignment: "center",
          fontSize: 9,
        },
        { text: row.mc?.toFixed(1) ?? "-", alignment: "center", fontSize: 9 },
        {
          text: row.dryDensity?.toFixed(3) ?? "-",
          alignment: "center",
          fontSize: 9,
        },
        {
          text: row.degreeCompaction?.toFixed(1) ?? "-",
          alignment: "center",
          fontSize: 9,
        },
      ]);

      content.push({
        table: {
          headerRows: 3,
          widths: ["10%", "30%", "15%", "15%", "15%", "15%"],
          body: [
            // 🔹 Sand Replacement Header
            [
              {
                text: "Field Dry Density by Sand Replacement Method",
                colSpan: 6,
                style: "tableHeader",
                alignment: "center",
                fontSize: 11,
                bold: true,
              },
              {},
              {},
              {},
              {},
              {},
            ],
            [
              {
                text: `MDD* (g/cc)=${sandData?.formData?.header?.mdd ?? "-"}`,
                colSpan: 3,
                style: "tableHeader",
                alignment: "center",
                fontSize: 9,
              },
              {},
              {},
              {
                text: `OMC* (%)=${sandData?.formData?.header?.omc ?? "-"}`,
                colSpan: 3,
                style: "tableHeader",
                alignment: "center",
                fontSize: 9,
              },
              {},
              {},
            ],
            getColumnHeaderRow(),

            ...sandTableBody,
          ],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex < 3 ? "#CCCCCC" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        margin: [0, 5, 0, 0],
      });
    }
    return content.length ? content : null;

    // return {
    //   table: {
    //     headerRows: 3,
    //     widths: ["10%", "30%", "15%", "15%", "15%", "15%"],
    //     body: [...tableHeader0, ...tableBody],
    //   },
    //   layout: {
    //     fillColor: (rowIndex) => (rowIndex < 3 ? "#CCCCCC" : null),
    //     hLineWidth: () => 0.5,
    //     vLineWidth: () => 0.5,
    //     hLineColor: () => "#000000",
    //     vLineColor: () => "#000000",
    //   },
    //   margin: [0, 5, 0, 0],
    // };
  } catch (err) {
    console.error("Error generating FDD table PDF:", err.message);
    return null;
  }
};

module.exports = soilField;
