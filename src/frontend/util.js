
export function log(...txt) {
  console.log(...txt); // eslint-disable-line no-console
  const div = document.getElementById('log');
  if (div) {
    div.innerHTML += `<br>${txt}`;
  }
}

export function delay(t, v) {
    return new Promise(resolve => setTimeout(resolve, t, v));
}

export function logStreamSettings(stream) {
  const track = stream.getVideoTracks()[0];
  const settings = track.getSettings();
  if (settings.deviceId) delete settings.deviceId;
  if (settings.groupId) delete settings.groupId;
  if (settings.aspectRatio) {
    settings.aspectRatio = Math.trunc(100 * settings.aspectRatio) / 100;
  }
  log(`Camera active: ${track.label}`);
  console.log(`Camera settings: ${settings}`);
}

// helper function to draw detected faces
export function drawFace(canvas, resultdata, str = '') {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'small-caps 20px "sans"';
  ctx.fillStyle = 'white';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.rect(resultdata.detection.box.x, resultdata.detection.box.y, resultdata.detection.box.width, resultdata.detection.box.height);
  ctx.stroke();
  ctx.globalAlpha = 1;
  //const expression = Object.entries(person.expressions).sort((a, b) => b[1] - a[1]);
  //ctx.fillText(`expression: ${Math.round(100 * expression[0][1])} % ${expression[0][0]}`, person.detection.box.x, person.detection.box.y + person.detection.box.height + 10);
  ctx.fillText(str, resultdata.detection.box.x, resultdata.detection.box.y + resultdata.detection.box.height + 10);
}

/*export function getTopExpression(data) {
  return Object.entries(data.expressions).sort((a, b) => b[1] - a[1]);
}*/
