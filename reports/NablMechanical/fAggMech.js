// const FINE_AGGREGATE_SIEVE_ANALYSIS = "FINE_AGGREGATE_SIEVE_ANALYSIS";

// const fAggMech = (jdata) => {
//   let parsedJdata;

//   try {
//     parsedJdata = JSON.parse(jdata);
//   } catch (error) {
//     console.error("Error parsing jdata:", error);
//     return null;
//   }

//   const getRow = (reportData) => {
//     console.log(reportData);
//     const { key, value, requirements } = reportData[0];

//     return [
//       [
//         {
//           text: key,
//           fontSize: 9,
//           alignment: "center",
//           margin: [0, 2, 0, 2],
//         },
//         {
//           text: value,
//           fontSize: 9,
//           alignment: "center",
//           margin: [0, 2, 0, 2],
//         },
//         {
//           text: requirements,
//           fontSize: 9,
//           alignment: "center",
//           margin: [0, 2, 0, 2],
//         },
//       ],
//     ];
//   };

//   const tableBody = [
//     [
//       { text: "Test Conducted", style: "tableHeader", alignment: "center" },
//       { text: "Results", style: "tableHeader", alignment: "center" },
//       { text: "Requirements", style: "tableHeader", alignment: "center" },
//     ],
//     ...parsedJdata.flatMap(({ paramName, reportData }) => {
//       if (paramName !== FINE_AGGREGATE_SIEVE_ANALYSIS) {
//         return getRow(reportData);
//       } else return [];
//     }),
//   ];

//   return {
//     table: {
//       headerRows: 1,
//       widths: ["*", "auto", "*"],
//       body: tableBody,
//     },
//     layout: {
//       fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
//       hLineWidth: () => 0.5,
//       vLineWidth: () => 0.5,
//       hLineColor: () => "#000000",
//       vLineColor: () => "#000000",
//     },
//     margin: [0, 5, 0, 0],
//   };
// };

// module.exports = fAggMech;

