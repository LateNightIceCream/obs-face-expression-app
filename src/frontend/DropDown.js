class DropDownItem {
  constructor(label, content) {
    this.label = label;
    this.content = content;
  }
}


/**
 * Example: DropDown structure in HTML:
 * <details role="list" id="parent-id">
 *    <summary araia-haspopup="listbox" id="summary-id">Placeholder<y>
 *    <ul role="listbox" id="list-id">
 *      <li><a>testitem 1</a></li>
 *      <li><a>testitem 2</a></li>
 *    </ul>
 *  </details>
 */
export class DropDown {
  constructor(parentId, summaryId, listId) {
    this.parentId  = parentId;
    this.listId    = listId;
    this.summaryId = summaryId;

    this.parent  = document.getElementById(this.parentId);
    this.summary = null;
    this.list    = null;

    if (!this.parent) {
      throw new Error('DropDown Parent Element ' + this.parentId + ' does not exist!');
    }

    this.initHtml();
    this.currentSelectedChild = null;

    this.onclick = () => {};
    this.onItemSelected = (item) => {};
  }
}


DropDown.prototype.initHtml = function() {
  this.summary = document.createElement('summary');
  this.summary.ariaHasPopup = "listbox";
  this.summary.innerHTML = "Placeholder!";
  this.list = document.createElement('ul');
  this.list.setAttribute('role', 'listbox');
  this.parent.appendChild(this.summary);
  this.parent.appendChild(this.list);
};


DropDown.prototype.clearChildren = function() {
  while(this.list.firstChild) {
    this.list.removeChild(this.list.firstChild);
  }
};


DropDown.prototype._onItemSelected = function(item) {
  this.summary.innerHTML = item.label;
  this.onItemSelected(content);
  this.close();
};


DropDown.prototype.close = function() {
  this.parent.open = false;
};

DropDown.prototype.open = function() {
  this.parent.open = true;
};

/**
  * Adds a child to the dropdown and initializes event handlers
  * @param {string} label Label for the child
  * @param {Object} content Content that gets passed on click
  */
DropDown.prototype.addChild = function(label, content) {
  console.log(label);
  console.log(content);
  let item = new DropDownItem(label, content);
  let listItem = document.createElement('li');
  let link = document.createElement('a');
  link.onclick = () => this._onItemSelected(item);
  link.innerHTML = label;
  listItem.appendChild(link);
  this.list.appendChild(listItem);
};
