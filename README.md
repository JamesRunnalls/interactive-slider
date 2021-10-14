# Interactive Slider

[![npm version](https://badge.fury.io/js/interactive-slider.svg)](https://badge.fury.io/js/interactive-slider)

Zoom compatible interactive slider, for dates and number. Easily display data availablity.

![Image of D3 Slider](https://runnalls.s3.eu-central-1.amazonaws.com/interactive-slider.gif)

Uses [d3](https://d3js.org/) for rendering the axis.

Check out the examples:

- [Basic](https://jamesrunnalls.github.io/interactive-slider/example/basic/) ([source](https://github.com/jamesrunnalls/interactive-slider/blob/master/example/basic/index.html))

## Quick start

```
import slider from 'interactive-slider';
```

then

```
slider(div, options={});
```

or

```
<script type="text/javascript" src="https://unpkg.com/interactive-slider"></script>
```

then

```
slider(div, options={});
```

## API reference

### div

The unique id of a div. The graph will be appended to this div and will automatically align to the div with.

### options

| Option              | Description                                     | Default     | Type         |
| ------------------- | ------------------------------------------------| ----------- | ------------ |
| onChange            | Called with new handle values when adjusted     | false       | Function     |
| onZoom              | Called with new min & max when zoomed           | false       | Function     |
| type                | Type of slider (single/ double)                 | single      | String       |
| min                 | Minimum slider value                            | 0           | Number/ Date |
| max                 | Maximum slider value                            | 1           | Number/ Date |
| upper               | Upper handle value (double slider)              | max         | Number/ Date |
| lower               | Lower handle value (double slider)              | min         | Number/ Date |
| value               | Handle value (single slider)                    | max         | Number/ Date |
| availability        | Array of [start, end] values for plotting       | []          | Array        |
| handleHeight        | Height of the handles                           | 20          | Number       |
| handleWidth         | Width of the handles                            | 2           | Number       |
| barColor            | Availability bar color                          | #28b5f5     | String       |
| barHeight           | Availability bar height                         | 4           | Number       |
| tooltip             | Show a tooltip on hover                         | true        | Boolean      |
| fontSize            | Font size for axis and tooltip                  | 10          | Number       |
| marginTop           | Top margin in px                                | 25          | Number       |
| marginLeft          | Left margin in px                               | 10          | Number       |
| marginBottom        | Bottom margin in px                             | 30          | Number       |
| marginRight         | Right margin in px                              | 10          | Number       |
| width               | Set custom slider width in px                   | parent      | Number       |
| language            | Select language for time axis. en, de, fr, es   | en          | String       |

