export class DropDown {
  constructor(parentId, listId) {
    this.parentId = parentId;
    this.listId = listId;
    this.parent = document.getElementById(this.parentId);
    this.list = document.getElementById(this.listId);

    if (!this.parent) {
      throw new Error('DropDown Parent Element ' + this.parentId + ' does not exist!');
    }

    if (!this.list) {
      throw new Error('DropDown List Element ' + this.listId + ' does not exist!');
    }

    this.currentSelectedChild = null;

    this.onclick = () => {};
    this.onItemSelected = (item) => {};
  }
}

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
  console.log(label);
  console.log(content);
  let listItem = document.createElement('li');
  let link = document.createElement('a');
  link.onclick = () => this.onItemSelected(content);
  link.innerHTML = label;
  listitem.appendChild(link);
  this.list.appendChild(listitem);
};
