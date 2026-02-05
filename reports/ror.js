const PdfPrinter = require("pdfmake");
const path = require("path");
// const { JSON } = require("sequelize");
const { RKsign } = require("./filePaths");

const fonts = {
  Roboto: {
    normal: path.join(__dirname, "../fonts/Open/OpenSans-Regular.ttf"),
    bold: path.join(__dirname, "../fonts/Open/OpenSans-Bold.ttf"),
    italics: path.join(__dirname, "../fonts/Open/OpenSans-Italic.ttf"),
    bolditalics: path.join(__dirname, "../fonts/PlayfairDisplay-Bold.ttf"),
  },
};

const printer = new PdfPrinter(fonts);

const generateReviewRequestPDF = (orderDraft, res) => {
  const jobDate = new Date(orderDraft.dor);
  const formattedJobDate = jobDate.toLocaleDateString("en-IN");
  const jobMonth = String(jobDate.getMonth() + 1).padStart(2, "0");
  const jobYear = jobDate.getFullYear();
  const customJobNo = `${jobMonth}/${jobYear}/${orderDraft.order_number}`;
  console.log(orderDraft, "orderDraft87");
  let checklist = {};
  try {
    checklist = JSON.parse(orderDraft?.checklist || "{}");
  } catch (err) {
    console.error("Invalid checklist JSON:", err);
  }

  const {
    capability = "Yes",
    discussions = "No",
    requirements = "Yes",
  } = checklist;
  const parsedSamples = JSON.parse(orderDraft.sample_data || "[]");
  let testRows = [];

  if (orderDraft.division === "NDT") {
    parsedSamples.forEach((sample, index) => {
      testRows.push([
        { text: String(index + 1), alignment: "center" },
        { text: "-", alignment: "center" }, // Type of Sample Submitted (empty)
        { text: sample.description || "-", alignment: "left" },
        { text: sample.testMethod || "-", alignment: "center" },
        { text: "", alignment: "center" }, // Remarks
      ]);
    });
  } else {
    parsedSamples.forEach((sample, sampleIndex) => {
      const {
        sampleName,
        chemicalParams = [],
        physicalParams = [],
        test_requirement,
        sampleType,
      } = sample;
      let tests = [...chemicalParams, ...physicalParams];

      // 🔹 Assign test details based on paramId
      tests.forEach((test) => {
        switch (Number(test.paramId)) {
          // 🧪 Chemical Properties (for Cement etc.)
          // case 20240919122530150:
          //   test.params = JSON.stringify([
          //     {
          //       testName: "Chemical Properties",
          //       method: "IS:4032",
          //       remarks: "",
          //     },
          //   ]);
          //   break;
          case 20240919122403433:
            test.params = JSON.stringify([
              {
                testName: "Specific Gravity",
                method: "IS:1727",
                remarks: "",
              },
              {
                testName: "Fineness by Blaine Air Permeability Method",
                method: "IS:4031 (Part 2)-1999",
                remarks: "",
              },
              {
                testName: "Residue of 45 Microns(%) ",
                method: "IS:1727 Clause 6.2",
                remarks: "",
              },
              {
                testName: "Compressive Strength",
                method: "IS:16714",
                remarks: "",
              },
              {
                testName: "Slag Activity Index",
                method: "IS:4031 (Part 6)-1988",
                remarks: "",
              },
            ]);
            break;
          case 20240924165520209:
            test.params = JSON.stringify([
              {
                testName: "Fineness by Blaine Air Permeability Method",
                method: "IS:1727-1967, Cl.6.1",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName:
                  "Particles Retained on 45microns IS Sieve (Wet Sieving)",
                method: "IS:1727-1967, Cl.6.2",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Lime Reactivity",
                method: "IS:1727-1967, Cl.9.0",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Compressive strength at 28days w.r.t Control sample",
                method: "IS:1727-1967, Cl.10.0",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Soundness by Autoclave Method",
                method: "IS:4031 (Part 3)-1988, CL.6",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Specific Gravity",
                method: "IS:1727-1967, Cl.15.0",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
            ]);
            break;
          case 20240919122530150:
            test.params = JSON.stringify([
              {
                testName: "Insoluble Residue",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },

              {
                testName: "Magnesium oxide(MgO)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Sulphate (as SO3)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Sulphide Sulphur",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName:
                  "Major oxides(As formula) CaO+ MgO+ l/3 Al2O3/SiO,+ 2/3 Al2O3, CaO+ MgO+Al2O3/SiO2",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },

              {
                testName: "Chloride as Cl",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Total loss on ignition",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
            ]);
            break;
          case 20250321143600228:
            test.params = JSON.stringify([
              {
                testName: "pH Value@25°C",
                method: "IS 3025 Part 11:2022",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName:
                  "ml of 0.02N NaOH required for 100 ml of sample with phenolphthalein as an indicator.",
                method: "IS 3025 Part 22:2024",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName:
                  "ml of 0.02N H2SO4 required for 100 ml of sample with mixed indicator",
                method: "IS 3025 Part 23:2023",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Organic Solids",
                method: "IS 3025 ( Part 18):2022",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "In Organic Solids",
                method: "IS 3025 ( Part 18):2022",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Chloride as Cl",
                method: "IS 3025 Part 32:1988(RA 2019)",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Sulphates as SO3",
                method: "IS 3025 Part 24/sec 1:2022",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Suspended Matter",
                method: "IS 3025 ( Part 17):2022",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
            ]);
            break;

          case 20250510150216784:
            test.params = JSON.stringify([
              {
                testName: "pH Value@25°C",
                method: "IS 3025 Part 11:2022",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Total Alkalinity	mg/l",
                method: "	IS 3025 Part 23:2023",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Total dissolved solids	mg/l",
                method: "IS 3025 ( Part 16):2023",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Chlorides as Cl	mg/l",
                method: "IS 3025 Part 32:1988(RA 2019)",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Sulphates as SO4",
                method: "IS 3025 Part 24/sec 1:2022",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Total Hardness",
                method: "IS 3025 ( Part 21)2009",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Calcium",
                method: "IS 3025 ( Part 40)2024",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Magnisium",
                method: "IS 3025 ( Part 46):2023",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Electrical Conductivity",
                method: "IS 3025 : Part 14:2013(RA 2023)",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Odour",
                method: "IS 3025 (Part 5) : 2018",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Taste",
                method: "IS 3025 (Part 7) :2017-RA 2022",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Nitrate as NO3 ",
                method: "APHA 4500 NO3",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Fluoride as F",
                method: "APHA 4500 F",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Iron as Fe",
                method: "IS 3025 (Part 53) : 2024",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: " Colour Hazeen Units",
                method: "IS 3025 (Part 4) : 2021",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Turbidity",
                method: "IS 3025 : Part 10 : Sec 2 : 2024    ",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
            ]);
            break;

          case 20250618170310955:
            test.params = JSON.stringify([
              {
                testName: "Chloride as Cl",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Magnesia as MgO",
                method: "IS 1727:1967 RA 2018",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Silica as SiO2",
                method: "IS 1727:1967 RA 2018",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Total loss on ignition",
                method: "	IS 1727:1967 RA 2018",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName:
                  "Total Sulphur content calculated as Sulphuricanhydride (SO3)",
                method: "IS 1727:1967 RA 2018",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },

              {
                testName:
                  "Silicon dioxide(SiO2)+ ferricoxide(Fe2o3) + alumina oxide(Al2O3)",
                method: "IS 1727:1967 RA 2018",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },

              {
                testName:
                  "Available alkalis as equivalent sodium oxide (Na2O) in percent by mass,Max	",
                method: "IS 3812:Part-1:2013 RA 2022(Annex-c)",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
            ]);
            break;
          case 20250612150326596:
            test.params = JSON.stringify([
              {
                testName: "Loss on Ignition(% by mass)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Insoluble Residue(% by mass)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName:
                  "Total Sulphur content calculated as sulphuric anhydride(SO3) (% by mass)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Magnesia (MgO) (% by mass)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Total Chloride (Cl) (% by mass)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Alkali content as NaO (% by mass)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Sulphur Sulphide (S)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
            ]);
            break;
          case 20250612145350341:
            test.params = JSON.stringify([
              {
                testName: "Loss on Ignition(% by mass)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Insoluble Residue(% by mass)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName:
                  "Total Sulphur content calculated as sulphuric anhydride(SO3) (% by mass)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Magnesia (MgO) (% by mass)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Total Chloride (Cl) (% by mass)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Alkali content as NaO (% by mass)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
            ]);
            break;

          // 🧱 Cement - Physical Properties
          case 20250617145922250:
          case 20250612150349126:
          case 20250617145803557:
          case 20250612145414015:
          case 20250612141609634:
            test.params = JSON.stringify([
              {
                testName: "Normal Consistency",
                method: "IS:4031 (Part-4)",
                remarks: "",
              },
              {
                testName: "Initial Setting Time",
                method: "IS:4031 (Part-5)",
                remarks: "",
              },
              {
                testName: "Final Setting Time",
                method: "IS:4031 (Part-5)",
                remarks: "",
              },
              // { testName: "Density", method: "IS:4031 (Part-11)", remarks: "" },
              {
                testName: "Compressive Strength",
                method: "IS:4031 (Part-6)",
                remarks: "",
              },
              {
                testName: "Fineness by Blaine's Air Permeability Method",
                method: "IS:4031 (Part-2)",
                remarks: "",
              },
              {
                testName: "Soundness (by Le-Chatelier Method)",
                method: "IS:4031 (Part-3)",
                remarks: "",
              },
              {
                testName: "Specific Gravity",
                method: "IS:4031 (Part-11)",
                remarks: "",
              },
            ]);
            break;
          case 20250617145740212:
          case 20250505124404605:
            test.params = JSON.stringify([
              {
                testName: "Loss on Ignition",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Insoluble Residue",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName:
                  "Total Sulphur content calculated as sulphuric anhydride(SO3)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Magnesia (MgO)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Total Chloride (Cl)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },

              {
                testName:
                  "Lime Ratio as below formula Cao-0.7SO3/2.8 SiO2+1.2Al2O3+0.65Fe2O3",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: " Ratio to Al2O3/Fe2O3 %",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Alkali Content",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
            ]);
            break;
          case 20251226105135330:
            test.params = JSON.stringify([
              {
                testName: "Determination of Chlorides",
                method: "IS 14959 Part 2 2001 RA 2021",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Determination of Soluble Sulphates",
                method: "BS 1881 Part 124",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
            ]);
            break;
          case 20250408120901945:
            test.params = JSON.stringify([
              {
                testName: "Alkali Aggregate reactivity",
                method: "IS 2386 Part-7 1963",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Chlorides, Sulphates",
                method: "IS 4032 1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
            ]);
            break;
          case 20251201134153960:
            test.params = JSON.stringify([
              {
                testName: "Yield Strength(N/mm²)",
                method: "IS 1608 Part-1",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Tensile Strength(N/mm²)",
                method: "IS 1608 Part-1",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Elongation(%)",
                method: "IS 1608 Part-1",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Bend",
                method: "IS 1599",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Uniformity of Coating",
                method: "IS 2633",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Adhesion Test",
                method: "IS 2629",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
            ]);
            break;
          case 20260103132129987:
            test.params = JSON.stringify([
              {
                testName: "Yield Strength(N/mm²)",
                method: "IS 1608 Part-1",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Tensile Strength(N/mm²)",
                method: "IS 1608 Part-1",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Elongation(%)",
                method: "IS 1608 Part-1",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Bend",
                method: "IS 1599",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Uniformity of Coating",
                method: "IS 2633",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Adhesion Test",
                method: "IS 2629",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
            ]);
            break;
          case 20240926120904378:
            test.params = JSON.stringify([
              {
                testName: "Water Absorption(%)",
                method: "IS 13630 Part-2",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Breaking Strength(N)",
                method: "IS 13630 Part-6",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Modulus of Rupture(N/sq.mm)",
                method: "IS 13630 Part-6",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Mohs Hardness",
                method: "IS 13630 Part-13",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Moisture Expansion",
                method: "IS 13630 Part-10",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Dimensions",
                method: "IS 13630 Part-1",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
            ]);
            break;
          case 20251226103548509:
            test.params = JSON.stringify([
              {
                testName: "Alkali Aggregate reactivity",
                method: "IS 2386 Part-7 1963",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Chlorides, Sulphates",
                method: "IS 4032 1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Organic Impurities",
                method: "IS 2386 Part 2 1963",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
            ]);
            break;
          case 20250618124725361:
            test.params = JSON.stringify([
              {
                testName: "Moisture content",
                method: "IS 15388 2003 RA 2022",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Loss on Ignition",
                method: "IS 1727:1967 RA 2018",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Alkalies as NalO, percent",
                method: "IS 15388 2003 RA 2022",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Silicon di Oxide",
                method: "IS 1727:1967 RA 2018",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
            ]);
            break;

          case 20250617145859476:
            test.params = JSON.stringify([
              {
                testName: "Loss on Ignition",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Insoluble Residue",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName:
                  "Total Sulphur content calculated as sulphuric anhydride(SO3)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
              {
                testName: "Magnesia (MgO)",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },

              {
                testName:
                  "Lime Ratio as below formula Cao-0.7SO3/2.8 SiO2+1.2Al2O3+0.65Fe2O3",
                method: "IS 4032:1985 RA 2019",
                remarks: "This Test Paremeter is not coverd under NABL Scope",
              },
            ]);
            break;

          //HT Stand
          case 20250929124141095:
            test.params = JSON.stringify([
              {
                testName: "Nominal Dia",
                method: "IS: 14268",
                remarks: "Test parameters are not covered under NABL scope",
              },
              {
                testName: "Lay Length",
                method: "IS: 14268",
                remarks: "Test parameters are not covered under NABL scope",
              },
              {
                testName: "Weight per Meter",
                method: "IS: 14268",
                remarks: "Test parameters are not covered under NABL scope",
              },
              {
                testName: "Yield Load",
                method: "IS: 1608 part-1",
                remarks: "Test parameters are not covered under NABL scope",
              },
              {
                testName: "Breaking Load",
                method: "IS: 1608 part-1",
                remarks: "Test parameters are not covered under NABL scope",
              },
              {
                testName: "Elongation",
                method: "IS: 1608 part-1",
                remarks: "Test parameters are not covered under NABL scope",
              },
            ]);
            break;

          // 🧵 Rebar Testing (TMT)
          case 20240919132722648:
          case 20240926123350854:
            test.params = JSON.stringify([
              // { testName: "Mass per meter", method: "IS:1786", remarks: "" },
              {
                testName: "Ultimate Tensile Strength",
                method: "IS:1608(Part-1)",
                remarks: "",
              },
              {
                testName: "Elongation",
                method: "IS:1608(Part-1)",
                remarks: "",
              },
              {
                testName: "Yield Stress",
                method: "IS:1608(Part-1)",
                remarks: "",
              },
              { testName: "Bend", method: "IS:1599", remarks: "" },
            ]);
            break;

          // 🛢️ Bitumen or Other Chemical Tests
          case 20240919132532508:
            test.params = JSON.stringify([
              {
                testName: "Carbon",
                method: "IS:8811 1998",
                remarks: "Test parameters are not covered under NABL scope",
              },
              {
                testName: "Phosporous",
                method: "IS:8811 1998",
                remarks: "Test parameters are not covered under NABL scope",
              },
              {
                testName: "Sulphur",
                method: "IS:8811 1998",
                remarks: "Test parameters are not covered under NABL scope",
              },
              {
                testName: "Sulphur + Phosporous",
                method: "IS:8811 1988",
                remarks: "Test parameters are not covered under NABL scope",
              },
            ]);
            break;
          case 20250821161332829:
            test.params = JSON.stringify([
              {
                testName: "Carbon",
                method: "IS:8811 1998",
                remarks: "Test parameters are not covered under NABL scope",
              },
              {
                testName: "Phosporous",
                method: "IS:8811 1998 ",
                remarks: "Test parameters are not covered under NABL scope",
              },
              {
                testName: "Sulphur",
                method: "IS:8811 1998",
                remarks: "Test parameters are not covered under NABL scope",
              },
              {
                testName: "Manganese",
                method: "IS:8811 1998",
                remarks: "Test parameters are not covered under NABL scope",
              },
              {
                testName: "Silicon",
                method: "IS:8811 1998",
                remarks: "Test parameters are not covered under NABL scope",
              },
            ]);
            break;

          default:
            break;
        }
      });

      // 🔹 Combine all parsed test details
      let allParsedTests = [];
      tests.forEach((testItem) => {
        const parsed = JSON.parse(testItem.params || "[]");
        parsed.forEach((test) => {
          let remarkText = "";
          if (testItem.isNabl === "0" || testItem.isNabl === 0) {
            remarkText = "This Test Parameter is not covered under NABL Scope";
          }
          allParsedTests.push({
            ...test,
            remarks: remarkText,
            // remarks: testItem.remarks,
          });
        });
      });

      // 🪨 Add proper display name for Coarse/Fine Aggregates
      let displaySampleName = sampleName;
      if (sampleName === "Coarse Aggregate") {
        const size = test_requirement || "";
        displaySampleName = `Coarse Aggregate${size ? ` (${size}mm)` : ""}`;
      } else if (sampleName === "Fine Aggregate") {
        const type = sampleType || test_requirement || "";
        displaySampleName = `Fine Aggregate${type ? ` (${type})` : ""}`;
      }

      // 🔹 Render each test row
      allParsedTests.forEach((test, testIndex) => {
        const row = [
          {}, // SI. No
          {}, // Type of Sample
          { text: test.testName, alignment: "left" },
          { text: test.method, alignment: "left" },
          { text: test?.remarks || "", alignment: "left" },
        ];

        // 🔹 Merge SI.No and Sample Name cells
        if (testIndex === 0) {
          row[0] = {
            text: String(sampleIndex + 1),
            rowSpan: allParsedTests.length,
            alignment: "center",
            valign: "middle",
          };
          row[1] = {
            text: displaySampleName,
            rowSpan: allParsedTests.length,
            alignment: "left",
            valign: "middle",
          };
        }

        testRows.push(row);
      });
    });
  }

  const docDefinition = {
    content: [
      {
        columns: [
          {
            width: "*",
            text: "KDM ENGINEERS (INDIA) PVT. LTD.\nVISAKHAPATNAM",
            style: "header",
            alignment: "center",
            margin: [0, 0, 0, 10],
            bold: true,
          },
          {
            width: "auto",
            table: {
              widths: ["*"],
              body: [
                [{ text: "Rev.No.01", border: [true, true, false, false] }],
                [{ text: "Issue Dt:", border: [true, false, false, true] }],
              ],
            },
            layout: {
              paddingTop: () => 2,
              paddingBottom: () => 2,
              paddingLeft: () => 5,
              paddingRight: () => 5,
            },
          },
        ],
      },
      {
        text: [
          { text: "MANAGEMENT SYSTEM FORMAT No:", style: "subheader" },
          { text: " KDMEPL/RRQ/F-02\n", bold: true, style: "subheader" },
        ],
        margin: [85, 0, 0, 0],
      },
      {
        text: "REVIEW OF REQUESTS",
        style: "underlineSubheader",
        margin: [165, 0, 0, 10],
      },
      {
        table: {
          widths: ["*", "*"],
          body: [
            [
              {
                text: `Job No: ${customJobNo}`,
                border: [true, true, true, false],
                style: "tableHeader",
                alignment: "center",
              },
              {
                text: `Job Date: ${formattedJobDate}`,
                border: [true, true, true, false],
                style: "tableHeader",
                alignment: "center",
              },
            ],
          ],
        },
        layout: {
          paddingTop: () => 5,
          paddingBottom: () => 5,
          paddingLeft: () => 5,
          paddingRight: () => 5,
        },
        margin: [0, 0, 0, 0],
      },
      {
        margin: [0, 0, 0, 10],
        table: {
          widths: ["5%", "80%", "15%"],
          body: [
            [
              { text: "SI. No", alignment: "center", style: "tableHeader" },
              {
                text: "Requirements as per\nCl. No. 7.1.8 of ISO 17025-2017",
                alignment: "center",
                style: "tableHeader",
              },
              { text: "Remarks", alignment: "center", style: "tableHeader" },
            ],
            [
              { text: "1", alignment: "center" },
              "KDM Engineers (India) Pvt.Ltd. Capability and resources to meet customer’s requirements",
              { text: capability, alignment: "center" },
            ],
            [
              { text: "2", alignment: "center" },
              "Details regarding discussions with customer relating to testing and deviations from contract, if any.",
              { text: discussions, alignment: "center" },
            ],
            [
              { text: "3", alignment: "center" },
              "Requirements of the customer in respect of no. of samples submitted for testing and test method to be adopted",
              { text: requirements, alignment: "center" },
            ],
          ],
        },
      },
      {
        table: {
          // 👇 Adjust widths dynamically
          widths:
            orderDraft.division === "NDT"
              ? ["8%", "60%", "20%", "12%"] // No "Type of Sample Submitted"
              : ["6%", "20%", "27%", "20%", "27%"],

          headerRows: 1,
          body: [
            // 👇 Dynamic header row
            orderDraft.division === "NDT"
              ? [
                  { text: "SI. No", style: "tableHeader", alignment: "center" },
                  {
                    text: "Description of Test",
                    style: "tableHeader",
                    alignment: "center",
                  },
                  {
                    text: "Test Method",
                    style: "tableHeader",
                    alignment: "center",
                  },
                  {
                    text: "Remarks",
                    style: "tableHeader",
                    alignment: "center",
                  },
                ]
              : [
                  { text: "SI. No", style: "tableHeader", alignment: "center" },
                  {
                    text: "Type of Sample Submitted",
                    style: "tableHeader",
                    alignment: "center",
                  },
                  {
                    text: "Description of Test",
                    style: "tableHeader",
                    alignment: "center",
                  },
                  {
                    text: "Test Method",
                    style: "tableHeader",
                    alignment: "center",
                  },
                  {
                    text: "Remarks",
                    style: "tableHeader",
                    alignment: "center",
                  },
                ],

            // 👇 Add rows dynamically based on division
            ...(orderDraft.division === "NDT"
              ? testRows.map((row) => [
                  row[0], // SI No
                  row[2], // Description (was index 2)
                  row[3], // Test Method
                  row[4], // Remarks
                ])
              : testRows),
          ],
        },
      },

      {
        text: "\nReviewed By:",
        margin: [0, 0, 0, 5],
      },
      {
        image: RKsign,
        width: 100,
        alignment: "left",
        margin: [0, 0, 0, 10],
      },

      // { text: "Reviewed By:", margin: [0, 0, 0, 0] },
    ],
    styles: {
      header: { fontSize: 14, bold: false },
      subheader: { fontSize: 11 },
      underlineSubheader: { fontSize: 11, decoration: "underline" },
      tableHeader: { bold: true, fillColor: "#ffffff" },
    },
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=review_request_${orderDraft.order_number}.pdf`
  );
  pdfDoc.pipe(res);
  pdfDoc.end();
};

module.exports = generateReviewRequestPDF;
