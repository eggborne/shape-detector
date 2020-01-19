import axios from "axios";
const LZUTF8 = require("lzutf8");

const saveTrainingPatterns = (id, fullTrainingPatterns) => {
  let trainingPatterns = [];
  fullTrainingPatterns.forEach((pat, p) => {
    trainingPatterns[p] = {
      ioObj: pat.ioObj,
      gridSize: pat.gridSize,
      id: pat.id,
      imageUrl: pat.imageUrl.replace('data:', '').replace(/^.+,/, '')
    };
  });
  console.log("savinf patterns to id", id, trainingPatterns);
  trainingPatterns = JSON.stringify(trainingPatterns);
  return axios({
    method: "post",
    url: "https://api.eggborne.com/shapedetector/saveshapetrainingdata.php",
    headers: {
      "Content-type": "application/x-www-form-urlencoded"
    },
    data: {
      id,
      trainingPatterns
    }
  });
};
const getAITrainingData = (id) => {
  return axios({
    method: "post",
    url: "https://api.eggborne.com/shapedetector/getshapetrainingdata.php",
    headers: {
      "Content-type": "application/x-www-form-urlencoded"
    },
    data: {
      id
    }
  });
};
const getAIModel = (id) => {
  return axios({
    method: "post",
    url: "https://api.eggborne.com/shapedetector/getshapeaimodel.php",
    headers: {
      "Content-type": "application/x-www-form-urlencoded"
    },
    data: {
      id
    }
  });
};
const saveAIModel = (id, model) => {
  if (process.env.NODE_ENV === "development") {
    console.log("goan save", id, model);
    model = JSON.stringify(model);
    console.log("stringified length", model.length);
    if (model.length < 800000) {
      // let compressed = LZUTF8.compress(model, {
      //   outputEncoding: "StorageBinaryString"
      // });
      // console.log("compressed length", compressed.length, compressed);
      return axios({
        method: "post",
        url: "https://api.eggborne.com/shapedetector/saveshapeaimodel.php",
        headers: {
          "Content-type": "application/x-www-form-urlencoded"
        },
        data: {
          id,
          model
        }
      });
    } else {
      console.error(
        "TOO LONG! --------------------------------------------------"
      );
    }
  }
};
const saveAIModelToJSON = (id, jsonData) => {
  console.log("goan save", id, jsonData);
  // jsonData = JSON.stringify(jsonData);
  console.log("stringified length", JSON.stringify(jsonData).length);
  return axios({
    method: "post",
    url: "https://api.eggborne.com/shapedetector/shapedetectorwritetojson.php",
    headers: {
      "Content-type": "application/x-www-form-urlencoded"
    },
    data: {
      id,
      jsonData
    }
  });
};

export {
  getAITrainingData,
  saveTrainingPatterns,
  getAIModel,
  saveAIModel,
  saveAIModelToJSON
};
