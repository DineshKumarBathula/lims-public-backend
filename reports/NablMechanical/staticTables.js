const steelReqTable = [
  {
    grade: "Fe415",
    proofStress: 415,
    ts: 485,
    tsByYs: 1.1,
    elongation: 14.5,
    totalElongation: "-",
    reportGrade: "Fe415",
  },
  {
    grade: "Fe415d",
    proofStress: 415,
    ts: 500,
    tsByYs: 1.12,
    elongation: 18,
    totalElongation: 5,
    reportGrade: "Fe415 D",
  },
  {
    grade: "Fe415s",
    proofStress: 415,
    ts: null,
    tsByYs: 1.25,
    elongation: 18,
    totalElongation: 8,
    reportGrade: "Fe415 S",
  },
  {
    grade: "Fe500",
    proofStress: 500,
    ts: 545,
    tsByYs: 1.08,
    elongation: 12,
    totalElongation: "-",
    reportGrade: "Fe500",
  },
  {
    grade: "Fe500d",
    proofStress: 500,
    ts: 565,
    tsByYs: 1.1,
    elongation: 16,
    totalElongation: 5,
    reportGrade: "Fe500 D",
  },
  {
    grade: "Fe500s",
    proofStress: 500,
    ts: null,
    tsByYs: 1.25,
    elongation: 16,
    totalElongation: 8,
    reportGrade: "Fe500 S",
  },
  {
    grade: "Fe550",
    proofStress: 550,
    ts: 585,
    tsByYs: 1.06,
    elongation: 10,
    totalElongation: "-",
    reportGrade: "Fe550",
  },
  {
    grade: "Fe550d",
    proofStress: 550,
    ts: 600,
    tsByYs: 1.08,
    elongation: 14.5,
    totalElongation: 5,
    reportGrade: "Fe550 D",
  },
  {
    grade: "Fe550d_crs",
    proofStress: 550,
    ts: 600,
    tsByYs: 1.08,
    elongation: 14.5,
    totalElongation: 5,
    reportGrade: "Fe550D",
  },
  {
    grade: "Fe600",
    proofStress: 600,
    ts: 660,
    tsByYs: 1.06,
    elongation: 10,
    totalElongation: "-",
    reportGrade: "Fe600",
  },
  {
    grade: "Fe650",
    proofStress: 650,
    ts: 700,
    tsByYs: 1.06,
    elongation: 10,
    totalElongation: "-",
    reportGrade: "Fe650",
  },
  {
    grade: "Fe700",
    proofStress: 700,
    ts: 770,
    tsByYs: 1.06,
    elongation: 10,
    totalElongation: "-",
    reportGrade: "Fe700",
  },

  {
    grade: "Fe415_crs",
    proofStress: 415,
    ts: 485,
    tsByYs: 1.1,
    elongation: 14.5,
    totalElongation: "-",
    reportGrade: "Fe415",
  },

  {
    grade: "Fe500_crs",
    proofStress: 550,
    ts: 585,
    tsByYs: 1.06,
    elongation: 10,
    totalElongation: "-",
    reportGrade: "Fe500",
  },
];

//mpm table

const getRsteelReqTable = (selectedGradesArray) => {
  const arr = [];

  const tableHeader = [
    "Grade",
    "0.2 percent proof stress/YS (Min) N/mm2",
    "TS (Min) N/mm2",
    "Ts/Ys (Min)",
    "Elongation (Min) (%)",
    // "Total Elongation (Min) (%)",
  ];
  const keys = [
    "grade",
    "proofStress",
    "ts",
    "tsByYs",
    "elongation",
    // "totalElongation",
  ];

  arr.push([
    {
      text: "Requirements as per IS: 1786 (table 3)",
      colSpan: tableHeader.length,
      fontSize: 9,
      bold: true,
      alignment: "center",
    },
    ...Array(keys.length - 1).fill({}),
  ]);

  const header = tableHeader.map((each) => ({
    text: each,
    fontSize: 9,
    alignment: "center",
  }));

  arr.push(header);

  steelReqTable.forEach((eachObj) => {
    if (selectedGradesArray.includes(eachObj.grade)) {
      arr.push(
        keys.map((eachKey) => ({
          text: eachKey === "grade" ? eachObj["reportGrade"] : eachObj[eachKey],
          fontSize: 9,
          alignment: "center",
        }))
      );
    }
  });

  return arr;
};

const mpmTable = [
  { dia: "8mm", minMpm: 0.363, maxMpm: 0.395 },
  { dia: "10mm", minMpm: 0.567, maxMpm: 0.617 },
  { dia: "12mm", minMpm: 0.834, maxMpm: 0.888 },
  { dia: "16mm", minMpm: 1.483, maxMpm: 1.58 },
  { dia: "20mm", minMpm: 2.371, maxMpm: 2.47 },
  { dia: "25mm", minMpm: 3.697, maxMpm: 3.85 },
  { dia: "28mm", minMpm: 4.638, maxMpm: 4.83 },
  { dia: "32mm", minMpm: 6.058, maxMpm: 6.31 },
];

