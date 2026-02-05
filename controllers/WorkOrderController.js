const { Op } = require("sequelize");
const PdfPrinter = require("pdfmake");
const path = require("path");
const AWS = require("aws-sdk");
const db = require("../models");
const {
  qrScanner,
  RKsign,
  sagarSign,
  vizagStamp,
} = require("../reports/filePaths");
const WorkOrder = db.WorkOrder;
const { createHeader } = require("../reports/header");
const { createFooter } = require("../reports/footer");
// Fonts for PDF
const fonts = {
  Roboto: {
    normal: path.join(__dirname, "../fonts/Open/OpenSans-Regular.ttf"),
    bold: path.join(__dirname, "../fonts/Open/OpenSans-Bold.ttf"),
    italics: path.join(__dirname, "../fonts/Open/OpenSans-Italic.ttf"),
    bolditalics: path.join(__dirname, "../fonts/PlayfairDisplay-Bold.ttf"),
  },
};
const printer = new PdfPrinter(fonts);

// AWS S3 Config

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const uploadFileToS3 = async (file) => {
  if (!file) throw new Error("No file provided");

  const params = {
    Bucket: process.env.PO_BUCKET, // ✅ Must match your env
    Key: file.originalname, // filename in S3
    Body: file.buffer, // file data (from multer)
  };

  try {
    const result = await s3.upload(params).promise();
    console.log("File uploaded:", result.Location);
    return result.Location;
  } catch (err) {
    console.error("S3 upload error:", err);
    throw err;
  }
};
// 🔹 generateRefNo (fixed version)
async function generateRefNo(location, date) {
  // Start and end of current year (or month if you prefer)
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const endOfYear = new Date(date.getFullYear(), 11, 31, 23, 59, 59);

  // Count existing WOs for this location this year
  const count = await WorkOrder.count({
    where: {
      location,
      date: { [Op.between]: [startOfYear, endOfYear] },
    },
  });

  // Increment count for new WO
  const newCount = count + 1;

  // Ref format: KDMEIPL/<Location>/<Year>/<Count>
  const month = (date.getMonth() + 1).toString().padStart(2, "0");

  // Ref format: KDMEIPL/<Location>/<GT>/<Month>/<Year>/<Count>
  const gt = "GT"; // replace if GT comes dynamically
  return `KDMEIPL/${location}/${gt}/${date.getFullYear()}/${month}/${newCount}`;
}

