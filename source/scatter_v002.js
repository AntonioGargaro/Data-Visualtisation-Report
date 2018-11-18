/*--------------------------------------------------------------------

   Module: scatterplot class implemented in Bostock's functional style
   Author: Mike Chantler

   What it does:
  	Renders a bar chart and its axes using the GUP

   Dependencies
  	D3.js v4

   Modified by: Antonio Gargaro

---------------------------------------------------------------------- */
"use safe";

function scatterplot(targetDOMelement) {
  //Here we use a function declaration to imitate a 'class' definition
  //
  //Invoking the function will return an object (barchartObject)
  //    e.g. barchart_instance = scatterplot(target)
  //    This also has the 'side effect' of appending an svg to the target element
  //
  //The returned object has attached public and private methods (functions in JavaScript)
  //For instance calling method 'updateAndRenderData()' on the returned object
  //(e.g. barchart_instance) will render a scatterplot to the svg

  //Delare the main object that will be returned to caller
  var scatterplotObject = {};

  //=================== PUBLIC FUNCTIONS =========================
  //
  scatterplotObject.appendedMouseOverFunction = function(callbackFunction) {
    console.log("appendedMouseOverFunction called", callbackFunction);
    appendedMouseOverFunction = callbackFunction;
    render();
    return scatterplotObject;
  };

  scatterplotObject.appendedMouseOutFunction = function(callbackFunction) {
    appendedMouseOutFunction = callbackFunction;
    render();
    return scatterplotObject;
  };

  scatterplotObject.loadAndRenderDataset = function(data) {
    dataset = data.map(d => d); //create local copy of references so that we can sort etc.
    console.log(dataset);
    render();
    return scatterplotObject;
  };

  scatterplotObject.overridesepalWidthFunction = function(callbackFunction) {
    sepalWidth = callbackFunction;
    return scatterplotObject;
  };
  scatterplotObject.overridesepalLengthFunction = function(callbackFunction) {
    sepalLength = callbackFunction;
    return scatterplotObject;
  };

  scatterplotObject.overrideKeyFunction = function(keyFunction) {
    //The key function is used to obtain keys for GUP rendering and
    //to provide the categories for the y-axis
    //These valuse should be unique
    GUPkeyField = yAxisCategoryFunction = keyFunction;
    return scatterplotObject;
  };

  scatterplotObject.overrideMouseOverFunction = function(callbackFunction) {
    mouseOverFunction = callbackFunction;
    render();
    return scatterplotObject;
  };

  scatterplotObject.overrideMouseOutFunction = function(callbackFunction) {
    mouseOutFunction = callbackFunction;
    render(); //Needed to update DOM
    return scatterplotObject;
  };

  scatterplotObject.overrideTooltipFunction = function(toolTipFunction) {
    tooltip = toolTipFunction;
    return scatterplotObject;
  };

  scatterplotObject.overrideMouseClickFunction = function(fn) {
    mouseClick2Function = fn;
    render(); //Needed to update DOM if they exist
    return scatterplotObject;
  };

  scatterplotObject.maxValueOfDataField = function(max) {
    maxValueOfDataset = max;
    maxValueOfDataField = function() {
      return maxValueOfDataset;
    };
    return scatterplotObject;
  };

  scatterplotObject.render = function() {
    render(); //Needed to update DOM
    return scatterplotObject;
  };

  scatterplotObject.yAxisIndent = function(indent) {
    yAxisIndent = indent;
    return scatterplotObject;
  };

  //=================== PRIVATE VARIABLES ====================================
  //Width and height of svg canvas
  //Declare and append SVG element
  var margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    },
    width = 600,
    height = 450,
    marginHeight = 450 - margin.top - margin.bottom,
    marginWidth = 600 - margin.right - margin.left;
  var dataset = [];
  var uoaSelect = [];
  var xScale = d3.scaleLinear();
  var yScale = d3.scaleLinear(); //This is an ordinal (categorical) scale
  var xAxisIndent = 30; //Space for labels
  var yAxisIndent = 30; //Space for labels
  //For manual setting of bar length scaling
  //(only used if .maxValueOfDataset() public method called)
  var maxValueOfDataset;

  var uniName = "";

  //=================== INITIALISATION CODE ====================================

  //Declare and append SVG element
  var svg = d3
    .select(targetDOMelement)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .classed("scatterplot", true);

  //Declare and add group for y axis
  var yAxis = svg.append("g").classed("yAxis", true);
  //Create text SVG for yAxis
  var yAxisText = svg
    .append("text")
    .attr("transform", "translate(" + width / 2 + " ," + margin.top + ")")
    .style("text-anchor", "middle")
    .text("4* Rating");

  //Declare and add group for x axis
  var xAxis = svg.append("g").classed("xAxis", true);
  //Create text SVG for xAxis
  var xAxisText = svg
    .append("text")
    .attr("transform", function() {
      return (
        "translate(" +
        (width - margin.right) +
        "," +
        height / 2 +
        ") rotate(90)"
      );
    })
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Word Count");

  //Institution text at bottom
  svg
    .append("text")
    .attr("id", "sc1_uni_info")
    .attr("transform", function() {
      return "translate(" + width / 2 + "," + (height - margin.bottom) + ")";
    })
    .attr("dy", "1em")
    .style("text-anchor", "middle");

  //===================== ACCESSOR FUNCTIONS =========================================

  var sepalWidth = function(d) {
    return d.sepalWidth;
  };
  var sepalLength = function(d) {
    return d.sepalLength;
  }; //The length of the bars
  var tooltip = function(d) {
    return d.key + ": " + d.sepalWidth;
  }; //tooltip text for bars
  var yAxisCategoryFunction = function(d) {
    return sepalLength(d);
  }; //Categories for y-axis
  //For 'keyed' GUP rendering (set to y-axis category)
  // THIS IS OVERRIDEN IN index.html
  var GUPkeyField = yAxisCategoryFunction;

  var getInstitution = function(d) {
    return d["Institution name"];
  };

  //=================== OTHER PRIVATE FUNCTIONS ====================================
  var maxValueOfDataField = function() {
    //Find the maximum value of the data field for the x scaling
    //function using a handy d3 max() method
    //This will be used to set (normally used )
    const max = d3.max(dataset, sepalWidth);
    if (max > 0) return max;
    return 1;
  };
  var maxValueOfWordCount = function() {
    //Find the maximum value of the data field for the x scaling
    // function using a handy d3 max() method
    //This will be used to set (normally used )
    return d3.max(dataset, sepalLength);
  };

  var appendedMouseOutFunction = function() {};

  var appendedMouseOverFunction = function() {};

  var mouseOverFunction = function(d, i) {
    d3.select(this)
      .classed("highlight", true)
      .classed("noHighlight", false);

    let classes = getKeyClasses(d3.select(this));
    highlightClassKey(classes);
    highlightUniversities(d.UoAString);
  };

  var mouseOutFunction = function(d, i) {
    d3.select(this)
      .classed("highlight", false)
      .classed("noHighlight", true);
    appendedMouseOutFunction(d, i);

    let classes = getKeyClasses(d3.select(this));
    unhighlightClassKey(classes);

    resetSunburst();
    resetTowns();
  };

  var mouseclick = function(d, i) {
    addAssessmentTop3Weights(d);
  };

  var rightClickFunction = function(d, i) {
    d3.event.preventDefault();

    let circle = d3.select(this);
    toggleMouseActions(circle);

    if (circle.classed("selected")) uoaSelect[uoaSelect.length] = d;
    else {
      let index = uoaSelect.indexOf(d);
      console.log(index);
      if (index > -1) {
        uoaSelect.splice(index, 1);
      }
    }
    console.log(uoaSelect);
    console.log(d);
  };

  var toggleMouseActions = function(d) {
    if (d.on("click") == null) {
      d.on("click", mouseclick)
        .on("mouseover", mouseOverFunction)
        .on("mouseout", mouseOutFunction)
        .classed("selected", false);
    } else
      d.on("click", null)
        .on("mouseover", null)
        .on("mouseout", null)
        .classed("selected", true);
  };

  function render() {
    checkAnySelected();
    updateScalesAndRenderAxes();
    GUP_bars();
  }

  function checkAnySelected() {
    console.log(uoaSelect);
    GUPkeyField = yAxisCategoryFunction;
    if (uoaSelect.length > 0) {
      dataset = dataset.filter(function(d) {
        let match = false;
        for (let i = 0; i < uoaSelect.length; i++) {
          if (uoaSelect[i]["UoAString"] == d["UoAString"]) match = true;
        }
        return match;
      });
      //GUPkeyField = d => d["DocumentID"];
    }

    for (let i = 0; i < uoaSelect.length; i++) {
      let key = uoaSelect[i]["UoAString"].replace(/[\W]+/g, "_");
      let temp = d3.select(".key--" + key + ".selected");

      toggleMouseActions(temp);
      temp.classed("selected", false).classed("compareSelection", true);
    }

    dataset = dataset.concat(uoaSelect);
    uoaSelect = [];
    console.log(dataset);
  }

  function updateScalesAndRenderAxes() {
    //Set scales to reflect any change in width, height or the dataset size or max value
    xScale
      .domain([maxValueOfDataField(), 0])
      // Range from left to right
      .range([0, width - (yAxisIndent * 2 + 40)]); // Changes x scale on page
    yScale
      .domain([0, maxValueOfWordCount()]) //Load y-axis categories into yScale
      .range([25, height - (xAxisIndent + 40)]);

    //Now render the y-axis using the new yScale
    var yAxisGenerator = d3.axisRight(yScale);
    svg
      .select(".yAxis")
      .transition()
      .duration(1000)
      .delay(1000)
      .attr(
        "transform",
        "translate(" + (marginWidth - yAxisIndent) + "," + xAxisIndent + ")"
      )
      .call(yAxisGenerator);

    //Now render the x-axis using the new xScale
    var xAxisGenerator = d3.axisTop(xScale);
    svg
      .select(".xAxis")
      .transition()
      .duration(1000)
      .delay(1000)
      .attr(
        "transform",
        "translate(" + yAxisIndent + "," + (xAxisIndent + 20) + ")"
      )
      .call(xAxisGenerator);

    if (dataset.length > 0)
      d3.select("#sc1_uni_info")
        .transition()
        .duration(500)
        .attr("transform", function() {
          return "translate(" + width / 2 + "," + height + ")";
        })
        .on("end", function(d) {
          d3.select(this)
            .text(getInstitution(dataset[0]))
            .on("mouseover", function(d) {
              opacityClassKey([
                "key--" + getInstitution(dataset[0]).replace(/[\W]+/g, "_")
              ]);
            })
            .on("mouseleave", function(d) {
              resetSunburst();
              resetTowns();
            })
            .transition()
            .duration(500)
            .attr("transform", function() {
              return (
                "translate(" + width / 2 + "," + (height - margin.bottom) + ")"
              );
            });
        });
  }

  function GUP_bars() {
    //GUP = General Update Pattern to render circle

    //GUP: BIND DATA to DOM placeholders
    var selection = svg.selectAll("circle").data(dataset, GUPkeyField);

    //GUP: ENTER SELECTION
    var enterSel = selection //Create DOM rectangles, positioned @ x=yAxisIndent
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .on("mouseover", mouseOverFunction)
      .on("mouseout", mouseOutFunction)
      .on("contextmenu", rightClickFunction)
      .on("click", mouseclick)
      .classed("highlight", d => d.highlight)
      .classed("enterSelection circle", true);

    enterSel //Add CSS classes
      .attr("class", d => "key--" + GUPkeyField(d).replace(/[\W]+/g, "_"))
      .classed("circle enterSelection", true)
      .classed("highlight", d => d.highlight);

    enterSel //Add tooltip
      .append("title")
      .text(tooltip);

    enterSel
      .transition()
      .duration("1000")
      .attr("cx", d => xScale(sepalWidth(d)) + yAxisIndent)
      .attr("cy", d => yScale(sepalLength(d)) + xAxisIndent);

    //GUP UPDATE (anything that is already on the page)
    var updateSel = selection //update CSS classes
      .classed("noHighlight updateSelection", true)
      .classed("highlight enterSelection exitSelection", false)
      .classed("highlight", d => d.highlight);

    updateSel //update bars
      .on("mouseover", mouseOverFunction)
      .on("mouseout", mouseOutFunction)
      .classed("highlight", d => d.highlight);

    updateSel //update tool tip
      .select("title") //Note that we already created a <title></title> in the Enter selection
      .text(tooltip);

    updateSel
      .transition()
      .duration("1000")
      .attr("cx", d => xScale(sepalWidth(d)) + yAxisIndent)
      .attr("cy", d => yScale(sepalLength(d)) + xAxisIndent);

    //GUP EXIT selection
    var exitSel = selection
      .exit()
      .classed("highlight updateSelection enterSelection", false)
      .classed("exitSelection", true)
      .transition()
      .duration(1000)
      .attr("cx", width * 1.1)
      .attr("cy", height * 1.1)
      .remove();
  }

  //================== IMPORTANT do not delete ==================================
  return scatterplotObject; // return the main object to the caller to create an instance of the 'class'
} //End of scatterplot() declaration
