class DropDownChild {
  constructor(label, content) {
    this.label = label;
    this.content = content;
  }
}

class DropDown {
  constructor(id) {
    this.id = id;
    this.parent = document.getElementById(this.id);
    if (!this.parent) {
      throw new Error('DropDown Element ' + this.id + ' does not exist!');
    }
    this.currentSelectedChild = null;
    this.initEventHandlers();
  }
  this.onclick = () => {};
  this.onItemSelected = (item) => {};
}

DropDown.prototype.initEventHandlers = function() {
  this.parent.onclick = this.onParentClicked;
};

DropDown.prototype.clearChildren = function() {
  while(this.parent.firstChild) {
    this.parent.removeChild(this.parent.firstChild);
  }
};

/**
  * Adds a child to the dropdown and initializes event handlers
  * @param {string} label Label for the child
  * @param {Object} content Content that gets passed on click
  */
DropDown.prototype.addChild = function(label, content) {
  let child = DropDownChild(label, content);
  let list = document.createElement('li');
  let link = document.createElement('a');
  link.onclick = () => this.onItemSelected(content);
  link.innerHTML = label;
  list.appendChild(link);
  this.parent.appendChild(list);
};
