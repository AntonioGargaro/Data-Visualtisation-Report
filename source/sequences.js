/*
Note by Antonio Gargaro:
This code was available on bl.ocks.org and licenced under Apache 2.0
Author: Kerry Rodden
Date Retrieved: 19/10/2018
Link: https://bl.ocks.org/kerryrodden/766f8f6d31f645c39f488a0befa1e3c8

Implemented the zooming funcitonality with
GNU General Public License, version 3 from,
Author: David Richard's
Date Retrieved: 28/10/2018
Link: https://bl.ocks.org/denjn5/1a3f8e44cdcb3054121dfd991f59fbc2
*/

/*
Apache 2.0 Licence

Copyright 2013 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

 */

var hierarchyGraph; //The graph of objects used to represent the hierarchy
var node; // Keep track of root

function sunburst(targetDOMelement) {
  /* I modified the original file to correspond with the same
  setup used in the labs. This allows me to understand how this
  view works as well as showing understanding of methods learned
  during lectures and labs.

  This is allowed under the Apache 2.0 Licence
  */

  //Declare the main object that will be returned to the caller
  var sunburstObject = {};

  //=================== PUBLIC FUNCTIONS =========================
  //
  sunburstObject.loadAndRenderNestDataset = function(
    nestFormatHierarchy,
    rootName
  ) {
    //Loads and renders (format 2) hierarchy in "nest" or "key-values" format.
    layoutAndRenderHierarchyInNestFormat(nestFormatHierarchy, rootName);
    return sunburstObject; //for method chaining
  };

  //=================== PRIVATE VARIABLES ====================================
  //Declare and append SVG element
  var margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 50
    },
    width = 600 - margin.right - margin.left,
    height = 450 - margin.top - margin.bottom;

  var radius = Math.min(width, height) / 2;
  // Breadcrumb dimensions: width, height, spacing, width of tip/tail.
  var b = {
    w: 10,
    h: 30,
    s: 3,
    t: 10
  };
  // Mapping of step names to colors.
  var colors = {};
  // Total size of all segments; we set this later, after loading the data.
  var totalSize = 0;

  //Setup SVG and append group to act as container for sunburst graph
  var grp = d3
    .select(targetDOMelement)
    .append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .append("svg:g")
    .attr("id", "container")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  //Add group for nodes
  var sbNodesGroup = grp.append("g").classed("sbNodesGroup", true);

  //Used to preserve proportional differences
  var x = d3.scaleLinear().range([0, 2 * Math.PI]);
  var y = d3.scaleSqrt().range([0, radius]);

  // Calculate the d path for each slice.
  var arc = d3
    .arc()
    .startAngle(function(d) {
      return Math.max(0, Math.min(2 * Math.PI, x(d.x0)));
    })
    .endAngle(function(d) {
      return Math.max(0, Math.min(2 * Math.PI, x(d.x1)));
    })
    .innerRadius(function(d) {
      return Math.max(0, y(d.y0));
    })
    .outerRadius(function(d) {
      return Math.max(0, y(d.y1));
    });

  //=================== PRIVATE FUNCTIONS ====================================
  //Add "key--" and replace nasty spaces etc with underscores
  var gupKey = d => "key--" + d.data.key.replace(/[\W]+/g, "_");

  /*var updatedTownAccessor = d =>
    d.data.value[0].lp.TOWN.replace(/[\W]+/g, "_").toLowerCase();*/
  var defaultTownAccessor = d =>
    d.data.key.replace(/[\W]+/g, "_").toLowerCase();
  var townNameAccessor = defaultTownAccessor;

  var getColour = function(d) {
    while (d.depth > 1) d = d.parent;
    return colors[d.data.key];
  };

  // Converted http://bl.ocks.org/sathomas/4a3b74228d9cb11eb486
  // to d3 v4 and utilised
  var color = function(d) {
    // This function builds the total
    // color palette incrementally so
    // we don't have to iterate through
    // the entire data structure.

    var colorsScale;

    // The root node is special since
    // we have to seed it with our
    // desired palette.
    if (!d.parent) {
      // Create a categorical color
      // scale to use both for the
      // root node's immediate
      // children. We're using the
      // 10-color predefined scale,
      // so set the domain to be
      // [0, ... 9] to ensure that
      // we can predictably generate
      // correct individual colors.
      colorsScale = d3
        .scaleOrdinal(d3.schemeCategory20)
        .domain(d3.range(0, 20));

      // White for the root node
      // itself.
      d.color = "#fff";
    } else if (d.children) {
      // Since this isn't the root node,
      // we construct the scale from the
      // node's assigned color. Our scale
      // will range from darker than the
      // node's color to brigher than the
      // node's color.
      var startColor = d3.hcl(d.color).darker(),
        endColor = d3.hcl(d.color).brighter();

      // Create the scale
      colorsScale = d3
        .scaleLinear()
        .interpolate(d3.interpolateHcl)
        .range([startColor.toString(), endColor.toString()])
        .domain([0, d.children.length + 1]);
    }

    if (d.children) {
      // Now distribute those colors to
      // the child nodes. We want to do
      // it in sorted order, so we'll
      // have to calculate that. Because
      // JavaScript sorts arrays in place,
      // we use a mapped version.
      d.children
        .map(function(child, i) {
          return {
            value: child.value,
            idx: i
          };
        })
        .sort(function(a, b) {
          return b.value - a.value;
        })
        .forEach(function(child, i) {
          d.children[child.idx].color = colorsScale(i);
        });
    }

    // Add region colours
    // to be placed in legend
    if (d.depth == 1) colors[d.data.key] = d.color;

    return d.color;
  };

  var clickFunction = function(d, i) {
    if (d.data.values) {
      console.log("node clicked, d = ", d);
      node = d;

      console.log(sbNodesGroup.selectAll("path"));
      sbNodesGroup
        .selectAll("path")
        .transition()
        .duration(1000)
        .attrTween("d", arcTweenZoom(d));
    } else renderUniversityData(d);
  };

  // Scales the bread based on key length
  var scaleBreadW = function(d) {
    return b.w * d.data.key.length;
  };

  //=================== MAIN PRIVATE FUNCTIONS ====================================

  function layoutAndRenderHierarchyInNestFormat(nestFormatHierarchy, rootName) {
    // Basic setup of page elements.
    initializeBreadcrumbTrail();

    // Bounding circle underneath the sunburst, to make it easier to detect
    // when the mouse leaves the parent g.
    sbNodesGroup
      .append("svg:circle")
      .attr("r", radius)
      .style("opacity", 0);

    //Move the 'nest' array into a root node:
    datasetAsJsonD3Hierarchy = {
      key: rootName,
      values: nestFormatHierarchy
    };

    //Now create hierarchy structure
    // Turn the data into a d3 hierarchy using the children accessor
    // 'd => d.values' to calculate the sums.
    hierarchyGraph = d3
      .hierarchy(datasetAsJsonD3Hierarchy, d => d.values)
      .sum(function(d) {
        // Our children are Universities and have 'value' variable, not 'values'
        return d.value != undefined ? 1 : 0;
      })
      .sort(function(a, b) {
        return b - a;
      });

    //And perform layout
    calculateXYpositionsAndRender(hierarchyGraph);
  }

  function calculateXYpositionsAndRender(root) {
    node = root;
    //setup the partition layout generator
    var myPartitionLayoutGenerator = d3.partition();
    //.size([2 * Math.PI, radius * radius]);

    var listOfNodes = myPartitionLayoutGenerator(root).descendants();

    GUPrenderNodes(listOfNodes);
  }

  function GUPrenderNodes(listOfNodes) {
    // BINDS DATA into selection
    var selectionGroup = sbNodesGroup
      // Returns new empty selection, parent node is container
      .selectAll("g.classSunburst")
      // Binds each data point to selection
      .data(listOfNodes);

    var enterSelectionGroup = selectionGroup
      .enter() // returns the enter selection
      .append("path") // adds path for every data point
      .attr("class", gupKey)
      .classed("classSunburst", true)
      .attr("d", arc) // Creates the arc for the data point
      .attr("fill-rule", "evenodd")
      .style("fill", color)
      .style("stroke", "#A9A9A9")
      .style("opacity", 1)
      .on("mouseover", mouseoverFunction)
      .on("click", clickFunction);

    // Add the mouseleave handler to the bounding circle.
    d3.select("#container").on("mouseleave.sb", mouseleave);

    console.log(sbNodesGroup.selectAll("path"));
    sbNodesGroup
      .selectAll("path")
      .transition()
      .duration(1000)
      .attrTween("d", arcTweenData);

    // Get total size of the tree = value of root node from partition.
    totalSize = enterSelectionGroup.datum().value;

    drawLegend();
    d3.select("#togglelegend").on("click", toggleLegend);
  }

  // Fade all but the current sequence, and show it in the breadcrumb trail.
  function mouseoverFunction(d) {
    // Change cursor type to pointer
    d3.select(this).style("cursor", "pointer");

    // Reset towns incase note
    // properly cleaned up
    resetTowns();
    resetScatter();
    resetLinkedNode();

    var percentage = ((100 * d.value) / totalSize).toPrecision(3),
      percentageString = percentage + "%";

    if (percentage < 0.1) percentageString = "< 0.1%";

    d3.select("#percentage").text(percentageString);
    d3.select("#explanation").style("visibility", "");

    var sequenceArray = d.ancestors().reverse();
    sequenceArray.shift(); // remove root node from the array
    updateBreadcrumbs(sequenceArray, percentageString);

    // Fade all the segments.
    d3.selectAll("path").style("opacity", 0.3);

    if (sequenceArray.length > 0) {
      // Get all towns attatched to slice
      var nodeDescendants = sequenceArray.reverse()[0].descendants();

      for (var i = 0; i < nodeDescendants.length; i++) {
        var townNode = nodeDescendants[i];
        while (townNode.depth > 2) townNode = townNode.parent;
        var town = townNameAccessor(townNode);
        d3.select(".key--" + town)
          .classed("highlight", true)
          .each(function(d, i) {
            var children = d3.selectAll(this.childNodes);
            children.attr("r", 2.5);
          });
      }
    }

    if (d.depth == 3) {
      let allDocs = d.data.value;
      let keys = [];
      for (let i = 0; i < allDocs.length; i++) {
        let key = allDocs[i]["UoAString"];
        keys.push("key--" + key.replace(/[\W]+/g, "_"));
      }
      highlightClassKey(keys);
    }

    // Then highlight only those that are an ancestor of the current segment.
    sbNodesGroup
      .selectAll("path")
      .filter(function(node) {
        return sequenceArray.indexOf(node) >= 0;
      })
      .style("opacity", 1);
  }

  // Restore everything to full opacity when moving off the visualization.
  function mouseleave(d) {
    // Change cursor type to default
    d3.select(this).style("cursor", "default");
    // Hide the breadcrumb trail
    d3.select("#trail").style("visibility", "hidden");

    resetAllhighlights();

    d3.select("#explanation").style("visibility", "hidden");
  }

  //https://bl.ocks.org/denjn5/1a3f8e44cdcb3054121dfd991f59fbc2
  // When switching data: interpolate the arcs in data space.
  function arcTweenData(a, i) {
    // (a.x0s ? a.x0s : 0) -- grab the prev saved x0 or set to 0 (for 1st time through)
    // avoids the stash() and allows the sunburst to grow into being
    var oi = d3.interpolate(
      {
        x0: a.x0s ? a.x0s : 0,
        x1: a.x1s ? a.x1s : 0
      },
      a
    );

    function tween(t) {
      var b = oi(t);
      a.x0s = b.x0;
      a.x1s = b.x1;
      return arc(b);
    }
    if (i == 0) {
      // If we are on the first arc, adjust the x domain to match the root node
      // at the current zoom level. (We only need to do this once.)
      var xd = d3.interpolate(x.domain(), [node.x0, node.x1]);
      return function(t) {
        x.domain(xd(t));
        return tween(t);
      };
    } else {
      return tween;
    }
  }

  // When zooming: interpolate the scales.
  function arcTweenZoom(d) {
    var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
      yd = d3.interpolate(y.domain(), [d.y0, 1]), // [d.y0, 1]
      yr = d3.interpolate(y.range(), [d.y0 ? 40 : 0, radius]);
    return function(d, i) {
      return i
        ? function(t) {
            return arc(d);
          }
        : function(t) {
            x.domain(xd(t));
            y.domain(yd(t)).range(yr(t));
            return arc(d);
          };
    };
  }

  function initializeBreadcrumbTrail() {
    // Add the svg area.
    var trail = d3
      .select("#sequence")
      .append("svg:svg")
      .attr("width", "100%")
      .attr("height", 50)
      .attr("id", "trail");
    // Add the label at the end, for the percentage.
    trail
      .append("svg:text")
      .attr("id", "endlabel")
      .style("fill", "#000");
  }

  // Generate a string that describes the points of a breadcrumb polygon.
  function breadcrumbPoints(d, i) {
    w = scaleBreadW(d); // Custom implementation by Antonio
    var points = [];
    points.push("0,0");
    points.push(w + ",0");
    points.push(w + b.t + "," + b.h / 2);
    points.push(w + "," + b.h);
    points.push("0," + b.h);
    if (i > 0) {
      // Leftmost breadcrumb; don't include 6th vertex.
      points.push(b.t + "," + b.h / 2);
    }
    return points.join(" ");
  }

  // Update the breadcrumb trail to show the current sequence and percentage.
  function updateBreadcrumbs(nodeArray, percentageString) {
    // Data join; key function combines name and depth (= position in sequence).
    var trail = d3
      .select("#trail")
      .selectAll("g")
      .data(nodeArray, function(d) {
        return d.data.key + d.depth;
      });

    // Remove exiting nodes.
    trail.exit().remove();

    // Add breadcrumb and label for entering nodes.
    var entering = trail.enter().append("svg:g");

    entering
      .append("svg:polygon")
      .attr("points", breadcrumbPoints)
      .style("fill", d => getColour(d));

    entering
      .append("svg:text")
      .attr("x", function(d) {
        w = scaleBreadW(d); // Custom implementation by Antonio
        return (w + b.t) / 2;
      })
      .attr("y", b.h / 2)
      .attr("dy", "0.3em")
      .attr("text-anchor", "middle")
      .text(function(d) {
        return d.data.key;
      });

    prevBreadW = [];
    // Merge enter and update selections; set position for all nodes.
    entering.merge(trail).attr("transform", function(d, i) {
      // Modified function by Antonio to allow
      // Text to fit into bread crumbs
      if (i == 0) {
        prevBreadW = [];
        prevBreadW.push(scaleBreadW(d));
        return "translate(1, 0)";
      }

      w = 0;
      for (j = 0; j < prevBreadW.length; j++) w += prevBreadW[j];

      prevBreadW.push(scaleBreadW(d));

      var x = w + i * b.s;
      return "translate(" + x + ", 0)";
    });

    // Now move and update the percentage at the end.
    d3.select("#trail")
      .select("#endlabel")
      .attr("x", function() {
        w = 0;
        len = prevBreadW.length;
        for (j = 0; j < len; j++) {
          w += prevBreadW[j];
        }
        // Modified return function by Antonio
        // to ensure percentage works correctly
        return w + len * b.s + b.w + 2 * b.t + b.s;
      })
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(percentageString);

    // Make the breadcrumb trail visible, if it's hidden.
    d3.select("#trail").style("visibility", "");
  }

  function drawLegend() {
    // Dimensions of legend item: width, height, spacing, radius of rounded rect.
    var li = {
      w: 75,
      h: 30,
      s: 3,
      r: 3
    };

    var legend = d3
      .select("#legend")
      .append("svg:svg")
      .attr("width", li.w)
      .attr("height", d3.keys(colors).length * (li.h + li.s));

    var g = legend
      .selectAll("g")
      .data(d3.entries(colors))
      .enter()
      .append("svg:g")
      .attr("transform", function(d, i) {
        return "translate(0," + i * (li.h + li.s) + ")";
      });

    g.append("svg:rect")
      .attr("rx", li.r)
      .attr("ry", li.r)
      .attr("width", li.w)
      .attr("height", li.h)
      .style("fill", function(d) {
        return d.value;
      });

    g.append("svg:text")
      .attr("x", li.w / 2)
      .attr("y", li.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) {
        return d.key;
      });
  }

  // Modified function to transition legend
  function toggleLegend() {
    var tt = 200;

    var legend = d3.select("#legend");
    if (legend.style("visibility") == "hidden") {
      toggleMap();
      legend
        .style("visibility", "")
        .transition()
        .duration(tt)
        .style("opacity", 1);
    } else {
      legend
        .transition()
        .duration(tt)
        .style("opacity", 0)
        .on("end", function() {
          legend.style("visibility", "hidden");
          toggleMap(tt);
        });
    }
  }

  function toggleMap(tt) {
    var map = d3.select("#sb1_map");
    if (map.empty()) return;

    if (map.style("visibility") == "hidden") {
      map
        .style("visibility", "")
        .attr("pointer-events", "")
        .transition()
        .duration(tt)
        .style("opacity", 1);
    } else {
      map
        .transition()
        .duration(tt)
        .style("opacity", 0)
        .on("end", function() {
          map.style("visibility", "hidden").attr("pointer-events", "none");
        });
    }
  }
  return sunburstObject; // return the main object to the caller to create an instance of the 'class'
}
