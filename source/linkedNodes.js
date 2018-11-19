/*--------------------------------------------------------------------

   Module: Linked Nodes class implemented in Bostock's functional style
   Author: Antonio Gargaro
   Modified from:
   https://bl.ocks.org/mbostock/1129492
   https://bl.ocks.org/BTKY/6c282b65246f8f46bb55aadc322db709

   What it does:
  	add nodes to chart

   Dependencies
  	D3.js v4

---------------------------------------------------------------------- */
"use safe";

function linkedNodesChart(targetDOMelement) {
  //Here we use a function declaration to imitate a 'class' definition

  //Delare the main object that will be returned to caller
  var chordObject = {};

  //=================== PUBLIC FUNCTIONS =========================
  //
  chordObject.appendedMouseOverFunction = function(callbackFunction) {
    //console.log("appendedMouseOverFunction called", callbackFunction);
    appendedMouseOverFunction = callbackFunction;
    addNodes();
    return chordObject;
  };

  chordObject.appendedMouseOutFunction = function(callbackFunction) {
    appendedMouseOutFunction = callbackFunction;
    render();
    return chordObject;
  };

  chordObject.loadAndRenderDataset = function(data) {
    /*
    Dataset format
    dataset = {
      nodes: [
        {id: generatedID,
        name: 'UoAString',
        type: 'Institution | UoAString | TopicWeight',
        weight: '0.0',
        parentNode: 'parentNode',
        childNodes: [node1, node2, node3]},
      ],
      links: [
        { source: 1, target: 0},
      ]
    }*/

    doc = data;
    addNodes();
    return chordObject;
  };

  chordObject.overridesepalWidthFunction = function(callbackFunction) {
    sepalWidth = callbackFunction;
    return chordObject;
  };
  chordObject.overridesepalLengthFunction = function(callbackFunction) {
    sepalLength = callbackFunction;
    return chordObject;
  };

  chordObject.overrideKeyFunction = function(keyFunction) {
    //The key function is used to obtain keys for GUP rendering and
    //to provide the categories for the y-axis
    //These valuse should be unique
    GUPkeyField = keyFunction;
    return chordObject;
  };

  chordObject.overrideMouseOverFunction = function(callbackFunction) {
    mouseOverFunction = callbackFunction;
    render();
    return chordObject;
  };

  chordObject.overrideMouseOutFunction = function(callbackFunction) {
    mouseOutFunction = callbackFunction;
    render(); //Needed to update DOM
    return chordObject;
  };

  chordObject.overrideTooltipFunction = function(toolTipFunction) {
    tooltip = toolTipFunction;
    return chordObject;
  };

  chordObject.overrideMouseClickFunction = function(fn) {
    clickFunction = fn;
    render(); //Needed to update DOM if they exist
    return chordObject;
  };

  chordObject.render = function(callbackFunction) {
    render(); //Needed to update DOM
    return chordObject;
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
    width = 960,
    height = 500,
    radius = 6,
    doc = [],
    dataset = [],
    links = [],
    marginHeight = 450 - margin.top - margin.bottom,
    marginWidth = 600 - margin.right - margin.left;

  var rScale = d3.scaleSqrt().range([5, 20]);

  var totalWeightOfRootNodes = 0;

  var simulation = d3
    .forceSimulation()
    .velocityDecay(0.1)
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05))
    .force("charge", d3.forceManyBody().strength(-240))
    .force(
      "link",
      d3
        .forceLink()
        .distance(100)
        .strength(1)
    );

  //=================== INITIALISATION CODE ====================================

  //Declare and append SVG element
  var svg = d3
    .select(targetDOMelement)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .classed("bubble_links", true);

  var linkGroup = svg.append("g").attr("class", "linkGroup"),
    nodeGroup = svg.append("g").attr("class", "nodeGroup");

  //===================== ACCESSOR FUNCTIONS =========================================

  //The length of the bars
  var tooltip = function(d) {
    return d.key + ": " + d.sepalWidth;
  };

  function newNode(name, type, weight, parentNode) {
    return {
      id: dataset[dataset.length - 1] ? dataset[dataset.length - 1].id + 1 : 0,
      name: name,
      type: type,
      weight: weight,
      parentNode: parentNode,
      childNodes: []
    };
  }

  var scaleWeights = d3.scaleLinear().range([0, 100]);

  var color = d3.scaleOrdinal(d3.schemeCategory20);
  var institutionColor = function(d) {
    let sbNode = d3.select("g.sbNodesGroup > path." + nodeGUPkey(d));
    ////console.log(sbNode);

    if (sbNode.size() > 0) return sbNode.attr("style");

    return "";
  };

  function weightAccessor(d) {
    return d.weight;
  }

  var linkGUPkey = d => "key--" + d.source.id + "-" + d.target.id;
  var nodeGUPkey = d => "key--" + d.name.replace(/[\W]+/g, "_");
  var nodeGUPkey_d = d => nodeGUPkey(d) + "_" + d.id;

  //=================== OTHER PRIVATE FUNCTIONS ====================================

  var clickFunction = function(d, i) {
    //console.log(d);
    if (d.parentNode == null) {
      institution = {
        data: {
          key: d.name
        }
      };
      renderUniversityData(institution);
    }
  };

  var rightClickFunction = function(d, i) {
    d3.event.preventDefault();
    //console.log(dataset);
    //console.log(links);
    removeNodeAndChildren(d);
  };

  var mouseOverFunction = function(d) {
    let classes = getKeyClasses(d3.select(this));
    highlightClassKey(classes);

    if (d.type == "Institution") opacityClassKey(classes);
    if (d.type == "UoAString") highlightUniversities(d.name);
  };

  var mouseOutFunction = function(d, i) {
    let classes = getKeyClasses(d3.select(this));
    unhighlightClassKey(classes);
    resetSunburst();
    resetTowns();
  };

  function addNodes() {
    var exists = false;

    let rootNode;
    let uoaNode;

    for (let i = 0; i < dataset.length; i++) {
      if (dataset[i].name == doc["Institution name"]) {
        rootNode = dataset[i];

        for (let j = 0; j < rootNode.childNodes.length; j++)
          if (rootNode.childNodes[j].name == doc["UoAString"]) return;

        uoaNode = newNode(doc["UoAString"], "UoAString", 0, rootNode);
        dataset[i].childNodes.push(uoaNode);
        dataset.push(uoaNode);
        exists = true;
        break;
      }
    }
    if (!exists) {
      rootNode = newNode(doc["Institution name"], "Institution", 0, null);
      dataset.push(rootNode);

      uoaNode = newNode(doc["UoAString"], "UoAString", 0, rootNode);
      rootNode.childNodes.push(uoaNode);
      dataset.push(uoaNode);
    }

    let topicWeights = getBest3TopicWeights(doc);

    for (let i = 0; i < 3; i++) {
      let topic = topicWeights[i]["topic"];
      let weight = topicWeights[i]["weight"];

      // Leave out weights which are to small
      if (weight < 0.05) break;

      let newTopic = newNode(topic, "topicWeight", weight, uoaNode);

      uoaNode.childNodes.push(newTopic);

      //console.log(newTopic);
      updateWeights(newTopic);
      dataset.push(newTopic);
    }

    generateLinks();
    render(rootNode);
  }

  function render(rootNode) {
    updateScalesandRender(rootNode);
    GUP_bars();
  }

  function updateScalesandRender(rootNode) {
    let sum = 0;
    for (let i = 0; i < dataset.length; i++)
      if (dataset[i].parentNode == null) sum += dataset[i].weight;

    totalWeightOfRootNodes = sum;
    scaleWeights = scaleWeights.domain([0, totalWeightOfRootNodes]);
  }

  function GUP_bars() {
    //GUP = General Update Pattern to render line
    var link = linkGroup
      .selectAll("line")
      .data(links, d => d.source.id + "-" + d.target.id);

    // Remove links no longer being used
    link.exit().remove();

    // Update new Enter group
    var enterLink = link
      .enter()
      .append("line")
      .classed("line", true)
      .attr("class", d => d.source.id + "-" + d.target.id);

    // merge enter and update
    link = enterLink.merge(link);

    // Apply the general update pattern to the nodes.
    var node = nodeGroup.selectAll(".node").data(dataset, nodeGUPkey_d);

    // Get Node Exit selection
    var nodeExitSel = node.exit();
    // Shrink circles
    nodeExitSel
      .selectAll("circle")
      .transition()
      .duration(1000)
      .attr("r", 0);
    // and fade circles and labels
    nodeExitSel
      .transition()
      .duration(1000)
      .style("opacity", 0)
      .remove();


    // Apply to new nodes
    var nodeEnterSel = node
      .enter()
      .append("g")
      .attr("id", nodeGUPkey_d)
      .on("click", clickFunction)
      .attr("class", "node");

    var circles = nodeEnterSel
      .append("circle")
      .attr("class", nodeGUPkey)
      .attr("r", function(d) {
        return rScale(weightAccessor(d));
      })
      .attr("style", institutionColor)
      .on("contextmenu", rightClickFunction)
      .on("mouseover", mouseOverFunction)
      .on("mouseout", mouseOutFunction)
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    var labels = nodeEnterSel
      .append("text")
      .attr("x", 6)
      .attr("y", 3);

    nodeEnterSel.append("title").text(d => {
      return d.name + ", actual weight = " + (d.weight * 100).toFixed(2) + "%";
    });

    var updateNode = node.selectAll("g.node > circle").transition().duration(1000).attr("r", function(d) {
      return rScale(weightAccessor(d));
    });

    var updateSelection = node.selectAll("title").text(d => {
      return d.name + ", actual weight = " + (d.weight * 100).toFixed(2) + "%";
    });

    // Merge enter and update groups
    node = nodeEnterSel.merge(node);
    circles = nodeEnterSel.merge(node).selectAll("g.node > circle");
    labels = nodeEnterSel.merge(node).selectAll("g.node > text");

    labels.text(function(d) {
      cur_node = d;
      while (cur_node.parentNode != null) cur_node = cur_node.parentNode;

      var scaleW = scaleWeights.domain([0, cur_node.weight]);

      return d.name + " " + scaleW(d.weight).toFixed(2) + "%";
    });

    simulation.nodes(dataset).on("tick", tick);
    simulation.force("link").links(links);
    simulation.alpha(1).restart();

    // Updating
    function tick() {
      //constrains the nodes to be within a box
      circles
        .attr("cx", function(d) {
          return (d.x = Math.max(radius, Math.min(width - radius, d.x)));
        })
        .attr("cy", function(d) {
          return (d.y = Math.max(radius, Math.min(height - radius, d.y)));
        });

      // update label positions
      labels
        .attr("x", function(d) {
          return d.x;
        })
        .attr("y", function(d) {
          return d.y;
        });

      link
        .attr("x1", function(d) {
          return d.source.x;
        })
        .attr("y1", function(d) {
          return d.source.y;
        })
        .attr("x2", function(d) {
          return d.target.x;
        })
        .attr("y2", function(d) {
          return d.target.y;
        });
    }
  }

  function generateLinks() {
    for (var i = 0; i < dataset.length; i++) {
      for (var j = i + 1; j < dataset.length; j++) {
        if (
          dataset[i] === dataset[j].parentNode &&
          dataset[j].parentNode != null
        ) {
          links.push({
            source: dataset[i],
            target: dataset[j]
          });
        }
      }
    }
  }

  function getBest3TopicWeights(d) {
    var sortTopics = [];
    var weights = [];

    for (var topic in d.environment.topicWeights) {
      weights.push(d.environment.topicWeights[topic]);
      sortTopics[sortTopics.length] = {
        topic: topic,
        weight: d.environment.topicWeights[topic]
      };
    }

    return sortTopics.sort(function(a, b) {
      return a.weight < b.weight;
    });
  }

  function updateWeights(node) {
    let weight = node.weight;
    let cur_node = node;

    while (cur_node.parentNode != null) {
      cur_node = cur_node.parentNode;

      cur_node.weight += weight;
    }
  }

  function removeNodeAndChildren(node) {
    let nodeId = node.id;
    let parId = node.parentNode;
    let parNode = getNodeByid(parId);

    var childNodes = node.childNodes;

    node.weight *= -1;
    updateWeights(node);
    node.parentNode = null;

    //console.log(dataset);
    let index = dataset.indexOf(node);
    if (index > -1) {
      dataset = dataset.filter(function(d) {
        return d != node;
      });
    }

    links = links.filter(function(d) {
      return d.source != parNode && d.target != node;
    });

    for (let j = 0; j < childNodes.length; j++)
      removeNodeAndChildren(childNodes[j]);

    GUP_bars();
  }

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  //================== HELPER FUNCTIONS ==================================
  function getNodeByid(id) {
    for (let i = 0; i < dataset.length; i++) {
      if (dataset[i].id == id) {
        return dataset[i];
      }
    }
    return null;
  }

  //================== IMPORTANT do not delete ==================================
  return chordObject; // return the main object to the caller to create an instance of the 'class'
} //End of chord() declaration
