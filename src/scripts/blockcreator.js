import { OutlineFilter } from "@pixi/filter-outline";
import { Sprite, Graphics, Container, utils } from "pixi.js";

const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const pointAtAngle = (x, y, angle, distance) => {
  return {
    x: x + distance * Math.cos(angle),
    y: y + distance * Math.sin(angle)
  };
}
const angleOfPointABFromXY = (a, b, x, y) => {
  return Math.atan2(b - y, a - x);
}
const distanceFromABToXY = (a, b, x, y) => {
  var distanceX = x - a;
  var distanceY = y - b;
  return Math.round(Math.sqrt(distanceX * distanceX + distanceY * distanceY));
}
const degToRad = (degrees) => {
  return degrees * (Math.PI / 180);
};
const radToDeg = (radians) => {
  let deg = radians * (180 / Math.PI);
  if (deg < 0) {
    deg += 360;
  } else if (deg > 359) {
    deg -= 360;
  }
  return radians * (180 / Math.PI);
  // return deg
};

class BlockCreator {
  constructor() {
    this.frameContainer = undefined;
    this.drawStatus = {};
    this.blockGraphics = new Graphics();
    this.shapeBounds = {};
    this.closingLine = undefined;
    this.randomColors = [0x00ee00, 0x00ff00, 0x00dd00];
  }
  createHighlight(block, thickness) {
    let filter = new OutlineFilter(thickness, 0x00ff00, 0.5);
    filter.padding = thickness;
    if (block.shapeObj) {
      block.shapeObj.filters = [filter]
    } else {
      block.filters = [filter];
    }
  }
  showAllJunctures(blockArr) {
    blockArr.forEach(block => {
      block.junctures.visible = true;
    })
  }
  hideAllJunctures(blockArr) {
    blockArr.forEach(block => {
      block.junctures.visible = false;
    })
  }
  highlightBlock(block, thickness, junctures) {
    let filter = block.shapeObj
      ? block.shapeObj.filters[0]
      : block.filters[0];
    filter.color = 0x00ff00;
    filter.thickness = thickness;
    if (junctures) {
      block.junctures.visible = true;
    }
  }
  unHighlightBlock(block, junctures) {
    let filter = block.shapeObj
      ? block.shapeObj.filters[0]
      : block.filters[0];
    filter.color = 0x000000;
    filter.thickness = 1;
    if (junctures) {
      block.junctures.visible = false;
    }
  }
  preparedSprite(textureName, type, x, y, width, height) {
    let sprite = new Sprite(window.IMAGE_LOADER.resources[textureName].texture);
    sprite.x = x;
    sprite.y = y;
    sprite.width = width;
    sprite.height = height;
    sprite.type = type;
    if (type === "line") {
      sprite.anchor.x = 0.5;
      sprite.anchor.y = 1;
    }
    return sprite;
  }
  knobSprite() {
    return new Sprite(window.IMAGE_LOADER.resources["knob"].texture);
  }
  spawnJuncture(posX, posY, radius, color) {
    color = utils.string2hex(color);
    this.blockGraphics = new Graphics();
    this.blockGraphics.beginFill(color);
    let autoCircle = this.blockGraphics.drawCircle(posX, posY, radius);
    this.blockGraphics.endFill();
    autoCircle.type = "juncture";
    return autoCircle;
  };
  spawnJunctures(block, spots, radius, color) {
    spots = spots.map(spot => {
      return {
        x: spot[0] * block.width,
        y: spot[1] * block.height
      };
    });
    color = utils.string2hex(color);
    let junctures = [];
    spots.forEach(spot => {
      let posX = spot.x;
      let posY = spot.y;
      const junct = this.knobSprite();
      junct.owner = block;
      junct.anchor.x = 0.5;
      junct.anchor.y = 0.5;
      junct.x = posX;
      junct.y = posY;
      junct.width = radius;
      junct.height = radius;
      junct.type = "juncture";
      junct.tint = color;
      junct.alpha = 0.5;
      junct.interactive = true;
      junct.originalScale = {
        x: junct.scale.x,
        y: junct.scale.y
      };
      junct.largeScale = {
        x: junct.scale.x * 1.25,
        y: junct.scale.y * 1.25
      };
      junctures.push(junct);
      block.junctures.addChild(junct);
    });
    return junctures;
  };
  spawnAutoBlock(shapeType, options) {
    const color = utils.string2hex(options.color);
    const posX = options.posX;
    const posY = options.posY;
    const posZ = options.posZ;
    const width = options.width;
    const height = options.height;
    const radius = options.radius;
    // let autoRect = this.preparedSprite("pixel", "autoRectangle", posX, posY, width, height);
    // autoRect.tint = color;
    this.blockGraphics = new Graphics();
    // if (shapeType === 'rectangle') {
    //   this.blockGraphics.isFastRect = true;
    // }
    this.blockGraphics.beginFill(color);
    let blockContainer = new Container();
    blockContainer.junctures = new Container();
    let autoBlock;
    if (shapeType === 'rectangle') {
      autoBlock = this.blockGraphics.drawRoundedRect(0, 0, width, height, radius);
      blockContainer.x = posX;
      blockContainer.y = posY;
    }
    if (shapeType === 'circle') {
      autoBlock = this.blockGraphics.drawCircle(radius, radius, radius);
      blockContainer.x = posX;
      blockContainer.y = posY;
    }
    if (shapeType === 'triangle') {
      autoBlock = this.blockGraphics.drawPolygon(
        posX.x,
        posX.y,
        posY.x,
        posY.y,
        posZ.x,
        posZ.y
      );
      blockContainer.junctures.x = posY.x;
      blockContainer.junctures.y = posY.y;
    }
    this.blockGraphics.endFill();
    blockContainer.addChild(autoBlock);
    blockContainer.addChild(blockContainer.junctures)
    
    autoBlock.type = blockContainer.type = "block";
    autoBlock.shape = blockContainer.shape = shapeType;
    blockContainer.shapeObj = autoBlock;
    return blockContainer;
  }
  spawnAutoRectangle(posX, posY, width, height, color, radius) {
    color = utils.string2hex(color);
    // let autoRect = this.preparedSprite("pixel", "autoRectangle", posX, posY, width, height);
    // autoRect.tint = color;
    this.blockGraphics = new Graphics();
    this.blockGraphics.isFastRect = true;
    this.blockGraphics.beginFill(color);
    let rectContainer = new Container();
    rectContainer.junctures = new Container();
    let autoRect = this.blockGraphics.drawRoundedRect(
      0,
      0,
      width,
      height,
      radius
    );
    this.blockGraphics.endFill();
    autoRect.type = rectContainer.type = "block";
    autoRect.shape = rectContainer.shape = "rectangle";
    rectContainer.addChild(autoRect);
    rectContainer.addChild(rectContainer.junctures)
    rectContainer.x = posX;
    rectContainer.y = posY;
    rectContainer.shapeObj = autoRect;
    // rectContainer.originalX = posX;
    // rectContainer.originalY = posY;
    return rectContainer;
  }
  spawnAutoCircle(posX, posY, radius, color) {
    color = utils.string2hex(color);
    this.blockGraphics = new Graphics();
    this.blockGraphics.beginFill(color);
    let autoCircle = this.blockGraphics.drawCircle(posX, posY, radius);
    this.blockGraphics.endFill();
    autoCircle.type = "block";
    autoCircle.shape = "circle";
    return autoCircle;
  }
  spawnAutoTriangle(posX, posY, posZ, color) {
    color = utils.string2hex(color);
    this.blockGraphics = new Graphics();
    this.blockGraphics.beginFill(color);
    let autoTriangle = this.blockGraphics.drawPolygon(
      posX.x,
      posX.y,
      posY.x,
      posY.y,
      posZ.x,
      posZ.y
    );
    this.blockGraphics.endFill();
    autoTriangle.type = "block";
    autoTriangle.shape = "triangle";
    return autoTriangle;
  }
  createFrame() {
    this.frameContainer = new Container();
    return this.frameContainer;
  }
  fadeDrawnFrame() {
    return new Promise(res => {
      this.frameInterval = setInterval(() => {
        if (this.frameContainer.alpha - 0.1 > 0) {
          this.frameContainer.alpha -= 0.1;
        } else {
          window.clearInterval(this.frameInterval);
          res(this.frameContainer);
        }
      }, 8);
    });
  }
  spawnFrameKnob(posX, posY, width, show) {
    const newKnob = this.knobSprite();
    newKnob.anchor.x = 0.5;
    newKnob.anchor.y = 0.5;
    newKnob.x = posX;
    newKnob.y = posY;
    newKnob.width = width;
    newKnob.height = width;
    newKnob.tint = 0x993333;
    newKnob.visible = show;
    newKnob.type = "frameKnob";
    // newKnob.cacheAsBitmap = true;
    this.frameContainer.addChild(newKnob);
    return newKnob;
  }
  spawnConnector(startX, startY, endX, endY, thickness) {
    const distance = distanceFromABToXY(startX, startY, endX, endY);
    const angle = angleOfPointABFromXY(endX, endY, startX, startY);
    const newLine = this.preparedSprite(
      "pixel",
      "line",
      endX,
      endY,
      thickness,
      distance
    );
    newLine.rotation = angle - Math.PI / 2;
    newLine.tint = newLine.originalTint = 0x0000ff;
    newLine.originalScaleY = newLine.scale.y;
    return newLine;
  }
  spawnLine(startX, startY, endX, endY, thickness, connector) {
    const distance = distanceFromABToXY(startX, startY, endX, endY);
    const angle = angleOfPointABFromXY(endX, endY, startX, startY);
    const newLine = this.preparedSprite(
      "pixel",
      "line",
      endX,
      endY,
      thickness,
      distance
    );
    newLine.rotation = angle - Math.PI / 2;
    newLine.tint = newLine.originalTint = 0x993333;
    newLine.originalScaleY = newLine.scale.y;
    if (!connector) {
      this.frameContainer.addChildAt(newLine, 0);
      this.frameContainer.children.forEach(piece => {
        if (piece.growInterval) {
          piece.scale.y = piece.originalScaleY;
          clearInterval(piece.growInterval);
        }
      });
    }
    // newLine.scale.y = 0;
    // newLine.growToSize = () => {
    //   return new Promise(res => {
    //     newLine.growInterval = setInterval(() => {
    //       if (newLine.scale.y + newLine.originalScaleY / 12 < newLine.originalScaleY) {
    //         newLine.scale.y += newLine.originalScaleY / 12;
    //       } else {
    //         newLine.scale.y = newLine.originalScaleY;
    //         clearInterval(newLine.growInterval);
    //         newLine.growInterval = undefined;
    //         res('growing finished.')
    //       }
    //     }, 6);
    //   });
    // };
    // newLine.growToSize();
    return newLine;
  }
  spawnCell(posX, posY, size) {
    let cellRect = this.preparedSprite("pixel", "cell", posX, posY, size, size);
    cellRect.tint = 0x000000;
    cellRect.alpha = 0.5;
    // cellRect.anchor.set(0.5);
    // this.blockGraphics = new Graphics();
    // this.blockGraphics.isFastRect = true;
    // this.blockGraphics.beginFill(
    //   0x000000
    // );
    // let cellRect = this.blockGraphics.drawRect(
    //   posX,
    //   posY,
    //   size,
    //   size,
    // );
    // this.blockGraphics.endFill();
    cellRect.origScale = {
      x: cellRect.scale.x,
      y: cellRect.scale.y
    };
    cellRect.type = "cell";
    this.frameContainer.addChild(cellRect);
    return cellRect;
  }
  spawnBlock(posX, posY, startingWidth = 1, startingHeight = 1, borderRadius) {
    this.blockGraphics = new Graphics();
    this.blockGraphics.isFastRect = true;
    this.blockGraphics.beginFill(
      this.randomColors[randomInt(0, this.randomColors.length - 1)]
    );
    let blockBodyRect = this.blockGraphics.drawRoundedRect(
      posX,
      posY,
      startingWidth,
      startingHeight,
      borderRadius
    );
    this.blockGraphics.endFill();
    blockBodyRect.origScale = {
      x: blockBodyRect.scale.x,
      y: blockBodyRect.scale.y
    };
    return blockBodyRect;
  }
  spawnPolygon(points, color, noShadow) {
    if (!color) {
      color = "transparent";
    }
    this.blockGraphics = new Graphics();
    this.blockGraphics.beginFill(color);
    let poly = this.blockGraphics.drawPolygon(points);
    this.blockGraphics.endFill();
    poly.type = "block";
    poly.shape = 'freehand';
    poly.frame = this.frameContainer;
    return poly;
  }
  createStroke(poly, thickness) {
    let stroke = poly.clone();
  }
  colorFrame(newColor, type) {
    // newColor = utils.string2hex(newColor)
    this.frameContainer.children.forEach(piece => {
      if (!type || piece.type.indexOf(type) > -1 || piece.type === "cell") {
        piece.tint = newColor;
        if (piece.type === "cell") {
          piece.alpha = 0.75;
        }
      }
    });
  }
  createContainingSquare(posX, posY, size) {
    const squareBacking = this.preparedSprite(
      "pixel",
      "backing",
      posX,
      posY,
      size,
      size
    );
    squareBacking.alpha = 0;
    this.frameContainer.addChildAt(squareBacking, 2);
  }
  recolor(shape, newColor) {
    newColor = utils.string2hex(newColor);
    let points = shape.points;
    let replacement = this.spawnPolygon(points, newColor, true);
    replacement.filters = shape.filters;
    replacement.likely = shape.likely;
    replacement.prediction = shape.prediction;
    replacement.bestPermutation = shape.bestPermutation;
    return replacement;
  }
}

const blockCreator = new BlockCreator();

export { blockCreator, pointAtAngle, angleOfPointABFromXY, distanceFromABToXY, degToRad, radToDeg }
