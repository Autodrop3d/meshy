// InfoBox
// Hangs out in the corner and provides information.
// Usage:
//  var box = new InfoBox();
//  box.add(title, source, props, def;
//  box.addMultiple(title2, source2, props, def);
//  box.update(); // called manually to update the values in the box
//
// Arguments for .add:
//  -title: title for the line in the info box
//  -source: closest unchanging reference to the requisite property
//  -props: a single property name, or an array of property names, that
//    lead to the data source
//  -def: default value if the line needs to be calculated
// Arguments for .addMultiple:
//  -props: an array of single property names, or an array of arrays of
//    property names
//
// Prop names that are functions are called instead of dereferenced,
//  but this can be expensive.
//
// Examples:
//  -If the requisite property is one reference away from the source, do:
//    box.add("foo", this, "count"); // or box.add("foo", this, ["count"]);
//  Then the value displayed will be this.count.
//  -If the datum comes from this.model.count, and model is not guaranteed
//  to reference the same object, then .add is called like:
//    box.add("foo", this, ["model", "count"]);
//  When calling .update(), the value displayed in the infobox will show
//  the value of this.model.count.
//  -To include multiple data sources on one line, do:
//    box.addMultiple("foo", this, ["xmin", "xmax"]);
//  This will show [ this.xmin, this.xmax ].
//  Or:
//    box.addMultiple("foo", this, [["model", "xmin"], ["model", "xmax"]]);
//  This will show [ this.model.xmin, this.model.xmax ].

InfoBox = function() {
  this.box = document.createElement("div");
  this.box.id = "infobox"
  this.styleBox();
  document.body.appendChild(this.box);

  this.infoList = document.createElement("ul");
  this.styleInfoList();
  this.box.appendChild(this.infoList);

  this.measurementList = document.createElement("ul");
  this.styleMeasurementList();
  this.box.appendChild(this.measurementList);

  this.items = [];

  this.decimals = 4;
}

// add a line with a single data source
InfoBox.prototype.add = function(title, source, props, def) {
  var liValueElement = this.createLine(title);

  if (!this.isArray(props)){
    props = [[props]];
  }
  else {
    if (!this.isArray(props[0])) {
      props = [props];
    }
  }
  this.items.push({
    element: liValueElement,
    source: source,
    props: props,
    def: def
  });
}

InfoBox.prototype.addMultiple = function(title, source, props, def) {
    var liValueElement = this.createLine(title);

    if (!this.isArray(props)) {
      console.log("didn't pass an array for InfoBox.addMultiple; use InfoBox.add");
      return;
    }

    for (var i=0; i<props.length; i++) {
      if (!this.isArray(props[i])) {
        props[i] = [props[i]]
      }
    }
    this.items.push({
      element: liValueElement,
      source: source,
      props: props,
      def: def
    });
}

// creates a line in the infobox, returns HTML element that contains the value
InfoBox.prototype.createLine = function(title) {
  var li = document.createElement("li");
  this.styleLI(li);

  var liTitle = document.createElement("span");
  this.styleLITitle(liTitle);
  var liTitleText = document.createTextNode(title);
  liTitle.appendChild(liTitleText);

  li.appendChild(liTitle);

  var liValue = document.createElement("span");
  this.styleLIValue(liValue);

  li.appendChild(liValue);

  this.infoList.appendChild(li);

  return liValue;
}

// can be more monolithic than the general format because the measurement
// is displayed at once and completely replaced on update
InfoBox.prototype.showMeasurement = function(measurement) {
  this.showMeasurementOutput();
  var li = document.createElement("li");
  this.styleLI(li);
  var liTitle = document.createElement("span");
  this.styleLITitle(liTitle);
  liTitle.textContent = "Measurement:";
  li.appendChild(liTitle);
  this.measurementList.appendChild(li);

  for (var key in measurement) {
    li = document.createElement("li");
    this.styleLI(li);

    liTitle = document.createElement("span");
    this.styleLITitle(liTitle);
    liTitle.textContent = key;

    li.appendChild(liTitle);

    var liValue = document.createElement("span");
    this.styleLIValue(liValue);
    liValue.textContent = this.formatNumber(measurement[key]);

    li.appendChild(liValue);

    this.measurementList.appendChild(li);
  }
}

