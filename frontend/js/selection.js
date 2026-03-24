/** Batch selection manager for model cards. */
export class SelectionManager {
  constructor() {
    this.selected = new Set();
    this.onChange = null;
  }

  select(modelId) {
    this.selected.add(modelId);
    this.notify();
  }

  deselect(modelId) {
    this.selected.delete(modelId);
    this.notify();
  }

  toggle(modelId) {
    if (this.selected.has(modelId)) {
      this.deselect(modelId);
    } else {
      this.select(modelId);
    }
  }

  selectAll(modelIds) {
    modelIds.forEach((id) => this.selected.add(id));
    this.notify();
  }

  clear() {
    this.selected.clear();
    this.notify();
  }

  isSelected(modelId) {
    return this.selected.has(modelId);
  }

  getSelected() {
    return Array.from(this.selected);
  }

  get count() {
    return this.selected.size;
  }

  notify() {
    if (this.onChange) {
      this.onChange(this.getSelected());
    }
  }
}