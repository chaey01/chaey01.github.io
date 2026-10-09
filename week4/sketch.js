// Kinectic Type and FaceMesh
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/0-introduction/patt-vira
// https://youtu.be/2h8VArJ3gnQ

// Subscribe to Patt Vira's channel! 
// https://youtube.com/@PattVira

let center; 
let angle = 0;
let letters = []; 
let cols; let rows; let size = 20; 

let video;
let faceMesh;
let faces = [];
let mouthX, mouthY, mouthW;

function preload() {
  faceMesh = ml5.faceMesh({ maxFaces: 1, flipped: true });
}

function gotFaces(results) {
  // console.log(results);
  faces = results;
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  faceMesh.detectStart(video, gotFaces);
  
  center = createVector(width/2, height/2);
  cols = width/size;
  rows = height/size;
  
  for (let i=0; i<cols; i++) {
    letters[i] = [];
    for (let j=0; j<rows; j++) {
      let x = i*size + size/2;
      let y = j*size + size/2;
      letters[i][j] = new Letter(x, y, 0.3);
    }
  }
}

function draw() {
  background(0);
  // image(video, 0, 0);

  if (faces.length > 0) {
    let face = faces[0];
    let keypoints = face.keypoints;
    let mouthTop = keypoints[13];
    let mouthBottom = keypoints[14];
    fill(255);
    mouthX = (mouthTop.x + mouthBottom.x)/2;
    mouthY = (mouthTop.y + mouthBottom.y)/2;
    mouthW = mouthBottom.y - mouthTop.y;
    ellipse(mouthX, mouthY, 10, 10);
    // ellipse(mouthTop.x, mouthTop.y, 10, 10);
    // ellipse(mouthBottom.x, mouthBottom.y, 10, 10);
    
    for (let i=0; i<keypoints.length; i++) {
      fill(255);
      noStroke();
      ellipse(keypoints[i].x, keypoints[i].y, 2, 2);
    }
    
    
//     let lips = faces[0].lips;
//     strokeWeight(4);
//     noFill();
//     stroke(255, 100, 255);
//     rect(lips.x, lips.y, lips.width, lips.height);
    
//     for (let lipPoint of lips.keypoints) {
//       strokeWeight(2);
//       stroke(0, 255, 0);
//       point(lipPoint.x, lipPoint.y);
//     }
    
    
  }
  
  
  center.x = mouthX; 
  center.y = mouthY;
  
  fill(255);
  ellipse(center.x, center.y, 10, 10);
  
  for (let i=0; i<cols; i++) {
    for (let j=0; j<rows; j++) {
      
      if (mouthW > 30) {
        letters[i][j].scl = 1;
      } else {
        if (letters[i][j].scl > 0.3) {
          letters[i][j].scl -= 0.01;
        } else {
          letters[i][j].scl = 0.3;
        }
        
      }
      letters[i][j].display();
      // noFill();
      // rect(i*size, j*size, size, size);
    }
  }
  
  angle += 0.005;
  
}
