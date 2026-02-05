const { RajeshwariSign, RKsign } = require("./filePaths");

const createFooter = (currentPage, pageCount) => {
  return {
    stack: [
      {
        canvas: [
          { text: "" },
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 600,
            y2: 0,
            lineWidth: 0.5,
            lineColor: "#000000",
          },
        ],
        margin: [0, 0, 0, 4],
      },

      {
        text: "Plot No.93, E - Block, Autonagar, Visakhapatnam – 530012, Andhra Pradesh\n\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0E-mail: mrk@kdmengineers.com    Website: www.kdmengineers.com    Contact: +91 9912944495",
        fontSize: 9,
        alignment: "center",

        bold: true,
      },
      // Page number
      {
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: "right",
        fontSize: 8.5,
        margin: [0, 0, 20, 0],
        // absolutePosition: {
        //   y: -80,
        //   x: -120,
        // },
      },
    ],
  };
};

const createFooter22 = (currentPage, pageCount) => {
  return {
    stack: [
      {
        canvas: [
          { text: "" },
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 600,
            y2: 0,
            lineWidth: 0.5,
            lineColor: "#000000",
          },
        ],
        margin: [0, 0, 0, 4],
      },

      {
        text: "Plot No.93, E - Block, Autonagar, Visakhapatnam – 530012, Andhra Pradesh\n\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0E-mail: mrk@kdmengineers.com    Website: www.kdmengineers.com    Contact: +91 9912944495",
        fontSize: 9,
        alignment: "center",

        bold: true,
      },
      // Page number
      {
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: "right",
        fontSize: 8.5,
        margin: [0, 0, 20, 0],
        absolutePosition: {
          y: 10,
          // x: -120,
        },
      },
    ],
  };
};

const createFooterWithSigns = (currentPage, pageCount, pageSize, signs) => {
  const children = [];

  // Footer text + line
  children.push({
    stack: [
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 600,
            y2: 0,
            lineWidth: 0.5,
            lineColor: "#000000",
          },
        ],
      },
      {
        text: "Plot No.93, E - Block, Autonagar, Visakhapatnam – 530012, Andhra Pradesh\nE-mail: mrk@kdmengineers.com    Website: www.kdmengineers.com    Contact: +91 9912944495",
        fontSize: 9,
        alignment: "center",
        bold: true,
      },
      {
        text: `Page ${currentPage} of ${pageCount}.`,
        fontSize: 8.5,
        alignment: "right",
        margin: [0, -10, 10, 0],
      },
    ],
  });

  if (currentPage !== pageCount) {
    const row = [];

    if (signs?.chemical) {
      row.push({
        image: RajeshwariSign,
        width: 70,
        height: 50,
        margin: [0, 30, 30, 0],
        alignment: "right",
        absolutePosition: {
          y: -80,
          x: -120,
        },
      });
    }

    if (signs?.mechanical) {
      row.push({
        image: RKsign,
        width: 70,
        height: 50,
        margin: [0, 30, 30, 0],
        alignment: "right",
        absolutePosition: {
          x: 120,
          y: -80,
        },
      });
    }

    if (row.length > 0) {
      children.push({
        columns: row,
        columnGap: 20,
        alignment: "center",
      });
    }
  }

  return { stack: children };
};

module.exports = { createFooter, createFooterWithSigns, createFooter22 };
