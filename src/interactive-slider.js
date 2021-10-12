import {
  select,
  extent,
  scaleTime,
  scaleLinear,
  axisBottom,
  symbol,
  symbolTriangle,
  zoomIdentity,
  range,
  zoom as d3zoom,
  timeFormatDefaultLocale,
} from "d3";
import {
  verifyString,
  verifyBool,
  verifyNumber,
  verifyColors,
  verifyDiv,
  verifyData,
  verifyFunction,
  verifyType,
  verifyInput,
} from "./verify";
import { languageOptions } from "./functions";

const slider = (div, options = {}) => {
  try {
    select("#svg_" + div).remove();
    select("#tooltip_" + div).remove();
  } catch (e) {}
  try {
    verifyDiv(div);
    options = processOptions(div, options);
    console.log(options);

    const svg = addSVG(div, options);
    timeFormatDefaultLocale(languageOptions(options.language));
    var Axis = xAxis(svg, options);

    const plotBars = plotAvailability(div, svg, Axis.ax, options);
    plotBars();

    Axis.g = plotAxis(svg, Axis.axis, options);
    
    var focushandle = addFocus(svg, Axis.axis, options);
  } catch (e) {
    console.error(e);
  }
};

const processOptions = (div, userOptions) => {
  var defaultOptions = [
    { name: "language", default: "en", verify: verifyString },
    { name: "min", default: 0, verify: verifyInput },
    { name: "max", default: 1, verify: verifyInput },
    { name: "upper", default: "max", verify: verifyInput },
    { name: "lower", default: "min", verify: verifyInput },
    { name: "value", default: "max", verify: verifyInput },
    { name: "availability", default: [], verify: verifyData },
    { name: "barcolor", default: "#28b5f5", verify: verifyString },
    { name: "type", default: "single", verify: verifyType },
    { name: "showtooltip", default: true, verify: verifyBool },
    { name: "fontSize", default: 10, verify: verifyNumber },
    { name: "marginTop", default: 25, verify: verifyNumber },
    { name: "marginLeft", default: 2, verify: verifyNumber },
    { name: "marginBottom", default: 30, verify: verifyNumber },
    { name: "marginRight", default: 2, verify: verifyNumber },
    { name: "barHeight", default: 4, verify: verifyNumber },
    {
      name: "width",
      default: select("#" + div)
        .node()
        .getBoundingClientRect().width,
      verify: verifyNumber,
    },
  ];
  var optionList = defaultOptions.map((d) => d.name);
  var options = {};
  for (let i = 0; i < defaultOptions.length; i++) {
    if (defaultOptions[i].name in userOptions) {
      if (defaultOptions[i].verify(userOptions[defaultOptions[i].name])) {
        options[defaultOptions[i].name] = userOptions[defaultOptions[i].name];
      } else {
        console.error(
          `${userOptions[defaultOptions[i].name]} is not a valid input for ${
            defaultOptions[i].name
          }`
        );
        if (optionList.includes(defaultOptions[i].default)) {
          options[defaultOptions[i].name] = options[defaultOptions[i].default];
        } else {
          options[defaultOptions[i].name] = defaultOptions[i].default;
        }
      }
    } else {
      if (optionList.includes(defaultOptions[i].default)) {
        options[defaultOptions[i].name] = options[defaultOptions[i].default];
      } else {
        options[defaultOptions[i].name] = defaultOptions[i].default;
      }
    }
  }
  options["width"] = Math.max(
    100,
    options["width"] - options.marginLeft - options.marginRight
  );
  options["height"] = options.fontSize * 2;
  return options;
};

const addSVG = (div, options) => {
  return select("#" + div)
    .append("svg")
    .attr("id", "svg_" + div)
    .attr("width", options.width + options.marginLeft + options.marginRight)
    .attr("height", options.height + options.marginTop + options.marginBottom)
    .append("g")
    .attr(
      "transform",
      "translate(" + options.marginLeft + "," + options.marginTop + ")"
    );
};

const plotAxis = (svg, axis, options) => {
  return svg
    .append("g")
    .attr("class", "xaxis")
    .attr("id", "axis--x")
    .style("font-size", `${options.fontSize}px`)
    .attr("transform", "translate(0," + options.height + ")")
    .call(axis);
};

const xAxis = (svg, options) => {
  var ax;
  if (options.min instanceof Date) {
    ax = scaleTime()
      .range([0, options.width])
      .domain([options.min, options.max]);
  } else {
    ax = scaleLinear()
      .range([0, options.width])
      .domain([options.min, options.max]);
  }
  var ref = ax.copy();
  var base = ax.copy();
  var axis = axisBottom(ax).ticks(4).tickPadding(10);
  return { ax, ref, base, axis };
};

const plotAvailability = (div, svg, x, options) => {
  var bars = svg
    .append("g")
    .attr("class", "bars")
    .attr("id", "bars_" + div);
  function plotBars() {
    select("#bars_" + div)
      .selectAll("*")
      .remove();
    bars
      .selectAll("dot")
      .data(options.availability)
      .enter()
      .append("rect")
      .attr("height", options.barHeight)
      .attr("width", function (d) {
        return Math.max(1, x(d[1]) - x(d[0]));
      })
      .attr("stroke", options.barcolor)
      .attr("fill", options.barcolor)
      .attr("x", function (d) {
        return x(d[0]);
      })
      .attr("y", options.height - options.barHeight / 2);
  }
  return plotBars;
};

const addFocus = (svg, x, options) => {
  var focus = svg.append("g").attr("class", "focus").attr("id", "focus");
  return focus
    .append("rect")
    .attr("height", 18)
    .attr("width", 0.2)
    .style("fill", "#989c9e")
    .attr("stroke", "#989c9e")
    .attr("x", x(options.min))
    .attr("y", -8)
    .style("opacity", 0);
};

export default slider;
