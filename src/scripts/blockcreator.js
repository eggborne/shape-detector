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
    this.randomColors = [
      0x00ee00,
      0x00ff00,
      0x00dd00,
    ];
  }
  createHighlight(block, thickness) {
    let filter = new OutlineFilter(thickness, 0xff0000, 0.5);
    filter.padding = thickness;
    block.filters = [filter];
  }
  highlightBlock(block, thickness) {
    let filter = block.filters[0];
    filter.thickness = thickness;
  }
  unHighlightBlock(block) {
    block.filters[0].thickness = 0;
  }
  preparedSprite(textureName, type, x, y, width, height) {
    let sprite = new Sprite(window.IMAGE_LOADER.resources[textureName].texture);
    sprite.x = x;
    sprite.y = y;
    sprite.width = width;
    sprite.height = height;
    sprite.type = type;
    if (type === 'line') {
      sprite.anchor.x = 0.5;
      sprite.anchor.y = 1;
    }
    return sprite
  }
  knobSprite() {
    return new Sprite(window.IMAGE_LOADER.resources["knob"].texture);
  }
  spawnAutoRectangle(posX, posY, width, height, color, radius) {
    color = utils.string2hex(color)
    // let autoRect = this.preparedSprite("pixel", "autoRectangle", posX, posY, width, height);
    // autoRect.tint = color;
    this.blockGraphics = new Graphics();
    this.blockGraphics.isFastRect = true;
    this.blockGraphics.beginFill(color);
    let autoRect = this.blockGraphics.drawRoundedRect(posX, posY, width, height, radius);
    this.blockGraphics.endFill();
    return autoRect;
  }
  spawnAutoCircle(posX, posY, radius, color) {
    color = utils.string2hex(color);
    this.blockGraphics = new Graphics();
    this.blockGraphics.beginFill(color);
    let autoCircle = this.blockGraphics.drawCircle(posX, posY, radius);
    this.blockGraphics.endFill();
    return autoCircle;
  }
  spawnAutoTriangle(posX, posY, posZ, color) {
    color = utils.string2hex(color);
    this.blockGraphics = new Graphics();
    this.blockGraphics.beginFill(color);
    let autoTriangle = this.blockGraphics.drawPolygon(posX.x, posX.y, posY.x, posY.y, posZ.x, posZ.y);
    this.blockGraphics.endFill();
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
  spawnLine(startX, startY, endX, endY, thickness) {
    const distance = distanceFromABToXY(startX, startY, endX, endY);
    const angle = angleOfPointABFromXY(endX, endY, startX, startY);
    const newLine = this.preparedSprite('pixel', 'line', endX, endY, thickness, distance);
    newLine.rotation = angle - Math.PI / 2;
    newLine.tint = newLine.originalTint = 0x993333;
    newLine.originalScaleY = newLine.scale.y;
    this.frameContainer.addChildAt(newLine, 0);
    this.frameContainer.children.forEach(piece => {
      if (piece.growInterval) {
        piece.scale.y = piece.originalScaleY;
        clearInterval(piece.growInterval);
      }
    });
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
    cellRect.type = 'cell'
    this.frameContainer.addChild(cellRect)
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
    if (!color) { color = "transparent" }
    this.blockGraphics = new Graphics();
    this.blockGraphics.beginFill(color);
    let poly = this.blockGraphics.drawPolygon(points);
    this.blockGraphics.endFill();
    return poly;
  }
  createStroke(poly, thickness) {
    let stroke = poly.clone();
    
  }
  colorFrame(newColor, type) {
    // newColor = utils.string2hex(newColor)
    console.log("coloring frame", type, newColor);
    this.frameContainer.children.forEach(piece => {
      if (!type || piece.type.indexOf(type) > -1 || piece.type === 'cell') {
        piece.tint = newColor;
        if (piece.type === 'cell') {
          piece.alpha = 0.75
        }
      }
    });
  }
  createContainingSquare(posX, posY, size) {
    const squareBacking = this.preparedSprite('pixel', 'backing', posX, posY, size, size);
    squareBacking.alpha = 0;
    this.frameContainer.addChildAt(squareBacking, 2);
  }
  recolor(shape, newColor) {
    newColor = utils.string2hex(newColor);
    let points = shape.points
    console.log("shape", shape);
    console.log("points", points);
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
