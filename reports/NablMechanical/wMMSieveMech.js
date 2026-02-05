const soilField = require("./soilField");
const wmmMech = (jdata) => {
  try {
    const parsedJdata = jdata;
    const sieveData = parsedJdata?.find(
      (item) => item.param_id === "COARSE_AGGREGATE_SIEVE_ANALYSIS"
    );
    const waterAbsorptionData = parsedJdata.find(
      (item) => item.param_id === "WMM_WATER_ABSORPTION"
    );

    const waterRows = waterAbsorptionData?.formData?.commonTemplate || [];

    console.log(jdata, "sieveData76");
    // if (!sieveData) {
    //   // console.warn("No sieve data found, aborting wmmMech()");
    //   return null; // ✅ abort early
    // }
    // Normalize sieve data here
    const sieveTableData =
      sieveData?.formData?.commonTemplate?.map((row) => ({
        ...row,
        d: row.d === "0.6" ? "0.600" : row.d, // ✅ convert to 0.600
      })) || [];

    const PROPORTION_LABELS = {
      css: "Crushed Stone Sand",
      rs: "River Sand",
      dust: "Dust",
    };

    const proportionsEntry = sieveData?.reportData?.find(
      (item) => item.key === "Proportions"
    );

    console.log(proportionsEntry,'proportionsEntry7865')

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
                      text: "Aggregate Mix Proportion WMM As per Table 400-13 of MORTH Rev-5",
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

    const specification = sieveData?.formData?.specification || "Specification";

    // match your form field naming: specifiedType (not SpecifiedType)
    const specifiedType = sieveData?.formData?.specifiedType || "MORTH";

    // Define both sets of limits
    const morthSieveLimits = {
      53: "100",
      45: "95–100",
      26.5: "–",
      22.4: "60–80",
      11.2: "40–60",
      4.75: "25–40",
      2.36: "15–30",
      "0.600": "8–22",
      0.075: "0–5",
    };

    const ircSieveLimits = {
      53: "100",
      45: "95–100",
      26.5: "–",
      22.4: "60–80",
      11.2: "40–60",
      4.75: "25–40",
      2.36: "15–30",
      "0.600": "6-18",
      0.075: "4-8",
    };

    const sieveLimits =
      specifiedType === "MORTH" ? morthSieveLimits : ircSieveLimits;

    const tableHeader = [
      [
        {
          text: "IS Sieve\nDesignation (mm)",
          rowSpan: 2,
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: "Cumulative Percent",
          colSpan: 2,
          style: "tableHeader",
          alignment: "center",
        },
        {},
        {
          text: "Test Method",
          rowSpan: 2,
          style: "tableHeader",
          alignment: "center",
        },
        {
          text: specification,
          rowSpan: 2,
          style: "tableHeader",
          alignment: "center",
        },
      ],
      [
        {},
        { text: "Retained", style: "tableHeader", alignment: "center" },
        { text: "Passing", style: "tableHeader", alignment: "center" },
        {},
        {},
      ],
    ];

    const tableBody = sieveTableData.map((row, index) => [
      { text: row.d, alignment: "center", fontSize: 9 },
      { text: row.r ?? "-", alignment: "center", fontSize: 9 },
      { text: row.p ?? "-", alignment: "center", fontSize: 9 },
      {
        text: index === 3 ? "IS: 2386 (Part-1)" : "", // ✅ show only at 3rd iteration
        alignment: "center",
        fontSize: 9,
        border:
          index === 7
            ? [true, false, true, true]
            : [false, false, false, false], // ✅ borders only for index 3
      },
      { text: sieveLimits[row.d] ?? "-", alignment: "center", fontSize: 9 },
    ]);

    if (tableBody.length === 0) {
      tableBody.push([
        { text: "No Sieve Data Found", colSpan: 5, alignment: "center" },
        {},
        {},
        {},
        {},
      ]);
    }

    const content = [];

    // 1️⃣ Proportions table (if exists)
    // 1️⃣ SIEVE TABLE (ONLY IF PRESENT)
    if (sieveData) {
      if (proportionsTable) {
        content.push(proportionsTable);
      }

      content.push({
        table: {
          headerRows: 2,
          widths: ["20%", "15%", "15%", "25%", "25%"],
          body: [...tableHeader, ...tableBody],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        margin: [0, 5, 0, 2],
      });
    }

    // 3️⃣ Field Dry Density tables (Core Cutter / Sand Replacement)
    const fieldDensityTable = soilField(parsedJdata);

    if (Array.isArray(fieldDensityTable)) {
      content.push(...fieldDensityTable);
    } else if (fieldDensityTable) {
      content.push(fieldDensityTable);
    }

    // ✅ return combined content
    return {
      stack: content,
    };
  } catch (err) {
    console.error("Error generating sieve table PDF:", err.message);
    return null;
  }
};

module.exports = wmmMech;
