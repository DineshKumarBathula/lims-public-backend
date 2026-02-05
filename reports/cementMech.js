const {
  REPORT_HEADER_PARTICULARS,
  REPORT_HEADER_TEST_METHOD,
  // REPORT_HEADER_SPECIFICATIONS,
  REPORT_HEADER_RESULTS,
  REPORT_HEADER_SNO,
} = require("./consts");

const getCementCompressiveStrength = (
  reportData,
  counter,
  parsedJdata,
  param_id,
  id
) => {
  const ind = parsedJdata.findIndex(
    (each) =>
      (each.param_id === "CEMENT_COMPRESSIVE_STRENGTH" &&
        each.param_id === param_id) ||
      each.param_id === "FINE_AGGREGATES_CHLORIDES_SULPHATES" ||
      each.param_id === "CHLORIDES_SULPHATES" ||
      (each.param_id === "CEMENT_SETTING_TIME" && each.param_id === param_id)
  );

  return reportData.map((each, idx) => {
    return [
      idx === 0
        ? {
            text: ind + 1,
            rowSpan: reportData.length,
            fontSize: 8,
            alignment: "center",
          }
        : "", // Leave blank for rowspan continuation
      {
        text: each.key,
        fontSize: 8,

        alignment: "center",
      },
      {
        text: each.testMethod || "",
        fontSize: 8,
        alignment: "center",
      },
      {
        text: each.value?.toString() || "",
        fontSize: 8,
        alignment: "center",
      },
      {
        text: each.requirements || "",
        fontSize: 8,
        alignment: "center",
      },
      [91, 101, 98, 99, 100, 102].includes(id)
        ? {
            text: each.remarks,
            fontSize: 8,
            alignment: "center",
          }
        : {},
    ];
  });
};

const getCementCompressiveStrength2 = (
  reportData,
  counter,
  parsedJdata,
  param_id,
  id
) => {
  const ind = parsedJdata.findIndex(
    (each) =>
      (each.param_id === "CEMENT_COMPRESSIVE_STRENGTH" &&
        each.param_id === param_id) ||
      each.param_id === "FINE_AGGREGATES_CHLORIDES_SULPHATES" ||
      each.param_id === "CHLORIDES_SULPHATES" ||
      (each.param_id === "CEMENT_SETTING_TIME" && each.param_id === param_id)
  );

  return reportData.map((each, idx) => {
    return [
      idx === 0
        ? {
            text: counter + 1,
            rowSpan: reportData.length,
            fontSize: 8,
            alignment: "center",
            margin: [0, 1, 0, 1],
          }
        : "", // Leave blank for rowspan continuation
      {
        text: each.key,
        fontSize: 8,

        alignment: "center",
        margin: [0, 1, 0, 1],
      },
      {
        text: each.testMethod || "",
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },
      {
        text: each.value?.toString() || "",
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },
      {
        text: each.requirements || "",
        fontSize: 8,
        alignment: "center",
        margin: [0, 1, 0, 1],
      },
      [91, 101, 98, 99, 100, 102].includes(id)
        ? {
            text: each.remarks,
            fontSize: 8,
            alignment: "center",
            margin: [0, 1, 0, 1],
          }
        : {},
    ];
  });
};

const dontShowParams = [
  "CEMENT_SIO2",
  "CEMENT_FE2O3",
  "CEMENT_AL203",
  "CEMENT_CALCIUM",
];

