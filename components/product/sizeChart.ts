// Copied verbatim from the live store's size chart page (fetched 30.10.2026).
// Do not add or "complete" values: only what the club publishes belongs here.
export const SIZE_CHART_URL = "https://shop.maccabi-tlv.co.il/pages/size-chart";
export const SIZE_CHART_CHECKED = "30.10.2026";
export const SIZE_CHART_NOTE =
  "הטבלה היא בגדר המלצה בלבד וההתאמה משתנה מאדם לאדם. תמיד אפשר להגיע לאחד הסניפים ולמדוד.";

export const ADULT_CHEST = {
  sizes: ["S", "M", "L", "XL"],
  rows: [
    { label: "היקף חזה גבר (ס״מ)", values: ["93-97", "98-103", "103-109", "110-116"] },
    { label: "היקף חזה נשים (ס״מ)", values: ["84-88", "90-94", "96-100", "102-106"] },
  ],
};

// The store lists six kids chest ranges under its adult header; they are shown here in the
// store's order next to the six PUMA kids sizes, with a note saying so.
export const KIDS = {
  puma: ["104", "116", "128", "140", "152", "164"],
  local: ["4", "6", "8", "10", "12", "14"],
  chest: ["60-64", "64-68", "68-72", "72-76", "76-80", "80-84"],
};
