const fs = require('fs');
const pdfParse = require('pdf-parse');

async function test() {
  try {
    // try to just require
    console.log("pdfParse required successfully");
  } catch (e) {
    console.error("error requiring pdfParse", e);
  }
}
test();