const fAggMech = (jdata) => {
  try {
    const parsedJdata = jdata;
    const seiveData = parsedJdata.find(
      (item) => item.param_id === "COARSE_AGGREGATE_SIEVE_ANALYSIS"
    );

    const seiveTableData = seiveData?.formData?.commonTemplate || [];

    if (!seiveTableData || seiveTableData.length === 0) {
      return null;
    }

    const requiredSizes = [
      "10.00 mm",
      "4.75 mm",
      "2.36 mm",
      "1.18 mm",
      "600 Microns",
      "300 Microns",
      "150 Microns",
    ];

    const zoneSpecifications = {
      "10.00 mm": ["100", "100", "100", "100"],
      "4.75 mm": ["90-100", "90-100", "90-100", "95-100"],
      "2.36 mm": ["60-95", "75-100", "85-100", "95-100"],
      "1.18 mm": ["30-70", "55-90", "75-100", "90-100"],
      "600 Microns": ["15-34", "35-59", "60-79", "80-100"],
      "300 Microns": ["5-20", "8-30", "12-40", "15-50"],
      "150 Microns": ["0-10", "0-10", "0-10", "0-15"],
    };

    let zoneNumbr = 39;

    const sieveHeader = [
      [
        {
          text: "IS Sieve\nDesignation",
          style: "tableHeader",
          alignment: "center",
          rowSpan: 2,
        },
        {
          text: "Cumulative %",
          style: "tableHeader",
          alignment: "center",
          colSpan: 2,
        },
        {},
        {
          text: "Test Method",
          style: "tableHeader",
          alignment: "center",
          rowSpan: 2,
        },
        {
          text: "Specifications as per IS:383-2016\n for Fine Aggregate(% Passing) - Grading",
          style: "tableHeader",
          alignment: "center",
          colSpan: 4,
        },
        {},
        {},
        {},
      ],
      [
        {},
        { text: "Retained", style: "tableHeader", alignment: "center" },
        { text: "Passing", style: "tableHeader", alignment: "center" },
        {},
        { text: "Zone-I", style: "tableHeader", alignment: "center" },
        { text: "Zone-II", style: "tableHeader", alignment: "center" },
        { text: "Zone-III", style: "tableHeader", alignment: "center" },
        { text: "Zone-IV", style: "tableHeader", alignment: "center" },
      ],
    ];

    const sieveTableBody = requiredSizes.map((size, index) => {
      const rowData = seiveTableData.find((item) => item.d === size);
      const specs = zoneSpecifications[size] || ["-", "-", "-", "-"];

      const row = [
        { text: size, fontSize: 9, alignment: "center" }, // col 1
        { text: rowData?.r ?? "-", fontSize: 9, alignment: "center" }, // col 2
        { text: rowData?.p ?? "-", fontSize: 9, alignment: "center" }, // col 3
        index === 0
          ? {
              text: "IS: 2386 (Part-I)", // col 4 (rowSpan in first row only)
              fontSize: 9,
              alignment: "center",
              rowSpan: requiredSizes.length + 1,
              margin: [0, 37, 0, 0],
              border: [true, true, true, false],
            }
          : {},
        {
          text: specs[0],
          fontSize: 9,
          alignment: "center",
          // margin: index === requiredSizes.length - 1 ? [0, 0, 0, 0] : [0, 0, 0, 0],
        }, // col 5
        { text: specs[1], fontSize: 9, alignment: "center" }, // col 6
        { text: specs[2], fontSize: 9, alignment: "center" }, // col 7
        { text: specs[3], fontSize: 9, alignment: "center" }, // col 8
      ];

      if (index === 4) {
        zoneNumbr = rowData?.p;
      }

      return row;
    });

    if (sieveTableBody.length === 0) {
      sieveTableBody.push([
        { text: "No Sieve Data Found", colSpan: 8, alignment: "center" },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
      ]);
    }

    const sieveHeader0 = [
      [
        {
          text: `Remarks: The tested sample satisfies the requirements of grading ${
            zoneNumbr >= 15 && zoneNumbr <= 34
              ? "Zone I"
              : zoneNumbr >= 35 && zoneNumbr <= 59
                ? "Zone II"
                : zoneNumbr >= 60 && zoneNumbr <= 79
                  ? "Zone III"
                  : zoneNumbr >= 80 && zoneNumbr <= 100
                    ? "Zone IV"
                    : "Unknown Zone"
          } According to IS: 383-2016 for crushed stone sands, the permissible limit on 150 micron IS Sieve is increased to 20%. This does not affect the 5% allowance permitted in clause 6.3 applying to other sieves. As per clause 6.3, where the grading falls outside the limits of any particular grading zone of sieves other than 600microns by an amount not exceeding 5% for a particular sieve size (subjected to a cumulative amount of 10%), it shall be regarded as falling within that grading zone.`,
          colSpan: 8,
          // style: 'tableHeader',
          alignment: "justify",
          // alignment: 'center',

          fontSize: 8,
          fillColor: "#ffffff",
          border: [true, true, true, true],
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
      ],
    ];

    const tableBody = [
      // ...sieveHeader01,
      ...sieveHeader,
      ...sieveTableBody,
      ...sieveHeader0,
    ];

    // console.log(zoneNumbr, 'zoneNumbr')

    return {
      table: {
        headerRows: 3,
        // widths: ["*", "*", "*", "*", "*", "*", "*", "*"],
        widths: [
          "15%",
          "15%",
          "10%",
          "10%",
          "12.5%",
          "12.5%",
          "12.5%",
          "12.5%",
        ],
        body: tableBody,
      },
      layout: {
        fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#000000",
        vLineColor: () => "#000000",
      },
    };
  } catch (err) {
    console.error("Error generating sieve table PDF:", err.message);
    return null;
  }
};

module.exports = fAggMech;
