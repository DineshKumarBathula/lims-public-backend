const {
  REPORT_HEADER_PARTICULARS,
  REPORT_HEADER_TEST_METHOD,
  REPORT_HEADER_RESULTS,
  REPORT_HEADER_SNO,
} = require("./consts");

const getCementCompressiveStrength = (
  reportData,
  counter,
  parsedJdata,
  param_id
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
        : "",
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
    ];
  });
};

const getCementCompressiveStrength2 = (
  reportData,
  counter,
  parsedJdata,
  param_id
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
          }
        : "",
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
    ];
  });
};

const dontShowParams = [
  "CEMENT_SIO2",
  "CEMENT_FE2O3",
  "CEMENT_AL203",
  "CEMENT_CALCIUM",
];

const genralTestTableCemMech = (id, parsedJdata) => {
  const compressiveRowIndexes = new Set();
  const getFormattedRow = (each, idx) => {
    const { key, value, testMethod, requirements } = each;
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
  }

  const headerRow = [
    { text: REPORT_HEADER_SNO, style: "tableHeader", alignment: "center" },
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
    { text: REPORT_HEADER_RESULTS, style: "tableHeader", alignment: "center" },
    {
      text: REPORT_HEADER_SPECIFICATIONS,
      style: "tableHeader",
      alignment: "center",
    },
  ];
  const body = [headerRow];
  let counter = 0;

  const normalizeParsedJdata = (parsedJdata) => {
    const result = [];
    parsedJdata.forEach((item) => {
      if (!item) return;
      if (
        item.param_id === "CEMENT_SETTING_TIME" &&
        item.reportData.length > 1
      ) {
        item.reportData.forEach((reportObj) => {
          result.push({
            ...item,
            reportData: [reportObj],
          });
        });
      } else {
        result.push(item);
      }
    });
    return result;
  };

  const settingTimeObj = parsedJdata.find(
    (item) => item && item.param_id === "CEMENT_SETTING_TIME"
  );
  const others = parsedJdata.filter(
    (item) => item && item.param_id !== "CEMENT_SETTING_TIME"
  );

  const newParsedJdata = settingTimeObj
    ? [others[0], settingTimeObj, ...others.slice(1)]
    : [...others];

  const parsedJdata2 = normalizeParsedJdata(newParsedJdata);

  for (const entry of parsedJdata2) {
    if (!entry) continue;
    const { reportData, param_id } = entry;

    if (dontShowParams.includes(param_id)) {
      continue;
    }

    if (
      param_id === "FINE_AGGREGATES_CHLORIDES_SULPHATES" ||
      param_id === "CHLORIDES_SULPHATES"
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
      const rows = getCementCompressiveStrength2(
        reportData,
        counter,
        parsedJdata,
        param_id
      );
      rows.forEach((row) => {
        compressiveRowIndexes.add(body.length);
        body.push(row);
      });
    } else {
      reportData.forEach((test, idx) => {
        if (param_id === "20240418112228524") {
          body.push(getFormattedRow(test, idx));
        } else if (param_id === "MAJOR_OXIDES") {
          body.push(getFormattedRow(test, idx));
        } else {
          body.push(getFormattedRow(test, counter));
        }
      });
    }

    counter++;
  }

  return {
    table: {
      headerRows: 1,
      widths: ["auto", "*", "*", "*", "*"],
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
};

module.exports = genralTestTableCemMech;