const getMPMtable = (selectedDiaArray) => {
  const arr = [];

  // Title row
  arr.push([
    {
      text: "Weight per Meter",
      colSpan: selectedDiaArray.length + 1,
      fontSize: 9,
      bold: true,
      alignment: "center",
    },
    ...Array(selectedDiaArray.length).fill({}),
  ]);

  // Dia row (header)
  const diaRow = [
    { text: "Dia", fontSize: 9, bold: true, alignment: "center" },
    ...selectedDiaArray.map((dia) => ({
      text: dia,
      fontSize: 9,
      alignment: "center",
    })),
  ];
  arr.push(diaRow);

  const minRow = [
    { text: "Min MPM", fontSize: 9, bold: true, alignment: "center" },
    ...selectedDiaArray.map((dia) => {
      const found = mpmTable.find((each) => each.dia === dia);
      return {
        text: found ? found.minMpm.toFixed(3) : "-",
        fontSize: 9,
        alignment: "center",
      };
    }),
  ];
  arr.push(minRow);

  const maxRow = [
    { text: "Max MPM", fontSize: 9, bold: true, alignment: "center" },
    ...selectedDiaArray.map((dia) => {
      const found = mpmTable.find((each) => each.dia === dia);
      return {
        text: found ? found.maxMpm.toFixed(3) : "-",
        fontSize: 9,
        alignment: "center",
      };
    }),
  ];
  arr.push(maxRow);
  return arr;
};

const steelChemicalComposition = [
  {
    grade: "Fe415",
    c: 0.3,
    s: 0.06,
    p: 0.06,
    sp: 0.11,
    cre: "0.40",
    reportGrade: "Fe415",
  },
  {
    grade: "Fe415_crs",
    c: 0.3,
    s: 0.06,
    p: 0.06,
    sp: 0.11,
    cre: "0.40",
    reportGrade: "Fe415",
  },
  {
    grade: "Fe415d",
    c: 0.3,
    s: 0.045,
    p: 0.045,
    sp: 0.085,
    cre: "0.40",
    reportGrade: "Fe415d",
  },
  {
    grade: "Fe415s",
    c: 0.25,
    s: 0.04,
    p: 0.04,
    sp: 0.075,
    cre: "0.40",
    reportGrade: "Fe415S",
  },
  {
    grade: "Fe500",
    c: 0.3,
    s: 0.055,
    p: 0.055,
    sp: 0.105,
    cre: "0.40",
    reportGrade: "Fe500",
  },
  {
    grade: "Fe500_crs",
    c: 0.3,
    s: 0.055,
    p: 0.055,
    sp: 0.105,
    cre: "0.40",
    reportGrade: "Fe500",
  },
  {
    grade: "Fe500d",
    c: 0.25,
    s: 0.04,
    p: 0.04,
    sp: 0.075,
    cre: "0.40",
    reportGrade: "Fe500D",
  },
  {
    grade: "Fe500s",
    c: 0.32,
    s: 0.04,
    p: 0.04,
    sp: 0.075,
    cre: "0.40",
    reportGrade: "Fe500S",
  },
  {
    grade: "Fe550",
    c: 0.3,
    s: 0.055,
    p: 0.055,
    sp: 0.1,
    cre: "0.40",
    reportGrade: "Fe550",
  },
  {
    grade: "Fe550d",
    c: 0.25,
    s: 0.04,
    p: 0.04,
    sp: 0.075,
    cre: "0.40",
    reportGrade: "Fe550D",
  },
  {
    grade: "Fe550d_crs",
    c: 0.25,
    s: 0.04,
    p: 0.04,
    sp: 0.075,
    cre: "0.40",
    reportGrade: "Fe550D",
  },
  {
    grade: "Fe600",
    c: 0.3,
    s: 0.04,
    p: 0.04,
    sp: 0.075,
    cre: "0.40",
    reportGrade: "Fe600",
  },
  {
    grade: "Fe650",
    c: 0.32,
    s: 0.04,
    p: 0.04,
    sp: 0.075,
    cre: "0.40",
    reportGrade: "Fe650",
  },
  {
    grade: "Fe700",
    c: 0.32,
    s: 0.04,
    p: 0.04,
    sp: 0.075,
    cre: "0.40",
    reportGrade: "Fe700",
  },

  //cre's
];

const getChemicalCompositionTable = (selectedDiaArray, creSelected) => {
  const arr = [];
  const tableHeader = [
    "Requirements as per \n IS: 1786 – 2008(RA2018) ",
    "C (Max %)",
    "S (Max %)",
    "P (Max %)",
    "S + P (Max %)",
  ];
  const keys = ["grade", "c", "s", "p", "sp"];
  if (creSelected) {
    keys.push("cre");
    tableHeader.push("CRE (Min %)");
  }
  const header = tableHeader.map((each) => ({
    text: each,
    fontSize: 9,
    alignment: "center",
  }));

  arr.push(header);

  steelChemicalComposition.forEach((eachObj) => {
    if (selectedDiaArray.includes(eachObj.grade)) {
      arr.push(
        keys.map((eachKey) => ({
          text: eachKey === "grade" ? eachObj["reportGrade"] : eachObj[eachKey],
          fontSize: 9,
          alignment: "center",
        }))
      );
    }
  });

  return arr;
};

module.exports = {
  getRsteelReqTable,
  getMPMtable,
  getChemicalCompositionTable,
};
