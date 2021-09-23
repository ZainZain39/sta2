class ShowFilter extends HTMLDivElement {
	static get observedAttributes() { return ["select"]; }

	constructor() {
		super();
		this.root = this.attachShadow({mode: "open"});
	}
	attributeChangedCallback(name, oldValue, newValue) {
		this.selected = newValue.replaceAll(" ", "-").split(",");
		this.render();
	}
	setObserver() {
		this.observer = new MutationObserver(mutations => {
			this.observer.disconnect();
			this.render();
		});
		this.observer.observe(this, {
			childList: true
		});
	}
	render() {
		this.root.innerHTML = "";
		const style = document.createElement("style");
		style.textContent = css_ShowFilter;
		this.root.appendChild(style);
		for(const child of this.children) {
			const div = document.createElement("div");
			div.classList.add("item");
			const selected = this.selected.some(v => child.classList.contains(v));
			div.classList.toggle("selected", selected);
			div.appendChild(child.cloneNode(true));
			this.root.appendChild(div);
		}
		this.setObserver();
	}
}
const css_ShowFilter = `
:host {
	display: flex;
	gap: 1px;
}
span {
	display: flex;
	justify-content: center;
	font-size: 1em;
}
img {
	width: 100%;
	float:left;
	vertical-align: bottom;
pointer-events: none;

	filter: invert(80%) grayscale(100%);
}

.item {
	display: flex;
	justify-content: center;
	width: 100%;
	color: #000;
	background: #ccc;
	user-drag: none;
	border-radius: 10px;
	overflow: hidden;
	box-sizing: border-box;
	color: #666;
	max-width: 30px;
}

.selected {
	background: fuchsia;
}

.selected > span {
	color: #fcc;
}
.selected > img {
	filter: invert(0%) grayscale(0%) brightness(180%) saturate(200%);
}

`;
customElements.define('show-filter', ShowFilter, { extends: "div" });
