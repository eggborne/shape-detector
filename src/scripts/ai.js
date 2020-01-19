import * as DB from './api.js';
const LZUTF8 = require("lzutf8");

export default class ShapeScanner {
	constructor(type, attributes) {
		this.type = type;
		this.nets = {};
		if (type === 'NeuralNetwork') {
			attributes.forEach((attr, a) => {
				this.nets[attr.attributeName] =	{
					network: new brain.NeuralNetwork({
						hiddenLayers: [1]
					}),
					modelId: attr.modelId,
					gridSize: attr.gridSize,
					loaded: false
				}
			});
		}
		// let cock = [
		// 	[1,1,1,0,0,0],
		// 	[1,1,1,0,0,0],
		// 	[1,1,1,0,0,0],
		// 	[0,0,0,1,0,0],
		// 	[0,0,0,0,1,0],
		// 	[0,0,0,0,0,1],
		// ]
		// console.log('starting with matrix', cock.slice(0))
		// const trans = this.evaluatePermutations([...cock], ['90deg', '180deg', '270deg', 'flipX', 'flipY'])
		// console.log(trans);
		console.log("made net with nets", this.nets);
	}	
	condenseIOFromGridArray(originalGrid, feature, value) {
		let ioObj;
    if (this.type === "NeuralNetwork") {
			const flatModel = originalGrid.flat();
			// const condensed = this.condenseArray(flatModel);
			const condensed = this.condenseArray(flatModel);
			console.log('condensed', condensed)
      ioObj = {
        input: condensed,
        output: { [feature]: value }
      };
    } else if (this.type === "RNN") {
      const arrayOfRowStrings = originalGrid.map(row => (row = row.join("")));
      ioObj = {
        input: arrayOfRowStrings,
        output: feature
      };
		}
		return ioObj;
	}
	formatIOFromGridArray(originalGrid, feature, value) {
		let ioObj;
    if (this.type === "NeuralNetwork") {
			const flatModel = originalGrid.flat();
      ioObj = {
        input: flatModel, // an array of 0.0 - 1.0 numbers
        output: { [feature]: value } // 'feature' is a string, 'value' is 0.0 - 1.0 number
      };
    } else if (this.type === "RNN") {
      const arrayOfRowStrings = originalGrid.map(row => (row = row.join("")));
      ioObj = {
        input: arrayOfRowStrings, // an array of any values
        output: feature // a string
      };
		}
		return ioObj;
	}
	async updateModels() {
		let gotModels = false;
		for (let net in this.nets) {
			console.log('getting model for', net)
			
			let netEntry = this.nets[net];
			// const modelJSONResponse = await DB.getAIModel(netEntry.modelId);
			const modelJSONResponse = 'balls';
			if (modelJSONResponse.data) {
				console.log('updateModels got', net, 'model of length', modelJSONResponse.data.length);
				const parsedData = JSON.parse(modelJSONResponse.data);
				// let decompressedData = LZUTF8.decompress(modelJSONResponse.data, {
        //   inputEncoding: "StorageBinaryString"
				// });
				// decompressedData = JSON.parse(decompressedData)
				netEntry.network.fromJSON(parsedData);
				netEntry.loaded = true;
				gotModels = true;
			}
		};
		return gotModels;
	}
	async updateModel(attributeName) {
		let gotModel = false;
		console.log("getting model for", attributeName);
		let netEntry = this.nets[attributeName];
		const modelJSONResponse = await DB.getAIModel(netEntry.modelId);
		if (modelJSONResponse.data) {
			console.log('updateModels got', attributeName, 'model of length', modelJSONResponse.data.length);
			const parsedData = JSON.parse(modelJSONResponse.data);
			// let decompressedData = LZUTF8.decompress(modelJSONResponse.data, {
			//   inputEncoding: "StorageBinaryString"
			// });
			// decompressedData = JSON.parse(decompressedData)
			netEntry.network.fromJSON(parsedData);
			netEntry.loaded = true;
			gotModel = true;
		}
		return gotModel;
	}