// Create Work Order
const createWorkOrder = async (req, res) => {
  try {
    const {
      vendor_id,
      location,
      date,
      contracter_name,
      client_name,
      address,
      gst,
      kind_attention,
      subject,
      preamble,
      items: itemsArray,
      payment_terms,
      conditions,
    } = req.body;

    if (!location)
      return res.status(400).json({ error: "Location is required" });

    // Format date
    const woDate = date ? new Date(date) : new Date();

    // ✅ Generate unique ref_no based on count
    //  const ref_no = await generateRefNo(location, woDate);
    // const formattedDate = woDate.toLocaleDateString("en-GB");
    //  // DD/MM/YYYY
    // const formattedDate = moment().format("DD-MM-YYYY");
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, "0")}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}-${now.getFullYear()}`;

    // Generate unique ref_no
    const ref_no = await generateRefNo(location, woDate);

    // Parse arrays safely
    const items =
      typeof itemsArray === "string"
        ? JSON.parse(itemsArray)
        : itemsArray || [];
    const paymentTerms =
      typeof payment_terms === "string"
        ? JSON.parse(payment_terms)
        : payment_terms || [];
    const otherConditions =
      typeof conditions === "string"
        ? JSON.parse(conditions)
        : conditions || [];
    let signStack;
    if (location?.toLowerCase().includes("viz")) {
      signStack = [
        {
          stack: [
            {
              image: RKsign,
              width: 100,
              height: 35,
              alignment: "center",
              margin: [0, 10, 0, 0],
            },
            {
              image: vizagStamp,
              width: 65,
              height: 65,
              alignment: "center",
              margin: [0, -55, 0, 0], // ✅ moves stamp *over* the sign (merged look)
            },
          ],
          alignment: "center",
        },
      ];
    } else if (location?.toLowerCase().includes("hyd")) {
      signStack = [
        {
          image: sagarSign, // ✅ Hyderabad already includes stamp
          width: 110,
          height: 40,
          alignment: "center",
          margin: [0, 0, 0, 0],
        },
      ];
    }

    // PDF definition
    const docDefinition = {
      pageMargins: [40, 68, 40, 40],
      header: (currentPage, pageCount, pageSize) => {
        if (currentPage === 1) {
          // Keep your original first-page header
          return createHeader(currentPage, pageCount, pageSize);
        } else {
          // For other pages: show Ref No. and Date at the top
          return {
            stack: [
              {
                columns: [
                  {
                    text: `Ref. No.: ${ref_no}`,
                    alignment: "left",
                    bold: true,
                    fontSize: 10,
                  },
                  {
                    text: `Date: ${formattedDate}`,
                    alignment: "right",
                    bold: true,
                    fontSize: 10,
                  },
                ],
                margin: [40, 20, 40, 10], // spacing from top of the page
              },
              {
                canvas: [
                  {
                    type: "line",
                    x1: 0,
                    y1: 0,
                    x2: pageSize.width - 80, // line width depends on page width
                    y2: 0,
                    lineWidth: 0.5,
                    lineColor: "#000000",
                  },
                ],
                margin: [40, 0, 40, 10],
              },
            ],
          };
        }
      },
      // no header on other pages

      footer: (currentPage, pageCount) => {
        let footerText = "";

        if (location?.toLowerCase().includes("viz")) {
          footerText =
            "Plot No.93, E - Block, Autonagar, Visakhapatnam – 530012, Andhra Pradesh\nE-mail: mrk@kdmengineers.com    Website: www.kdmengineers.com    Contact: +91 9912944495";
        } else if (location?.toLowerCase().includes("hyd")) {
          footerText =
            "9th Floor, Pardha's Picasa, D Block, above Vijetha Supermarket, D Block, Kavuri Hills, Madhapur, Hyderabad, Telangana 500081\nE-mail: geotechnical.hyd@kdmengineers.com    Website: www.kdmengineers.com    Contact: +91 9912801114";
        } else {
          footerText =
            "KDM Engineers (India) Pvt. Ltd.\nCorporate Office – www.kdmengineers.com";
        }

        return {
          margin: [40, 0, 40, 25], // ✅ adds small bottom spacing
          stack: [
            {
              canvas: [
                { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5 },
              ],
              margin: [0, 0, 0, 4],
            },
            {
              text: footerText,
              fontSize: 8.5,
              alignment: "center",
              bold: true,
              margin: [0, 0, 0, 2],
            },
            {
              columns: [
                {
                  text: "", // empty to keep left aligned space
                  width: "*",
                },
                {
                  text: `Page ${currentPage} of ${pageCount}`,
                  alignment: "right",
                  fontSize: 8,
                  italics: true,
                  margin: [0, -10, 0, 0], // ✅ moves page number up beside address
                },
              ],
            },
          ],
        };
      },

      content: [
        {
          text: "WORK ORDER",
          style: "title",
          alignment: "center",
          margin: [0, 10, 0, 0], // push down below header
        },
        {
          columns: [
            { text: `Ref. No.: ${ref_no}`, alignment: "left", bold: true },
            { text: `Date: ${formattedDate}`, alignment: "right", bold: true },
          ],
          margin: [0, 0, 0, 20],
        },

        {
          text: [
            { text: "To\n", bold: true },
            { text: `${contracter_name}\n`, bold: true },
            { text: `${address}\n` },
            { text: "GST: ", bold: true },
            { text: `${gst || "-"}\n` },
            { text: "Kind Attention: ", bold: true },
            { text: `${kind_attention}\n` },
            { text: "Sub: ", bold: true },
            { text: `${subject}\n` },
            { text: "Preamble: ", bold: true },
            { text: `${preamble}` },
          ],
          style: "body",
          margin: [0, 0, 0, 5], // reduce bottom margin
        },

        { text: "Scope of Work:", bold: true, margin: [0, 10, 0, 5] },
        {
          table: {
            headerRows: 1,
            widths: ["auto", "*", 50, "auto", "auto"], // increased width for Description column
            body: [
              [
                { text: "Sl. No", style: "tableHeader" },
                {
                  text: "Description",
                  style: "tableHeader",
                  alignment: "center",
                },
                { text: "Unit", style: "tableHeader" },
                { text: "Qty", style: "tableHeader" },
                { text: "Rate (Rs.)", style: "tableHeader" },
              ],
              ...items.map((it, i) => [
                { text: i + 1, style: "tableItem" },
                {
                  text: it.description || "-",
                  style: "tableItem",
                  alignment: "left",
                },
                { text: it.unit || "-", style: "tableItem" },
                { text: it.qty || 0, style: "tableItem" },
                { text: it.rate || 0, style: "tableItem" },
              ]),
            ],
          },
        },

        // Dynamic Payment Terms
        {
          text: "1. Payment Terms",
          style: "subheading",
          margin: [0, 10, 0, 5],
          pageBreak: (currentNode, followingNodesOnPage, nodesOnNextPage) => {
            return followingNodesOnPage.length < 2; // move to next page if <2 lines available
          },
        },
        ...(payment_terms || []).map((pt) => ({ text: `• ${pt}` })),

        // Dynamic Other Conditions
        {
          text: "2. Other Conditions",
          style: "subheading",
          margin: [0, 10, 0, 5],
          pageBreak: (currentNode, followingNodesOnPage, nodesOnNextPage) => {
            return followingNodesOnPage.length < 2; // move to next page if <2 lines available
          },
        },
        ...(conditions || []).map((c) => ({ text: `• ${c}` })),

        // 🔹 Static Section
        { text: "Note:", style: "subheading", margin: [0, 10, 0, 5] },
        {
          text: "Taxes as applicable shall be deducted at source as per GOI norms and all the Payments will be made on back to back basis.",
          margin: [0, 0, 0, 10],
          style: "body",
          pageBreak: (currentNode, followingNodesOnPage, nodesOnNextPage) => {
            return followingNodesOnPage.length < 2; // move to next page if <2 lines available
          },
        },

        {
          text: "3. Taxes and Duties",
          style: "subheading",
          margin: [0, 10, 0, 5],
          pageBreak: (currentNode, followingNodesOnPage, nodesOnNextPage) => {
            return followingNodesOnPage.length < 2; // move to next page if <2 lines available
          },
        },
        // 5. Taxes and Duties - Paragraph
        {
          text: "No separate payment shall be made on account of taxes other than GST. The contract price is inclusive of all input credits and all applicable taxes and duties etc. and it shall remain firm during the period of this contract.",
          margin: [0, 10, 0, 10],
          style: "body",
          alignment: "justify", // ✅ Make text justified
          lineHeight: 1.2,
        },

        // GST Lines - Simple Paragraphs
        {
          text: "1. GST will be paid extra as per the applicability.",
          margin: [0, 0, 0, 2],
          style: "body",
        },
        {
          text: "2. Our GSTIN No. is 36AAECK9447L1ZX.",
          margin: [0, 0, 0, 2],
          style: "body",
        },
        {
          text: "3. Our Pan No. is AAECK9447L.",
          margin: [0, 0, 0, 10],
          style: "body",
        },

        // Small Subheading
        {
          text: "4. Tax Clauses in Orders",
          style: "subheading",
          margin: [0, 10, 0, 5],
          pageBreak: (currentNode, followingNodesOnPage, nodesOnNextPage) => {
            return followingNodesOnPage.length < 2; // move to next page if <2 lines available
          },
        },

        // Numbered GST Points starting from 1
        {
          ol: [
            "In case of any credit, refund or other benefit denied or delayed by GST Department to KDM Engineers (India) Pvt. Ltd. due to non-compliance by the Owner/Contractor (Such as failure to upload the details of sale on GST portal, failure to pay GST to the Government or due to non-furnishing of returns/document or furnishing of incorrect or incomplete documents/returns by the contractor), the contractor has to reimburse the loss to KDM Engineers (India) Pvt. Ltd. including but not limited to the tax loss, interest and penalty.",
            "In case of non-submission of return/document related to GST for previous month, the relevant amount will be withheld from the invoice of the current month and it will be released after submission of relevant documents as per GST rules.",
            "Under any circumstances, KDM Engineers (India) Pvt. Ltd. shall make no reimbursement for the previous period when such amounts have suffered GST under RCM. GST will be paid from the date of Intimation to KDM Engineers (India) Pvt. Ltd. with Signed and Stamped Copy of GST Registration Certificate and on Submission of TAX invoice as per GST law.",
            "HSN/SAC CODE should be mentioned in the tax invoice as per the order. No deviation shall be allowed. The difference in the tax amount for wrong codification in the invoice shall be recovered from the bills or from the outstanding amounts.",
            "Statutory Compliance: You shall abide by and fully comply with all the statutory regulations applicable for execution of this work, i.e., PF Act, Employee State Insurance Act, Minimum Wages Act and furnish certified copies of such approval/compliance as and when required by us.",
          ],
          type: "number",
          style: "body",
          alignment: "justify", // ✅ Make text justified
          lineHeight: 1.2,
        },

        // 7. General Conditions
        {
          text: "5. General Conditions",
          style: "subheading",
          margin: [0, 10, 0, 5],
          pageBreak: (currentNode, followingNodesOnPage, nodesOnNextPage) => {
            return followingNodesOnPage.length < 2; // move to next page if <2 lines available
          },
        },
        {
          ol: [
            "KDM Engineers (India) Pvt. Ltd. shall not be responsible for any mishap/loss/damage of equipment or human resource or due to some natural calamities caused during the course of the work. The agency shall be fully responsible and shall take full care of any mishap, accident, disaster, or any unforeseen circumstances while doing testing work. Any consequential legal/financial/judicial matters shall be full liability of the agency. KDM Engineers (India) Pvt. Ltd. shall not be liable in what so ever manner.",
            "Test Data and Results shall be the copyright of KDM Engineers (India) Pvt. Ltd. In no way the testing agency shall supply or use these data and drawings to any other agency or for any other work.",
          ],
          style: "body",
          type: "number",
          alignment: "justify", // ✅ Make text justified
          lineHeight: 1.2,
        },

        // 8. Additional Conditions
        {
          text: "6. Additional Conditions",
          style: "subheading",
          margin: [0, 10, 0, 5],
          pageBreak: (currentNode, followingNodesOnPage, nodesOnNextPage) => {
            return followingNodesOnPage.length < 2; // move to next page if <2 lines available
          },
        },
        {
          ol: [
            "The agency shall depute qualified and competent Engineers/Supervisors, sufficient number of skilled/unskilled labour and other resource to carry out the work and shall be available at site during work.",
            "The agency shall be solely responsible to complete the given work in the given time schedule as per instruction of our site engineer.",
            "The agency will abide by and strictly comply with all the safety rules and regulation framed by statutory authorities during execution of the project. All the safety accessories will be returned after completion of work.",
            "No idle charges shall be paid on any accounts.",
            "The agency will not employ any labour below 18 years.",
            "The quantity mentioned is tentative and may increase or decrease up to any extent as per the site requirement without variation in mentioned rate.",
            "KDM Engineers (India) Pvt. Ltd. reserves the right to terminate this agreement any time during course of the work, if (i) The progress of the work is not found satisfactory as per the time frame, (ii) The work being done is not found of desired quality as per nomenclature of items and terms and conditions. In such an eventuality, the payment due to the agency shall be forfeited.",
          ],
          style: "body",
          type: "number",
          alignment: "justify", // ✅ Make text justified
          lineHeight: 1.2,
        },

        // 9. Insurance
        {
          text: "7. Insurance",
          style: "subheading",
          margin: [0, 10, 0, 5],
          pageBreak: (currentNode, followingNodesOnPage, nodesOnNextPage) => {
            return followingNodesOnPage.length < 2; // move to next page if <2 lines available
          },
        },
        {
          ol: [
            "The agency shall insure himself against any liability under any workmen compensation ordinance or equivalent prevailing legislation and any modifications thereof, which may be put in force by the government during the continuance of the contract.",
            "In the event of any loss or damage suffered in consequence of any accident or injury or disease resulting from his work to any workman or other person in the employment of the agency, the agency shall pay compensation to the victims.",
            "The agency shall in respect of his employees who are employed by him pay rates of wages, observed hours of labour and provide other facilities not less favourable than those required by law.",
          ],
          style: "body",
          type: "number",
          alignment: "justify", // ✅ Make text justified
          lineHeight: 1.2,
        },

        // 10. Confidentiality
        {
          text: "8. Confidentiality",
          style: "subheading",
          margin: [0, 10, 0, 5],
          pageBreak: (currentNode, followingNodesOnPage, nodesOnNextPage) => {
            return followingNodesOnPage.length < 4; // move to next page if <2 lines available
          },
        },
        {
          text: "This work order or its terms & conditions will neither be disclosed to any third party nor will any work-related information or documents be given related to projects contracted for, to any party without permission of KDM Engineers (India) Pvt. Ltd.",
          style: "body",
          alignment: "justify", // ✅ Make text justified
          lineHeight: 1.2,
        },

        // 11. Arbitration
        {
          text: "9. Arbitration",
          style: "subheading",
          margin: [0, 10, 0, 5],
          pageBreak: (currentNode, followingNodesOnPage, nodesOnNextPage) => {
            return followingNodesOnPage.length < 2; // move to next page if <2 lines available
          },
        },
        {
          text: "In case of any disputes of any nature during the project, it is agreed that both parties will continue their respective jobs and complete the project, i.e., under no circumstances should the project suffer due to any non-issue of drawing/decision/estimates.",
          style: "body",
          alignment: "justify", // ✅ Make text justified
          lineHeight: 1.2,
        },

        // 12. Integrity and Ethics of Business
        {
          text: "10. Integrity and Ethics of Business",
          style: "subheading",
          margin: [0, 5, 0, 0],
          pageBreak: (currentNode, followingNodesOnPage, nodesOnNextPage) => {
            return followingNodesOnPage.length < 2; // move to next page if <2 lines available
          },
        },
        {
          text: "The Agency shall follow and maintain integrity and ethics of the construction industry with utmost care and attention. The contractor shall not deal or take up similar business of similar nature or type of work or item with our client either directly or indirectly or through other agency till the completion of this contracted work. Any deviation shall be viewed seriously and may lead to termination of contract besides forfeiting the value of work done till then.",
          style: "body",
          alignment: "justify", // ✅ Make text justified
          lineHeight: 1.2,
        },

        // Signature Section
        // Determine sign image based on location

        // Signature Section
        {
          stack: [
            {
              columns: [
                {
                  width: "50%",
                  stack: [
                    {
                      stack: [
                        {
                          text: "For M/s KDM Engineers (India) Pvt. Ltd.",
                          bold: true,
                          fontSize: 9,
                          margin: [0, -15, 0, 5],
                          alignment: "center",
                        },
                        // 👇 Include your RK/Vizag sign image here if any
                        ...(signStack || []),
                        {
                          text: "Authorized Signatory",
                          bold: true,
                          fontSize: 9,
                          alignment: "center",
                          margin: [0, 5, 0, 0],
                        },
                      ],
                      alignment: "center",
                    },
                  ],
                  alignment: "center",
                },
                {
                  width: "50%",
                  stack: [
                    {
                      text: contracter_name,
                      bold: true,
                      fontSize: 9,
                      margin: [0, -15, 0, 40],
                      alignment: "center",
                    },
                    {
                      text: "Accepted & Received",
                      bold: true,
                      fontSize: 9,
                      alignment: "center",
                    },
                  ],
                  alignment: "center",
                },
              ],
              columnGap: 20,
              alignment: "center",
            },
          ],
          margin: [0, 30, 0, 0],
          pageBreak: "avoid", // ✅ prevents *any part* from splitting across pages
        },
      ],
      styles: {
        tableItem: { fontSize: 10, margin: [0, 1, 0, 1] }, // smaller font size and tight spacing

        headerLeft: { fontSize: 12, bold: true, alignment: "left" },
        headerRight: { fontSize: 12, bold: true, alignment: "right" },
        title: {
          fontSize: 15,
          bold: true,
          decoration: "underline",
          margin: [0, 0, 0, 8],
        },
        refNo: { fontSize: 12, italics: true, margin: [0, 0, 0, 10] },
        subheading: {
          fontSize: 11,
          bold: true,
          decoration: "underline",
          margin: [0, 15, 0, 6],
        },
        subheadingSmall: { fontSize: 10, bold: true, margin: [0, 8, 0, 4] },
        body: {
          fontSize: 10,
          margin: [0, 2, 0, 2],
          alignment: "justify", // ✅ Justify all body text by default
          lineHeight: 1.2,
        },
        tableHeader: { fontSize: 10, bold: true, fillColor: "#f2f2f2" },
        label: { fontSize: 10, bold: true },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);
      const fileName = `WO-${ref_no}.pdf`;

      const uploadParams = {
        Bucket: process.env.WO_BUCKET,
        Key: fileName,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      };
      const uploadResult = await s3.upload(uploadParams).promise();
      const totalAmount = items.reduce(
        (sum, it) => sum + Number(it.qty || 0) * Number(it.rate || 0),
        0,
      );

      const wo = await WorkOrder.create({
        ref_no,
        date,
        vendor_id,
        contracter_name,
        client_name,
        address,
        gst,
        kind_attention,
        subject,
        preamble,
        location,
        items,
        payment_terms,
        conditions,
        total_amount: totalAmount,
        file_url: uploadResult.Location,
      });

      res.status(201).json(wo);
    });

    pdfDoc.end();
  } catch (err) {
    console.error("Error creating WO:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get All WOs
const getAllWorkOrders = async (req, res) => {
  try {
    const orders = await WorkOrder.findAll({ order: [["created_at", "DESC"]] });
    res.json(orders);
  } catch (err) {
    console.error("Fetch WO Error:", err);
    res.status(500).json({ error: "Failed to fetch work orders" });
  }
};

module.exports = { createWorkOrder, getAllWorkOrders };
