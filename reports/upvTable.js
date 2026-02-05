const upvTable = (parsedJdata) => {
  const node = parsedJdata[0];
  const { reportFormat } = node;

  if (!reportFormat || reportFormat.length === 0) {
    return {
      text: "No UPV test results available.",
      fontSize: 9,
      bold: true,
      color: "red",
      margin: [0, 5, 0, 5],
    };
  }

  const tables = [];

  reportFormat.forEach((block, index) => {
    const tableHeader = [
      { text: "Sl. No", style: "tableHeader", alignment: "center" },
      {
        text: "Member ID / Location",
        style: "tableHeader",
        alignment: "center",
      },
      { text: "Type of Probing", style: "tableHeader", alignment: "center" },
      { text: "Path Length (mm)", style: "tableHeader", alignment: "center" },
      {
        text: "Pulse Velocity (km/sec)",
        style: "tableHeader",
        alignment: "center",
      },
      { text: "Concrete Quality", style: "tableHeader", alignment: "center" },
    ];

    const rows = block.rows.map((row, i) => {
      let velocity = parseFloat(row.pulse_velocity);

      if (!isNaN(velocity)) {
        if (row.type_of_probing?.toLowerCase() === "surface probing") {
          velocity = velocity + 0.5; // *** auto increase by 0.5 ***
        }
      }

      const finalVelocity = isNaN(velocity) ? "-" : velocity.toFixed(2);

      return [
        { text: row.sl_no || i + 1, alignment: "center", fontSize: 8 },
        { text: row.member_id || "-", alignment: "center", fontSize: 8 },
        { text: row.type_of_probing || "-", alignment: "center", fontSize: 8 },
        { text: row.path_length || "-", alignment: "center", fontSize: 8 },
        { text: finalVelocity, alignment: "center", fontSize: 8 },
        { text: row.concrete_quality || "-", alignment: "center", fontSize: 8 },
      ];
    });

    // ✅ Show Technical Reference only before FIRST table
    if (index === 0) {
      tables.push({
        text: "Technical Reference                     : IS: 516: Part-5 Sec-1",
        fontSize: 9,
        margin: [0, 0, 0, 4],
      });
    }

    tables.push(
      {
        text: `Block: ${block.blockName} Concrete: ${block.concreteClass}`,
        bold: true,
        fontSize: 9,
        margin: [0, 6, 0, 6],
      },
      {
        table: {
          headerRows: 1,
          widths: [28, 120, "*", "*", "*", "*"],
          body: [tableHeader, ...rows],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#E0E0E0" : null),
          hLineWidth: () => 0.4,
          vLineWidth: () => 0.4,
          hLineColor: () => "#000",
          vLineColor: () => "#000",
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
        margin: [0, 0, 0, 10],
      }
    );
  });
  tables.push({
    text: "Velocity Criterion for Concrete QUALITY Grading\n(Table 1 of IS: 516 (Part-5/Sec-1, Amd 1))",
    alignment: "center",
    bold: true,
    fontSize: 9,
    margin: [0, 8, 0, 5],
  });
  // ======= UPDATED CLASSIFICATION TABLE (Better Visual Balance) =======
  const gradingTable = {
    margin: [0, 10, 0, 0], // reduced spacing
    table: {
      headerRows: 1,
      widths: ["25%", "25%", "25%", "25%"],
      body: [
        [
          {
            text: "Avg. Pulse Velocity (km/s)",
            bold: true,
            alignment: "center",
            fontSize: 9,
          },
          {
            text: "Concrete Quality\n(≤ M25)",
            bold: true,
            alignment: "center",
            fontSize: 8,
          },
          {
            text: "Avg. Pulse Velocity (km/s)",
            bold: true,
            alignment: "center",
            fontSize: 8,
          },
          {
            text: "Concrete Quality\n(> M25)",
            bold: true,
            alignment: "center",
            fontSize: 8,
          },
        ],
        [
          { text: "Below 3.5", alignment: "center", fontSize: 8 },
          { text: "Doubtful", alignment: "center", fontSize: 8 },
          { text: "Below 3.75", alignment: "center", fontSize: 8 },
          { text: "Doubtful", alignment: "center", fontSize: 8 },
        ],
        [
          { text: "3.5 – 4.5", alignment: "center", fontSize: 8 },
          { text: "Good", alignment: "center", fontSize: 8 },
          { text: "3.75 – 4.50", alignment: "center", fontSize: 8 },
          { text: "Good", alignment: "center", fontSize: 8 },
        ],
        [
          { text: "Above 4.5", alignment: "center", fontSize: 8 },
          { text: "Excellent", alignment: "center", fontSize: 8 },
          { text: "Above 4.50", alignment: "center", fontSize: 8 },
          { text: "Excellent", alignment: "center", fontSize: 8 },
        ],
      ],
    },
    layout: {
      fillColor: (rowIndex) => (rowIndex === 0 ? "#D6D6D6" : null),
      hLineWidth: () => 0.4,
      vLineWidth: () => 0.4,
      hLineColor: () => "#000",
      vLineColor: () => "#000",
      paddingTop: () => 2,
      paddingBottom: () => 2,
    },
  };

  tables.push(gradingTable);
  // ⭐ ADD WITNESSED BY LINE

  return { stack: tables };
};

module.exports = upvTable;