	async getTrainingPatterns(attrNameList=['rectangle', 'circle']) {		
		let patternListObj = {};
		for (let net in this.nets) {
			if (net === 'rectangle') {
				console.log('getting training data for', net)
				let netEntry = this.nets[net];
				console.time('got patterns in');
				let patterns = await DB.getAITrainingData(netEntry.modelId);
				console.timeEnd('got patterns in');
				console.log('patterns.data.length is', patterns.data.length)
				let patternList = JSON.parse(patterns.data);
				patternList = patternList.sort((a, b) => b.id - a.id);
				patternListObj[net] = patternList;
				console.log('parsed', net, 'patterns:', patternList.length);
			}
		};
		return patternListObj;
	}

	async trainScanner(ioArray, attributeName) {
		this.nets.rectangle.network = undefined;
		this.nets.rectangle.network = new brain.NeuralNetwork({
			hiddenLayers: [2]
		});
		console.time("trained in");
		let properLength = Math.pow(this.nets.rectangle.gridSize, 2);
		ioArray.forEach(entry => {
			// let decompressed = LZUTF8.decompress(entry.input, {
      //   inputEncoding: "StorageBinaryString"
      // });
			// entry.input = decompressed.split('');
			entry.input = this.decodeCondensedArray(entry.input);
			entry.input.length = properLength;
		});
		console.log('props', properLength)
		if (!ioArray.every(entry => entry.input.length === properLength)) {
			console.error('NOT ALL ARE PROPER LENGTH!');

		} else {
			console.log('training', attributeName, 'with', ioArray);
			let trained = await this.nets[attributeName].network.trainAsync(ioArray, {
				iterations: 20000, // the maximum times to iterate the training data --> number greater than 0
				errorThresh: 0.001, // the acceptable error percentage from training data --> number between 0 and 1
				// errorThresh: 0.001, // the acceptable error percentage from training data --> number between 0 and 1
				// learningRate: 0.3, // scales with delta to effect training rate --> number between 0 and 1
				learningRate: 0.1, // scales with delta to effect training rate --> number between 0 and 1
				log: detail => console.log(detail), // true to use console.log, when a function is supplied it is used --> Either true or a function
				logPeriod: 1, // iterations between logging out --> number greater than 0
				momentum: 0.1, // scales with next layer's change value --> number between 0 and 1
				// momentum: 0.3, // scales with next layer's change value --> number between 0 and 1
				callback: null, // a periodic call back that can be triggered while training --> null or function
				callbackPeriod: 10, // the number of iterations through the training data between callback calls --> number greater than 0
				timeout: 60000 // the max number of milliseconds to train for --> number greater than 0
			});
			console.timeEnd('trained in')
			return trained;
		}
	}

	async saveModel(attributeName) {
		let json = this.nets[attributeName].network.toJSON();
		let modelSaved = await DB.saveAIModel(this.nets[attributeName].modelId, json);
		// let modelSaved = await DB.saveAIModelToJSON(this.modelId, json);
		return modelSaved;

		// INSERT INTO `shapeTypes` (`id`, `aiType`, `trainingPatterns`, `model`, `creator`, `attributeName`) VALUES (NULL, 'NeuralNetwork', '[]', '', 'Mike', 'circle');
	}

	transformMatrix(originalMatrix) {
		let matrix = JSON.parse(JSON.stringify(originalMatrix));
		const n = matrix.length;
		const x = Math.floor(n / 2);
		const y = n - 1;
		for (let i = 0; i < x; i++) {
			for (let j = i; j < y - i; j++) {
				let k = matrix[i][j];
					matrix[i][j] = matrix[y - j][i];
					matrix[y - j][i] = matrix[y - i][y - j];
					matrix[y - i][y - j] = matrix[j][y - i]
					matrix[j][y - i] = k
			}
		}
		return matrix;
	}

