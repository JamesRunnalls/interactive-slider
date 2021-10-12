import { select } from "d3";

export const verifyString = (string) => {
  return typeof string === "string";
};

export const verifyType = (type) => {
  return ["single", "double"].includes(type);
};

export const verifyInput = (input) => {
  return typeof input === "number" && !isNaN(input) || typeof input.getMonth === 'function'; 
};

export const verifyNumber = (number) => {
  return typeof number === "number" && !isNaN(number);
};

export const verifyBool = (bool) => {
  return typeof bool === "boolean";
};

export const verifyColors = (colors) => {
  return true;
};

export const verifyFunction = (f) => {
  return typeof f === "function";
};

export const verifyDiv = (div) => {
  if (select("#" + div)._groups[0][0] === null) {
    throw new Error(
      "Div with ID: " + div + " not found, slider could not be added."
    );
  }
};

export const verifyData = (data) => {
  return true
};
