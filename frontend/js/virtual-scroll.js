/** Virtual scrolling for large model lists. */
export class VirtualScroll {
  constructor(container, { itemHeight, gap, renderItem }) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.gap = gap;
    this.renderItem = renderItem;
    this.items = [];
    this.columns = 1;
    this.scrollTop = 0;

    this.container.style.overflow = "auto";
    this.content = document.createElement("div");
    this.content.style.display = "grid";
    this.content.style.gap = `${gap}px`;
    this.container.appendChild(this.content);

    this.container.addEventListener("scroll", () => {
      this.scrollTop = this.container.scrollTop;
      this.render();
    });
  }

  setItems(items) {
    this.items = items;
    this.updateColumns();
    this.content.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
    this.content.style.height = `${this.getTotalHeight()}px`;
    this.render();
  }

  updateColumns() {
    const containerWidth = this.container.clientWidth;
    const itemWidth = 240; // minmax in CSS
    this.columns = Math.max(1, Math.floor(containerWidth / (itemWidth + this.gap)));
  }

  getTotalHeight() {
    const rows = Math.ceil(this.items.length / this.columns);
    return rows * (this.itemHeight + this.gap);
  }

  render() {
    const containerHeight = this.container.clientHeight;
    const startRow = Math.floor(this.scrollTop / (this.itemHeight + this.gap));
    const visibleRows = Math.ceil(containerHeight / (this.itemHeight + this.gap)) + 2;
    const startIndex = startRow * this.columns;
    const endIndex = Math.min(startIndex + visibleRows * this.columns, this.items.length);

    // Remove off-screen items
    const existingItems = this.content.querySelectorAll(".virtual-item");
    existingItems.forEach((el) => {
      const index = parseInt(el.dataset.index);
      if (index < startIndex || index >= endIndex) el.remove();
    });

    // Add visible items
    for (let i = startIndex; i < endIndex; i++) {
      const existing = this.content.querySelector(`[data-index="${i}"]`);
      if (!existing) {
        const row = Math.floor(i / this.columns);
        const col = i % this.columns;
        const wrapper = document.createElement("div");
        wrapper.className = "virtual-item";
        wrapper.dataset.index = i;
        wrapper.style.gridRow = `${row + 1}`;
        wrapper.style.gridColumn = `${col + 1}`;
        wrapper.style.height = `${this.itemHeight}px`;
        wrapper.appendChild(this.renderItem(this.items[i]));
        this.content.appendChild(wrapper);
      }
    }
  }
}