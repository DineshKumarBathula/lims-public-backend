const path = require("path");
const fs = require("fs");

const getBase64Image = (filePath) => {
  const file = fs.readFileSync(filePath);
  return `data:image/png;base64,${file.toString("base64")}`;
};

const logoBase64 = getBase64Image(path.join(__dirname, "images/logo.png"));

const logoBase65 = getBase64Image(path.join(__dirname, "images/kdmNabl.jpg"));

const NonNablHeaderbase = getBase64Image(
  path.join(__dirname, "images/NonNablHeader.png")
);

const qrScanner = getBase64Image(path.join(__dirname, "images/scanner.PNG"));

const sign = getBase64Image(
  path.join(__dirname, "images/WhatsApp Image 2024-11-19 at 7.15.43 PM.jpeg")
);

const RajeshwariSign = getBase64Image(
  path.join(__dirname, "signs/rajeshwari.png")
);

const RKsign = getBase64Image(path.join(__dirname, "signs/Rk.png"));

const SanyasiRaoSign = getBase64Image(
  path.join(__dirname, "signs/SanyasiRao.png")
);

const suhasinisign = getBase64Image(path.join(__dirname, "signs/Suhasini.png"));
const sagarSign = getBase64Image(path.join(__dirname, "signs/sagar.png"));

const vizagStamp = getBase64Image(path.join(__dirname, "signs/stamp.png"));

module.exports = {
  logoBase64,
  logoBase65,
  sign,
  NonNablHeaderbase,
  qrScanner,
  RajeshwariSign,
  SanyasiRaoSign,
  RKsign,
  sagarSign,
  suhasinisign,
  vizagStamp,
};
