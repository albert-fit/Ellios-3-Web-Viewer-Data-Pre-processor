// First, read the csv file that you would like to convert to json.
var path = require("path");
var fs = require("fs");
var papaparse = require("papaparse");

function fromDir(startPath, filter, callback) {
  if (!fs.existsSync(startPath)) {
    console.log("no dir ", startPath);
    return;
  }

  var files = fs.readdirSync(startPath);
  for (var i = 0; i < files.length; i++) {
    var filename = path.join(startPath, files[i]);
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      fromDir(filename, filter, callback); //recurse
    } else if (filter.test(filename)) callback(filename);
  }
}

var parentDirectory = "/Users/Albert/Desktop/elliosDelivery/data/F5901/";

var flightsDirectories = [
  "096-southc-F1-02",
  "085-north-F1-00",
  "086-north-F1-01",
  "087-north-F1-02",
  "088-north-F1-03",
  "089-north-F1-04",
  "090-north-F1-05",
  "091-southrhs-F1-00",
  "092-southrhs-F1-01",
  "093-southrhs-F1-02",
  "094-southb-F1-03",
  "095-southb-F1-01"
];

flightsDirectories.forEach(function (flightDirectory) {
fromDir(
  `${parentDirectory}${flightDirectory}`,
  /\livetraj.csv$/,
  function (filename) {
    console.log("-- found: ", filename);
    var csvFile = fs.readFileSync(filename, "utf8");
    // Parse the csv file using papaparse.
    var csvData = papaparse.parse(csvFile, { header: true, delimiter: " " });
    // Format the data to be used in potree:
    var potreeData = csvData.data.map(function (row) {
      return {
        timestamp: parseFloat(row[(key = "timestamp[s]")]),
        pos_x: parseFloat(row[(key = "pos_x[m]")]),
        pos_y: parseFloat(row[(key = "pos_y[m]")]),
        pos_z: parseFloat(row[(key = "pos_z[m]")]),
        rot_x: parseFloat(row[(key = "rot_x")]),
        rot_y: parseFloat(row[(key = "rot_y")]),
        rot_z: parseFloat(row[(key = "rot_z")]),
        rot_w: parseFloat(row[(key = "rot_w")]),
      };
    });
    // Write the data to a json file.
    fs.writeFileSync(`${parentDirectory}/${flightDirectory}/${flightDirectory}.json`, JSON.stringify(potreeData));
    console.log(`${parentDirectory}/${flightDirectory}/${flightDirectory}.json created.`)
    //Write it to a js file too.
    fs.writeFileSync(
      `${parentDirectory}/${flightDirectory}/${flightDirectory}.js`,
      "var data = " + JSON.stringify(potreeData) + ";"
    );
    console.log(`${parentDirectory}/${flightDirectory}/${flightDirectory}.js created.`)
  }
);
});