const cementMech = (id, parsedJdata = []) => {
  const compressiveRowIndexes = new Set();
  const getFormattedRow = (each, idx) => {
    const { key, value, testMethod, requirements, remarks } = each;

    return [
      {
        text: idx + 1,
        fontSize: 8,
        alignment: "center",
      },
      {
        text: key,
        fontSize: 8,
        alignment: "center",
      },
      {
        text: testMethod,
        fontSize: 8,
        alignment: "center",
      },
      {
        text: value,
        fontSize: 9,
        alignment: "center",
      },
      {
        text: requirements,
        fontSize: 8,
        alignment: "center",
      },
      [91, 101, 98, 99, 100, 102].includes(id)
        ? {
            text: remarks,
            fontSize: 8,
            alignment: "center",
          }
        : {},
    ];
  };

  let REPORT_HEADER_SPECIFICATIONS = "Specifications";
  if (id === 99) {
    REPORT_HEADER_SPECIFICATIONS =
      "Requirements as per IS:455-2015(Reaffirmed 2020)";
  } else if (id === 98) {
    REPORT_HEADER_SPECIFICATIONS =
      "Requirements as per Table I IS:1489(Part-1):2015,(Reaffirmed 2020)";
  } else if (id === 101) {
    REPORT_HEADER_SPECIFICATIONS =
      "Requirements as per IS:269-2015(Reaffirmed 2020)";
  } else if (id === 26) {
    REPORT_HEADER_SPECIFICATIONS =
      "Requirements as per IS:456-2000(Permissible Limit)";
  } else if (id === 27) {
    REPORT_HEADER_SPECIFICATIONS =
      "Requirements as per IS:10500-2012 Acceptable Limits(Max)";
  } else if (id === 91) {
    REPORT_HEADER_SPECIFICATIONS =
      "Requirements as per IS:269-2015(Reaffirmed 2020)";
  }

  const headerRow = [
    {
      text: REPORT_HEADER_SNO,
      style: "tableHeader",
      alignment: "center",
    },
    {
      text: REPORT_HEADER_PARTICULARS,
      style: "tableHeader",
      alignment: "center",
    },
    {
      text: REPORT_HEADER_TEST_METHOD,
      style: "tableHeader",
      alignment: "center",
    },
    {
      text: REPORT_HEADER_RESULTS,
      style: "tableHeader",
      alignment: "center",
    },
    {
      text: REPORT_HEADER_SPECIFICATIONS,
      style: "tableHeader",
      alignment: "center",
    },
    [91, 101, 98, 99, 100, 102].includes(id)
      ? {
          text: "Remarks",
          style: "tableHeader",
          alignment: "center",
        }
      : {},
  ];
  const body = [headerRow];
  let counter = 0;

  const normalizeParsedJdata = (parsedJdata) => {
    const result = [];

    parsedJdata.forEach((item) => {
      // For CEMENT_SETTING_TIME we split if multiple reportData exist
      if (
        item &&
        item?.param_id === "CEMENT_SETTING_TIME" &&
        item.reportData.length > 1
      ) {
        item.reportData.forEach((reportObj) => {
          result.push({
            ...item,
            reportData: [reportObj], // keep each reportData separately
          });
        });
      } else {
        // keep as-is
        result.push(item);
      }
    });

    return result;
  };

  const settingTimeObj = parsedJdata.find(
    (item) => item.param_id === "CEMENT_SETTING_TIME"
  );

  const others = parsedJdata.filter(
    (item) => item.param_id !== "CEMENT_SETTING_TIME"
  );

  const newParsedJdata = [others[0], settingTimeObj, ...others.slice(1)];
  let parsedJdata2 = normalizeParsedJdata(newParsedJdata);
  parsedJdata2 = parsedJdata2.filter(
  (item) => item && item.reportData && Array.isArray(item.reportData)
);
  for (const { reportData, param_id } of parsedJdata2) {

    if (dontShowParams.includes(param_id)) {
      continue;
    }

    if (
      param_id === "FINE_AGGREGATES_CHLORIDES_SULPHATES" ||
      param_id === "CHLORIDES_SULPHATES"
      // ||param_id === "CEMENT_SETTING_TIME"
    ) {
      const rows = getCementCompressiveStrength(
        reportData,
        counter,
        parsedJdata,
        param_id
      );
      rows.forEach((row) => {
        compressiveRowIndexes.add(body.length);
        body.push(row);
      });
    } else if (param_id === "CEMENT_COMPRESSIVE_STRENGTH") {
      console.log(reportData,'parsedJdata287')

      const rows = getCementCompressiveStrength2(
        reportData,
        counter,
        parsedJdata,
        param_id,
        id
      );

      rows.forEach((row) => {
        compressiveRowIndexes.add(body.length);
        body.push(row);
      });
    } else {
      (reportData || []).forEach((test, idx) => {
        if (param_id === "20240418112228524") {
          body.push(getFormattedRow(test, idx));
        } else if (param_id === "MAJOR_OXIDES") {
          body.push(getFormattedRow(test, idx));
        } else {
          body.push(getFormattedRow(test, counter));
        }
      });
    }

    counter++; // after each block
  }

const tableContent = {
  table: {
    headerRows: 1,
    widths: [91, 101, 98, 99, 100, 102].includes(id)
      ? ["auto", "auto", "25%", "10%", "*", "auto"]
      : ["auto", "auto", "25%", "10%", "*"],
    body,
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

  return {
    table: {
      headerRows: 1,
      widths: [91, 101, 98, 99, 100, 102].includes(id)
        ? ["auto", "auto", "25%", "10%", "*", "auto"]
        : ["auto", "auto", "25%", "10%", "*"],
      body,
    },
    layout: {
      fillColor: (rowIndex) => (rowIndex === 0 ? "#CCCCCC" : null),
      hLineWidth: (i) => 0.5,
      vLineWidth: (i) => 0.5, // You can customize per cell too, if needed
      hLineColor: () => "#000000",
      vLineColor: () => "#000000",
    },
    margin: [0, 5, 0, 0],
  };
};

module.exports = cementMech;
