const renderContent = (
  results,
  customerInfo,
  taxNumber,
  total_transportation_charged,
  dis,
) => {
  const { name, address, pan_number, gst_number } = customerInfo;

  const {
    project_name,
    ref,
    subject,
    sample_data,
    dor,
    order_number,
    discount,
    transportation_fee,
  } = eachOrder;

  const date = new Date(dor);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const monthShort = date.toLocaleString("default", { month: "short" });
  const strPN = `000${taxNumber}`;

  let content = [];
  let parsedData;

  try {
    parsedData = JSON.parse(sample_data);
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }

  content.push([
    { text: "S.No", style: "tableHeader" },
    { text: "Particulars", style: "tableHeader" },
    { text: "Price", style: "tableHeader" },
    { text: "Qty", style: "tableHeader" },
    { text: "Price", style: "tableHeader" },
  ]);

  let serialNumber = 1;
  let totalPrice = 0;
  let row;

  parsedData.forEach((sample) => {
    row = [];
    const { sampleName, physicalParams = [], chemicalParams = [] } = sample;
    row.push({
      text: serialNumber++,
      rowSpan: 1,
      fontSize: 9,
    });
    row.push({
      text: `Testing of ${sampleName}`,
      colSpan: 4,
      fontSize: 9,
      bold: true,
    });

    content.push(row);
    [...physicalParams, ...chemicalParams].forEach((param) => {
      const parsedParam = JSON.parse(param.params || "[]");
      const l = parsedParam.map((eachParamName) => eachParamName.testName);
      const paramNames = l.join(",\n");

      const paramRow = [];

      paramRow.push("");
      paramRow.push({
        text: paramNames,
        fontSize: 9,
      });

      paramRow.push({
        text: parseFloat(Number(param.price).toFixed(2)),
        fontSize: 9,
      });
      paramRow.push({
        text: sample.qty,
        fontSize: 9,
      });
      paramRow.push({
        text: (Number(param.price) * parseInt(sample.qty)).toFixed(2),
        fontSize: 9,
      });

      totalPrice = parseInt(
        totalPrice + Number(param.price) * parseInt(sample.qty),
      );
      content.push(paramRow);
    });
  });

  const discountAmount = calculateDiscountAmount(totalPrice, discount);

  const totalAfterDiscountPlusTransportationFee =
    totalPrice - discountAmount + parseInt(transportation_fee);

  const totalGST = Math.round(
    calculateDiscountAmount(totalAfterDiscountPlusTransportationFee, 18),
    2,
  );

  const totalAgg = Math.round(
    totalAfterDiscountPlusTransportationFee + totalGST,
  );

  //adding subtotal row
  row = [];
  row.push({
    text: "Sub Total",
    colSpan: 3,
    alignment: "right",
    fontSize: 10,
    bold: true,
  });
  row.push("", "");
  row.push({ text: "" });
  row.push({
    text: Number(totalPrice).toFixed(2),
    fontSize: 10,
    colSpan: 1,
    bold: true,
  });
  content.push(row);

  //adding discount
  if (discount > 0) {
    row = [];
    row.push({
      text: "Discount",
      colSpan: 3,
      alignment: "right",
      fontSize: 10,
      bold: true,
    });
    row.push("", "");
    row.push({ text: `${discount} %` });
    row.push({
      text: Math.round(discountAmount, 2),
      fontSize: 10,
      colSpan: 1,
      bold: true,
    });
    content.push(row);
  }

  //Transportation Charges
  if (transportation_fee > 0) {
    row = [];
    row.push({
      text: "Transportation Charges",
      colSpan: 3,
      alignment: "right",
      fontSize: 10,
      bold: true,
    });
    row.push("", "");
    row.push({ text: "" });
    row.push({
      text: Number(transportation_fee).toFixed(2),
      fontSize: 10,
      colSpan: 1,
      bold: true,
    });
    content.push(row);
  }

  //Subtotal - discountedAmount  + transportation fee

  if (discount > 0 || transportation_fee > 0) {
    row = [];
    row.push({
      text: "Sub Total",
      colSpan: 3,
      alignment: "right",
      fontSize: 10,
      bold: true,
    });
    row.push("", "");
    row.push({ text: "" });
    row.push({
      text: Number(totalAfterDiscountPlusTransportationFee).toFixed(2),
      fontSize: 10,
      colSpan: 1,
      bold: true,
    });
    content.push(row);
  }

  if (gst_number.startsWith("36")) {
    //state GST

    row = [];
    row.push({
      text: "CGST",
      colSpan: 3,
      alignment: "right",
      fontSize: 10,
      bold: true,
    });
    row.push("", "");
    row.push({ text: `9%` });
    row.push({
      text: Number(totalGST / 2).toFixed(2),
      fontSize: 10,
      colSpan: 1,
      bold: true,
    });
    content.push(row);

    //state GST

    row = [];
    row.push({
      text: "SGST",
      colSpan: 3,
      alignment: "right",
      fontSize: 10,
      bold: true,
    });
    row.push("", "");
    row.push({ text: `9%` });
    row.push({
      text: Number(totalGST / 2).toFixed(2),
      fontSize: 10,
      colSpan: 1,
      bold: true,
    });
    content.push(row);
  } else {
    //CGST
    row = [];
    row.push({
      text: "GST",
      colSpan: 3,
      alignment: "right",
      fontSize: 10,
      bold: true,
    });
    row.push("", "");
    row.push({ text: `18%` });
    row.push({
      text: Number(totalGST).toFixed(2),
      fontSize: 10,
      colSpan: 1,
      bold: true,
    });
    content.push(row);
  }

  //GST

  //final aggregation
  row = [];
  row.push({
    text: "Total",
    colSpan: 3,
    alignment: "right",
    fontSize: 10,
    bold: true,
  });
  row.push("", "");
  row.push({ text: `` });
  row.push({
    text: Number(totalAgg).toFixed(2),
    fontSize: 10,
    colSpan: 1,
    bold: true,
  });
  content.push(row);

  //amount in words

  const amountInWordsRow = [];

  amountInWordsRow.push({
    text: amountInWords(
      Math.round(totalAfterDiscountPlusTransportationFee + totalGST, 2),
    ),
    fontSize: 10,
    colSpan: 5,
    italics: true,
    alignment: "right",
  });

  amountInWordsRow.push("", "", "", "");

  content.push(amountInWordsRow);

  return [
    {
      columns: [
        {
          width: "70%",
          table: {
            widths: [80, "auto"],
            body: [
              [
                {
                  text: "Buyer's Name",
                  fontSize: 9,
                  border: [false, false, false, false],
                  width: 100,
                },
                {
                  text: name,
                  fontSize: 10,
                  border: [false, false, false, false],
                },
              ],
              [
                {
                  text: "Address",
                  fontSize: 9,
                  border: [false, false, false, false],
                  width: 100,
                },
                {
                  text: address,
                  fontSize: 10,
                  border: [false, false, false, false],
                },
              ],
              [
                {
                  text: "PAN",
                  fontSize: 9,
                  border: [false, false, false, false],
                  width: 100,
                },
                {
                  text: pan_number,
                  fontSize: 10,
                  border: [false, false, false, false],
                },
              ],
              [
                {
                  text: "GST IN",
                  fontSize: 9,
                  border: [false, false, false, false],
                  width: 100,
                },
                {
                  text: gst_number,
                  fontSize: 10,
                  border: [false, false, false, false],
                },
              ],
              [
                {
                  text: "Subject",
                  fontSize: 9,
                  border: [false, false, false, false],
                  width: 100,
                },
                {
                  text: subject,
                  fontSize: 10,
                  border: [false, false, false, false],
                },
              ],
              [
                {
                  text: "Project",
                  fontSize: 9,
                  border: [false, false, false, false],
                  width: 100,
                },
                {
                  text: project_name,
                  fontSize: 10,
                  border: [false, false, false, false],
                },
              ],
              [
                {
                  text: "Ref",
                  fontSize: 9,
                  border: [false, false, false, false],
                  width: 100,
                },
                {
                  text: ref,
                  fontSize: 10,
                  border: [false, false, false, false],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
          },
        },
        {
          width: "30%",
          table: {
            widths: ["auto", "auto"],
            body: [
              // [
              //   { text: "Tax Invoice No:", fontSize: 10 },
              //   { text: `TI/${year}/${strPN.slice(-4)}`, fontSize: 10 },
              // ],
              // [
              //   { text: "Invoice Date:", fontSize: 10 },
              //   { text: `${day}/${monthShort}/${year}`, fontSize: 10 },
              // ],

              ...(idx === 0
                ? [
                    [
                      { text: "Tax Invoice No:", fontSize: 10 },
                      {
                        text: `TI/${year}/${strPN.slice(-4)}`,
                        fontSize: 10,
                      },
                    ],
                    [
                      { text: "Invoice Date:", fontSize: 10 },
                      {
                        text: `${day}/${monthShort}/${year}`,
                        fontSize: 10,
                      },
                    ],
                  ]
                : []), // Include only when idx === 0
              [
                { text: "Order No:", fontSize: 10 },
                {
                  text: `${month}/${year}/${order_number}`,
                  fontSize: 10,
                },
              ],
              [
                { text: "Order Date:", fontSize: 10 },
                { text: `${day}/${monthShort}/${year}`, fontSize: 10 },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
          },
        },
      ],
      margin: [0, 0, 0, 10], // margin to separate header from content table
    },

    {
      table: {
        headerRows: 1,
        widths: ["auto", "*", "auto", "auto", "auto"],
        body: content,
      },
    },
  ];
};