	evaluatePermutations(matrix, permList) {
		let normalMatrix = matrix.flat();
		let results = {
      // normal: this.getLikely(normalMatrix)
    };
		permList.forEach(perm => {
			let transformed;
			let matrixCopy = JSON.parse(JSON.stringify(matrix));
			if (perm === "90deg") {
        transformed = this.transformMatrix(matrixCopy);
      } else if (perm === "180deg") {
        transformed = this.transformMatrix(this.transformMatrix(matrixCopy));
      } else if (perm === "270deg") {
        transformed = this.transformMatrix(this.transformMatrix(this.transformMatrix(matrixCopy)));
      } else if (perm === "flipX") {
        transformed = matrixCopy.map(row => row.reverse());
      } else if (perm === "flipY") {
        transformed = matrixCopy.reverse();
			}
			// results[perm] = this.getLikely(transformed.flat());
			results[perm] = this.getAttribute(transformed.flat());
		});
		return results;
	}
	
	getAttribute(input, attributeName='rectangle') {
		const result = this.nets[attributeName].network.run(input);
		return result;
	}
	getLikely(input) {
		const result = brain.likely(
      input,
      this.nets["rectangle"].network
    );
    return result;
	}
	getLikeliest(permResults) {
		let highestScore = 0;
		let winner = {};
		for (let permType in permResults) {
			let shapesObj = permResults[permType]
			for (let shapeType in shapesObj) {
				if (shapesObj[shapeType] > highestScore) {
					highestScore = shapesObj[shapeType];
					winner = {
            shapeType,
            permType,
            score: highestScore
          };
				}
			}
		}
		return winner;
	}
	condenseArray(arr) {
		let result = [];
		let firstDigit = arr[0];
		result[0] = firstDigit;		
		let previousDigit = firstDigit;
		let currentEntry = {
			digit: firstDigit,
			count: 1
		}
		arr.forEach((digit, d) => {
			if (d > 0) {
				const lastIndex = d === arr.length - 1
				if (digit !== previousDigit || lastIndex) {
					if (lastIndex) {
						currentEntry.count += 1;
					}
					result.push(currentEntry.count);
					currentEntry.count = 0;
        }
				currentEntry.count += 1;				
				previousDigit = digit;
			}
		});
		return result;
	}
	decodeCondensedArray(condensedArray) {
		let result = [];
		let firstDigit = condensedArray[0];
		let currentDigit = firstDigit;
		condensedArray.forEach((entry, e) => {
			if (e > 0) {
				for (let i = 0; i < entry; i += 1) {
					result.push(currentDigit);
				}
				currentDigit = currentDigit === 1 ? 0 : 1;
			}
		});
		return result;
	}
	compressArray(arr) {
		let origLength = arr.length
		console.warn('condensing arr of length', arr.length)
		arr = arr.join('');
		let compressedString = LZUTF8.compress(arr, {
			outputEncoding: "StorageBinaryString"
		});
		console.warn("condensed to compressedString of length", compressedString.length);
		let decomp = LZUTF8.decompress(compressedString, {
			inputEncoding: "StorageBinaryString"
		});
		console.warn('decompressed length is', decomp.length)
		if (decomp.length === origLength) {
			return compressedString;
		} else {
			console.warn('decompressed length is no good!', decomp.length)
			return false;
		}
	}
	decompressStringToFlatArray(compressedString) {
		return LZUTF8.decompress(compressedString, {
      inputEncoding: "StorageBinaryString"
    });
	}
	getBinaryArray(grid) {
    const binaryArray = [];
    grid.forEach((row, r) => {
      binaryArray[r] = [];
      row.forEach((cell, c) => {
        binaryArray[r][c] = cell.shaded ? 1 : 0;
      });
		});
		return binaryArray.flat();
	}

	getFlippedCellGrid(grid) {
		const newGrid = [];
		grid.forEach((row, r) => {
			newGrid[r] = [...row].reverse();
		});
		return newGrid;
	}
}
