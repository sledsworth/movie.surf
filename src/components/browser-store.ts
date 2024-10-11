class BrowserStoreElement extends HTMLElement {
	private form: HTMLFormElement | null = null;
	private slotElement: HTMLSlotElement | null = null;
	private abortController: AbortController | null = null;

	public submitOnLoad = false;

	constructor() {
		super();

		this.handleSlotChange = this.handleSlotChange.bind(this);
		this.attachShadow({ mode: "open" });
		if (this.shadowRoot) {
			this.shadowRoot.innerHTML = "<slot></slot>";
		}
	}

	handleCheckbox(key: string, value: string | string[]) {
		const checkboxes = this.form?.querySelectorAll(`[name="${key}"]`);
		if (checkboxes) {
			for (const checkbox of checkboxes) {
				if (Array.isArray(value)) {
					if (value.includes((checkbox as HTMLInputElement).value)) {
						(checkbox as HTMLInputElement).checked = true;
					}
				} else {
					if ((checkbox as HTMLInputElement).value === value) {
						(checkbox as HTMLInputElement).checked = true;
					}
				}
			}
		}
	}

	handleSlotChange() {
		this.form = this.querySelector("form");
		if (this.form) {
			this.form.addEventListener("change", (event: Event) => {
				const formData = new FormData(this.form as HTMLFormElement);
				let formValues = {};
				for (const key of formData.keys()) {
					const value = formData.getAll(key);
					if (value.length === 1) {
						formValues = { ...formValues, [key]: value[0] };
					} else {
						formValues = { ...formValues, [key]: value };
					}
				}
				localStorage.setItem(`${this.form?.name}`, JSON.stringify(formValues));
			});
		}
	}

	handleRadio(key: string, value: string) {
		const radios = this.form?.querySelectorAll(`[name="${key}"]`);
		if (radios) {
			for (const radio of radios) {
				if ((radio as HTMLInputElement).value === value) {
					(radio as HTMLInputElement).checked = true;
				}
			}
		}
	}

	connectedCallback() {
		this.slotElement = this.shadowRoot?.querySelector("slot");
		this.slotElement?.addEventListener("slotchange", this.handleSlotChange, {
			signal: this.abortController?.signal,
		});
		this.form = this.querySelector("form");
		this.submitOnLoad = this.hasAttribute("submit-on-load");
		const data = JSON.parse(localStorage.getItem(`${this.form?.name}`) ?? "{}");
		// const formData = new FormData(this.form as HTMLFormElement);
		const checkboxes = this.form?.querySelectorAll(`[type="checkbox"]`) ?? [];
		for (const checkbox of checkboxes) {
			(checkbox as HTMLInputElement).checked = false;
		}
		for (const key in data) {
			const value = data[key];
			const inputType = this.form
				?.querySelector(`[name="${key}"]`)
				?.getAttribute("type");
			switch (inputType) {
				case "checkbox":
					this.handleCheckbox(key, value);
					break;
				case "radio":
					this.handleRadio(key, value);
					break;
				default:
					this.form
						?.querySelector(`[name="${key}"]`)
						?.setAttribute("value", value);
					break;
			}
		}
		if (this.submitOnLoad) {
			this.form?.requestSubmit();
		}
	}

	attributcChangedCallback(name: string, oldValue: string, newValue: string) {
		if (oldValue !== newValue) {
			if (name === "submit-on-load") this.submitOnLoad = newValue === "true";
		}
	}
}

class BrowserStore {
	private storageType: "localStorage" | "sessionStorage";

	constructor(storageType: "localStorage" | "sessionStorage") {
		this.storageType = storageType;
	}
}

customElements.define("browser-store", BrowserStoreElement);
