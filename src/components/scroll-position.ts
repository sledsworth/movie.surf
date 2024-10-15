class ScrollPositionElement extends HTMLElement {
	selector = "html";

	getScrollElement() {
		return document.querySelector(this.selector);
	}

	static get observedAttributes() {
		return ["selector"];
	}

	attributchangedCallback(name: string, oldValue: string, newValue: string) {
		if (oldValue !== newValue) {
			if (name === "selector") {
				this.selector = newValue;
			}
		}
	}

	connectedCallback() {
		const scrollElement = this.getScrollElement();
		const top = sessionStorage.getItem("scroll-position") ?? 0;
		setTimeout(() => {
			scrollElement?.scroll({ top: Number(top) });
		});
		window.addEventListener("scroll", () => {
			sessionStorage.setItem(
				"scroll-position",
				`${scrollElement?.scrollTop ?? 0}`,
			);
		});
	}
}
customElements.define("scroll-position", ScrollPositionElement);
