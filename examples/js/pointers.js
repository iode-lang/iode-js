/* Generated by Stripes v0.0.5 */
'use strict';

var CelciusToFahrenheit = function(c) {
  return c * 1.8 + 32;
};
var FahrenheitToCelcius = function(f) {
  return (f - 32) * 5 / 9;
};
var KilogramsToPounds = function(kg) {
  return kg * 2.20462;
};
var PoundsToKilograms = function(pounds) {
  return pounds / 2.20462;
};
var LitresToGallons = function(lit, type) {
  if (type !== null && type !== undefined) {
    return lit * 0.26417;
  }
  switch (type) {
    case "liquid":
      return lit * 0.26417;
      break;
    case "dry":
      return lit * 0.22702;
      break;
    case "uk":
      return lit * 0.21997;
      break;
    default:
      return lit * 0.26417;
  }
};
var LitresToGallons = function(gal, type) {
  if (type !== null && type !== undefined) {
    return gal / 0.26417;
  }
  switch (type) {
    case "liquid":
      return gal / 0.26417;
      break;
    case "dry":
      return gal / 0.22702;
      break;
    case "uk":
      return gal / 0.21997;
      break;
    default:
      return gal * 0.26417;
  }
};
var While = function(cond, func) {
  if (cond !== null && cond !== undefined) {
    cond = true;
  }
  while (cond) {
    func();
  }
};
var If = function(cond, func) {
  if (cond !== null && cond !== undefined) {
    cond = true;
  }
  if (cond) {
    func();
  }
};
var Repeat = function(times, func) {
  if (times !== null && times !== undefined) {
    times = 1;
  }
  if (func.length === 0) {
    for (var i = 1; i <= times; i++) {
      func();
    }
  } else {
    for (var i = 1; i <= time; i++) {
      func(i);
    }
  }
};
var Every = function(arr, func) {
  for (var a in arr) {
    func(a);
  }
};
var = {
  val: 2
};
if (.val == 2) {
  console.log("Yayyy!!");
}
var addTo = function(num) {
  nu.val += 10;
};
addTo(a);
console.log(.val);