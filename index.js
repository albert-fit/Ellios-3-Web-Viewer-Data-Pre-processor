const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const papaparse = require('papaparse');

const directoryPath = '/Users/Albert/Desktop/elliosDelivery/data/F5901/'; // Replace with your actual directory path

const outputJson = [];

const copyFile = promisify(fs.copyFile);

async function copyElfFileToJSON(eflyFilePath, jsonFilePath) {
  try {
    await copyFile(eflyFilePath, jsonFilePath);
  } catch (error) {
    console.error(`Error copying .efly file to .json: ${error}`);
  }
}

function extractVideoOffsetAndRotation(jsonFilePath) {
  try {
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const eflyJson = JSON.parse(jsonData);
    const video_offset = eflyJson.contents.flights[0].properties.video_offset || 0; // Default to 0 if not found

    const rotation = eflyJson.contents.flights[0].maps[0].trajectories[0].rotation || {
      w: 0.7071067690849304,
      x: 0,
      y: 0,
      z: -0.7071067690849304,
    };

    return { video_offset, rotation };
  } catch (error) {
    console.error(`Big Error reading or parsing .json file: ${jsonFilePath}`);
    return { video_offset: 0, rotation: { w: 0, x: 0, y: 0, z: 0 } }; // Default values in case of an error
  }
}

function findElfFile(dirPath) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    if (file.endsWith('.efly')) {
      return path.join(dirPath, file);
    }
  }
  return null; // Return null if no .efly file is found
}

function findCSVFile(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
        if (file.endsWith('.csv')) {
        return path.join(dirPath, file);
        }
    }
    return null; // Return null if no .csv file is found
    }

async function populateJson(dirPath, parentName = '') {
  const eflyFile = findElfFile(dirPath);
  const csvFile = findCSVFile(dirPath);

  if (!eflyFile) {
    console.error(`No .efly file found in directory: ${dirPath}`);
    return;
  }

  if (!csvFile) {
    console.error(`No .csv file found in directory: ${dirPath}`);
    return;
  }
  
  const name = path.basename(eflyFile, '.efly');
  const url = path.join(parentName, name, 'metadata.json');
  const trajFile = path.join(parentName, name, `${name}.js`);
  const trajVar = `flight_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const jsonCopyFilePath = path.join(dirPath, `${name}.json`);
  var liveTraj = [];
  fromDir(
    dirPath,
    /\livetraj.csv$/,
    function (filename) {
      console.log("-- found: ", filename);
      var csvFile = fs.readFileSync(filename, "utf8");
      // Parse the CSV file using papaparse.
      var csvData = papaparse.parse(csvFile, { header: true, delimiter: " " });
      // Format the data to be used in potree:
      liveTraj = csvData.data.map(function (row) {
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
      });})
    
  try {
    await copyElfFileToJSON(eflyFile, jsonCopyFilePath);

    const { video_offset, rotation } = extractVideoOffsetAndRotation(jsonCopyFilePath);
    const entry = {
      name,
      url,
      trajFile,
      trajVar,
      video_offset,
      rotation,
      liveTraj
    };
    outputJson.push(entry);
  } catch (error) {
    console.error(`Error processing .efly file: ${error}`);
  }
}

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


// Look only in subdirectories of directoryPath
const subdirectories = fs.readdirSync(directoryPath);
(async () => {

  // After parsing CSV files, populate JSON
  for (const subdirectory of subdirectories) {
    const subdirectoryPath = path.join(directoryPath, subdirectory);
    const subdirectoryStats = fs.statSync(subdirectoryPath);
    if (subdirectoryStats.isDirectory()) {
      await populateJson(subdirectoryPath, subdirectory);
    }
  }

  console.log(outputJson);

  const jsonFilePath = 'Data.js'; // Replace with your desired output JSON file path
  fs.writeFileSync(jsonFilePath, `var data = ${JSON.stringify(outputJson, null, 2)}`);
  console.log(`JSON data written to ${jsonFilePath}`);
})();
