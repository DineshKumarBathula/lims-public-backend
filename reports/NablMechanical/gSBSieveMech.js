const soilField = require("./soilField");
const gSbMech = (jdata) => {
  try {
    const parsedJdata = jdata;
    const seiveData = parsedJdata.find(
      (item) => item.param_id === "COARSE_AGGREGATE_SIEVE_ANALYSIS"
    );

        const grading = seiveData?.reportData?.find(
      (item) => item.key === "Grading"
    );

    const gradingValue =
  grading?.value === undefined || grading?.value === null || grading?.value === ""
    ? "Grading I"
    : grading.value;


    const PROPORTION_LABELS = {
      css: "Crushed Stone Sand",
      rs: "River Sand",
      dust: "Dust",
    };

    const proportionsEntry = seiveData?.reportData?.find(
      (item) => item.key === "Proportions"
    );


    const proportions = proportionsEntry?.value || {};
    const proportionKeys = Object.keys(proportions);

    // Build table only if proportions exist
    const proportionsTable =
      proportionKeys.length > 0
        ? (() => {
            // Header row
            const headerRow = [
              { text: "S. No", style: "tableHeader", alignment: "center" },
              ...proportionKeys.map((key) => ({
                text: PROPORTION_LABELS[key] || key.toUpperCase(),
                style: "tableHeader",
                alignment: "center",
              })),
            ];

            // Value row
            const valueRow = [
              { text: "1.", alignment: "center", fontSize: 9 },
              ...proportionKeys.map((key) => ({
                text: `${proportions[key]}%`,
                alignment: "center",
                fontSize: 9,
              })),
            ];

            return {
              table: {
                headerRows: 1,
                widths: ["10%", ...proportionKeys.map(() => "*")],
                body: [
                  [
                    {
                      text: `Aggregate Mix Proportion GSB ${gradingValue} As per Table 400-1 of MORTH Rev-5`,
                      colSpan: headerRow.length,
                      alignment: "center",
                      style: "tableHeader",
                    },
                    ...Array(headerRow.length - 1).fill({}),
                  ],
                  headerRow,
                  valueRow,
                ],
              },
              layout: {
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => "#000000",
                vLineColor: () => "#000000",
              },
              margin: [0, 0, 0, 0],
            };
          })()
        : null;

    const seiveTableData = seiveData?.formData?.commonTemplate || [];
    const sieveGrading = seiveData?.formData?.grading || "Grading III";

    // For Grading-III table in image
    const gradingSpecs = {
      "Grading I": {
        sizes: ["75", "53", "26.5", "9.5", "4.75", "2.36", "0.425", "0.075"],
        limits: [
          "100",
          "80-100",
          "55-90",
          "35-65",
          "25-55",
          "20-40",
          "10-15",
          "<5",
        ],
      },
      "Grading II": {
        sizes: ["53", "26.5", "9.5", "4.75", "2.36", "0.425", "0.075"],
        limits: ["100", "70-100", "50-80", "40-65", "30-50", "10-16", "<5"],
      },
      "Grading III": {
        sizes: ["53", "26.5", "4.75", "0.075"],
        limits: ["100", "55-75", "10-30", "<5"],
      },
      "Grading IV": {
        sizes: ["53", "26.5", "4.75", "0.075"],
        limits: ["100", "50-80", "15-35", "<5"],
      },
      "Grading V": {
        sizes: ["75", "53", "26.5", "9.5", "4.75", "2.36", "0.85", "0.425"],
        limits: [
          "100",
          "80-100",
          "55-90",
          "35-65",
          "25-50",
          "10-20",
          "2-10",
          "0-5",
        ],
      },
      "Grading VI": {
        sizes: ["53", "26.5", "9.5", "4.75", "2.36", "0.425", "0.075"],
        limits: ["100", "75-100", "55-75", "30-55", "10-25", "0-8", "0-3"],
      },
    };

    const gradingData =
      gradingSpecs[sieveGrading] || gradingSpecs["Grading III"];
    const { sizes: requiredSizes, limits: sieveSpecification } = gradingData;

    // Table header
    const sieveHeader = [
      [
        {
          text: "IS Sieve\nDesignation",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Cumulative Percent\nRetained (%)",
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Cumulative Percent\nPassing (%)",
          style: "tableHeader",
          alignment: "center",
        },
        { text: "Test Method", style: "tableHeader", alignment: "center" },
        {
          text: `As per MORTH\nTable 400-1,\n${sieveGrading} (% of Passing)`,
          style: "tableHeader",
          alignment: "center",
        },
      ],
    ];

    // Table body rows
    const sieveTableBody = requiredSizes.map((size, index) => {
      const rowData = seiveTableData.find((item) => item.d === size);
      return [
        { text: `${size} mm`, fontSize: 9, alignment: "center" },
        { text: rowData?.r ?? "-", fontSize: 9, alignment: "center" },
        { text: rowData?.p ?? "-", fontSize: 9, alignment: "center" },
        {
          text: "IS: 2386 (Part-1)",
          fontSize: 9,
          alignment: "center",
          //   margin: [0, 6, 0, 6]
        },
        {
          text: sieveSpecification[index] ?? "-",
          fontSize: 9,
          alignment: "center",
        },
      ];
    });

    // In case empty
    if (sieveTableBody.length === 0) {
      sieveTableBody.push([
        { text: "No Sieve Data Found", colSpan: 5, alignment: "center" },
        {},
        {},
        {},
        {},
      ]);
    }

    const sieveTable = {
      table: {
        headerRows: 1,
        widths: ["20%", "20%", "20%", "20%", "20%"],
        body: [...sieveHeader, ...sieveTableBody],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#000000",
        vLineColor: () => "#000000",
      },
      margin: [0, 5, 0, 0],
    };
    // 🔹 Field Dry Density tables (Core Cutter / Sand Replacement)
    const fieldDensityTable = soilField(parsedJdata);

    const content = [];

    if (proportionsTable) content.push(proportionsTable);
    if (seiveData) content.push(sieveTable);

    if (Array.isArray(fieldDensityTable)) {
      content.push(...fieldDensityTable);
    } else if (fieldDensityTable) {
      content.push(fieldDensityTable);
    }

    return {
      stack: content,
    };
  } catch (err) {
    console.error("Error generating sieve table PDF:", err.message);
    return null;
  }
};

module.exports = gSbMech;
