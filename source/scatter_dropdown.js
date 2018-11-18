function onSCDataChange() {
  let dataOption = d3.select("#sc1SelectID").property("value");
  let sepalWidth;

  if (dataOption == "Environment")
    sepalWidth = function(e) {
      return Number(e.environment["4*"]);
    };
  else
    sepalWidth = function(e) {
      return Number(e.outputs["4*"]);
    };

  // Render again after override
  sc1.overridesepalWidthFunction(sepalWidth).render();
}

function renderSCDataOptions(uniSelect) {
  //GUP pattern to render Universities dropdown
  var uOptions = uniSelect //Select and bind
    .selectAll(".uniOptionClass")
    .data(["Environment", "Output"]);

  uOptions //Enter Selection
    .enter()
    .append("option")
    .classed("uniOptionClass", true)
    .text(function(d) {
      return d;
    });
  uOptions //Update Selection
    .text(function(d) {
      return d;
    });
  uOptions //Exit Selection
    .exit()
    .remove();
}
