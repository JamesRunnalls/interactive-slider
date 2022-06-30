import {
  select,
  scaleTime,
  scaleLinear,
  axisBottom,
  pointer,
  timeFormat,
  timeSecond,
  timeMinute,
  timeHour,
  timeDay,
  timeMonth,
  timeYear,
  timeWeek,
  drag as d3drag,
  zoom as d3zoom,
  timeFormatDefaultLocale,
} from "d3";
import {
  verifyString,
  verifyBool,
  verifyNumber,
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
    timeFormatDefaultLocale(languageOptions(options.language));

    const svg = addSVG(div, options);
    var Axis = xAxis(options);

    addAvailability(div, svg);
    var gX = addAxis(div, svg, Axis.axis, options);
    addFocus(div, svg, Axis.ax, options);
    addTooltip(div, options);
    addEventbox(div, svg, Axis, gX, options);
    const drag = addHandles(div, svg, Axis.ax, options);

    plotAvailability(div, Axis.ax, options);
    plotHandles(div, drag, Axis.ax, options);
  } catch (e) {
    console.error(e);
  }
};

const processOptions = (div, userOptions) => {
  var defaultOptions = [
    { name: "onChange", default: false, verify: verifyFunction },
    { name: "onZoom", default: false, verify: verifyFunction },
    { name: "language", default: "en", verify: verifyString },
    { name: "min", default: 0, verify: verifyInput },
    { name: "max", default: 1, verify: verifyInput },
    { name: "upper", default: "max", verify: verifyInput },
    { name: "lower", default: "min", verify: verifyInput },
    { name: "value", default: "max", verify: verifyInput },
    { name: "availability", default: [], verify: verifyData },
    { name: "barColor", default: "#28b5f5", verify: verifyString },
    { name: "type", default: "single", verify: verifyType },
    { name: "tooltip", default: true, verify: verifyBool },
    { name: "fontSize", default: 10, verify: verifyNumber },
    { name: "marginTop", default: 25, verify: verifyNumber },
    { name: "marginLeft", default: 10, verify: verifyNumber },
    { name: "marginBottom", default: 30, verify: verifyNumber },
    { name: "marginRight", default: 10, verify: verifyNumber },
    { name: "barHeight", default: 4, verify: verifyNumber },
    { name: "handleHeight", default: 20, verify: verifyNumber },
    { name: "handleWidth", default: 2, verify: verifyNumber },
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
        console.warn(
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
  var svg = select("#" + div)
    .append("svg")
    .attr("id", "svg_" + div)
    .attr("width", options.width + options.marginLeft + options.marginRight)
    .attr("height", options.height + options.marginTop + options.marginBottom)
    .append("g")
    .attr(
      "transform",
      "translate(" + options.marginLeft + "," + options.marginTop + ")"
    )
    .attr("width", options.width);

  svg
    .append("defs")
    .append("svg:clipPath")
    .attr("id", "clip_" + div)
    .append("svg:rect")
    .attr("width", options.width)
    .attr("height", options.height + options.marginBottom + options.marginTop)
    .attr("x", 0)
    .attr("y", 0);

  svg
    .append("defs")
    .append("svg:clipPath")
    .attr("id", "cliphandle_" + div)
    .append("svg:rect")
    .attr("width", options.width + options.handleWidth * 2)
    .attr("height", options.height + options.marginBottom + options.marginTop)
    .attr("x", -options.handleWidth)
    .attr("y", 0);
  return svg;
};

const addAxis = (div, svg, axis, options) => {
  return svg
    .append("g")
    .attr("class", "interactive-slider-xaxis")
    .attr("id", "xAxis_" + div)
    .style("font-size", `${options.fontSize}px`)
    .attr("transform", "translate(0," + options.height + ")")
    .call(axis);
};

const xAxis = (options) => {
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
  if (options.min instanceof Date) {
    axis.tickFormat(multiFormat);
  }
  return { ax, ref, base, axis };
};

const addAvailability = (div, svg) => {
  svg
    .append("g")
    .attr("class", "interactive-slider-availability")
    .attr("id", "availability_" + div)
    .attr("clip-path", "url(#clip_" + div + ")");
};

const plotAvailability = (div, x, options) => {
  select("#availability_" + div)
    .selectAll("*")
    .remove();
  select("#availability_" + div)
    .selectAll("dot")
    .data(options.availability)
    .enter()
    .append("rect")
    .attr("height", options.barHeight)
    .attr("width", function (d) {
      return Math.max(1, x(d[1]) - x(d[0]));
    })
    .attr("stroke", options.barColor)
    .attr("fill", options.barColor)
    .attr("x", function (d) {
      return x(d[0]);
    })
    .attr("y", options.height - options.barHeight / 2);
};

const addFocus = (div, svg, x, options) => {
  var focus = svg
    .append("g")
    .attr("class", "interactive-slider-focus")
    .attr("id", "focus_" + div);
  focus
    .append("rect")
    .attr("id", "focushandle_" + div)
    .attr("height", 0.9 * options.handleHeight)
    .attr("width", 0.2)
    .style("fill", "#989c9e")
    .attr("stroke", "#989c9e")
    .attr("x", x(options.min))
    .attr("y", options.height - 0.45 * options.handleHeight)
    .style("opacity", 0);
};

const addHandles = (div, svg, x, options) => {
  function dragstarted() {
    select("#focus_" + div).style("opacity", 0);
  }
  function dragged(event) {
    var id = select(this).attr("id");
    if (id === "handles-lower_" + div && event.x < x(options.upper)) {
      select(this).attr("x", event.x);
      plotTooltip(div, x, event, options, drag = true);
    } else if (id === "handles-upper_" + div && event.x > x(options.lower)) {
      select(this).attr("x", event.x);
      plotTooltip(div, x, event, options, drag = true);
    } else if (id === "handles-value_" + div) {
      select(this).attr("x", event.x);
      plotTooltip(div, x, event, options, drag = true);
    }
  }
  function dragended(event) {
    select("#focus_" + div).style("opacity", 1);
    try {
      var id = select(this).attr("id");
      var v = x.invert(select("#" + id).attr("x"));
      if (id === "handles-lower_" + div) {
        options.lower = v;
        if (options.onChange) {
          options.onChange([v, options.upper]);
        }
      } else if (id === "handles-upper_" + div) {
        options.upper = v;
        if (options.onChange) {
          options.onChange([options.lower, v]);
        }
      } else if (id === "handles-value_" + div) {
        options.value = v;
        if (options.onChange) {
          options.onChange([v]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  svg
    .append("g")
    .attr("class", "interactive-slider-handles")
    .attr("id", "handles_" + div)
    .attr("clip-path", "url(#cliphandle_" + div + ")");

  var drag = d3drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);

  return drag;
};

const plotHandles = (div, drag, x, options) => {
  var handles = select("#handles_" + div);
  handles.selectAll("*").remove();
  if (options.type === "single") {
    handles
      .append("rect")
      .attr("id", "handles-value_" + div)
      .attr("class", "interactive-slider-handles")
      .attr("cursor", "pointer")
      .attr("height", options.handleHeight)
      .attr("width", options.handleWidth)
      .attr("x", x(options.value))
      .attr("y", options.height - 1 - options.handleHeight / 2)
      .on("mouseover", function (event) {
        mouseover(event, div, options);
      })
      .on("mousemove", function (event) {
        mousemove(event, div, x, options);
      })
      .on("mouseout", function () {
        mouseout(div);
      })
      .call(drag);
  } else if (options.type === "double") {
    handles
      .append("rect")
      .attr("id", "handles-lower_" + div)
      .attr("class", "interactive-slider-handles")
      .attr("cursor", "pointer")
      .attr("height", options.handleHeight)
      .attr("width", options.handleWidth)
      .attr("x", x(options.lower))
      .attr("y", options.height - 1 - options.handleHeight / 2)
      .on("mouseover", function (event) {
        mouseover(event, div, options);
      })
      .on("mousemove", function (event) {
        mousemove(event, div, x, options);
      })
      .on("mouseout", function () {
        mouseout(div);
      })
      .call(drag);
    handles
      .append("rect")
      .attr("id", "handles-upper_" + div)
      .attr("class", "interactive-slider-handles")
      .attr("cursor", "pointer")
      .attr("height", options.handleHeight)
      .attr("width", options.handleWidth)
      .attr("x", x(options.upper))
      .attr("y", options.height - 1 - options.handleHeight / 2)
      .on("mouseover", function (event) {
        mouseover(event, div, options);
      })
      .on("mousemove", function (event) {
        mousemove(event, div, x, options);
      })
      .on("mouseout", function () {
        mouseout(div);
      })
      .call(drag);
  }
};

const moveHandles = (div, x, options) => {
  if (options.type === "single") {
    select("#handles-value_" + div).attr("x", x(options.value));
  } else if (options.type === "double") {
    select("#handles-lower_" + div).attr("x", x(options.lower));
    select("#handles-upper_" + div).attr("x", x(options.upper));
  }
};

const addTooltip = (div, options) => {
  select("#" + div)
    .append("div")
    .attr("id", "tooltip_" + div)
    .style("font-size", `${options.fontSize}px`)
    .style("position", "absolute")
    .style("bottom", options.marginBottom + options.height + "px")
    .style("left", options.marginLeft)
    .attr("class", "interactive-slider-tooltip");
};

const plotTooltip = (div, x, event, options, drag = false) => {
  try {
    var tooltip = select("#tooltip_" + div);
    var e = drag ? event.x : pointer(event)[0];
    tooltip.html(tooltipText(x.invert(e), options));
    let tooltipwidth = tooltip.node().getBoundingClientRect().width;
    tooltip.style(
      "left",
      Math.max(
        Math.min(options.width - tooltipwidth, e - tooltipwidth / 2),
        0
      ) +
        options.marginLeft +
        "px"
    );
  } catch (e) {}
};

const tooltipText = (text, options) => {
  var months = languageOptions(options.language).shortMonths;
  if (text instanceof Date) {
    return `${text.getHours() < 10 ? "0" + text.getHours() : text.getHours()}:${
      text.getMinutes() < 10 ? "0" + text.getMinutes() : text.getMinutes()
    } ${text.getDate()}-${months[text.getMonth()]} ${text.getFullYear()}`;
  } else {
    return Math.round(text * 1000) / 1000;
  }
};

const addEventbox = (div, svg, Axis, gX, options) => {
  var zoom = d3zoom()
    .extent([
      [0, 0],
      [options.width, options.height],
    ])
    .on("zoom", function (event) {
      zoomed(event, div, Axis.ax, Axis.ref, gX, Axis.axis, options);
    })
    .on("end", function (event) {
      zoomEnd(event, Axis.ax, options);
    });

  var eventbox = svg
    .append("rect")
    .attr("id", "eventbox_" + div)
    .attr("width", options.width)
    .attr("height", options.height + options.marginTop + options.marginBottom)
    .style("fill", "none")
    .style("cursor", "pointer")
    .attr("y", -options.marginTop)
    .attr("pointer-events", "all")
    .call(zoom);

  eventbox
    .on("dblclick.zoom", null)
    .on("mouseover", function (event) {
      mouseover(event, div, options);
    })
    .on("mousemove", function (event) {
      mousemove(event, div, Axis.ax, options);
    })
    .on("mouseout", function () {
      mouseout(div);
    })
    .on("click", function (event) {
      onclick(event, div, Axis.ax, options);
    });
};

const zoomEnd = (event, x, options) => {
  if (event) {
    if (options.onZoom) {
      options.onZoom(x.domain());
    }
  }
};

const zoomed = (event, div, x, ref, gX, axis, options) => {
  if (event) {
    let d = event.transform.rescaleX(ref).domain();
    x.domain(d);
  }
  gX.call(axis);
  plotAvailability(div, x, options);
  moveHandles(div, x, options);
};

const onclick = (event, div, x, options) => {
  var value = x.invert(event.layerX - options.marginLeft);
  if (options.type === "single") {
    select("#handles-value_" + div).attr(
      "x",
      event.layerX - options.marginLeft
    );
    options.value = value;
    if (options.onChange) {
      options.onChange([options.value]);
    }
  } else if (options.type === "double") {
    if (value <= options.lower) {
      select("#handles-lower_" + div).attr(
        "x",
        event.layerX - options.marginLeft
      );
      options.lower = value;
      if (options.onChange) {
        options.onChange([options.lower, options.upper]);
      }
    } else if (value >= options.upper) {
      select("#handles-upper_" + div).attr(
        "x",
        event.layerX - options.marginLeft
      );
      options.upper = value;
      if (options.onChange) {
        options.onChange([options.lower, options.upper]);
      }
    } else if (
      Math.abs(value - options.lower) > Math.abs(value - options.upper)
    ) {
      select("#handles-upper_" + div).attr(
        "x",
        event.layerX - options.marginLeft
      );
      options.upper = value;
      if (options.onChange) {
        options.onChange([options.lower, options.upper]);
      }
    } else {
      select("#handles-lower_" + div).attr(
        "x",
        event.layerX - options.marginLeft
      );
      options.lower = value;
      if (options.onChange) {
        options.onChange([options.lower, options.upper]);
      }
    }
  }
};

const mouseover = (event, div, options) => {
  try {
    var focushandle = select("#focushandle_" + div);
    focushandle.attr("x", pointer(event)[0]);
    focushandle.style("opacity", 1);
    if (options.tooltip) {
      select("#tooltip_" + div).style("visibility", "visible");
    }
  } catch (e) {
    console.error(e);
  }
};

const mousemove = (event, div, x, options) => {
  try {
    var focushandle = select("#focushandle_" + div);
    focushandle.attr("x", pointer(event)[0]);
  } catch (e) {}
  try {
    plotTooltip(div, x, event, options);
  } catch (e) {}
};

const mouseout = (div) => {
  try {
    select("#focushandle_" + div).style("opacity", 0);
    select("#tooltip_" + div).style("visibility", "hidden");
  } catch (e) {}
};

const multiFormat = (date) => {
  var formatMillisecond = timeFormat(".%L"),
    formatSecond = timeFormat(":%S"),
    formatMinute = timeFormat("%H:%M"),
    formatHour = timeFormat("%H:%M"),
    formatDay = timeFormat("%a %d"),
    formatWeek = timeFormat("%b %d"),
    formatMonth = timeFormat("%B"),
    formatYear = timeFormat("%Y");
  return (
    timeSecond(date) < date
      ? formatMillisecond
      : timeMinute(date) < date
      ? formatSecond
      : timeHour(date) < date
      ? formatMinute
      : timeDay(date) < date
      ? formatHour
      : timeMonth(date) < date
      ? timeWeek(date) < date
        ? formatDay
        : formatWeek
      : timeYear(date) < date
      ? formatMonth
      : formatYear
  )(date);
};

export default slider;