InfoBox.prototype.update = function() {
  for (var itemIdx=0; itemIdx<this.items.length; itemIdx++) {
    var item = this.items[itemIdx];

    if (!item.source) {
      item.element.textContent = "";
      continue;
    }

    var value = "";

    if (item.props.length==1) {
      value = this.getPropValue(item.source, item.props[0]);
      if (this.isNumber(value)) value = this.formatNumber(value);
    }
    else {
      var len = item.props.length;
      var valuesExist = false;
      value += "[ ";
      for (var propIdx=0; propIdx<len; propIdx++) {
        var v = this.getPropValue(item.source, item.props[propIdx]);
        if (v!=="") valuesExist = true;
        if (this.isNumber(v)) v = this.formatNumber(v);
        value += v;
        if (propIdx < len-1) value += ", ";
      }
      value += " ]";
      if (!valuesExist) value = "";
    }

    if (value==="" && item.def) value = item.def;

    item.element.textContent = value;
  }
}

InfoBox.prototype.formatNumber = function(num) {
  if ((num%1)===0) return num;
  else return num.toFixed(this.decimals);
}

InfoBox.prototype.getPropValue = function(source, propPath) {
  for (var i=0; i<propPath.length; i++) {
    if (this.isFunction(source[propPath[i]])) source = source[propPath[i]]();
    else source = source[propPath[i]];
    if (source===null || source===undefined) return "";
  }
  return source;
}

InfoBox.prototype.isArray = function(item) {
  return (Object.prototype.toString.call(item) === '[object Array]');
}

InfoBox.prototype.isString = function(item) {
  return (typeof item === 'string' || item instanceof String);
}

InfoBox.prototype.isNumber = function(item) {
  return (typeof item === 'number');
}
InfoBox.prototype.isFunction = function(item) {
  return (typeof item === 'function');
}

// STYLES

InfoBox.prototype.styleBox = function() {
  this.box.style.position = "absolute";
  this.box.style.left = "0";
  this.box.style.top = "0";
  this.box.style.width = "245px";
  this.box.style.marginLeft = "15px";
  this.box.style.backgroundColor = "#000";

  this.box.style.color = "#eee";
  this.box.style.font = "11px Lucida Grande, sans-serif";
  this.box.style.textShadow = "0 -1px 0 #111";
}

InfoBox.prototype.styleInfoList = function() {
  this.infoList.style.width = "100%";
  this.infoList.style.height = "auto";
  this.infoList.style.margin = "0";
  this.infoList.style.padding = "0";
}

InfoBox.prototype.styleMeasurementList = function() {
  this.measurementList.style.boxSizing = "border-box";
  this.measurementList.style.display = "none";
  this.measurementList.style.width = "100%";
  this.measurementList.style.height = "auto";
  this.measurementList.style.margin = "0";
  this.measurementList.style.padding = "0";
  this.measurementList.style.border = "1px solid #8adeff"
}
InfoBox.prototype.hideMeasurementOutput = function() {
  this.measurementList.style.display = "none";
  // clear the measurement box
  this.measurementList.textContent = "";
}
InfoBox.prototype.showMeasurementOutput = function() {
  this.measurementList.style.display = "block";
  // clear the measurement box
  this.measurementList.textContent = "";
}

InfoBox.prototype.styleLI = function(listItem) {
  listItem.style.width = "100%";
  listItem.style.height = "27px";
  listItem.style.lineHeight = "27px";
  listItem.style.overflow = "hidden";
  listItem.style.padding = "0 4px 0 5px";
  this.box.style.borderBottom = "1px solid #2c2c2c";
}

InfoBox.prototype.styleLITitle = function(listItemTitle) {
  listItemTitle.style.width = "40%";
  listItemTitle.style.overflow = "hidden";
  listItemTitle.style.textOverflow = "ellipsis";
  listItemTitle.style.display = "inline-block";
}

InfoBox.prototype.styleLIValue = function(listItemTitle) {
  listItemTitle.style.width = "60%";
  listItemTitle.style.overflow = "hidden";
  listItemTitle.style.textOverflow = "ellipsis";
  listItemTitle.style.display = "inline-block";
}
