import React, { Component } from "react";
import * as d3 from "d3";
import "./SliderSelect.css";

class SliderSelect extends Component {
  state = {
    graphid: Math.round(Math.random() * 100000),
    domain: false,
  };

  updateDomain = (domain) => {
    this.domain = domain;
  };

  

  plotSliderSelect = async () => {
    var { graphid } = this.state;
    try {
      d3.select("#sliderselectsvg" + graphid).remove();
      d3.select("#tooltip" + graphid).remove();
    } catch (e) {}
    var {
      type,
      min,
      max,
      upper,
      lower,
      value,
      data,
      barcolor,
      showtooltip,
      fontSize,
      onChangeLower,
      onChangeUpper,
      onChangeValue,
      language,
    } = this.props;

    if (typeof min == "undefined") min = 0;
    if (typeof max == "undefined") max = 1;
    if (typeof upper == "undefined") upper = max;
    if (typeof lower == "undefined") lower = min;
    if (typeof value == "undefined") value = max;
    if (typeof data == "undefined") data = [];
    if (typeof barcolor == "undefined") barcolor = "#28b5f5";
    if (typeof type == "undefined") type = "single";
    if (typeof showtooltip == "undefined") showtooltip = true;
    if (typeof fontSize == "undefined") fontSize = 10;
    if (typeof language == "undefined") language = "en";

    this.upper = upper;
    this.lower = lower;
    this.value = value;

    try {
      // Set language
      var lang = this.languageOptions(language);
      d3.timeFormatDefaultLocale(lang);

      // Set graph size
      var margin = { top: 25, right: 2, bottom: 30, left: 2 },
        viswidth = d3
          .select("#sliderselect" + graphid)
          .node()
          .getBoundingClientRect().width,
        visheight = margin.bottom + margin.top,
        width = viswidth - margin.left - margin.right,
        height = visheight - margin.top - margin.bottom;

      // Format X-axis
      var x, xx;
      if (min instanceof Date) {
        x = d3.scaleTime().range([0, width]).domain([min, max]);
        xx = d3.scaleTime().range([0, width]).domain([min, max]);
      } else {
        x = d3.scaleLinear().range([0, width]).domain([min, max]);
        xx = d3.scaleLinear().range([0, width]).domain([min, max]);
      }

      // Define the axes
      var xAxis = d3.axisBottom(x).ticks(4).tickPadding(10);

      // Adds the svg canvas
      var svg = d3
        .select("#sliderselect" + graphid)
        .append("svg")
        .attr("id", "sliderselectsvg" + graphid)
        .attr("class", "sliderselectsvg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("pointer-events", "all");

      // Add the availability data
      var bars = svg
        .append("g")
        .attr("class", "bars")
        .attr("id", "bars" + graphid);
      function plotdata() {
        d3.select("#bars" + graphid)
          .selectAll("*")
          .remove();
        bars
          .selectAll("dot")
          .data(data)
          .enter()
          .append("rect")
          .attr("height", 4)
          .attr("width", function (d) {
            return Math.max(1, x(d[1]) - x(d[0]));
          })
          .attr("stroke", barcolor)
          .attr("fill", barcolor)
          .attr("x", function (d) {
            return x(d[0]);
          })
          .attr("y", -1);
      }
      plotdata();

      // Add the X Axis
      var gX = svg
        .append("g")
        .attr("class", "xaxis")
        .attr("id", "axis--x" + graphid)
        .style("font-size", `${fontSize}px`)
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

      // Add the focus
      var focus = svg.append("g").attr("class", "focus").attr("id", "focus");
      var focushandle = focus
        .append("rect")
        .attr("height", 18)
        .attr("width", 0.2)
        .style("fill", "#989c9e")
        .attr("stroke", "#989c9e")
        .attr("x", x(min))
        .attr("y", -8)
        .style("opacity", 0);

      // Handle events
      var updateDomain = this.updateDomain;
      var zoom = d3
        .zoom()
        .extent([
          [0, 0],
          [width, height],
        ])
        .on("zoom", zoomed)
        .on("end", zoomEnd);

      function zoomEnd(event) {
        if (event) {
          updateDomain(event.transform.rescaleX(xx).domain());
        }
      }

      function zoomed(event) {
        plotdata();
        plothandles(value, lower, upper);
        if (event) {
          let d = event.transform.rescaleX(xx).domain();
          x.domain(d);
        }
        gX.call(xAxis);
      }

      var eventbox = svg
        .append("rect")
        .attr("id", "eventbox" + graphid)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("fill", "none")
        .style("cursor", "pointer")
        .attr("y", -margin.top)
        .attr("pointer-events", "all")
        .call(zoom);

      function mouseover(event) {
        try {
          focushandle.attr("x", d3.pointer(event)[0]);
          focushandle.style("opacity", 1);
          tooltip.style("visibility", "visible");
        } catch (e) {}
      }
      function mousemove(event) {
        try {
          focushandle.attr("x", d3.pointer(event)[0]);
        } catch (e) {}
        try {
          tooltip.html(tooltiptext(x.invert(d3.pointer(event)[0])));
          let tooltipwidth = d3
            .select("#tooltip" + graphid)
            .node()
            .getBoundingClientRect().width;
          tooltip.style(
            "left",
            Math.max(
              Math.min(
                width + margin.left + margin.right - tooltipwidth,
                d3.pointer(event)[0] - tooltipwidth / 2
              ),
              0
            ) + "px"
          );
        } catch (e) {}
      }
      function mouseout() {
        try {
          focushandle.style("opacity", 0);
          tooltip.style("visibility", "hidden");
        } catch (e) {}
      }
      function onclick(event) {
        if (type === "single") {
          d3.select("#handles-value" + graphid).attr("x", event.layerX);
          onChangeValue(x.invert(event.layerX));
          value = x.invert(event.layerX);
        } else if (type === "double") {
          var xu = Math.abs(event.layerX - x(upper));
          var xl = Math.abs(event.layerX - x(lower));
          if (xu <= xl) {
            d3.select("#handles-upper" + graphid).attr("x", event.layerX);
            onChangeUpper(x.invert(event.layerX));
            upper = x.invert(event.layerX);
          } else if (xl < xu) {
            d3.select("#handles-lower" + graphid).attr("x", event.layerX);
            onChangeLower(x.invert(event.layerX));
            lower = x.invert(event.layerX);
          }
        }
      }
      function dragstarted() {
        focushandle.style("opacity", 0);
      }
      function dragged(event) {
        var id = d3.select(this).attr("id");
        if (id === "handles-lower" + graphid && event.x < x(upper)) {
          d3.select(this).attr("x", event.x);
        } else if (id === "handles-upper" + graphid && event.x > x(lower)) {
          d3.select(this).attr("x", event.x);
        } else if (id === "handles-value" + graphid) {
          d3.select(this).attr("x", event.x);
        }
      }
      function dragended(event) {
        try {
          var id = d3.select(this).attr("id");
          var v = x.invert(d3.select("#" + id).attr("x"));
          if (id === "handles-lower" + graphid) {
            onChangeLower(v);
            lower = v;
          } else if (id === "handles-upper" + graphid) {
            onChangeUpper(v);
            upper = v;
          } else if (id === "handles-value" + graphid) {
            onChangeValue(v);
            value = v;
          }
        } catch (e) {
          console.error(e);
        }
      }

      function tooltiptext(text) {
        var months = lang.shortMonths;
        if (text instanceof Date) {
          return `${
            text.getHours() < 10 ? "0" + text.getHours() : text.getHours()
          }:${
            text.getMinutes() < 10 ? "0" + text.getMinutes() : text.getMinutes()
          } ${text.getDate()}-${months[text.getMonth()]} ${text.getFullYear()}`;
        } else {
          return Math.round(text * 1000) / 1000;
        }
      }

      eventbox
        .on("dblclick.zoom", null)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseout", mouseout)
        .on("click", onclick);

      // Add the handles
      var handles = svg
        .append("g")
        .attr("class", "handles")
        .attr("id", "handles" + graphid);
      var drag = d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);

      function plothandles(value, lower, upper) {
        d3.select("#handles" + graphid)
          .selectAll("*")
          .remove();
        if (type === "single") {
          handles
            .append("rect")
            .attr("id", "handles-value" + graphid)
            .attr("height", 20)
            .attr("width", 2)
            .attr("x", x(value))
            .attr("y", -8)
            .call(drag);
        } else if (type === "double") {
          handles
            .append("rect")
            .attr("id", "handles-lower" + graphid)
            .attr("height", 20)
            .attr("width", 2)
            .attr("x", x(lower))
            .attr("y", -8)
            .call(drag);
          handles
            .append("rect")
            .attr("id", "handles-upper" + graphid)
            .attr("height", 20)
            .attr("width", 2)
            .attr("x", x(upper))
            .attr("y", -8)
            .call(drag);
        }
      }
      plothandles(value, lower, upper);

      // Add tooltip
      if (showtooltip) {
        var tooltip = d3
          .select("#sliderselect" + graphid)
          .append("div")
          .attr("id", "tooltip" + graphid)
          .style("font-size", `${fontSize}px`)
          .attr("class", "sliderselecttooltip");
      }

      if (this.domain) {
        x.domain(this.domain);
        xx.domain(this.domain);
        zoomed(false);
      }
    } catch (e) {
      console.error("Error plotting time selector", e);
    }
  };

  componentDidMount() {
    this.domain = false;
    setTimeout(this.plotSliderSelect, 10);
    window.addEventListener("resize", this.plotSliderSelect, false);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.plotSliderSelect, false);
  }

  componentDidUpdate() {
    setTimeout(this.plotSliderSelect, 10);
  }
  render() {
    var { graphid } = this.state;
    return <div id={"sliderselect" + graphid} className="sliderselect" />;
  }
}

export default SliderSelect;
