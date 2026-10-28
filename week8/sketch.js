let shared;

// Load the connection and shared data before setup().
function preload() {
  partyConnect(
    "wss://demoserver.p5party.org",
    "nature-class-blue-v1"
  );

  shared = partyLoadShared("circle", {
    x: 200,
    y: 200,
    size: 60,
    color: "black"
  });
}

function setup() {
  createCanvas(400, 400);
  noStroke();
}

function draw() {
  background(255);

  fill(shared.color);
  circle(shared.x, shared.y, shared.size);

  fill(0);
  textSize(13);
  text("Click or drag to move", 15, 345);
  text("1 / 2 / 3: color", 15, 365);
  text("+ / -: size", 15, 385);
}

function mousePressed() {
  moveCircle();
}

function mouseDragged() {
  moveCircle();
}

function moveCircle() {
  // Ignore clicks outside the canvas.
  if (
    mouseX < 0 || mouseX > width ||
    mouseY < 0 || mouseY > height
  ) {
    return;
  }

  shared.x = mouseX;
  shared.y = mouseY;
}

function keyPressed() {
  if (key === "1") shared.color = "magenta";
  if (key === "2") shared.color = "purple";
  if (key === "3") shared.color = "black";

  if (key === "+" || key === "=") {
    shared.size = min(200, shared.size + 10);
  }

  if (key === "-") {
    shared.size = max(10, shared.size - 10);
  }
}