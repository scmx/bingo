let url = new URL(location);
let itemNames = url.searchParams.getAll("s");
itemNames.length = 25;
const choices = [];
let current = null;
const grid = document.querySelector("div[data-bingo-items-grid]");
let pointerId;
grid.onpointerdown = (event) => {
  pointerId = event.pointerId;
  const [x, y] = findGridPos(event);
  current = [[x, y]];
};
grid.onpointerover = (event) => {
  if (pointerId !== event.pointerId) return;
  if (!current || !current[0]) return;
  updateCurrent(event);
  updateGrid();
};
grid.onpointerup = (event) => {
  if (pointerId !== event.pointerId) return;
  if (!current || !current[0]) return;
  updateCurrent(event);
  choices.push(current);
  pointerId = null;
  updateGrid();
  updateQuote();
};
grid.onpointerleave = (event) => {
  if (pointerId !== event.pointerId) return;
  if (!current || !current[0]) return;
  updateCurrent(event);
  choices.push(current);
  pointerId = null;
  updateGrid();
  updateQuote();
};

const quote = document.querySelector("p[data-bingo-quote]");
const choicesList = document.querySelector("ul[data-bingo-choices]");
const editor = document.querySelector("details[data-bingo-editor]");

const random = document.querySelector("button[data-bingo-random-button]");
random.onclick = () => {
  randomChoice();
};

const lock = document.querySelector("button[data-bingo-lock-button]");
lock.onclick = () => {
  editor.remove();
  url.searchParams.set("lock", "");
  history.replaceState(null, "", url.href);
};

const form = document.querySelector("form[data-bingo-items-form]");
form.onsubmit = (event) => {
  event.preventDefault();
};

const shuffle = document.querySelector("button[data-bingo-shuffle-button]");
shuffle.onclick = () => {
  shuffleArray(itemNames);
  update();
  updateInputs();
};

const inputs = [...form.querySelectorAll("input")];
const items = [...grid.querySelectorAll("div")];

inputs.forEach((_, i) => {
  items[i].textContent = itemNames[i];

  if (itemNames[i]) inputs[i].value = itemNames[i];

  inputs[i].oninput = (event) => {
    itemNames[i] = event.target.value;
    update();
  };
});

randomChoice();

if (url.searchParams.has("lock")) editor.remove();

function randomChoice() {
  const x1 = Math.floor(Math.random() * 5);
  const y1 = Math.floor(Math.random() * 5);
  const alternatives = [
    ...new Set(
      [...Array(5)].flatMap((_, x) =>
        [...Array(5)].map((_, y) => expandDirection(x1, y1, x, y)),
      ),
    ),
  ].filter((a) => a.length > 1);
  current = alternatives[Math.floor(Math.random() * alternatives.length)];
  update();
}

function update() {
  updateQuote();
  updateGrid();
  updateParams();
}

function updateQuote() {
  const chosen = current.map(([x, y]) => itemNames[x + y * 5]);
  quote.textContent = chosen.join(", ");

  choicesList.innerHTML = "";
  for (const choice of choices) {
    const li = document.createElement("li");
    choicesList.appendChild(li);
    li.textContent = choice.map(([x, y]) => itemNames[x + y * 5]).join(", ");
  }
}

function updateGrid() {
  for (let i = 0; i < itemNames.length; i++) {
    const x = i % 5;
    const y = Math.floor(i / 5);
    items[i].textContent = itemNames[i];
    items[i].classList.toggle("active", choices.some(containsPos([x, y])));
    items[i].classList.toggle(
      "current",
      current && containsPos([x, y])(current),
    );
  }
}

function containsPos([x, y]) {
  return (list) => list.some(([cx, cy]) => cx === x && cy === y);
}

function updateInputs() {
  for (let i = 0; i < itemNames.length; i++) {
    if (itemNames[i]) inputs[i].value = itemNames[i] ?? "";
  }
}

function updateParams() {
  url.searchParams.delete("s");
  for (let i = 0; i < itemNames.length; i++) {
    if (itemNames[i]) url.searchParams.append("s", itemNames[i]);
  }
  history.replaceState(null, "", url.href);
}

function findGridPos(event) {
  const rect = grid.getBoundingClientRect();
  const cell = { width: rect.width / 5, height: rect.height / 5 };
  const x = Math.floor((event.clientX - rect.left) / cell.width);
  const y = Math.floor((event.clientY - rect.top) / cell.height);
  return [x, y];
}

function updateCurrent(event) {
  const [x1, y1] = current[0];
  const [x2, y2] = findGridPos(event);
  current = expandDirection(x1, y1, x2, y2);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function expandDirection(x1, y1, x2, y2) {
  const res = expandDirectionInner(x1, y1, x2, y2);
  if (!res.length) debugger;
  return res;
}
function expandDirectionInner(x1, y1, x2, y2) {
  const xd = x2 - x1;
  const yd = y2 - y1;
  const xa = Math.abs(xd);
  const ya = Math.abs(yd);
  if (xa > ya) return expandRange(x1, x2).map((x) => [x, y1]);
  if (xa < ya) return expandRange(y1, y2).map((y) => [x1, y]);
  const xr = expandRange(x1, x2);
  const yr = expandRange(y1, y2);
  return xr.map((x, i) => [x, yr[i]]);
}
assertEqual(expandDirection(0, 0, 2, 2), [
  [0, 0],
  [1, 1],
  [2, 2],
]);
assertEqual(expandDirection(2, 2, 0, 0), [
  [2, 2],
  [1, 1],
  [0, 0],
]);
assertEqual(expandDirection(0, 0, 1, 2), [
  [0, 0],
  [0, 1],
  [0, 2],
]);
assertEqual(expandDirection(0, 0, 2, 1), [
  [0, 0],
  [1, 0],
  [2, 0],
]);

function expandRange(start, end) {
  const length = Math.abs(end - start) + 1;
  const dir = end - start > 0 ? 1 : -1;
  return Array.from({ length }, (_, i) => start + i * dir);
}
assertEqual(expandRange(0, 2), [0, 1, 2]);
assertEqual(expandRange(2, 0), [2, 1, 0]);
assertEqual(expandRange(4, 0), [4, 3, 2, 1, 0]);

function assertEqual(actual, expected) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  const message = `Expected ${left} to equal ${right}`;
  console.assert(left === right, message);
}
