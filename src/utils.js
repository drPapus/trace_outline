export function checkLineIntersection(line1Point1, line1Point2, line2Point1, line2Point2) {
  const line1StartX = line1Point1.x;
  const line1StartY = line1Point1.y;
  const line1EndX = line1Point2.x;
  const line1EndY = line1Point2.y;

  const line2StartX = line2Point1.x;
  const line2StartY = line2Point1.y;
  const line2EndX = line2Point2.x;
  const line2EndY = line2Point2.y;

  let a;
  let b;
  let numerator1;
  let numerator2;
  let denominator;

  const result = {
    x: null,
    y: null,
    onLine1: false,
    onLine2: false
  };

  denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));

  if (denominator === 0) {
    return result;
  }

  a = line1StartY - line2StartY;
  b = line1StartX - line2StartX;
  numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
  numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
  a = numerator1 / denominator;
  b = numerator2 / denominator;

  result.x = line1StartX + (a * (line1EndX - line1StartX));
  result.y = line1StartY + (a * (line1EndY - line1StartY));

  if (a > 0 && a < 1) {
    result.onLine1 = true;
  }

  if (b > 0 && b < 1) {
    result.onLine2 = true;
  }

  return result;
};