class ToggleButton extends HTMLElement {
	constructor() {
		super();
		this.root = this.attachShadow({mode: "open"});
		this.setObserver();
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
		this.type = this.getAttribute("type") ?? "select";
		this.target = [];
		this.reset = null;
		this.resetTarget = [];

		const fragment = new DocumentFragment();

		const style = document.createElement("style");
		fragment.appendChild(style);
		style.innerHTML = css_togglebutton;

		const name = this.getAttribute("id");
		const format = this.getAttribute("format") ?? "button";

		const container = document.createElement("div");
		fragment.appendChild(container);
		container.setAttribute("class", format);

		[...this.children].forEach(child => {
			const reset = child.nodeName.includes("RESET-");
			const type = child.nodeName.includes("CHECK-") ? "checkbox" : "radio";
			const css = child.getAttribute("class");
			const title = child.getAttribute("title");
			const value = child.getAttribute("value");
			const checked = child.hasAttribute("checked");
			const content = child.innerHTML;

			const label = document.createElement("label");
			container.appendChild(label);
			const input = document.createElement("input");
			label.appendChild(input);
			const span = document.createElement("span");
			label.appendChild(span);
			if(css) span.setAttribute("class", css);

			input.setAttribute("type", type);
			input.setAttribute("name", name);
			if(value) input.setAttribute("value", value);
			input.checked = checked;
			if(title) span.setAttribute("title", title);
			span.innerHTML = content;

			if(reset) {
				this.reset = input;
			} else {
				this.target.push(input);
				if(type === "checkbox") this.resetTarget.push(input);
			}
		});

		if(this.reset) {
			this.resetTarget.forEach(e => e.addEventListener("change", () => this.reset.checked = this.resetTarget.filter(target => target.checked).length ? false : true));
			this.reset.addEventListener("change", () => {
				this.resetTarget.forEach(target => target.checked = false);
				this.myEvent();
			});
		}
		this.target.forEach(e => e.addEventListener("change", this.myEvent));

		this.root.appendChild(fragment);
		this.setObserver();
	}
	myEvent() {
		const event = new CustomEvent("changed", {
			bubbles: true,
			composed: true,
		});
		this.dispatchEvent(event);
	}
	get value() {
		if(this.classList.contains("reject")) return this.target.flatMap(e => e.value.split(","));
		if(this.reset?.checked) return this.target.flatMap(e => e.value.split(","));
		return this.target.filter(e => this.type === "select" ? e.checked : !e.checked).flatMap(e => e.value.split(","));
	}
}
const css_togglebutton = `
input {
	display: none;
}
img {
	height: 30px;
	width: 30px;
	float:left;
	vertical-align: top;
	pointer-events: none;
}

.button {
	display: inline-flex;
	flex-wrap: wrap;
	border-radius: 5px;
	overflow: hidden;
	gap: 1.5px;
	background: #000;
}
.button label {
	display: flex;
	flex-grow: 1;
	cursor: pointer;
}
.button span {
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: center;
	width: 100%;
	padding: 5px 10px;
	opacity: .7;
	background: #1f783f;
	color: #fff;
	text-shadow: 0px 0px 5px #000;
}
.button span:hover {
	opacity: .9;
	color: #ff0;
}
.button :checked + span {
	opacity: 1;
}
.button .quality0 {
	background: #b2b2b2;
}
.button .quality1 {
	background: #60ff9c;
}
.button .quality2 {
	background: #5df8ff;
}
.button .quality3 {
	background: #d342ff;
}
.button .quality4 {
	background: #ffe250;
}
.button .gray {
	background: #ccc;
}
.button .red {
	background: #f00;
}
.button .green {
	background: #0f0;
}
.button .blue {
	background: #00f;
}

.icon {
	display: inline-flex;
	flex-wrap: wrap;
	gap: 5px;
}
.icon label {
	display: flex;
	cursor: pointer;
}
.icon span {
	border: 3px solid #ccc;
	border-radius: 10px;
	overflow: hidden;
}
.icon :checked + span {
	border: 3px solid #ff0;
}
`;
customElements.define("toggle-button", ToggleButton);
