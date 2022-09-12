const doc = document;

const i$ = id => doc.getElementById(id),
      c$ = (cls, node = doc) => node.getElementsByClassName(cls),
      t$ = (tag, node = doc) => node.getElementsByTagName(tag);

const Ele = (tag, cls, id, prop) => {
  let ele = doc.createElement(tag);
  if (cls) ele.className = cls;
  if (id) ele.id = id;
  if (prop) Object.assign(ele, prop);
  return ele;
};

HTMLElement.prototype.hC = function(cls) {
  return this.classList.contains(cls);
};
HTMLElement.prototype.aC = function(...cls) {
  this.classList.add(...cls);
};
HTMLElement.prototype.rC = function(...cls) {
  this.classList.remove(...cls);
};