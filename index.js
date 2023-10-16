// First, read the csv file that you would like to convert to json. 
var fs = require("fs");
var papaparse = require("papaparse");

var csvFilePath = "example.csv";

var csvFile = fs.readFileSync(csvFilePath, "utf8");

// Parse the csv file using papaparse.
var csvData = papaparse.parse(csvFile, { header: true, delimiter: " "});

// Format the data to be used in potree:
var potreeData = csvData.data.map(function (row) {
    return {
        timestamp: parseFloat(row[key = "timestamp[s]"]),
        pos_x: parseFloat(row[key = "pos_x[m]"]),
        pos_y: parseFloat(row[key = "pos_y[m]"]),
        pos_z: parseFloat(row[key = "pos_z[m]"]),
        rot_x: parseFloat(row[key = "rot_x"]),
        rot_y: parseFloat(row[key = "rot_y"]),
        rot_z: parseFloat(row[key = "rot_z"]),
        rot_w: parseFloat(row[key = "rot_w"]),
    };
}
);

// Write the data to a json file.
fs.writeFileSync("example.json", JSON.stringify(potreeData));

//Write it to a js file too.
fs.writeFileSync("example.js", "var data = " + JSON.stringify(potreeData) + ";");